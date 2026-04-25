# EASYCOM — Plan d'Automatisation Make.com

## Vue d'ensemble

```
[Visiteur site]          [CEO Telegram]        [Google Sheets]
      |                        |                      |
      v                        v                      v
 ELION Chat              Izzy Scripts           Clics / Stats
      |                        |                      |
      +------------------------+----------------------+
                               |
                        [Make.com Hub]
                               |
              +----------------+----------------+
              |                |                |
              v                v                v
         [IA (Claude)]    [Notion DB]    [Instagram DM]
```

---

## Scenario 1 — Elion : Site -> Make -> IA -> Reponse

**Objectif** : Elion sur le site repond via IA (pas de cle exposee cote navigateur)

### Flux
```
index.html POST MAKE_WEBHOOK_URL
    -> Make Webhook recoit {type, message, history, products}
    -> Router : si type == "elion_chat"
    -> Appel IA (Claude / GPT-4o / Gemini dans Make)
    -> Reponse JSON { "reply": "..." }
    -> Renvoi vers site (CORS autorise)
```

### Variables Make
- `MAKE_WEBHOOK_URL` : URL du webhook custom (copier dans index.html)
- Cle IA : stockee dans la connexion Make (jamais dans GitHub)

### Format reponse attendu
```json
{ "reply": "Je vous conseille le Timekettle M3 pour votre voyage au Japon..." }
```

---

## Scenario 2 — Izzy : Google Sheets -> Telegram

Voir `agents/izzy/MAKE_IZZY_SCENARIO.md` pour le detail complet.

**Resume** :
- Schedule quotidien 09:00
- Lire Google Sheets -> filtrer "A tourner"
- Envoyer script Telegram
- Marquer "Envoye Telegram"

---

## Scenario 3 — Tracking clics : Site -> Make -> Notion/Google Sheets

**Objectif** : Enregistrer chaque clic affilié pour analyser les performances

### Flux
```
index.html sendBeacon MAKE_WEBHOOK_URL
    -> Make Webhook recoit {type:"affiliate_click", product, asin, clickSource, page, ts}
    -> Router : si type == "affiliate_click"
    -> Google Sheets : ajouter ligne
    -> Notion : creer entree (optionnel)
```

### Colonnes Google Sheets
```
Date | Source | Produit | ASIN | Page | ClickSource | Notes
```

---

## Scenario 4 — Instagram DM -> Make -> Reponse

Voir `agents/instagram/MAKE_INSTAGRAM_DM_SCENARIO.md` pour le detail.

**Resume** :
- Webhook Meta Instagram recoit le DM
- Analyser le texte (mots-cles)
- Repondre avec lien produit + lien site
- Enregistrer dans Google Sheets

---

## Ordre de mise en place recommande

1. **Etape 1** : Creer le webhook Elion Chat (le plus impactant sur le site)
2. **Etape 2** : Creer le Google Sheet Izzy + scenario Telegram
3. **Etape 3** : Activer le tracking des clics
4. **Etape 4** : Connecter Instagram DM (necessite Meta App approuvee)
5. **Etape 5** : Synchronisation Notion (reporting mensuel)

---

## Securite Make.com

- Toutes les cles API sont stockees dans les **connexions Make** (chiffrees)
- Les webhooks Make ont une URL unique — ne pas partager publiquement
- Activer **IP filtering** sur les webhooks si possible
- Ne jamais stocker de token dans les champs "texte" des modules Make
