const Anthropic = require('@anthropic-ai/sdk');
const { AGENTS } = require('./agentDefinitions');
const { getAllActiveTools, dispatchMcpTool } = require('./mcpClient');
const { getKpis, getMonthlyChart, getCategoryBreakdown, getSimpleBilan } = require('./accountingService');
const { getDb } = require('../config/database');
const logger = require('../config/logger');

let anthropic;
function getAnthropic() {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'sk-ant-CHANGE_ME') {
      throw new Error('ANTHROPIC_API_KEY non configurée. Ajoutez votre clé dans le fichier .env');
    }
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropic;
}

const MODEL = () => process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

// ─── Outils internes DJA.MAINT ───────────────────────────────────────────────

const INTERNAL_TOOLS = [
  {
    name: 'get_accounting_kpis',
    description: 'Récupère les KPIs comptables en temps réel (CA, dépenses, résultat net, TVA)',
    input_schema: {
      type: 'object',
      properties: {
        year:  { type: 'integer', description: 'Année (défaut: en cours)' },
        month: { type: 'integer', description: 'Mois 1-12 (défaut: en cours)' },
      },
    },
  },
  {
    name: 'get_monthly_chart',
    description: 'Récupère les données CA mensuel sur 12 mois pour analyse de tendance',
    input_schema: {
      type: 'object',
      properties: {
        year: { type: 'integer', description: 'Année (défaut: en cours)' },
      },
    },
  },
  {
    name: 'get_bilan',
    description: 'Récupère le bilan simplifié EI annuel (recettes/dépenses par catégorie, résultat)',
    input_schema: {
      type: 'object',
      properties: {
        year: { type: 'integer', description: 'Année (défaut: en cours)' },
      },
    },
  },
  {
    name: 'get_category_breakdown',
    description: 'Analyse des dépenses ou recettes par catégorie sur une période',
    input_schema: {
      type: 'object',
      required: ['type'],
      properties: {
        type:     { type: 'string', enum: ['revenue', 'expense'], description: 'Type de transaction' },
        dateFrom: { type: 'string', description: 'Date début YYYY-MM-DD' },
        dateTo:   { type: 'string', description: 'Date fin YYYY-MM-DD' },
      },
    },
  },
  {
    name: 'get_recent_transactions',
    description: 'Récupère les dernières transactions comptables',
    input_schema: {
      type: 'object',
      properties: {
        limit:  { type: 'integer', description: 'Nombre max (défaut: 10)', default: 10 },
        type:   { type: 'string', enum: ['revenue', 'expense'], description: 'Filtrer par type' },
      },
    },
  },
  {
    name: 'get_company_info',
    description: 'Informations sur DJA.MAINT (CA annuel, nb clients, interventions, statut TVA)',
    input_schema: { type: 'object', properties: {} },
  },
];

async function executeInternalTool(toolName, input) {
  const now = new Date();
  const year  = input.year  || now.getFullYear();
  const month = input.month || (now.getMonth() + 1);

  switch (toolName) {
    case 'get_accounting_kpis':
      return JSON.stringify(getKpis({ year, month }));

    case 'get_monthly_chart':
      return JSON.stringify(getMonthlyChart(year));

    case 'get_bilan':
      return JSON.stringify(getSimpleBilan(year));

    case 'get_category_breakdown':
      return JSON.stringify(getCategoryBreakdown(input.type, { dateFrom: input.dateFrom, dateTo: input.dateTo }));

    case 'get_recent_transactions': {
      const db = getDb();
      const rows = db.prepare(`
        SELECT date, type, description, amount_ht, category_code
        FROM transactions ORDER BY date DESC LIMIT ?
      `).all(input.limit || 10);
      return JSON.stringify(rows);
    }

    case 'get_company_info': {
      const db = getDb();
      const kpis = getKpis();
      const clientCount = db.prepare("SELECT COUNT(*) as n FROM (SELECT DISTINCT client_id FROM transactions WHERE client_id IS NOT NULL)").get()?.n || 0;
      return JSON.stringify({
        name: 'DJA.MAINT',
        type: 'Entreprise individuelle',
        location: 'Genève, Suisse',
        sector: 'Facility Management',
        currentYearRevenue: kpis.year.revenue,
        currentYearExpenses: kpis.year.expenses,
        netResult: kpis.year.net,
        vatLiable: kpis.year.revenue >= 100_000,
        activeClients: clientCount,
        currency: 'CHF',
      });
    }

    default:
      return JSON.stringify({ error: `Outil inconnu : ${toolName}` });
  }
}

// ─── Moteur d'agent ──────────────────────────────────────────────────────────

async function runAgent({ agentId, messages, userId, stream = false }) {
  const agent = AGENTS[agentId];
  if (!agent) throw Object.assign(new Error(`Agent inconnu : ${agentId}`), { status: 400 });

  const client = getAnthropic();

  // Assembler les outils : internes + MCP actifs
  let tools = [...INTERNAL_TOOLS];
  try {
    const mcpTools = await getAllActiveTools();
    tools = [...tools, ...mcpTools];
  } catch {
    // MCP non connecté — on continue avec les outils internes
  }

  const anthropicMessages = messages.map(m => ({ role: m.role, content: m.content }));

  // Boucle agentic avec tool use
  let response;
  let iterations = 0;
  const MAX_ITERATIONS = 6;

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    response = await client.messages.create({
      model: MODEL(),
      max_tokens: 4096,
      system: agent.systemPrompt,
      messages: anthropicMessages,
      tools,
    });

    logger.debug(`Agent ${agentId} iter ${iterations}: stop_reason=${response.stop_reason}`);

    if (response.stop_reason === 'end_turn') break;

    if (response.stop_reason === 'tool_use') {
      // Traiter tous les appels d'outils
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
      const toolResults = [];

      for (const toolUse of toolUseBlocks) {
        let result;
        try {
          if (INTERNAL_TOOLS.some(t => t.name === toolUse.name)) {
            result = await executeInternalTool(toolUse.name, toolUse.input);
          } else {
            // Outil MCP
            const mcpResult = await dispatchMcpTool(toolUse.name, toolUse.input);
            result = JSON.stringify(mcpResult);
          }
        } catch (err) {
          result = JSON.stringify({ error: err.message });
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: result,
        });
      }

      // Ajouter la réponse de l'assistant et les résultats outils
      anthropicMessages.push({ role: 'assistant', content: response.content });
      anthropicMessages.push({ role: 'user', content: toolResults });
    } else {
      break;
    }
  }

  // Extraire le texte final
  const textContent = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n');

  // Sauvegarder dans l'historique
  saveConversationHistory(userId, agentId, messages, textContent);

  return {
    agentId,
    agentName: agent.name,
    response: textContent,
    model: MODEL(),
    iterations,
    usage: response.usage,
  };
}

// ─── Historique conversations ────────────────────────────────────────────────

function saveConversationHistory(userId, agentId, messages, response) {
  const db = getDb();
  const last = messages[messages.length - 1];
  db.prepare(`
    INSERT INTO agent_conversations (id, user_id, agent_id, user_message, assistant_response, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run(require('crypto').randomUUID(), userId, agentId, last?.content || '', response);
}

function getConversationHistory(userId, agentId, limit = 20) {
  const db = getDb();
  return db.prepare(`
    SELECT agent_id, user_message, assistant_response, created_at
    FROM agent_conversations
    WHERE user_id = ? AND agent_id = ?
    ORDER BY created_at DESC LIMIT ?
  `).all(userId, agentId, limit).reverse();
}

// ─── Rapport hebdomadaire automatique ────────────────────────────────────────

async function generateWeeklyReport() {
  logger.info('Génération rapport hebdomadaire Agent Stratégie...');
  try {
    const result = await runAgent({
      agentId: 'strategy',
      userId: 'system',
      messages: [{
        role: 'user',
        content: `Génère le rapport hebdomadaire DJA.MAINT pour la semaine du ${new Date().toLocaleDateString('fr-CH')}.
Analyse les KPIs comptables en temps réel, identifie les tendances, et fournis :
1. Résumé performance semaine (CA, dépenses, résultat net)
2. Alertes si baisse > 10% vs semaine précédente
3. Top 3 actions prioritaires pour la semaine suivante
4. Pipeline et prévisions
Format : rapport structuré prêt à envoyer par email.`,
      }],
    });

    logger.info('Rapport hebdomadaire généré');
    return result.response;
  } catch (err) {
    logger.error(`Erreur rapport hebdomadaire : ${err.message}`);
    throw err;
  }
}

module.exports = { runAgent, getConversationHistory, generateWeeklyReport, AGENTS };
