const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { getDb } = require('../config/database');
const { CATALOG, CATEGORIES } = require('../config/trainingCatalog');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array().map(e => ({ field: e.path, message: e.msg })) });
  next();
}

router.use(authenticate);

// GET /api/training/catalog
router.get('/catalog', (req, res) => {
  const { category } = req.query;
  const items = category ? CATALOG.filter(c => c.category === category) : CATALOG;
  res.json({ items, categories: CATEGORIES });
});

// GET /api/training/stats
router.get('/stats', (req, res) => {
  const db = getDb();
  const userId = req.user.sub;
  const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count, COALESCE(SUM(hours),0) as total_hours
    FROM trainings WHERE user_id = ? GROUP BY status
  `).all(userId);

  const hoursYear = db.prepare(`
    SELECT COALESCE(SUM(hours),0) as total
    FROM trainings
    WHERE user_id = ? AND status = 'completed'
    AND (end_date IS NULL OR strftime('%Y', end_date) = ?)
  `).get(userId, String(year)).total;

  const certs = db.prepare(`
    SELECT COUNT(*) as count FROM trainings
    WHERE user_id = ? AND certificate_obtained = 1
  `).get(userId).count;

  const byCategory = db.prepare(`
    SELECT category, COUNT(*) as count, COALESCE(SUM(hours),0) as hours
    FROM trainings WHERE user_id = ? GROUP BY category
  `).all(userId);

  res.json({ byStatus, hoursYear, certificates: certs, byCategory, year });
});

// GET /api/training/my
router.get('/my', (req, res) => {
  const db = getDb();
  const { status, category } = req.query;
  const conds = ['user_id = ?'];
  const params = [req.user.sub];
  if (status)   { conds.push('status = ?');   params.push(status); }
  if (category) { conds.push('category = ?'); params.push(category); }

  const rows = db.prepare(`
    SELECT * FROM trainings WHERE ${conds.join(' AND ')}
    ORDER BY CASE status WHEN 'ongoing' THEN 0 WHEN 'planned' THEN 1 ELSE 2 END, updated_at DESC
  `).all(...params);

  res.json(rows);
});

// POST /api/training/my
router.post('/my', [
  body('title').trim().isLength({ min: 2, max: 200 }),
  body('provider').trim().isLength({ min: 1, max: 100 }),
  body('category').isIn(['fm', 'elec', 'normes', 'gestion', 'autre']),
  body('status').optional().isIn(['planned', 'ongoing', 'completed']),
  body('hours').optional().isFloat({ min: 0 }),
  body('costChf').optional().isFloat({ min: 0 }),
], validate, (req, res) => {
  const db = getDb();
  const { title, provider, category, status = 'planned', url, hours, costChf, startDate, endDate, certificateObtained, certificateName, notes } = req.body;
  const id = uuidv4();

  db.prepare(`
    INSERT INTO trainings
      (id, user_id, title, provider, category, status, url, hours, cost_chf,
       start_date, end_date, certificate_obtained, certificate_name, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.sub, title, provider, category, status, url || null,
    hours || null, costChf || 0, startDate || null, endDate || null,
    certificateObtained ? 1 : 0, certificateName || null, notes || null);

  res.status(201).json(db.prepare('SELECT * FROM trainings WHERE id = ?').get(id));
});

// PATCH /api/training/my/:id
router.patch('/my/:id', (req, res) => {
  const db = getDb();
  const t = db.prepare('SELECT id FROM trainings WHERE id = ? AND user_id = ?').get(req.params.id, req.user.sub);
  if (!t) return res.status(404).json({ error: 'Introuvable' });

  const allowed = ['title', 'provider', 'category', 'status', 'url', 'hours', 'cost_chf', 'start_date', 'end_date', 'certificate_obtained', 'certificate_name', 'notes'];
  const updates = [];
  const vals = [];

  // camelCase → snake_case
  const map = { costChf: 'cost_chf', startDate: 'start_date', endDate: 'end_date', certificateObtained: 'certificate_obtained', certificateName: 'certificate_name' };
  const fields = { ...req.body };
  for (const [k, v] of Object.entries(map)) {
    if (k in fields) { fields[v] = fields[k]; delete fields[k]; }
  }

  for (const [k, v] of Object.entries(fields)) {
    if (allowed.includes(k)) { updates.push(`${k} = ?`); vals.push(k === 'certificate_obtained' ? (v ? 1 : 0) : v); }
  }
  updates.push("updated_at = datetime('now')");
  db.prepare(`UPDATE trainings SET ${updates.join(', ')} WHERE id = ?`).run(...vals, req.params.id);
  res.json(db.prepare('SELECT * FROM trainings WHERE id = ?').get(req.params.id));
});

// DELETE /api/training/my/:id
router.delete('/my/:id', (req, res) => {
  const db = getDb();
  const t = db.prepare('SELECT id FROM trainings WHERE id = ? AND user_id = ?').get(req.params.id, req.user.sub);
  if (!t) return res.status(404).json({ error: 'Introuvable' });
  db.prepare('DELETE FROM trainings WHERE id = ?').run(req.params.id);
  res.json({ message: 'Supprimé' });
});

// POST /api/training/catalog/:id/add — ajouter depuis catalogue
router.post('/catalog/:id/add', (req, res) => {
  const item = CATALOG.find(c => c.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Ressource introuvable dans le catalogue' });

  const db = getDb();
  const existing = db.prepare('SELECT id FROM trainings WHERE user_id = ? AND title = ?').get(req.user.sub, item.title);
  if (existing) return res.status(409).json({ error: 'Déjà dans votre liste' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO trainings (id, user_id, title, provider, category, status, url)
    VALUES (?, ?, ?, ?, ?, 'planned', ?)
  `).run(id, req.user.sub, item.title, item.provider, item.category, item.url || null);

  res.status(201).json(db.prepare('SELECT * FROM trainings WHERE id = ?').get(id));
});

module.exports = router;
