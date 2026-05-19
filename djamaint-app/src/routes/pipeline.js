const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const svc = require('../services/pipelineService');

function validate(req, res, next) {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(422).json({ errors: errs.array().map(e => ({ field: e.path, message: e.msg })) });
  next();
}

router.use(authenticate);

// GET /api/pipeline/board — kanban
router.get('/board', (req, res) => {
  res.json(svc.getKanbanBoard());
});

// GET /api/pipeline
router.get('/', (req, res) => {
  res.json(svc.listLeads(req.query));
});

// GET /api/pipeline/:id
router.get('/:id', (req, res) => {
  const lead = svc.getLead(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead introuvable' });
  res.json(lead);
});

// POST /api/pipeline
router.post('/', [
  body('client_name').isString().trim().isLength({ min: 1, max: 200 }),
  body('value_chf').optional().isFloat({ min: 0 }),
  body('probability').optional().isInt({ min: 0, max: 100 }),
  body('status').optional().isIn(svc.STATUSES),
], validate, (req, res) => {
  const lead = svc.createLead(req.body, req.user.sub);
  res.status(201).json(lead);
});

// PUT /api/pipeline/:id
router.put('/:id', (req, res) => {
  try {
    const lead = svc.updateLead(req.params.id, req.body);
    if (!lead) return res.status(404).json({ error: 'Lead introuvable' });
    res.json(lead);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// PATCH /api/pipeline/:id/move — déplacer dans le kanban
router.patch('/:id/move', [
  body('status').isIn(svc.STATUSES),
], validate, (req, res) => {
  try {
    const lead = svc.moveLead(req.params.id, req.body.status);
    res.json(lead);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// DELETE /api/pipeline/:id
router.delete('/:id', (req, res) => {
  svc.deleteLead(req.params.id);
  res.status(204).end();
});

module.exports = router;
