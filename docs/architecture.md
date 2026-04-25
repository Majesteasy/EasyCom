# Architecture technique — EasyCom

## Site web (easycom-world.ch)

### Stack
- **HTML/CSS/JS** : Mono-fichier `index.html`
- **Hébergement** : GitHub Pages (branche main, root)
- **Domaine** : Infomaniak DNS → GitHub Pages (CNAME)
- **Aucun backend** : 100% statique, client-side
- **Zéro secret dans le code** : tout passe par placeholders + Make.com

### Structure index.html
```
<head>
  - Meta referrer no-referrer (images Amazon)
  - CSS inline complet
</head>
<body>
  - Header navigation
  - Hero section
  - Section catégories/produits (#collection)
  - Chatbot Elion (#chat)
  - Footer affilié
</body>
<script>
  const TAG = 'easycom0ae-21'                 // Tag Amazon affilié
  const ELION_WEBHOOK_URL = 'MAKE_WEBHOOK_URL' // Placeholder → URL Make.com en prod
  const PRODUCTS = [...]                        // 12 produits avec ASIN
  const CATS = [...]                            // 6 catégories
  pick(q) → recommande 1-2 produits par mots-clés (fallback local)
  fallback(q) → construit réponse avec liens affiliés
  sendChat() → fetch ELION_WEBHOOK_URL ou fallback si placeholder
</script>
```

### Liens Amazon affiliés
Format : `https://www.amazon.fr/dp/{ASIN}?tag=easycom0ae-21`
Générés dynamiquement par `url(p)` dans le JS.

---

## Agent ELION (Chatbot)

### Mode production (Make.com configuré)
```
POST MAKE_WEBHOOK_URL
Content-Type: application/json

{
  "type": "elion_chat",
  "message": "...",
  "history": [...],
  "products": [...],
  "page": "https://easycom-world.ch"
}

→ Réponse : { "reply": "..." }
```
Make.com reçoit → appelle Claude Haiku → retourne `{reply}`.
Voir scénario : `/automation/make-scenarios/elion-chat-webhook.json`

### Mode fallback (aucun backend)
Si `ELION_WEBHOOK_URL === 'MAKE_WEBHOOK_URL'` (placeholder), Elion répond
localement via `pick()` + `fallback()` en pur JavaScript.

---

## Agent IZZY (Contenu)

### Pipeline Make.com
```
Déclencheur (manuel ou cron)
  → Module 1 : Claude Opus → génère script TikTok/Instagram
  → Module 2 : Telegram → CEO approuve
  → Module 3 : Instagram Graph API → publie le Reel
  → Module 4 : Notion → enregistre le post
```
Voir scénario : `/automation/make-scenarios/izzy-content-pipeline.json`

---

## Stack complète

```
GitHub Pages          → Site statique (easycom-world.ch)
Make.com              → Orchestration (Elion + IZZY + alertes)
Claude API (Anthropic) → IA (Haiku pour Elion, Opus pour IZZY)
Telegram Bot          → Approbations CEO + notifications
Instagram Graph API   → Publication IZZY
Notion                → Dashboard ventes + calendrier contenu
DeerFlow 2.0          → Veille produits + rapports hebdo (Phase 4+)
Amazon Associates     → Commissions (tag: easycom0ae-21)
```

---

## Variables clés

| Variable | Valeur / Placeholder | Emplacement |
|----------|---------------------|-------------|
| `TAG` | `easycom0ae-21` | `index.html` |
| `ELION_WEBHOOK_URL` | `'MAKE_WEBHOOK_URL'` (placeholder) | `index.html` |
| `CNAME` | `easycom-world.ch` | `CNAME` (root) |
| Tous les secrets | Voir `.env.example` | Make.com / variables privées |

---

## GitHub Flow

1. Claude Code → développe sur branche `claude/...`
2. PR → merge sur `main` par le CEO
3. Déploiement automatique GitHub Pages

## Règles absolues
- Jamais de clé API, token ou secret dans le code Git
- Tous les placeholders restent dans le code (MAKE_WEBHOOK_URL, etc.)
- Les valeurs réelles vont dans Make.com Connections uniquement
- Tag Amazon `easycom0ae-21` toujours présent dans tous les liens
