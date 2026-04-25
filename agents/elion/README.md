# ELION — Chatbot Conseiller EasyCom

## Role
Conseiller shopping IA du site easycom-world.ch. Repond aux visiteurs,
recommande des produits et augmente les conversions affiliees Amazon.

## Architecture actuelle

```
Visiteur -> index.html (JS) -> Make.com Webhook -> IA -> reponse JSON
                                     |
                            Si MAKE_WEBHOOK_URL non configure :
                                     v
                            fallback local (mots-cles)
```

- **Webhook** : `MAKE_WEBHOOK_URL` (placeholder — configurer dans Make.com)
- **Fallback** : reponse locale par mots-cles si webhook non configure
- **Aucune cle API exposee** dans le code source
- **Compatible** : GitHub Pages (aucun backend requis cote serveur)

## Comportement

### Mode Make.com (connecte)
1. Visiteur envoie un message
2. `index.html` POST vers `MAKE_WEBHOOK_URL` avec `{type:"elion_chat", message, history, products}`
3. Make.com appelle une IA (GPT-4o, Claude, Gemini — au choix dans Make)
4. Make renvoie `{ "reply": "..." }`
5. Elion affiche la reponse avec liens Amazon cliquables

### Mode fallback (sans Make)
Si `ELION_WEBHOOK_URL === 'MAKE_WEBHOOK_URL'`, aucun appel reseau n'est fait.
Elion repond via `fallbackElion()` selon mots-cles detectes :

| Mots-cles | Produits recommandes |
|-----------|---------------------|
| enfant / gps / parent / secur | Xplora X6Play + EUNICECG 4G |
| voyage / tradu / langue / japon | Timekettle M3 + WT2 Edge |
| tiktok / video / lunette / createur | Luckits 115L + BLESSOURCE 116L |
| stylo / scan / document / etudiant | Stylo Scanner AI + IRISPen Reader 8 |
| cle / valise / voiture / traceur | Apple AirTag + Samsung SmartTag2 |
| (defaut) | Timekettle M3 + Luckits 115L |

## Liens Amazon
Format systematique :
```
https://www.amazon.fr/dp/{ASIN}?tag=easycom0ae-21&ascsubtag=easycom_tiktok_site
```

## Tracking des clics
Envoye via `navigator.sendBeacon` uniquement si `MAKE_WEBHOOK_URL` est configure.
Payload :
```json
{
  "type": "affiliate_click",
  "source": "easycom-world.ch",
  "product": "Nom produit",
  "asin": "B0XXXXXXXX",
  "clickSource": "product_card",
  "page": "https://easycom-world.ch/",
  "ts": "2026-04-25T..."
}
```

## Configurer Make.com (etapes)
1. Creer un scenario Make.com "Elion Chat"
2. Trigger : Webhook custom (copier l'URL)
3. Remplacer `MAKE_WEBHOOK_URL` dans `index.html` par l'URL Make
4. Router : si `type == elion_chat` -> appel IA -> repondre JSON `{ "reply": "..." }`
5. Si `type == affiliate_click` -> enregistrer dans Google Sheets / Notion

## Securite
- Aucune cle API dans le code source
- Secrets uniquement dans Make.com (variables d'environnement du scenario)
- Tag Amazon : `easycom0ae-21` — ne jamais modifier
