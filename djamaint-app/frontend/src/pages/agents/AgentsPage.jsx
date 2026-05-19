import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Send, Bot, User, RefreshCw, Info, Zap } from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

const AGENT_COLORS = {
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-700',   ring: 'ring-blue-400',   btn: 'bg-blue-600 hover:bg-blue-700' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', ring: 'ring-purple-400', btn: 'bg-purple-600 hover:bg-purple-700' },
  green:  { bg: 'bg-green-100',  text: 'text-green-700',  ring: 'ring-green-400',  btn: 'bg-green-600 hover:bg-green-700' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', ring: 'ring-yellow-400', btn: 'bg-yellow-600 hover:bg-yellow-700' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', ring: 'ring-orange-400', btn: 'bg-orange-600 hover:bg-orange-700' },
  red:    { bg: 'bg-red-100',    text: 'text-red-700',    ring: 'ring-red-400',    btn: 'bg-red-600 hover:bg-red-700' },
};

// Suggestions rapides par agent
const QUICK_PROMPTS = {
  fm: [
    'Génère une check-list inspection HVAC pour immeuble de bureaux',
    'Quelles sont les normes SIA applicables pour la maintenance préventive ?',
    'Plan de maintenance préventive mensuel type FM',
    'Protocole intervention urgence fuite d\'eau — étapes',
  ],
  legal: [
    'Rédige un contrat de prestation FM pour un immeuble résidentiel',
    'Génère une mise en demeure pour facture impayée de CHF 3\'200',
    'Conditions pour transition EI → Sàrl selon le droit suisse',
    'Quelles mentions obligatoires dans un devis FM suisse ?',
  ],
  commercial: [
    'Script d\'appel setting pour un hôtel 4* à Genève',
    'Email de prospection pour une agence immobilière (SPG/Naef)',
    'Comment répondre à l\'objection "on a déjà un prestataire" ?',
    'Proposition commerciale type pour contrat maintenance annuel',
  ],
  accounting: [
    'Analyse mes KPIs comptables du mois en cours',
    'Comment optimiser ma fiscalité EI Genève légalement ?',
    'Quelles dépenses FM sont déductibles à 100% ?',
    'Résumé de mon bilan simplifié cette année',
  ],
  hr: [
    'Calcule les cotisations sociales pour un salaire brut de CHF 5\'500',
    'Conditions renouvellement permis G frontalier OCPM Genève',
    'Modèle contrat de travail technicien FM temps partiel 80%',
    'Délais de préavis légaux selon ancienneté en droit suisse',
  ],
  strategy: [
    'Analyse ma performance et donne-moi le top 3 priorités cette semaine',
    'Projections CA sur les 6 prochains mois basées sur mes données',
    'Quelles sont les opportunités FM à Genève en ce moment ?',
    'Génère le rapport hebdomadaire complet DJA.MAINT',
  ],
};

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const { data: agentsData } = useQuery({
    queryKey: ['agents-list'],
    queryFn: () => api.get('/agents').then(r => r.data),
  });

  const { data: history } = useQuery({
    queryKey: ['agent-history', selectedAgent?.id],
    queryFn: () => api.get(`/agents/${selectedAgent.id}/history`).then(r => r.data),
    enabled: Boolean(selectedAgent),
  });

  const chatMutation = useMutation({
    mutationFn: ({ agentId, messages }) => api.post(`/agents/${agentId}/chat`, { messages }),
    onSuccess: (res) => {
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response, meta: { iterations: res.data.iterations, usage: res.data.usage } }]);
    },
    onError: (err) => {
      const msg = err.response?.data?.error || err.message;
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Erreur : ${msg}`, isError: true }]);
    },
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatMutation.isPending]);

  const selectAgent = (agent) => {
    setSelectedAgent(agent);
    setMessages([]);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const send = (text) => {
    const content = (text || input).trim();
    if (!content || !selectedAgent || chatMutation.isPending) return;
    const newMsg = { role: 'user', content };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    const allMessages = [...messages, newMsg].map(m => ({ role: m.role, content: m.content }));
    chatMutation.mutate({ agentId: selectedAgent.id, messages: allMessages });
  };

  const agents = agentsData?.agents || [];
  const colors = selectedAgent ? AGENT_COLORS[selectedAgent.color] || AGENT_COLORS.blue : null;
  const quickPrompts = selectedAgent ? QUICK_PROMPTS[selectedAgent.id] || [] : [];

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      {/* Sidebar agents */}
      <div className="w-72 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-4 py-4 border-b border-gray-100">
          <h1 className="font-bold text-gray-900 flex items-center gap-2">
            <Bot size={20} className="text-blue-600" /> Agents IA
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">{agentsData?.model || 'claude-sonnet-4-6'}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {agents.map(agent => {
            const c = AGENT_COLORS[agent.color] || AGENT_COLORS.blue;
            const isSelected = selectedAgent?.id === agent.id;
            return (
              <button key={agent.id} onClick={() => selectAgent(agent)}
                className={`flex items-start gap-3 p-3 rounded-xl text-left transition-all w-full ${isSelected ? `ring-2 ${c.ring} ${c.bg}` : 'hover:bg-gray-50'}`}>
                <span className="text-2xl">{agent.emoji}</span>
                <div className="min-w-0">
                  <p className={`font-semibold text-sm ${isSelected ? c.text : 'text-gray-800'}`}>{agent.name}</p>
                  <p className="text-xs text-gray-400 leading-snug mt-0.5">{agent.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Statut API */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Zap size={12} className="text-green-500" />
            Anthropic API + MCP connecté
          </div>
        </div>
      </div>

      {/* Zone de chat */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {!selectedAgent ? (
          <WelcomeScreen agents={agents} onSelect={selectAgent} />
        ) : (
          <>
            {/* Header agent */}
            <div className={`px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-3`}>
              <span className="text-2xl">{selectedAgent.emoji}</span>
              <div>
                <h2 className={`font-bold text-gray-900`}>{selectedAgent.name}</h2>
                <p className="text-xs text-gray-400">{selectedAgent.description}</p>
              </div>
              <Button variant="ghost" className="ml-auto text-xs" onClick={() => setMessages([])}>
                <RefreshCw size={14} /> Nouvelle conversation
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-6">
                  <div className={`w-16 h-16 rounded-2xl ${AGENT_COLORS[selectedAgent.color]?.bg} flex items-center justify-center text-4xl`}>
                    {selectedAgent.emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">{selectedAgent.name}</h3>
                    <p className="text-sm text-gray-400 max-w-sm">{selectedAgent.description}</p>
                  </div>
                  {quickPrompts.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
                      {quickPrompts.map((p, i) => (
                        <button key={i} onClick={() => send(p)}
                          className="text-left text-xs px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors text-gray-600">
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : `${AGENT_COLORS[selectedAgent.color]?.bg} text-lg`
                  }`}>
                    {msg.role === 'user' ? <User size={16} /> : selectedAgent.emoji}
                  </div>
                  <div className={`max-w-2xl ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : msg.isError
                          ? 'bg-red-50 text-red-700 border border-red-200 rounded-tl-sm'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                    }`}>
                      <MarkdownText text={msg.content} />
                    </div>
                    {msg.meta && (
                      <p className="text-xs text-gray-300">
                        {msg.meta.usage?.input_tokens + msg.meta.usage?.output_tokens} tokens · {msg.meta.iterations} outil(s)
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {chatMutation.isPending && (
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${AGENT_COLORS[selectedAgent.color]?.bg}`}>
                    {selectedAgent.emoji}
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1 items-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="px-6 py-4 bg-white border-t border-gray-200">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder={`Message à ${selectedAgent.name}… (Entrée pour envoyer, Maj+Entrée pour retour à la ligne)`}
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-40 overflow-y-auto"
                  style={{ minHeight: '48px' }}
                  onInput={e => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
                  }}
                />
                <Button
                  onClick={() => send()}
                  disabled={!input.trim() || chatMutation.isPending}
                  loading={chatMutation.isPending}
                  className={`h-12 w-12 p-0 rounded-xl shrink-0 ${colors?.btn || ''}`}>
                  <Send size={18} />
                </Button>
              </div>
              <p className="text-xs text-gray-300 mt-2 text-center">
                Les agents ont accès à vos données DJA.MAINT en temps réel + connecteurs MCP
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WelcomeScreen({ agents, onSelect }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-3xl mb-6 shadow-lg">
        <Bot size={32} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Agents IA DJA.MAINT</h2>
      <p className="text-gray-500 max-w-md mb-8">
        6 agents spécialisés connectés à l'API Anthropic et à vos données en temps réel.
        Choisissez un agent pour commencer.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
        {agents.map(agent => {
          const c = AGENT_COLORS[agent.color] || AGENT_COLORS.blue;
          return (
            <button key={agent.id} onClick={() => onSelect(agent)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-100 hover:border-current ${c.text} hover:${c.bg} transition-all group`}>
              <span className="text-3xl group-hover:scale-110 transition-transform">{agent.emoji}</span>
              <p className="font-semibold text-sm text-gray-800">{agent.name}</p>
              <p className="text-xs text-gray-400 text-center leading-snug">{agent.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Rendu Markdown basique (gras, code, listes)
function MarkdownText({ text }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} className="font-bold text-base mt-2">{line.slice(4)}</h3>;
        if (line.startsWith('## '))  return <h2 key={i} className="font-bold text-lg mt-3">{line.slice(3)}</h2>;
        if (line.startsWith('# '))   return <h1 key={i} className="font-bold text-xl mt-3">{line.slice(2)}</h1>;
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return <li key={i} className="ml-4 list-disc">{renderInline(line.slice(2))}</li>;
        }
        if (/^\d+\. /.test(line)) {
          return <li key={i} className="ml-4 list-decimal">{renderInline(line.replace(/^\d+\. /, ''))}</li>;
        }
        if (line.trim() === '---' || line.trim() === '***') return <hr key={i} className="my-2 border-gray-200" />;
        if (!line.trim()) return <br key={i} />;
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`')  && part.endsWith('`'))  return <code key={i} className="bg-gray-100 px-1 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
    return part;
  });
}
