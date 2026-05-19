const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const svc = require('../services/invoiceService');

function validate(req, res, next) {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(422).json({ errors: errs.array().map(e => ({ field: e.path, message: e.msg })) });
  next();
}

router.use(authenticate);

// GET /api/invoices
router.get('/', [
  query('clientId').optional().isString(),
  query('status').optional().isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  query('year').optional().isInt({ min: 2020, max: 2099 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
], validate, (req, res) => {
  res.json(svc.listInvoices(req.query));
});

// GET /api/invoices/stats
router.get('/stats', (req, res) => {
  res.json(svc.getInvoiceStats());
});

// GET /api/invoices/next-number
router.get('/next-number', (req, res) => {
  res.json({ number: svc.nextInvoiceNumber() });
});

// GET /api/invoices/:id
router.get('/:id', (req, res) => {
  const inv = svc.getInvoice(req.params.id);
  if (!inv) return res.status(404).json({ error: 'Facture introuvable' });
  res.json(inv);
});

// POST /api/invoices
router.post('/', [
  body('client_id').isUUID(),
  body('items').isArray({ min: 1 }),
  body('items.*.description').isString().trim().isLength({ min: 1 }),
  body('items.*.quantity').optional().isFloat({ min: 0.01 }),
  body('items.*.unit_price').isFloat({ min: 0 }),
  body('vat_rate').optional().isFloat({ min: 0, max: 100 }),
], validate, (req, res) => {
  try {
    const inv = svc.createInvoice(req.body, req.user.sub);
    res.status(201).json(inv);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// PUT /api/invoices/:id
router.put('/:id', (req, res) => {
  try {
    const inv = svc.updateInvoice(req.params.id, req.body);
    res.json(inv);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/invoices/:id/send
router.post('/:id/send', (req, res) => {
  try {
    const inv = svc.markSent(req.params.id);
    res.json(inv);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/invoices/:id/pay
router.post('/:id/pay', [
  body('payment_date').optional().isISO8601(),
], validate, (req, res) => {
  try {
    const inv = svc.markPaid(req.params.id, req.body.payment_date);
    res.json(inv);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
