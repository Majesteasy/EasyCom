const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');
const { validate, loginRules, registerRules, totpRules } = require('../middleware/validation');
const { auditLog } = require('../middleware/audit');
const logger = require('../config/logger');

// POST /api/auth/register
router.post('/register',
  authLimiter,
  registerRules,
  validate,
  async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      const user = await authService.register({ email, password, firstName, lastName });
      logger.info(`Inscription : ${email}`);
      res.status(201).json({ message: 'Compte créé. Configurez votre 2FA.', userId: user.id });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

// POST /api/auth/login — étape 1
router.post('/login',
  authLimiter,
  loginRules,
  validate,
  auditLog('LOGIN_ATTEMPT'),
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const { user, totpEnabled } = await authService.login({ email, password, ip: req.ip });

      if (!totpEnabled) {
        const tokens = authService.issueTokens(user.id, user.role);
        return res.json({ message: '2FA non activé — activez-le maintenant', ...tokens, user, requireTotp: false });
      }

      res.json({ message: 'Entrez votre code 2FA', userId: user.id, requireTotp: true });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

// POST /api/auth/login/2fa — étape 2
router.post('/login/2fa',
  authLimiter,
  totpRules,
  validate,
  async (req, res) => {
    try {
      const { userId, token } = req.body;
      if (!userId) return res.status(400).json({ error: 'userId manquant' });

      const valid = authService.verifyTotp(userId, token);
      if (!valid) return res.status(401).json({ error: 'Code 2FA invalide' });

      const { getDb } = require('../config/database');
      const user = getDb().prepare('SELECT id, role, email, first_name, last_name FROM users WHERE id = ?').get(userId);
      if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

      const tokens = authService.issueTokens(user.id, user.role);
      res.json({
        ...tokens,
        user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role },
      });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

// POST /api/auth/2fa/setup
router.post('/2fa/setup',
  authenticate,
  async (req, res) => {
    try {
      const { secret, qrCodeUrl } = await authService.setupTotp(req.user.sub);
      res.json({ secret, qrCodeUrl });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

// POST /api/auth/2fa/enable
router.post('/2fa/enable',
  authenticate,
  totpRules,
  validate,
  async (req, res) => {
    try {
      const valid = authService.verifyTotp(req.user.sub, req.body.token);
      if (!valid) return res.status(401).json({ error: 'Code 2FA invalide' });
      authService.enableTotp(req.user.sub);
      res.json({ message: '2FA activé avec succès' });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken manquant' });
    const accessToken = await authService.refreshAccessToken(refreshToken);
    res.json({ accessToken });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) authService.revokeRefreshToken(refreshToken);
  res.json({ message: 'Déconnecté' });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const { getDb } = require('../config/database');
  const user = getDb()
    .prepare('SELECT id, email, first_name, last_name, role, totp_enabled, last_login, created_at FROM users WHERE id = ?')
    .get(req.user.sub);
  if (!user) return res.status(404).json({ error: 'Introuvable' });
  res.json({ id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role, totpEnabled: Boolean(user.totp_enabled), lastLogin: user.last_login, createdAt: user.created_at });
});

module.exports = router;
