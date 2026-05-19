const express  = require('express');
const router   = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { runAgent, getConversationHistory, AGENTS } = require('../services/agentService');
const { getMcpStatus } = require('../services/mcpClient');
const logger = require('../config/logger');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array().map(e => ({ field: e.path, message: e.msg })) });
  next();
}

router.use(authenticate);

// GET /api/agents — liste des agents disponibles
router.get('/', (req, res) => {
  const agents = Object.values(AGENTS).map(({ id, name, emoji, color, description }) => ({
    id, name, emoji, color, description,
  }));
  res.json({ agents, model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6' });
});

// GET /api/agents/:id/history
router.get('/:id/history', (req, res) => {
  const history = getConversationHistory(req.user.sub, req.params.id);
  res.json(history);
});

// POST /api/agents/:id/chat — envoi message à un agent
router.post('/:id/chat', [
  body('messages').isArray({ min: 1 }).withMessage('messages[] requis'),
  body('messages.*.role').isIn(['user', 'assistant']),
  body('messages.*.content').isString().isLength({ min: 1, max: 10000 }),
], validate, async (req, res) => {
  const { id } = req.params;
  const { messages } = req.body;

  // Vérifier clé API configurée
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'sk-ant-CHANGE_ME') {
    return res.status(503).json({
      error: 'API Anthropic non configurée',
      detail: 'Ajoutez ANTHROPIC_API_KEY dans le fichier .env du serveur.',
    });
  }

  try {
    const result = await runAgent({ agentId: id, messages, userId: req.user.sub });
    res.json(result);
  } catch (err) {
    logger.error(`Agent ${id} erreur : ${err.message}`);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/agents/mcp/status — état des serveurs MCP
router.get('/mcp/status', async (req, res) => {
  try {
    const status = await getMcpStatus();
    res.json({ servers: status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/agents/weekly-report — déclencher rapport manuel
router.post('/weekly-report', async (req, res) => {
  const { generateWeeklyReport } = require('../services/agentService');
  try {
    const report = await generateWeeklyReport();
    res.json({ report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
