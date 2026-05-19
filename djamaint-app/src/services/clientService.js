const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');

function listClients({ status, search, limit = 100, offset = 0 } = {}) {
  const db = getDb();
  let where = 'WHERE 1=1';
  const params = [];

  if (status) { where += ' AND c.status = ?'; params.push(status); }
  if (search) {
    where += ' AND (c.company_name LIKE ? OR c.email LIKE ? OR c.contact_first_name LIKE ? OR c.contact_last_name LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q, q, q);
  }

  const rows = db.prepare(`
    SELECT c.*,
      COUNT(DISTINCT i.id) AS invoice_count,
      COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total_ttc ELSE 0 END), 0) AS total_revenue
    FROM clients c
    LEFT JOIN invoices i ON i.client_id = c.id
    ${where}
    GROUP BY c.id
    ORDER BY c.company_name
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  const total = db.prepare(`SELECT COUNT(*) AS n FROM clients c ${where}`).get(...params).n;
  return { clients: rows, total };
}

function getClient(id) {
  const db = getDb();
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  if (!client) return null;
  const invoices = db.prepare(`
    SELECT id, number, status, issue_date, due_date, total_ttc FROM invoices
    WHERE client_id = ? ORDER BY issue_date DESC LIMIT 20
  `).all(id);
  return { ...client, invoices };
}

function createClient(data, userId) {
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO clients (id, company_name, contact_first_name, contact_last_name, email, phone,
      address_line1, address_line2, postal_code, city, canton, country,
      vat_number, iban, payment_terms, notes, status, source, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.company_name, data.contact_first_name || null, data.contact_last_name || null,
    data.email || null, data.phone || null,
    data.address_line1 || null, data.address_line2 || null,
    data.postal_code || null, data.city || null,
    data.canton || 'GE', data.country || 'Suisse',
    data.vat_number || null, data.iban || null,
    data.payment_terms || 30, data.notes || null,
    data.status || 'active', data.source || null, userId
  );
  return db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
}

function updateClient(id, data) {
  const db = getDb();
  const fields = [
    'company_name', 'contact_first_name', 'contact_last_name', 'email', 'phone',
    'address_line1', 'address_line2', 'postal_code', 'city', 'canton', 'country',
    'vat_number', 'iban', 'payment_terms', 'notes', 'status', 'source',
  ];
  const sets = fields.filter(f => f in data).map(f => `${f} = ?`);
  if (!sets.length) return getClient(id);
  sets.push("updated_at = datetime('now')");
  const vals = fields.filter(f => f in data).map(f => data[f]);
  db.prepare(`UPDATE clients SET ${sets.join(', ')} WHERE id = ?`).run(...vals, id);
  return getClient(id);
}

function deleteClient(id) {
  const db = getDb();
  const hasInvoices = db.prepare('SELECT COUNT(*) AS n FROM invoices WHERE client_id = ?').get(id).n;
  if (hasInvoices > 0) {
    const err = new Error('Ce client possède des factures — archivez-le plutôt que de le supprimer.');
    err.status = 409;
    throw err;
  }
  db.prepare('DELETE FROM clients WHERE id = ?').run(id);
}

function exportClientsCsv(ids) {
  const db = getDb();
  const rows = ids?.length
    ? db.prepare(`SELECT * FROM clients WHERE id IN (${ids.map(() => '?').join(',')}) ORDER BY company_name`).all(...ids)
    : db.prepare('SELECT * FROM clients ORDER BY company_name').all();

  const headers = ['Société', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Adresse', 'NPA', 'Ville', 'Canton', 'Statut', 'Conditions', 'TVA', 'IBAN'];
  const lines = [headers.join(';')];
  for (const r of rows) {
    lines.push([
      r.company_name, r.contact_first_name || '', r.contact_last_name || '',
      r.email || '', r.phone || '', r.address_line1 || '',
      r.postal_code || '', r.city || '', r.canton || '',
      r.status, `${r.payment_terms}j`, r.vat_number || '', r.iban || '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'));
  }
  return lines.join('\n');
}

module.exports = { listClients, getClient, createClient, updateClient, deleteClient, exportClientsCsv };
