# ELION — Chatbot IA EasyCom

## Rôle
Conseiller shopping IA du site easycom-world.ch. Répond aux visiteurs,
recommande des produits, augmente les conversions affiliées Amazon.

## Technologie
- **API** : Google Gemini 1.5 Flash (`generativelanguage.googleapis.com`)
- **Intégration** : 100% côté client (JavaScript dans `index.html`)
- **Compatible** : GitHub Pages (aucun backend requis)

## Configuration

### Clé API Gemini
Dans `index.html` ligne ~672 :
```javascript
const GEMINI_KEY = 'TA_CLÉ_ICI';
```

### Obtenir une clé Gemini
1. Va sur https://aistudio.google.com/app/apikey
2. Clique "Create API Key"
3. Sélectionne le projet `gen-lang-client-0867504105`
4. Copie la clé et colle-la dans `index.html`

### Restreindre la clé (sécurité)
Dans Google Cloud Console → APIs & Services → Credentials :
- HTTP referrers uniquement :
  - `https://easycom-world.ch/*`
  - `https://www.easycom-world.ch/*`
  - `https://majesteasy.github.io/EasyCom/*`

## System Prompt
Elion connaît les 12 produits EasyCom avec leurs liens affiliés `easycom0ae-21`.
Il répond en FR/EN/DE/IT/ES selon la langue du visiteur.

## Fonctionnement
- S'ouvre automatiquement après **4 secondes** sur le site
- Message de bienvenue multilingue
- Maximum 250 tokens par réponse (rapide)
- Historique conservé sur 8 messages

## Tag Amazon affilié
`easycom0ae-21` — intégré dans tous les liens produits du system prompt.
