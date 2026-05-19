const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');

const STATUSES = ['setting', 'qualification', 'proposition', 'closing', 'won', 'lost'];

function listLeads({ status, search } = {}) {
  const db = getDb();
  let where = 'WHERE 1=1';
  const params = [];

  if (status) { where += ' AND l.status = ?'; params.push(status); }
  if (search) {
    where += ' AND (l.client_name LIKE ? OR l.contact_name LIKE ? OR l.contact_email LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q, q);
  }

  return db.prepare(`
    SELECT l.*, c.company_name AS linked_client_name
    FROM pipeline_leads l
    LEFT JOIN clients c ON c.id = l.client_id
    ${where}
    ORDER BY l.created_at DESC
  `).all(...params);
}

function getKanbanBoard() {
  const db = getDb();
  const leads = db.prepare(`
    SELECT l.*, c.company_name AS linked_client_name
    FROM pipeline_leads l
    LEFT JOIN clients c ON c.id = l.client_id
    WHERE l.status NOT IN ('won', 'lost')
    ORDER BY l.created_at
  `).all();

  const columns = {};
  for (const s of STATUSES.slice(0, 4)) columns[s] = { leads: [], total_value: 0 };

  for (const lead of leads) {
    if (columns[lead.status]) {
      columns[lead.status].leads.push(lead);
      columns[lead.status].total_value += lead.value_chf || 0;
    }
  }

  const stats = db.prepare(`
    SELECT
      COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN status = 'won' THEN value_chf ELSE 0 END), 0) AS won_value,
      COALESCE(SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END), 0) AS lost_count,
      COALESCE(SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END), 0) AS won_count
    FROM pipeline_leads
  `).get();

  return { columns, stats };
}

function getLead(id) {
  const db = getDb();
  return db.prepare(`
    SELECT l.*, c.company_name AS linked_client_name
    FROM pipeline_leads l
    LEFT JOIN clients c ON c.id = l.client_id
    WHERE l.id = ?
  `).get(id);
}

function createLead(data, userId) {
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO pipeline_leads (id, client_name, client_id, contact_name, contact_email, contact_phone,
      status, value_chf, probability, expected_close_date, source, notes, next_action, next_action_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.client_name, data.client_id || null,
    data.contact_name || null, data.contact_email || null, data.contact_phone || null,
    data.status || 'setting',
    data.value_chf || 0, data.probability || 0,
    data.expected_close_date || null, data.source || null,
    data.notes || null, data.next_action || null, data.next_action_date || null,
    userId
  );
  return getLead(id);
}

function updateLead(id, data) {
  const db = getDb();
  const fields = [
    'client_name', 'client_id', 'contact_name', 'contact_email', 'contact_phone',
    'status', 'value_chf', 'probability', 'expected_close_date',
    'source', 'notes', 'next_action', 'next_action_date', 'lost_reason',
  ];
  const sets = fields.filter(f => f in data).map(f => `${f} = ?`);
  if (!sets.length) return getLead(id);
  sets.push("updated_at = datetime('now')");
  const vals = fields.filter(f => f in data).map(f => data[f]);
  db.prepare(`UPDATE pipeline_leads SET ${sets.join(', ')} WHERE id = ?`).run(...vals, id);
  return getLead(id);
}

function moveLead(id, newStatus) {
  if (!STATUSES.includes(newStatus)) {
    const e = new Error(`Statut invalide : ${newStatus}`); e.status = 422; throw e;
  }
  // Auto-probability on move
  const probMap = { setting: 10, qualification: 25, proposition: 50, closing: 75, won: 100, lost: 0 };
  return updateLead(id, { status: newStatus, probability: probMap[newStatus] });
}

function deleteLead(id) {
  getDb().prepare('DELETE FROM pipeline_leads WHERE id = ?').run(id);
}

module.exports = { listLeads, getKanbanBoard, getLead, createLead, updateLead, moveLead, deleteLead, STATUSES };
