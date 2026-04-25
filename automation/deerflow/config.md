# DeerFlow 2.0 — Intégration EasyCom

## Rôle dans la stack EasyCom
DeerFlow orchestre des workflows IA multi-étapes : veille produits Amazon,
analyse tendances TikTok, génération de rapports hebdomadaires, déclenchement IZZY.

## Variables requises
- `DEERFLOW_API_KEY` — Dans Make.com › HTTP module › Headers
- `DEERFLOW_WORKFLOW_ID` — ID du workflow DeerFlow (visible dans l'UI)

---

## Workflow 1 : Veille Produits Amazon

**Objectif** : Détecter de nouveaux produits tendance dans les catégories EasyCom.

```yaml
name: easycom-product-watch
trigger: schedule (chaque lundi 8h00)
steps:
  - name: search_amazon
    action: web_search
    query: "meilleur traducteur oreillette amazon 2026 site:amazon.fr"
    output: product_candidates

  - name: filter_relevance
    action: llm_filter
    model: claude-opus-4-7
    prompt: |
      Parmi ces résultats Amazon, sélectionne les 3 produits les plus pertinents
      pour le site EasyCom (traduction, GPS enfant, lunettes, traceurs, stylos scanner).
      Pour chaque produit, extrais : nom, ASIN, prix, catégorie, raison de sélection.
    input: "{{search_amazon.results}}"

  - name: notify_ceo
    action: telegram_message
    token: "TELEGRAM_BOT_TOKEN"
    chat_id: "TELEGRAM_CHAT_ID"
    text: |
      🔍 DeerFlow — Veille produits EasyCom
      
      Nouveaux produits potentiels cette semaine :
      {{filter_relevance.output}}
      
      Répondre AJOUTER {ASIN} pour intégrer au catalogue.
```

---

## Workflow 2 : Analyse Tendances TikTok

**Objectif** : Identifier les formats et hooks qui performent dans la niche gadgets.

```yaml
name: easycom-tiktok-trends
trigger: schedule (chaque vendredi 9h00)
steps:
  - name: search_trends
    action: web_search
    queries:
      - "site:tiktok.com traducteur oreillette viral 2026"
      - "site:tiktok.com gadget voyage amazon trending"
      - "site:tiktok.com lunettes connectées test"
    output: trend_data

  - name: analyze_hooks
    action: llm_analysis
    model: claude-opus-4-7
    prompt: |
      Analyse ces TikToks viraux dans la niche gadgets tech.
      Identifie :
      1. Les 3 hooks d'ouverture les plus utilisés
      2. La durée moyenne des vidéos performantes
      3. Les hashtags dominants
      4. Le style de CTA le plus efficace
      Génère 3 suggestions de hooks pour IZZY cette semaine.
    input: "{{search_trends.results}}"

  - name: send_to_izzy
    action: make_webhook
    url: "MAKE_WEBHOOK_URL"
    payload:
      type: "izzy_trend_brief"
      hooks: "{{analyze_hooks.suggested_hooks}}"
      week: "{{current_week}}"
```

---

## Workflow 3 : Rapport Hebdomadaire CEO

**Objectif** : Synthèse automatique des performances EasyCom chaque dimanche.

```yaml
name: easycom-weekly-report
trigger: schedule (chaque dimanche 18h00)
steps:
  - name: fetch_amazon_data
    action: web_fetch
    url: "https://affiliate-program.amazon.fr/home/reports"
    description: "Données commissions Amazon Associates (nécessite authentification)"

  - name: generate_report
    action: llm_generate
    model: claude-opus-4-7
    prompt: |
      Génère le rapport hebdomadaire EasyCom CEO en français.
      Données Amazon : {{fetch_amazon_data.data}}
      
      Format :
      📊 RAPPORT SEMAINE {N} — EASYCOM
      
      💰 Commissions : X €
      🛒 Ventes validées : X
      🎯 Objectif 3 ventes : [X/3]
      
      📱 Contenu publié :
      - TikTok : X posts
      - Instagram : X posts
      
      🏆 Produit top : {produit} ({X} clics)
      
      📈 Recommandations IZZY pour la semaine suivante :
      1. {recommandation_1}
      2. {recommandation_2}

  - name: send_report
    action: telegram_message
    token: "TELEGRAM_BOT_TOKEN"
    chat_id: "TELEGRAM_CHAT_ID"
    text: "{{generate_report.output}}"
```

---

## Intégration Make.com → DeerFlow

### Déclencher un workflow DeerFlow depuis Make.com
```
Module : HTTP › Make a Request
URL : https://api.deerflow.com/v2/workflows/DEERFLOW_WORKFLOW_ID/run
Method : POST
Headers :
  Authorization : Bearer DEERFLOW_API_KEY
  Content-Type : application/json
Body :
  {
    "inputs": {
      "product_id": "{{product_id}}",
      "context": "easycom"
    }
  }
```

### Recevoir les résultats DeerFlow dans Make.com
DeerFlow → webhook Make.com → traitement → Telegram/Notion/Instagram

```
DeerFlow Output Webhook : MAKE_WEBHOOK_URL
```

---

## Ordre d'activation recommandé

1. **Phase 1** (maintenant) : Élion + fallback local → fonctionne sans DeerFlow
2. **Phase 2** (semaine 2) : Make.com + Elion webhook + alertes Telegram
3. **Phase 3** (semaine 3) : IZZY + Instagram publication
4. **Phase 4** (semaine 4) : DeerFlow veille produits + rapports auto
5. **Phase 5** (mois 2) : DeerFlow tendances TikTok + optimisation IZZY
