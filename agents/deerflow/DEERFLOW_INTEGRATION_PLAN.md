# DEERFLOW 2.0 — Plan d'Integration EasyCom

## Avertissement important
Deerflow 2.0 est un outil en evolution. Ce document prepare l'architecture
d'integration sans supposer l'API exacte.

**Avant d'implementer** :
- Verifier la documentation officielle Deerflow
- Confirmer les endpoints disponibles
- Remplacer les placeholders :
  - DEERFLOW_API_KEY
  - DEERFLOW_WORKFLOW_ID

---

## Qu'est-ce que Deerflow ?
Deerflow est un framework d'agent AI autonome (open-source) base sur LangGraph.
Il permet de creer des workflows d'agents qui peuvent naviguer, rechercher,
analyser et generer du contenu de facon autonome.

Repo de reference : https://github.com/bytedance/deer-flow

---

## Cas d'usage EasyCom

### Cas 1 — Generation automatique de scripts Izzy
```
Deerflow recoit : {produit, asin, categorie, angle}
Deerflow produit : script complet Hook-Probleme-Solution-Preuve-CTA
Output -> Google Sheets Izzy (colonne Statut = "A produire")
```

### Cas 2 — Analyse des produits gagnants
```
Deerflow recoit : donnees de clics des 30 derniers jours
Deerflow analyse : quel produit convertit le mieux, par source
Output -> Notion "Performances" + rapport Telegram
```

### Cas 3 — Resume performances TikTok
```
Deerflow scrape (si autorise) : statistiques videos @easycomworld
Deerflow produit : rapport hebdo (vues, engagement, taux de clic bio)
Output -> Notion + Telegram
```

### Cas 4 — Proposition de prochaines videos
```
Deerflow recoit : historique des scripts + performances
Deerflow analyse : ce qui a fonctionne + tendances TikTok actuelles
Deerflow propose : 5 prochains scripts prioritaires
Output -> Google Sheets Izzy
```

---

## Architecture Make -> Deerflow

```
[Make.com Schedule]
      |
      v
[HTTP Request POST]
  URL: DEERFLOW_API_ENDPOINT
  Headers:
    Authorization: Bearer DEERFLOW_API_KEY
    Content-Type: application/json
  Body:
    {
      "workflow_id": "DEERFLOW_WORKFLOW_ID",
      "inputs": { ... }
    }
      |
      v
[Deerflow execute le workflow]
      |
      v
[Make recoit le resultat]
      |
      +-> Google Sheets
      +-> Notion
      +-> Telegram
```

---

## Variables Deerflow (JAMAIS dans GitHub)

| Variable | Description |
|----------|-------------|
| DEERFLOW_API_KEY | Cle d'authentification API Deerflow |
| DEERFLOW_WORKFLOW_ID | ID du workflow a executer |
| DEERFLOW_API_ENDPOINT | URL de l'API Deerflow |

---

## Etapes de mise en place (a confirmer avec la doc officielle)

1. Installer Deerflow 2.0 (self-hosted ou cloud selon disponibilite)
2. Creer un workflow "EasyCom Script Generator"
3. Configurer les inputs/outputs du workflow
4. Generer une cle API
5. Creer un scenario Make avec un module HTTP vers l'endpoint Deerflow
6. Tester avec un produit unique
7. Automatiser (schedule) si les resultats sont satisfaisants

---

## Note sur l'etat actuel (avril 2026)
Deerflow 2.0 est en developpement actif. Si la solution n'est pas encore
disponible en mode cloud/API, une alternative est d'utiliser directement
Make.com avec un module "OpenAI" ou "Claude" pour la generation de scripts,
en attendant une integration Deerflow stable.

Alternatives immediates :
- Make.com + GPT-4o (module OpenAI)
- Make.com + Claude API (module HTTP vers api.anthropic.com)
- Make.com + Gemini (module Google AI)
