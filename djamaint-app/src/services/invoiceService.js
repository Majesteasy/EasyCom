const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');

function nextInvoiceNumber() {
  const db = getDb();
  const year = new Date().getFullYear();
  const last = db.prepare(`
    SELECT number FROM invoices WHERE number LIKE 'F-${year}-%' ORDER BY number DESC LIMIT 1
  `).get();
  if (!last) return `F-${year}-001`;
  const seq = parseInt(last.number.split('-')[2], 10) + 1;
  return `F-${year}-${String(seq).padStart(3, '0')}`;
}

function computeTotals(items, vatRate) {
  const subtotal_ht = items.reduce((s, it) => s + it.total_ht, 0);
  const vat_amount = Math.round(subtotal_ht * (vatRate / 100) * 100) / 100;
  const total_ttc = Math.round((subtotal_ht + vat_amount) * 100) / 100;
  return { subtotal_ht, vat_amount, total_ttc };
}

function listInvoices({ clientId, status, year, limit = 50, offset = 0 } = {}) {
  const db = getDb();
  let where = 'WHERE 1=1';
  const params = [];

  if (clientId) { where += ' AND i.client_id = ?'; params.push(clientId); }
  if (status) { where += ' AND i.status = ?'; params.push(status); }
  if (year) { where += " AND strftime('%Y', i.issue_date) = ?"; params.push(String(year)); }

  const rows = db.prepare(`
    SELECT i.*, c.company_name AS client_name, c.email AS client_email
    FROM invoices i
    JOIN clients c ON c.id = i.client_id
    ${where}
    ORDER BY i.issue_date DESC, i.number DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  const total = db.prepare(`SELECT COUNT(*) AS n FROM invoices i ${where}`).get(...params).n;
  return { invoices: rows, total };
}

function getInvoice(id) {
  const db = getDb();
  const inv = db.prepare(`
    SELECT i.*, c.company_name AS client_name, c.email AS client_email,
      c.address_line1, c.address_line2, c.postal_code, c.city, c.canton, c.country,
      c.vat_number AS client_vat_number, c.iban AS client_iban
    FROM invoices i JOIN clients c ON c.id = i.client_id
    WHERE i.id = ?
  `).get(id);
  if (!inv) return null;
  inv.items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order').all(id);
  return inv;
}

function createInvoice(data, userId) {
  const db = getDb();
  const id = uuidv4();
  const number = data.number || nextInvoiceNumber();
  const items = (data.items || []).map((it, i) => ({
    id: uuidv4(),
    invoice_id: id,
    description: it.description,
    quantity: it.quantity || 1,
    unit_price: it.unit_price,
    vat_rate: it.vat_rate ?? data.vat_rate ?? 8.1,
    total_ht: Math.round(((it.quantity || 1) * it.unit_price) * 100) / 100,
    sort_order: i,
  }));

  const vatRate = data.vat_rate ?? 8.1;
  const { subtotal_ht, vat_amount, total_ttc } = computeTotals(items, vatRate);
  const issueDate = data.issue_date || new Date().toISOString().slice(0, 10);
  const paymentTerms = data.payment_terms ?? 30;
  const dueDate = data.due_date || addDays(issueDate, paymentTerms);

  db.prepare(`
    INSERT INTO invoices (id, number, client_id, status, issue_date, due_date,
      subtotal_ht, vat_rate, vat_amount, total_ttc, notes, payment_method, iban, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, number, data.client_id, 'draft', issueDate, dueDate,
    subtotal_ht, vatRate, vat_amount, total_ttc,
    data.notes || null, data.payment_method || null, data.iban || null, userId);

  const insertItem = db.prepare(`
    INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, vat_rate, total_ht, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const it of items) insertItem.run(it.id, it.invoice_id, it.description, it.quantity, it.unit_price, it.vat_rate, it.total_ht, it.sort_order);

  return getInvoice(id);
}

function updateInvoice(id, data) {
  const db = getDb();
  const inv = getInvoice(id);
  if (!inv) { const e = new Error('Facture introuvable'); e.status = 404; throw e; }
  if (inv.status !== 'draft' && !data.status) {
    const e = new Error('Seules les factures en brouillon peuvent être modifiées'); e.status = 409; throw e;
  }

  // Recalcul si items fournis
  if (data.items) {
    db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(id);
    const vatRate = data.vat_rate ?? inv.vat_rate;
    const items = data.items.map((it, i) => ({
      id: uuidv4(),
      description: it.description,
      quantity: it.quantity || 1,
      unit_price: it.unit_price,
      vat_rate: it.vat_rate ?? vatRate,
      total_ht: Math.round(((it.quantity || 1) * it.unit_price) * 100) / 100,
      sort_order: i,
    }));
    const { subtotal_ht, vat_amount, total_ttc } = computeTotals(items, vatRate);
    data.subtotal_ht = subtotal_ht;
    data.vat_amount = vat_amount;
    data.total_ttc = total_ttc;
    data.vat_rate = vatRate;
    const insertItem = db.prepare(`
      INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, vat_rate, total_ht, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const it of items) insertItem.run(it.id, id, it.description, it.quantity, it.unit_price, it.vat_rate, it.total_ht, it.sort_order);
  }

  const fields = ['status', 'issue_date', 'due_date', 'payment_date', 'subtotal_ht', 'vat_rate', 'vat_amount', 'total_ttc', 'notes', 'payment_method', 'iban', 'sent_at', 'reminder_1_at', 'reminder_2_at', 'reminder_3_at'];
  const sets = fields.filter(f => f in data).map(f => `${f} = ?`);
  if (sets.length) {
    sets.push("updated_at = datetime('now')");
    const vals = fields.filter(f => f in data).map(f => data[f]);
    db.prepare(`UPDATE invoices SET ${sets.join(', ')} WHERE id = ?`).run(...vals, id);
  }
  return getInvoice(id);
}

function markSent(id) {
  return updateInvoice(id, { status: 'sent', sent_at: new Date().toISOString() });
}

function markPaid(id, paymentDate) {
  return updateInvoice(id, { status: 'paid', payment_date: paymentDate || new Date().toISOString().slice(0, 10) });
}

function getInvoiceStats() {
  const db = getDb();
  const year = new Date().getFullYear();
  return db.prepare(`
    SELECT
      COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END), 0) AS drafts,
      COALESCE(SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END), 0) AS sent,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) AS paid,
      COALESCE(SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END), 0) AS overdue,
      COALESCE(SUM(CASE WHEN status = 'paid' AND strftime('%Y', payment_date) = ? THEN total_ttc ELSE 0 END), 0) AS revenue_ytd,
      COALESCE(SUM(CASE WHEN status IN ('sent','overdue') THEN total_ttc ELSE 0 END), 0) AS outstanding
    FROM invoices
  `).get(String(year));
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

module.exports = { listInvoices, getInvoice, createInvoice, updateInvoice, markSent, markPaid, getInvoiceStats, nextInvoiceNumber };
