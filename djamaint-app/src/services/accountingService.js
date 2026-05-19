const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const { CATEGORIES } = require('../config/categories');

function computeVat(amountHt, vatRate) {
  const vat = Math.round(amountHt * (vatRate / 100) * 100) / 100;
  return { vatAmount: vat, amountTtc: Math.round((amountHt + vat) * 100) / 100 };
}

// ─── Transactions ────────────────────────────────────────────────────────────

function createTransaction({ type, date, description, categoryCode, amountHt, vatRate, paymentMethod, reference, invoiceId, clientId, notes, createdBy }) {
  const db = getDb();
  const { vatAmount, amountTtc } = computeVat(amountHt, vatRate ?? 0);
  const id = uuidv4();

  db.prepare(`
    INSERT INTO transactions
      (id, type, date, description, category_code, amount_ht, vat_rate, amount_ttc, vat_amount,
       payment_method, reference, invoice_id, client_id, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, type, date, description, categoryCode, amountHt, vatRate ?? 0, amountTtc, vatAmount,
    paymentMethod ?? null, reference ?? null, invoiceId ?? null, clientId ?? null, notes ?? null, createdBy ?? null);

  return getTransactionById(id);
}

function getTransactionById(id) {
  return getDb().prepare('SELECT * FROM transactions WHERE id = ?').get(id);
}

function listTransactions({ type, categoryCode, dateFrom, dateTo, reconciled, limit = 100, offset = 0 } = {}) {
  const db = getDb();
  const conditions = ['1=1'];
  const params = [];

  if (type)         { conditions.push('type = ?');          params.push(type); }
  if (categoryCode) { conditions.push('category_code = ?'); params.push(categoryCode); }
  if (dateFrom)     { conditions.push('date >= ?');         params.push(dateFrom); }
  if (dateTo)       { conditions.push('date <= ?');         params.push(dateTo); }
  if (reconciled !== undefined) { conditions.push('reconciled = ?'); params.push(reconciled ? 1 : 0); }

  const rows = db.prepare(`
    SELECT * FROM transactions WHERE ${conditions.join(' AND ')}
    ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  const total = db.prepare(`SELECT COUNT(*) as n FROM transactions WHERE ${conditions.join(' AND ')}`).get(...params).n;
  return { rows, total };
}

function updateTransaction(id, fields) {
  const db = getDb();
  const allowed = ['date', 'description', 'category_code', 'amount_ht', 'vat_rate', 'payment_method', 'reference', 'notes', 'reconciled'];
  const updates = [];
  const vals = [];

  for (const [k, v] of Object.entries(fields)) {
    if (allowed.includes(k)) { updates.push(`${k} = ?`); vals.push(v); }
  }

  if (fields.amount_ht !== undefined || fields.vat_rate !== undefined) {
    const current = getTransactionById(id);
    const amountHt = fields.amount_ht ?? current.amount_ht;
    const vatRate  = fields.vat_rate  ?? current.vat_rate;
    const { vatAmount, amountTtc } = computeVat(amountHt, vatRate);
    updates.push('vat_amount = ?', 'amount_ttc = ?');
    vals.push(vatAmount, amountTtc);
  }

  updates.push("updated_at = datetime('now')");
  db.prepare(`UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`).run(...vals, id);
  return getTransactionById(id);
}

function deleteTransaction(id) {
  getDb().prepare('DELETE FROM transactions WHERE id = ?').run(id);
}

// ─── KPIs & Agrégats ────────────────────────────────────────────────────────

function getKpis({ year, month } = {}) {
  const db = getDb();
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? (now.getMonth() + 1);

  const pad = n => String(n).padStart(2, '0');
  const monthFrom = `${y}-${pad(m)}-01`;
  const monthTo   = `${y}-${pad(m)}-31`;
  const yearFrom  = `${y}-01-01`;
  const yearTo    = `${y}-12-31`;

  const agg = (type, from, to) => db.prepare(`
    SELECT COALESCE(SUM(amount_ht),0) as ht, COALESCE(SUM(vat_amount),0) as vat,
           COALESCE(SUM(amount_ttc),0) as ttc
    FROM transactions WHERE type = ? AND date BETWEEN ? AND ?
  `).get(type, from, to);

  const revMonth  = agg('revenue', monthFrom, monthTo);
  const expMonth  = agg('expense', monthFrom, monthTo);
  const revYear   = agg('revenue', yearFrom, yearTo);
  const expYear   = agg('expense', yearFrom, yearTo);

  const unreconciled = db.prepare(
    `SELECT COUNT(*) as n FROM transactions WHERE reconciled = 0`
  ).get().n;

  return {
    month: { revenue: revMonth.ht, expenses: expMonth.ht, net: revMonth.ht - expMonth.ht, vatCollected: revMonth.vat },
    year:  { revenue: revYear.ht,  expenses: expYear.ht,  net: revYear.ht  - expYear.ht,  vatCollected: revYear.vat },
    unreconciled,
  };
}

function getMonthlyChart(year) {
  const db = getDb();
  const y = year ?? new Date().getFullYear();
  const results = [];

  for (let m = 1; m <= 12; m++) {
    const pad = n => String(n).padStart(2, '0');
    const from = `${y}-${pad(m)}-01`;
    const to   = `${y}-${pad(m)}-31`;

    const rev = db.prepare(`SELECT COALESCE(SUM(amount_ht),0) as v FROM transactions WHERE type='revenue' AND date BETWEEN ? AND ?`).get(from, to).v;
    const exp = db.prepare(`SELECT COALESCE(SUM(amount_ht),0) as v FROM transactions WHERE type='expense' AND date BETWEEN ? AND ?`).get(from, to).v;

    results.push({ month: m, label: new Date(y, m - 1).toLocaleString('fr-CH', { month: 'short' }), revenue: rev, expenses: exp, net: rev - exp });
  }
  return results;
}

function getCategoryBreakdown(type, { dateFrom, dateTo } = {}) {
  const db = getDb();
  const from = dateFrom || `${new Date().getFullYear()}-01-01`;
  const to   = dateTo   || `${new Date().getFullYear()}-12-31`;

  return db.prepare(`
    SELECT category_code, COALESCE(SUM(amount_ht),0) as total, COUNT(*) as count
    FROM transactions
    WHERE type = ? AND date BETWEEN ? AND ?
    GROUP BY category_code ORDER BY total DESC
  `).all(type, from, to);
}

// ─── Rapprochement bancaire ──────────────────────────────────────────────────

function importBankCsv(rows) {
  const db = getDb();
  let imported = 0;
  let skipped  = 0;

  const insert = db.prepare(`
    INSERT OR IGNORE INTO bank_transactions
      (id, transaction_date, value_date, description, amount, balance, reference, raw_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items) => {
    for (const r of items) {
      const ref = r.reference || `${r.date}_${r.amount}_${r.description}`.replace(/\s/g, '_');
      const id = uuidv4();
      const result = insert.run(id, r.date, r.valueDate || null, r.description, parseFloat(r.amount), r.balance ? parseFloat(r.balance) : null, ref, JSON.stringify(r));
      result.changes > 0 ? imported++ : skipped++;
    }
  });

  insertMany(rows);
  return { imported, skipped };
}

function listBankTransactions({ status, limit = 100, offset = 0 } = {}) {
  const db = getDb();
  const where = status ? 'WHERE status = ?' : '';
  const params = status ? [status, limit, offset] : [limit, offset];

  const rows = db.prepare(`SELECT * FROM bank_transactions ${where} ORDER BY transaction_date DESC LIMIT ? OFFSET ?`).all(...params);
  const total = db.prepare(`SELECT COUNT(*) as n FROM bank_transactions ${where}`).get(...(status ? [status] : [])).n;
  return { rows, total };
}

function matchBankTransaction(bankId, transactionId) {
  const db = getDb();
  db.prepare(`UPDATE bank_transactions SET status = 'matched', matched_transaction_id = ? WHERE id = ?`).run(transactionId, bankId);
  db.prepare(`UPDATE transactions SET reconciled = 1, bank_transaction_id = ? WHERE id = ?`).run(bankId, transactionId);
}

function ignoreBankTransaction(bankId) {
  getDb().prepare(`UPDATE bank_transactions SET status = 'ignored' WHERE id = ?`).run(bankId);
}

// ─── TVA trimestrielle ───────────────────────────────────────────────────────

function computeVatPeriod(year, quarter) {
  const db = getDb();
  const starts = ['01-01', '04-01', '07-01', '10-01'];
  const ends   = ['03-31', '06-30', '09-30', '12-31'];
  const from = `${year}-${starts[quarter - 1]}`;
  const to   = `${year}-${ends[quarter - 1]}`;

  const rev = db.prepare(`
    SELECT COALESCE(SUM(amount_ht),0) as ht, COALESCE(SUM(vat_amount),0) as vat
    FROM transactions WHERE type='revenue' AND date BETWEEN ? AND ?
  `).get(from, to);

  const exp = db.prepare(`
    SELECT COALESCE(SUM(amount_ht),0) as ht, COALESCE(SUM(vat_amount),0) as vat
    FROM transactions WHERE type='expense' AND vat_rate > 0 AND date BETWEEN ? AND ?
  `).get(from, to);

  const vatDue = Math.max(0, Math.round((rev.vat - exp.vat) * 100) / 100);

  const existing = db.prepare('SELECT id FROM vat_periods WHERE year = ? AND quarter = ?').get(year, quarter);
  if (existing) {
    db.prepare(`
      UPDATE vat_periods SET revenue_ht=?, vat_collected=?, expenses_ht=?, vat_deductible=?, vat_due=?
      WHERE year=? AND quarter=?
    `).run(rev.ht, rev.vat, exp.ht, exp.vat, vatDue, year, quarter);
  } else {
    db.prepare(`
      INSERT INTO vat_periods (id,year,quarter,date_from,date_to,revenue_ht,vat_collected,expenses_ht,vat_deductible,vat_due)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `).run(uuidv4(), year, quarter, from, to, rev.ht, rev.vat, exp.ht, exp.vat, vatDue);
  }

  return db.prepare('SELECT * FROM vat_periods WHERE year=? AND quarter=?').get(year, quarter);
}

function listVatPeriods() {
  return getDb().prepare('SELECT * FROM vat_periods ORDER BY year DESC, quarter DESC').all();
}

// ─── Export CSV ─────────────────────────────────────────────────────────────

function exportTransactionsCsv({ dateFrom, dateTo } = {}) {
  const from = dateFrom || `${new Date().getFullYear()}-01-01`;
  const to   = dateTo   || `${new Date().getFullYear()}-12-31`;

  const rows = getDb().prepare(`
    SELECT date, type, category_code, description, amount_ht, vat_rate, vat_amount, amount_ttc,
           payment_method, reference, reconciled
    FROM transactions WHERE date BETWEEN ? AND ? ORDER BY date ASC
  `).all(from, to);

  const headers = ['Date','Type','Catégorie','Description','Montant HT','TVA %','TVA CHF','Montant TTC','Paiement','Référence','Rapproché'];
  const lines = [headers.join(';')];

  for (const r of rows) {
    lines.push([
      r.date, r.type === 'revenue' ? 'Recette' : 'Dépense',
      r.category_code, `"${r.description}"`,
      r.amount_ht.toFixed(2), r.vat_rate, r.vat_amount.toFixed(2), r.amount_ttc.toFixed(2),
      r.payment_method || '', r.reference || '', r.reconciled ? 'Oui' : 'Non'
    ].join(';'));
  }

  return lines.join('\n');
}

// ─── Bilan simplifié EI ──────────────────────────────────────────────────────

function getSimpleBilan(year) {
  const db = getDb();
  const y = year ?? new Date().getFullYear();

  const byCategory = (type) => db.prepare(`
    SELECT category_code, COALESCE(SUM(amount_ht),0) as total
    FROM transactions WHERE type=? AND strftime('%Y',date)=?
    GROUP BY category_code ORDER BY total DESC
  `).all(type, String(y));

  const revenues  = byCategory('revenue');
  const expenses  = byCategory('expense');
  const totalRev  = revenues.reduce((s, r) => s + r.total, 0);
  const totalExp  = expenses.reduce((s, r) => s + r.total, 0);
  const result    = totalRev - totalExp;

  // Cotisation AVS estimée EI : ~10% du bénéfice net (simplifié)
  const avsEstimate = Math.max(0, result * 0.10);

  return { year: y, revenues, expenses, totalRevenue: totalRev, totalExpenses: totalExp, netResult: result, avsEstimate, netAfterAvs: result - avsEstimate };
}

module.exports = {
  createTransaction, listTransactions, updateTransaction, deleteTransaction, getTransactionById,
  getKpis, getMonthlyChart, getCategoryBreakdown,
  importBankCsv, listBankTransactions, matchBankTransaction, ignoreBankTransaction,
  computeVatPeriod, listVatPeriods,
  exportTransactionsCsv, getSimpleBilan,
};
