const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const svc = require('../services/clientService');

function validate(req, res, next) {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(422).json({ errors: errs.array().map(e => ({ field: e.path, message: e.msg })) });
  next();
}

router.use(authenticate);

// GET /api/clients
router.get('/', [
  query('status').optional().isIn(['active', 'inactive', 'prospect']),
  query('search').optional().isString().trim(),
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
], validate, (req, res) => {
  const result = svc.listClients(req.query);
  res.json(result);
});

// GET /api/clients/export.csv
router.get('/export.csv', (req, res) => {
  const csv = svc.exportClientsCsv();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="clients.csv"');
  res.send('﻿' + csv); // BOM UTF-8 pour Excel
});

// GET /api/clients/:id
router.get('/:id', (req, res) => {
  const c = svc.getClient(req.params.id);
  if (!c) return res.status(404).json({ error: 'Client introuvable' });
  res.json(c);
});

// POST /api/clients
router.post('/', [
  body('company_name').isString().trim().isLength({ min: 1, max: 200 }),
  body('email').optional({ nullable: true }).isEmail().normalizeEmail(),
  body('phone').optional().isString().trim(),
  body('payment_terms').optional().isInt({ min: 0, max: 120 }),
  body('status').optional().isIn(['active', 'inactive', 'prospect']),
  body('canton').optional().isString().trim().isLength({ max: 2 }),
], validate, (req, res) => {
  const c = svc.createClient(req.body, req.user.sub);
  res.status(201).json(c);
});

// PUT /api/clients/:id
router.put('/:id', [
  body('company_name').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('email').optional({ nullable: true }).isEmail().normalizeEmail(),
  body('status').optional().isIn(['active', 'inactive', 'prospect']),
], validate, (req, res) => {
  try {
    const c = svc.updateClient(req.params.id, req.body);
    if (!c) return res.status(404).json({ error: 'Client introuvable' });
    res.json(c);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// DELETE /api/clients/:id
router.delete('/:id', (req, res) => {
  try {
    svc.deleteClient(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
