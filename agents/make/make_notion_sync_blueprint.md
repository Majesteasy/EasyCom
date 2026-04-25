# Make.com — Synchronisation avec Notion

## Objectif
Notion devient le tableau de bord EasyCom : produits, contenu, performances.

## Scenario A — Clics affilies -> Notion

### Flux
```
Site (sendBeacon) -> Make Webhook -> Notion Database "Clics/Conversions"
```

### Module Notion "Create a Database Item"
```
Connection    : Notion (NOTION_API_KEY dans Make)
Database ID   : NOTION_DATABASE_ID (base "Clics/Conversions")
Proprietes    :
  - Date     : {{1.ts}}
  - Source   : {{1.source}}
  - Produit  : {{1.product}}
  - ASIN     : {{1.asin}}
  - Page     : {{1.page}}
  - ClickSource: {{1.clickSource}}
```

## Scenario B — Script Izzy approuve -> Notion Calendrier

### Flux
```
Telegram : CEO approuve le script -> Make webhook -> Notion "Calendrier Contenu"
```

### Module Notion "Create a Database Item"
```
Database ID : NOTION_DATABASE_ID (base "Calendrier Contenu")
Proprietes  :
  - Date      : {{date du script}}
  - Plateforme: {{plateforme}}
  - Produit   : {{produit}}
  - Hook      : {{hook}}
  - Script    : {{corps complet}}
  - Statut    : "A tourner"
  - Resultat  : (vide — a remplir apres publication)
```

## Scenario C — Reporting hebdomadaire -> Notion

### Flux
```
Schedule (lundi 08:00) -> Google Sheets (stats semaine) -> Notion "Performances"
```

Metrique calculees :
- Total clics semaine
- Produit le plus clique
- Source principale (TikTok / Instagram DM / direct)
- Scripts envoyes vs publies

## Variables requises dans Make

| Variable | Description |
|----------|-------------|
| NOTION_API_KEY | Integration Notion (dans connexion Make) |
| NOTION_DATABASE_ID | ID base Notion cible |

## Notes
- L'API Notion necessite une integration connectee a chaque base de donnees
- Creer l'integration sur https://www.notion.so/my-integrations
- Partager chaque base Notion avec l'integration (bouton "Partager" dans Notion)
