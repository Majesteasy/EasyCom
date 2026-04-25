# MAKE WEBHOOKS — Guide EasyCom

## Webhooks a creer dans Make.com

### Webhook 1 — Elion Chat + Tracking clics

**Nom** : `easycom-elion-webhook`
**URL generee** : `https://hook.eu1.make.com/XXXXXXXXXXXXXXXXXX` (generee par Make)
**Utilisation** :
- Remplaces `MAKE_WEBHOOK_URL` dans `index.html` par cette URL
- Recoit 2 types de requetes selon le champ `type`

**Payloads acceptes** :

Type `elion_chat` :
```json
{
  "type": "elion_chat",
  "message": "Je pars au Japon",
  "history": [{"role":"user","content":"..."}],
  "products": [{"id":"p1","name":"...","asin":"...","url":"..."}]
}
```

Type `affiliate_click` :
```json
{
  "type": "affiliate_click",
  "source": "easycom-world.ch",
  "product": "Timekettle M3",
  "asin": "B0B8NJR625",
  "clickSource": "product_card",
  "page": "https://easycom-world.ch/",
  "ts": "2026-04-25T09:00:00.000Z"
}
```

**Reponse attendue pour elion_chat** :
```json
{ "reply": "Voici mes recommandations pour votre voyage..." }
```

---

### Webhook 2 — Instagram DM

**Nom** : `easycom-instagram-dm`
**Type** : Meta Webhook (configure dans Meta Developer Platform)
**Voir** : `agents/instagram/MAKE_INSTAGRAM_DM_SCENARIO.md`

---

## CORS — Configuration necessaire

Pour que `index.html` puisse appeler le webhook Make depuis le navigateur,
il faut activer CORS dans Make :

Dans le module Webhook -> Settings -> Response headers :
```
Access-Control-Allow-Origin: https://easycom-world.ch
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## Test rapide du webhook Elion

```bash
curl -X POST "VOTRE_MAKE_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "elion_chat",
    "message": "Je pars au Japon",
    "history": [],
    "products": []
  }'
```

Reponse attendue :
```json
{ "reply": "Pour votre voyage au Japon, je recommande..." }
```

---

## Variables a ne jamais exposer dans GitHub

| Placeholder | Description |
|-------------|-------------|
| MAKE_WEBHOOK_URL | URL webhook Make.com |
| TELEGRAM_BOT_TOKEN | Token @EasyComCEObot2_bot |
| TELEGRAM_CHAT_ID | ID chat Telegram CEO |
| GOOGLE_SHEET_ID | ID du Google Sheet Izzy |
| INSTAGRAM_ACCESS_TOKEN | Token Instagram Graph API |
| INSTAGRAM_PAGE_ID | ID de la page Instagram |
| INSTAGRAM_VERIFY_TOKEN | Token verification webhook Meta |
| NOTION_API_KEY | Cle integration Notion |
| NOTION_DATABASE_ID | ID base Notion |
