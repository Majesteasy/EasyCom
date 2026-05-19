const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { getDb } = require('../config/database');
const logger = require('../config/logger');

const SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function generateAccessToken(userId, role) {
  return jwt.sign(
    { sub: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

function generateRefreshToken(userId) {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

async function register({ email, password, firstName, lastName, role = 'technician' }) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) throw Object.assign(new Error('Email déjà utilisé'), { status: 409 });

  const passwordHash = await hashPassword(password);
  const id = uuidv4();

  db.prepare(`
    INSERT INTO users (id, email, password_hash, first_name, last_name, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, email.toLowerCase(), passwordHash, firstName, lastName, role);

  logger.info(`Nouvel utilisateur créé : ${email}`);
  return { id, email: email.toLowerCase(), firstName, lastName, role };
}

async function login({ email, password, ip }) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());

  if (!user || !user.is_active) {
    throw Object.assign(new Error('Identifiants invalides'), { status: 401 });
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const minutes = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
    throw Object.assign(
      new Error(`Compte verrouillé. Réessayez dans ${minutes} minute(s).`),
      { status: 429 }
    );
  }

  const valid = await verifyPassword(password, user.password_hash);

  if (!valid) {
    const attempts = user.failed_attempts + 1;
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60000).toISOString();
      db.prepare('UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?')
        .run(attempts, lockedUntil, user.id);
      logger.warn(`Compte verrouillé après ${attempts} tentatives : ${email}`);
      throw Object.assign(new Error(`Compte verrouillé pendant ${LOCK_DURATION_MINUTES} minutes`), { status: 429 });
    }
    db.prepare('UPDATE users SET failed_attempts = ? WHERE id = ?').run(attempts, user.id);
    throw Object.assign(new Error('Identifiants invalides'), { status: 401 });
  }

  db.prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login = ? WHERE id = ?')
    .run(new Date().toISOString(), user.id);

  return {
    user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role },
    totpEnabled: Boolean(user.totp_enabled),
  };
}

function issueTokens(userId, role) {
  const db = getDb();
  const accessToken = generateAccessToken(userId, role);
  const refreshToken = generateRefreshToken(userId);
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

  db.prepare('INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)')
    .run(uuidv4(), userId, tokenHash, expiresAt);

  return { accessToken, refreshToken };
}

async function setupTotp(userId) {
  const db = getDb();
  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(userId);
  if (!user) throw Object.assign(new Error('Utilisateur introuvable'), { status: 404 });

  const secret = speakeasy.generateSecret({
    name: `${process.env.TOTP_ISSUER || 'DJA.MAINT'} (${user.email})`,
    length: 32,
  });

  db.prepare('UPDATE users SET totp_secret = ? WHERE id = ?').run(secret.base32, userId);

  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
  return { secret: secret.base32, qrCodeUrl };
}

function verifyTotp(userId, token) {
  const db = getDb();
  const user = db.prepare('SELECT totp_secret FROM users WHERE id = ?').get(userId);
  if (!user?.totp_secret) throw Object.assign(new Error('2FA non configuré'), { status: 400 });

  const valid = speakeasy.totp.verify({
    secret: user.totp_secret,
    encoding: 'base32',
    token,
    window: 1,
  });

  return valid;
}

function enableTotp(userId) {
  const db = getDb();
  db.prepare('UPDATE users SET totp_enabled = 1 WHERE id = ?').run(userId);
}

async function refreshAccessToken(refreshToken) {
  const db = getDb();
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw Object.assign(new Error('Token invalide'), { status: 401 });
  }

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const stored = db.prepare('SELECT * FROM refresh_tokens WHERE token_hash = ?').get(tokenHash);

  if (!stored || new Date(stored.expires_at) < new Date()) {
    throw Object.assign(new Error('Token expiré ou révoqué'), { status: 401 });
  }

  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(payload.sub);
  if (!user) throw Object.assign(new Error('Utilisateur introuvable'), { status: 401 });

  return generateAccessToken(user.id, user.role);
}

function revokeRefreshToken(refreshToken) {
  const db = getDb();
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  db.prepare('DELETE FROM refresh_tokens WHERE token_hash = ?').run(tokenHash);
}

module.exports = {
  register,
  login,
  issueTokens,
  setupTotp,
  verifyTotp,
  enableTotp,
  refreshAccessToken,
  revokeRefreshToken,
  verifyAccessToken,
};
