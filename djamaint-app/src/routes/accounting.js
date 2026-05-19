const express = require('express');
const multer  = require('multer');
const { parse } = require('csv-parse/sync');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const { body, query, validationResult } = require('express-validator');
const svc = require('../services/accountingService');
const { CATEGORIES, VAT_RATES } = require('../config/categories');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array().map(e => ({ field: e.path, message: e.msg })) });
  next();
}

// Toutes les routes nécessitent l'auth
router.use(authenticate);

// GET /api/accounting/categories
router.get('/categories', (req, res) => {
  res.json({ categories: CATEGORIES, vatRates: VAT_RATES });
});

// GET /api/accounting/kpis
router.get('/kpis', (req, res) => {
  const { year, month } = req.query;
  res.json(svc.getKpis({ year: year ? parseInt(year) : undefined, month: month ? parseInt(month) : undefined }));
});

// GET /api/accounting/chart
router.get('/chart', (req, res) => {
  const { year } = req.query;
  res.json(svc.getMonthlyChart(year ? parseInt(year) : undefined));
});

// GET /api/accounting/breakdown
router.get('/breakdown', (req, res) => {
  const { type = 'expense', dateFrom, dateTo } = req.query;
  res.json(svc.getCategoryBreakdown(type, { dateFrom, dateTo }));
});

// GET /api/accounting/transactions
router.get('/transactions', (req, res) => {
  const { type, categoryCode, dateFrom, dateTo, reconciled, limit = 100, offset = 0 } = req.query;
  res.json(svc.listTransactions({
    type, categoryCode, dateFrom, dateTo,
    reconciled: reconciled !== undefined ? reconciled === 'true' : undefined,
    limit: parseInt(limit), offset: parseInt(offset),
  }));
});

// POST /api/accounting/transactions
router.post('/transactions', [
  body('type').isIn(['revenue', 'expense']),
  body('date').isISO8601().withMessage('Date invalide (YYYY-MM-DD)'),
  body('description').trim().isLength({ min: 2, max: 200 }),
  body('categoryCode').notEmpty(),
  body('amountHt').isFloat({ min: 0.01 }).withMessage('Montant HT invalide'),
  body('vatRate').isFloat({ min: 0, max: 15 }).withMessage('Taux TVA invalide'),
], validate, (req, res) => {
  try {
    const t = svc.createTransaction({ ...req.body, createdBy: req.user.sub });
    res.status(201).json(t);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/accounting/transactions/:id
router.patch('/transactions/:id', (req, res) => {
  try {
    res.json(svc.updateTransaction(req.params.id, req.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/accounting/transactions/:id
router.delete('/transactions/:id', (req, res) => {
  svc.deleteTransaction(req.params.id);
  res.json({ message: 'Transaction supprimée' });
});

// GET /api/accounting/export
router.get('/export', (req, res) => {
  const { dateFrom, dateTo } = req.query;
  const csv = svc.exportTransactionsCsv({ dateFrom, dateTo });
  const filename = `djamaint_compta_${dateFrom || 'debut'}_${dateTo || 'fin'}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('﻿' + csv); // BOM pour Excel
});

// GET /api/accounting/bilan
router.get('/bilan', (req, res) => {
  res.json(svc.getSimpleBilan(req.query.year ? parseInt(req.query.year) : undefined));
});

// ─── Rapprochement bancaire ───────────────────────────────────────────────

// GET /api/accounting/bank-transactions
router.get('/bank-transactions', (req, res) => {
  res.json(svc.listBankTransactions({ status: req.query.status, limit: parseInt(req.query.limit || 100), offset: parseInt(req.query.offset || 0) }));
});

// POST /api/accounting/bank-import
router.post('/bank-import', upload.single('csv'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier CSV requis' });

  try {
    const content = req.file.buffer.toString('utf-8').replace(/^﻿/, '');

    // Détection automatique du séparateur
    const sep = content.includes(';') ? ';' : ',';
    const records = parse(content, { columns: true, delimiter: sep, skip_empty_lines: true, trim: true });

    // Mapping flexible : supporte Postfinance, UBS, Credit Suisse, Revolut Business
    const rows = records.map(r => ({
      date:        r['Date'] || r['Datum'] || r['date'] || r['Date transaction'] || '',
      valueDate:   r['Valeur'] || r['Valutadatum'] || r['value_date'] || '',
      description: r['Description'] || r['Buchungstext'] || r['Libellé'] || r['Merchant'] || r['description'] || '',
      amount:      (r['Montant'] || r['Betrag'] || r['Amount'] || r['amount'] || '0').replace(/\s/g,'').replace(',','.'),
      balance:     (r['Solde'] || r['Saldo'] || r['Balance'] || r['balance'] || '').replace(/\s/g,'').replace(',','.'),
      reference:   r['Référence'] || r['Referenz'] || r['Reference'] || r['reference'] || '',
    })).filter(r => r.date && r.amount && !isNaN(parseFloat(r.amount)));

    const result = svc.importBankCsv(rows);
    res.json({ message: `Importé : ${result.imported} ligne(s), ${result.skipped} doublon(s)`, ...result });
  } catch (err) {
    res.status(400).json({ error: `Erreur CSV : ${err.message}` });
  }
});

// POST /api/accounting/bank-transactions/:id/match
router.post('/bank-transactions/:id/match', [
  body('transactionId').notEmpty(),
], validate, (req, res) => {
  svc.matchBankTransaction(req.params.id, req.body.transactionId);
  res.json({ message: 'Rapprochement effectué' });
});

// POST /api/accounting/bank-transactions/:id/ignore
router.post('/bank-transactions/:id/ignore', (req, res) => {
  svc.ignoreBankTransaction(req.params.id);
  res.json({ message: 'Transaction ignorée' });
});

// ─── TVA ──────────────────────────────────────────────────────────────────

// GET /api/accounting/vat
router.get('/vat', (req, res) => {
  res.json(svc.listVatPeriods());
});

// POST /api/accounting/vat/compute
router.post('/vat/compute', [
  body('year').isInt({ min: 2020, max: 2099 }),
  body('quarter').isInt({ min: 1, max: 4 }),
], validate, (req, res) => {
  try {
    res.json(svc.computeVatPeriod(req.body.year, req.body.quarter));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
