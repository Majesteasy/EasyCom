const cron = require('node-cron');
const logger = require('../config/logger');

// Webhooks Make.com (configurés dans .env)
async function triggerMakeWebhook(webhookUrl, payload) {
  if (!webhookUrl) return;
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, timestamp: new Date().toISOString(), source: 'DJA.MAINT' }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    logger.info(`Webhook Make.com déclenché : ${webhookUrl.slice(0, 60)}...`);
  } catch (err) {
    logger.error(`Webhook Make.com échoué : ${err.message}`);
  }
}

function initScheduler() {
  // ─── Rapport hebdomadaire — vendredi 17h ─────────────────────────────────
  const weeklyReportCron = process.env.WEEKLY_REPORT_CRON || '0 17 * * 5';
  cron.schedule(weeklyReportCron, async () => {
    logger.info('CRON : déclenchement rapport hebdomadaire');
    try {
      const { generateWeeklyReport } = require('./agentService');
      const report = await generateWeeklyReport();

      // Déclencher Make.com scénario rapport
      await triggerMakeWebhook(process.env.MAKE_WEBHOOK_WEEKLY_REPORT, {
        type: 'weekly_report',
        report,
        recipient: process.env.WEEKLY_REPORT_EMAIL,
      });
    } catch (err) {
      logger.error(`CRON rapport hebdo échoué : ${err.message}`);
    }
  }, { timezone: 'Europe/Zurich' });

  // ─── Vérification factures en retard — chaque matin 8h ───────────────────
  cron.schedule('0 8 * * *', async () => {
    const { getDb } = require('../config/database');
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);
    const j30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const j45 = new Date(Date.now() - 45 * 86400000).toISOString().slice(0, 10);
    const j60 = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);

    // Factures non payées par ancienneté (si module facturation actif)
    try {
      const overdue = db.prepare(`
        SELECT id, reference, amount_ttc, date FROM transactions
        WHERE type = 'revenue' AND reconciled = 0
        AND date <= ? ORDER BY date ASC
      `).all(j30);

      if (overdue.length > 0) {
        const j45items = overdue.filter(t => t.date <= j45);
        const j60items = overdue.filter(t => t.date <= j60);

        if (j60items.length > 0) {
          await triggerMakeWebhook(process.env.MAKE_WEBHOOK_OVERDUE_INVOICES, {
            type: 'overdue_j60', invoices: j60items, action: 'mise_en_demeure',
          });
        } else if (j45items.length > 0) {
          await triggerMakeWebhook(process.env.MAKE_WEBHOOK_OVERDUE_INVOICES, {
            type: 'overdue_j45', invoices: j45items, action: 'relance_2',
          });
        } else {
          await triggerMakeWebhook(process.env.MAKE_WEBHOOK_OVERDUE_INVOICES, {
            type: 'overdue_j30', invoices: overdue, action: 'relance_1',
          });
        }
      }
    } catch (err) {
      logger.debug(`CRON factures retard : ${err.message}`);
    }
  }, { timezone: 'Europe/Zurich' });

  logger.info('Scheduler initialisé (rapport hebdo vendredi, vérification factures quotidienne)');
}

// Exposer triggerMakeWebhook pour usage dans les routes
module.exports = { initScheduler, triggerMakeWebhook };
