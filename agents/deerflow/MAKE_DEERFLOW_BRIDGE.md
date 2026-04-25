# Make.com <-> Deerflow Bridge — EasyCom

## Architecture du pont Make -> Deerflow

```
[Make.com]
    |
    v
[HTTP Module: POST DEERFLOW_API_ENDPOINT]
    Headers:
      Authorization: Bearer DEERFLOW_API_KEY
    Body:
      { workflow_id, task, inputs }
    |
    v
[Deerflow execute le workflow autonome]
    |
    v (polling ou webhook callback)
[Make recoit le resultat]
    |
    +-> Google Sheets (scripts generes)
    +-> Notion (analyses)
    +-> Telegram (rapport CEO)
```

---

## Scenario 1 — Generation de scripts (hebdomadaire)

### Declencheur
```
Schedule : Lundi 08:00 (Europe/Zurich)
```

### Module 1 — Preparer les inputs
Pour chaque produit prioritaire (Timekettle M3, Luckits 115L, Xplora X6Play, AirTag) :
- Lire les donnees depuis la base Notion Produits
- Construire le payload Deerflow

### Module 2 — HTTP Request vers Deerflow
```
URL    : DEERFLOW_API_ENDPOINT/api/workflows/run
Method : POST
Auth   : Bearer DEERFLOW_API_KEY
Body   :
{
  "workflow_id": "DEERFLOW_WORKFLOW_ID",
  "task": "generate_izzy_script",
  "inputs": {
    "product_name": "{{produit}}",
    "asin": "{{asin}}",
    "category": "{{categorie}}",
    "angle": "{{angle_tiktok}}",
    "target_platform": "TikTok",
    "amazon_tag": "easycom0ae-21"
  }
}
```

### Module 3 — Google Sheets : Ajouter le script
```
Sheet  : Scripts
Date   : {{today}}
Produit: {{produit}}
Hook   : {{output.hook}}
Corps  : {{output.full_script}}
CTA    : {{output.cta}}
Hashtags: {{output.hashtags}}
Statut : A produire
```

### Module 4 — Telegram : Notifier le CEO
```
Chat  : TELEGRAM_CHAT_ID
Texte : "Deerflow a genere {{n}} scripts cette semaine. Voir Google Sheets pour approbation."
```

---

## Scenario 2 — Analyse performances (mensuel)

### Declencheur
```
Schedule : 1er du mois a 08:00
```

### Module 1 — Google Sheets : Lire les clics du mois
Recuperer toutes les lignes de la feuille "Clics" du mois ecoule.

### Module 2 — HTTP Request vers Deerflow
```
Task   : analyze_affiliate_clicks
Inputs : { clicks_data, period: "last_30_days", target: "optimize_content" }
```

### Module 3 — Notion : Creer rapport mensuel
Creer une page dans la base "Performances" avec les recommendations Deerflow.

### Module 4 — Telegram : Envoyer le rapport
Envoyer un resume en Telegram avec les top produits et recommendations.

---

## Gestion des erreurs

Si Deerflow renvoie une erreur ou est indisponible :
1. Make log l'erreur dans Google Sheets
2. Make envoie une alerte Telegram
3. Fallback : utiliser le module OpenAI de Make directement (sans Deerflow)

---

## Variables requises dans Make

| Variable | Source |
|----------|--------|
| DEERFLOW_API_KEY | Cle API Deerflow (connexion Make) |
| DEERFLOW_WORKFLOW_ID | ID du workflow Deerflow |
| DEERFLOW_API_ENDPOINT | URL de l'API |
| GOOGLE_SHEET_ID | ID Google Sheet Izzy |
| TELEGRAM_BOT_TOKEN | Token bot Telegram |
| TELEGRAM_CHAT_ID | ID chat CEO |
| NOTION_API_KEY | Integration Notion |

**Aucune de ces variables ne doit apparaitre dans GitHub.**
