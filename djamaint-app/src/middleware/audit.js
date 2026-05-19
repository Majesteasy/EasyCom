const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');

function auditLog(action, resource) {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 400) return;
      const db = getDb();
      db.prepare(`
        INSERT INTO audit_logs (id, user_id, action, resource, ip_address, user_agent, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        uuidv4(),
        req.user?.sub || null,
        action,
        resource || req.originalUrl,
        req.ip,
        req.get('User-Agent') || null
      );
    });
    next();
  };
}

module.exports = { auditLog };
