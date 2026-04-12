# Architecture technique — EasyCom

## Site web (easycom-world.ch)

### Stack
- **HTML/CSS/JS** : Mono-fichier `index.html` (~930 lignes)
- **Hébergement** : GitHub Pages (branche main, root)
- **Domaine** : Infomaniak DNS → GitHub Pages IP (CNAME)
- **Aucun backend** : 100% statique, client-side

### Structure index.html
```
<head>
  - Meta referrer no-referrer (images Amazon)
  - CSS inline complet
</head>
<body>
  - Header navigation + sélecteur langue
  - Section catégories (#cats-grid)
  - Section produits (#produits-grid) — 12 cartes
  - Chatbot Elion (#chat-win)
  - Modal CGV
  - Footer
</body>
<script>
  - const TAG = 'easycom0ae-21'
  - const GEMINI_KEY = '...'
  - const PRODUITS = [...] (12 produits avec ASIN)
  - const CATS = [...] (6 catégories)
  - Fonctions : setLang(), renderCats(), renderProduits()
  - Chatbot : SYSTEM_CHAT, toggleChat(), envoyerChat()
  - Init DOMContentLoaded → renderCats + renderProduits + auto-open Elion
</script>
```

### Liens Amazon affiliés
Format : `https://www.amazon.fr/dp/{ASIN}?tag=easycom0ae-21`
Générés dynamiquement par `getUrl(p)` dans renderProduits()

## Agent ELION (Chatbot)

### API
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=KEY
Content-Type: application/json

{
  system_instruction: { parts: [{ text: SYSTEM_CHAT }] },
  contents: [ { role: "user"|"model", parts: [{ text }] } ],
  generationConfig: { maxOutputTokens: 250, temperature: 0.8 }
}
```

### Réponse
```json
{ "candidates": [{ "content": { "parts": [{ "text": "..." }] } }] }
```

## Agent IZZY (TikTok)
À développer — voir `/agents/izzy/README.md`

## Automation
Make.com + Telegram bot — voir `/automation/README.md`

## GitHub Flow
1. Claude Code → push sur `claude/fix-*` branch
2. PR automatique créée
3. User merge sur GitHub → déploiement GitHub Pages automatique

## Variables clés
| Variable | Valeur | Emplacement |
|----------|--------|-------------|
| TAG | `easycom0ae-21` | index.html ligne ~543 |
| GEMINI_KEY | À insérer | index.html ligne ~672 |
| CNAME | `easycom-world.ch` | CNAME (root) |
