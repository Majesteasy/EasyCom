# Scenario Make — Instagram DM vers Reponse EasyCom

## Vue d'ensemble

```
[DM Instagram] -> [Meta Webhook] -> [Make.com] -> [Analyse] -> [Reponse DM]
                                                      |
                                              [Google Sheets Log]
```

---

## Etape 1 — Creer le webhook dans Make

1. Dans Make.com : New Scenario -> Add module -> Webhooks -> Custom Webhook
2. Cliquer "Add" -> donner un nom : `easycom-instagram-dm`
3. Copier l'URL generee
4. Dans Meta Developer -> Webhooks -> Instagram -> Modifier
   - Callback URL : coller l'URL Make
   - Verify Token : INSTAGRAM_VERIFY_TOKEN (valeur que vous definissez)
   - Champs : cocher "messages"

## Etape 2 — Gerer la verification Meta (challenge)

Ajouter un module "Webhook Response" en debut de scenario :
```
Condition : si {{query.hub.mode}} == "subscribe"
Reponse   : {{query.hub.challenge}}
Status    : 200
```

## Etape 3 — Parser le message entrant

Module "Set Variable" pour extraire :
- `sender_id` = `{{entry[].messaging[].sender.id}}`
- `message_text` = `{{entry[].messaging[].message.text}}`
- `timestamp` = `{{entry[].messaging[].timestamp}}`

## Etape 4 — Detecter l'intention (Text Parser)

Module "Text Parser" ou conditions sur `message_text` :

```
Contient "traduction" OR "voyage" OR "langue" OR "japon"
  -> intention = "translation"

Contient "enfant" OR "gps" OR "securite" OR "montre" OR "parent"
  -> intention = "kids_gps"

Contient "tiktok" OR "video" OR "lunette" OR "createur"
  -> intention = "creator"

Sinon
  -> intention = "general"
```

## Etape 5 — Router selon l'intention

4 routes Make avec les textes de reponse correspondants.
(Voir `instagram_reply_templates.md` pour les textes)

## Etape 6 — Envoyer la reponse (Instagram Send Message)

Module "HTTP - Make a request" (ou module Instagram si disponible) :
```
URL     : https://graph.facebook.com/v19.0/me/messages
Method  : POST
Headers :
  Authorization : Bearer INSTAGRAM_ACCESS_TOKEN
  Content-Type  : application/json
Body    :
{
  "recipient": { "id": "{{sender_id}}" },
  "message": { "text": "{{texte_reponse}}" }
}
```

## Etape 7 — Logger dans Google Sheets

Module Google Sheets -> Add Row :
```
Sheet   : DM_Log
Date    : {{timestamp}}
User ID : {{sender_id}}
Message : {{message_text}}
Intent  : {{intention}}
Reponse : {{texte_reponse}}
```

---

## Securite du scenario
- INSTAGRAM_ACCESS_TOKEN : connexion Make uniquement (jamais en clair)
- INSTAGRAM_PAGE_ID : variable Make
- INSTAGRAM_VERIFY_TOKEN : variable Make + configuration Meta
- Activer "Verify SSL" dans les requetes HTTP Make
- Tester en mode developpement avant passage en production
