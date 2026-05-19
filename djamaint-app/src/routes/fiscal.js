const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { simulateFiscalEI, getDeductionsGuide, getFiscalCalendar, VAT_THRESHOLD, PILIER3A_MAX } = require('../services/fiscalService');
const { getSimpleBilan } = require('../services/accountingService');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
}

router.use(authenticate);

// GET /api/fiscal/calendar — dates échéances AFC Genève
router.get('/calendar', (req, res) => {
  res.json(getFiscalCalendar());
});

// GET /api/fiscal/deductions — guide déductions EI FM
router.get('/deductions', (req, res) => {
  res.json({ deductions: getDeductionsGuide(), pilier3aMax: PILIER3A_MAX, vatThreshold: VAT_THRESHOLD });
});

// POST /api/fiscal/simulate — simulateur fiscal EI Genève
router.post('/simulate', [
  body('revenue').isFloat({ min: 0 }),
  body('expenses').isFloat({ min: 0 }),
  body('pilier3a').optional().isFloat({ min: 0, max: 10000 }),
], validate, (req, res) => {
  const { revenue, expenses, pilier3a } = req.body;
  res.json(simulateFiscalEI({ revenue, expenses, pilier3a: pilier3a || 0 }));
});

// GET /api/fiscal/simulate/current — simulation basée sur données réelles de l'année
router.get('/simulate/current', (req, res) => {
  const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
  const bilan = getSimpleBilan(year);
  const pilier3a = req.query.pilier3a ? parseFloat(req.query.pilier3a) : 0;
  const simulation = simulateFiscalEI({ revenue: bilan.totalRevenue, expenses: bilan.totalExpenses, pilier3a });
  res.json({ year, bilan, simulation });
});

module.exports = router;
