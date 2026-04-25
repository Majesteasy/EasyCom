# Automation — EasyCom Stack

## Outils
- **Make.com** : Organisation Easycom-World — orchestration de tous les workflows
- **Telegram Bot** : @EasyComCEObot2_bot — notifications CEO + approbations IZZY
- **Instagram Graph API** : Publication contenu IZZY (@easycom_world)
- **Notion** : Dashboard et tracking ventes affiliées
- **DeerFlow 2.0** : Veille produits, tendances TikTok, rapports auto

---

## Scénarios Make.com (importables)

| Fichier | Rôle | Statut |
|---------|------|--------|
| `make-scenarios/elion-chat-webhook.json` | Elion IA via Claude Haiku | Prêt à importer |
| `make-scenarios/izzy-content-pipeline.json` | IZZY génération + publication Instagram | Prêt à importer |
| `make-scenarios/sales-alert.json` | Alerte ventes Amazon + suivi Notion | Prêt à importer |

---

## Variables à configurer (JAMAIS dans le code)

Toutes les valeurs réelles vont dans **Make.com › Connections** et **variables d'environnement privées**.

| Placeholder | Où configurer |
|-------------|--------------|
| `MAKE_WEBHOOK_URL` | Make.com › Webhooks › Copier l'URL |
| `TELEGRAM_BOT_TOKEN` | Make.com › Telegram module |
| `TELEGRAM_CHAT_ID` | Make.com › Telegram module |
| `INSTAGRAM_ACCESS_TOKEN` | Make.com › HTTP module headers |
| `INSTAGRAM_PAGE_ID` | Make.com › HTTP module body |
| `INSTAGRAM_VERIFY_TOKEN` | Meta Developer › Webhooks |
| `NOTION_API_KEY` | Make.com › Notion connection |
| `NOTION_DATABASE_ID` | Make.com › Notion module |
| `DEERFLOW_API_KEY` | Make.com › HTTP module headers |
| `DEERFLOW_WORKFLOW_ID` | Make.com › HTTP module URL |
| `GOOGLE_SHEET_ID` | Make.com › Google Sheets module |

---

## Automatisations actives / planifiées

### ✅ Prêt (fallback local sans Make.com)
- Elion chatbot avec réponses par mots-clés
- Liens affiliés Amazon `easycom0ae-21` dynamiques

### 🔧 Phase 2 — Configurer Make.com
- [ ] Importer `elion-chat-webhook.json` → activer Elion IA
- [ ] Configurer alerte Telegram ventes
- [ ] Tester webhook MAKE_WEBHOOK_URL → index.html

### 📱 Phase 3 — Instagram IZZY
- [ ] Configurer compte Meta Developer
- [ ] Obtenir token Instagram longue durée
- [ ] Importer `izzy-content-pipeline.json`
- [ ] Premier Reel publié via IZZY

### 📊 Phase 4 — Notion Dashboard
- [ ] Créer les 3 bases Notion (voir `notion/database-structure.md`)
- [ ] Connecter Make.com → Notion
- [ ] Premier tracking vente enregistré

### 🤖 Phase 5 — DeerFlow
- [ ] Configurer workflow veille produits
- [ ] Activer rapport hebdomadaire automatique
- [ ] Intégrer tendances TikTok → IZZY

---

## Architecture résumée

```
easycom-world.ch (GitHub Pages)
    │
    ├── Visiteur → ELION chatbot
    │      └── fetch MAKE_WEBHOOK_URL
    │              └── Make.com → Claude Haiku → réponse
    │
    ├── TikTok @easycomworld → lien bio → site
    │
    └── IZZY (contenu automatisé)
           ├── Make.com → Claude Opus → script
           ├── CEO approuve via Telegram
           └── Make.com → Instagram Graph API → publication
                   └── Notion → tracking post + ventes
```
