const Database = require('better-sqlite3');
const path = require('path');
const logger = require('./logger');

let db;

function getDb() {
  if (!db) {
    const dbPath = path.resolve(process.env.DB_PATH || './data/djamaint.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    logger.info(`Base de données connectée : ${dbPath}`);
  }
  return db;
}

function initDatabase() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'technician' CHECK(role IN ('admin', 'technician', 'client')),
      is_active INTEGER NOT NULL DEFAULT 1,
      totp_secret TEXT,
      totp_enabled INTEGER NOT NULL DEFAULT 0,
      last_login TEXT,
      failed_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      resource TEXT,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Comptabilité
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('revenue', 'expense')),
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      category_code TEXT NOT NULL,
      amount_ht REAL NOT NULL,
      vat_rate REAL NOT NULL DEFAULT 0,
      amount_ttc REAL NOT NULL,
      vat_amount REAL NOT NULL DEFAULT 0,
      payment_method TEXT CHECK(payment_method IN ('bank', 'cash', 'card', 'twint', 'other')),
      reference TEXT,
      invoice_id TEXT,
      client_id TEXT,
      reconciled INTEGER NOT NULL DEFAULT 0,
      bank_transaction_id TEXT,
      notes TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bank_transactions (
      id TEXT PRIMARY KEY,
      import_date TEXT NOT NULL DEFAULT (datetime('now')),
      transaction_date TEXT NOT NULL,
      value_date TEXT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      balance REAL,
      reference TEXT,
      matched_transaction_id TEXT REFERENCES transactions(id),
      status TEXT NOT NULL DEFAULT 'unmatched' CHECK(status IN ('unmatched', 'matched', 'ignored')),
      raw_data TEXT
    );

    CREATE TABLE IF NOT EXISTS vat_periods (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      quarter INTEGER NOT NULL CHECK(quarter IN (1,2,3,4)),
      date_from TEXT NOT NULL,
      date_to TEXT NOT NULL,
      revenue_ht REAL NOT NULL DEFAULT 0,
      vat_collected REAL NOT NULL DEFAULT 0,
      expenses_ht REAL NOT NULL DEFAULT 0,
      vat_deductible REAL NOT NULL DEFAULT 0,
      vat_due REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'submitted', 'paid')),
      submitted_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Conversations agents IA
    CREATE TABLE IF NOT EXISTS agent_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      user_message TEXT NOT NULL,
      assistant_response TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_agent_conv_user ON agent_conversations(user_id, agent_id);

    -- Formation & Développement professionnel
    CREATE TABLE IF NOT EXISTS trainings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      provider TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('fm', 'elec', 'normes', 'gestion', 'autre')),
      status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned', 'ongoing', 'completed')),
      url TEXT,
      hours REAL,
      cost_chf REAL DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      certificate_obtained INTEGER DEFAULT 0,
      certificate_name TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Clients CRM
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      contact_first_name TEXT,
      contact_last_name TEXT,
      email TEXT,
      phone TEXT,
      address_line1 TEXT,
      address_line2 TEXT,
      postal_code TEXT,
      city TEXT,
      canton TEXT DEFAULT 'GE',
      country TEXT DEFAULT 'Suisse',
      vat_number TEXT,
      iban TEXT,
      payment_terms INTEGER DEFAULT 30,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'prospect')),
      source TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Facturation
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      number TEXT UNIQUE NOT NULL,
      client_id TEXT NOT NULL REFERENCES clients(id),
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sent','paid','overdue','cancelled')),
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      payment_date TEXT,
      subtotal_ht REAL NOT NULL DEFAULT 0,
      vat_rate REAL NOT NULL DEFAULT 8.1,
      vat_amount REAL NOT NULL DEFAULT 0,
      total_ttc REAL NOT NULL DEFAULT 0,
      notes TEXT,
      payment_method TEXT,
      iban TEXT,
      qr_reference TEXT,
      pdf_path TEXT,
      sent_at TEXT,
      reminder_1_at TEXT,
      reminder_2_at TEXT,
      reminder_3_at TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      vat_rate REAL NOT NULL DEFAULT 8.1,
      total_ht REAL NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    -- Pipeline commercial (kanban)
    CREATE TABLE IF NOT EXISTS pipeline_leads (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      client_id TEXT REFERENCES clients(id),
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      status TEXT NOT NULL DEFAULT 'setting' CHECK(status IN ('setting','qualification','proposition','closing','won','lost')),
      value_chf REAL DEFAULT 0,
      probability INTEGER DEFAULT 0,
      expected_close_date TEXT,
      source TEXT,
      notes TEXT,
      next_action TEXT,
      next_action_date TEXT,
      lost_reason TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_code);
    CREATE INDEX IF NOT EXISTS idx_bank_transactions_status ON bank_transactions(status);
  `);

  logger.info('Tables initialisées');
}

module.exports = { getDb, initDatabase };
