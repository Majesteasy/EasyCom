const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');
const logger = require('../config/logger');

// Registre des 6 serveurs MCP DJA.MAINT
const MCP_SERVERS = {
  gmail: {
    url: 'https://gmailmcp.googleapis.com/mcp/v1',
    headers: () => ({ Authorization: `Bearer ${process.env.GOOGLE_OAUTH_TOKEN}` }),
    enabled: () => !!process.env.GOOGLE_OAUTH_TOKEN,
    description: 'Gmail — envoi factures, relances, prospection',
  },
  calendar: {
    url: 'https://calendarmcp.googleapis.com/mcp/v1',
    headers: () => ({ Authorization: `Bearer ${process.env.GOOGLE_OAUTH_TOKEN}` }),
    enabled: () => !!process.env.GOOGLE_OAUTH_TOKEN,
    description: 'Google Calendar — agenda interventions',
  },
  drive: {
    url: 'https://drivemcp.googleapis.com/mcp/v1',
    headers: () => ({ Authorization: `Bearer ${process.env.GOOGLE_OAUTH_TOKEN}` }),
    enabled: () => !!process.env.GOOGLE_OAUTH_TOKEN,
    description: 'Google Drive — documents, contrats, archivage',
  },
  notion: {
    url: 'https://mcp.notion.com/mcp',
    headers: () => ({ Authorization: `Bearer ${process.env.NOTION_TOKEN}` }),
    enabled: () => !!process.env.NOTION_TOKEN,
    description: 'Notion — base de connaissances FM',
  },
  make: {
    url: 'https://mcp.make.com',
    headers: () => ({ 'X-Api-Key': process.env.MAKE_API_KEY }),
    enabled: () => !!process.env.MAKE_API_KEY,
    description: 'Make.com — automatisations scénarios',
  },
  slack: {
    url: 'https://mcp.slack.com/mcp',
    headers: () => ({ Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }),
    enabled: () => !!process.env.SLACK_BOT_TOKEN,
    description: 'Slack — notifications équipe',
  },
};

// Cache clients actifs
const clients = new Map();

async function getMcpClient(name) {
  const server = MCP_SERVERS[name];
  if (!server || !server.enabled()) return null;
  if (clients.has(name)) return clients.get(name);

  try {
    const transport = new StreamableHTTPClientTransport(new URL(server.url), {
      requestInit: { headers: server.headers() },
    });
    const client = new Client({ name: `djamaint-${name}`, version: '1.0.0' });
    await client.connect(transport);
    clients.set(name, client);
    logger.info(`MCP connecté : ${name} → ${server.url}`);
    return client;
  } catch (err) {
    logger.warn(`MCP ${name} indisponible : ${err.message}`);
    return null;
  }
}

async function getMcpTools(name) {
  const client = await getMcpClient(name);
  if (!client) return [];
  try {
    const { tools } = await client.listTools();
    return tools.map(t => ({
      name: `${name}__${t.name}`,
      description: t.description,
      input_schema: t.inputSchema,
    }));
  } catch {
    return [];
  }
}

async function callMcpTool(name, toolName, input) {
  const client = await getMcpClient(name);
  if (!client) throw new Error(`MCP ${name} non connecté`);
  const { content } = await client.callTool({ name: toolName, arguments: input });
  return content;
}

async function getAllActiveTools() {
  const names = Object.keys(MCP_SERVERS).filter(n => MCP_SERVERS[n].enabled());
  const toolLists = await Promise.all(names.map(n => getMcpTools(n)));
  return toolLists.flat();
}

async function dispatchMcpTool(toolName, input) {
  // toolName format: "gmail__send_email" → server=gmail, tool=send_email
  const sepIdx = toolName.indexOf('__');
  if (sepIdx === -1) throw new Error(`Format outil MCP invalide : ${toolName}`);
  const serverName = toolName.slice(0, sepIdx);
  const actualTool = toolName.slice(sepIdx + 2);

  if (!MCP_SERVERS[serverName]) throw new Error(`Serveur MCP "${serverName}" inconnu`);
  if (!MCP_SERVERS[serverName].enabled()) throw new Error(`Serveur MCP "${serverName}" non configuré (token manquant)`);

  return callMcpTool(serverName, actualTool, input);
}

// Statut de tous les serveurs MCP
async function getMcpStatus() {
  const results = await Promise.allSettled(
    Object.entries(MCP_SERVERS).map(async ([name, server]) => {
      const configured = server.enabled();
      let connected = false;
      if (configured) {
        try {
          const client = await getMcpClient(name);
          connected = !!client;
        } catch {}
      }
      return { name, description: server.description, configured, connected };
    })
  );
  return results.map(r => (r.status === 'fulfilled' ? r.value : { error: r.reason?.message }));
}

// Déconnecter et vider le cache (utile en test)
function disconnectAll() {
  clients.clear();
}

module.exports = { getMcpTools, callMcpTool, getAllActiveTools, dispatchMcpTool, getMcpStatus, disconnectAll };
