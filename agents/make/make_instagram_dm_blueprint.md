# Make.com — Scenario Instagram DM -> Reponse Elion

## Prerequis
- Meta App configuree (voir `agents/instagram/INSTAGRAM_CHATBOT_SETUP.md`)
- Webhook Meta Instagram pointe vers Make.com
- Token Instagram configuree dans la connexion Make (INSTAGRAM_ACCESS_TOKEN)

## Structure du scenario Make

### Module 1 — Webhook Meta Instagram
```
Type    : Instant Trigger (Webhook)
Source  : Meta — Instagram Messaging
Evenement: messages
```

Payload entrant (exemple) :
```json
{
  "object": "instagram",
  "entry": [{
    "id": "INSTAGRAM_PAGE_ID",
    "messaging": [{
      "sender": { "id": "USER_PSID" },
      "recipient": { "id": "INSTAGRAM_PAGE_ID" },
      "timestamp": 1714000000000,
      "message": {
        "mid": "mid.xxx",
        "text": "Avez-vous des oreillettes de traduction?"
      }
    }]
  }]
}
```

### Module 2 — Text Parser (detection intention)
Analyser `entry[].messaging[].message.text` avec des filtres :

| Mots-cles detectes | Intention |
|--------------------|-----------|
| traduction / voyage / langue / japon / anglais | need=translation |
| enfant / gps / securite / montre / parent | need=kids_gps |
| tiktok / video / lunette / createur / film | need=creator |
| (defaut) | general |

### Module 3 — Router (4 routes)

**Route A — Traduction/Voyage**
```
Reponse : "Bonjour! Pour la traduction en voyage, je vous recommande nos oreillettes Timekettle. Decouvrez notre selection : https://easycom-world.ch/?src=instagram_dm&need=translation"
```

**Route B — Securite Enfant**
```
Reponse : "Bonjour! Pour surveiller votre enfant en securite, decouvrez nos montres GPS : https://easycom-world.ch/?src=instagram_dm&need=kids_gps"
```

**Route C — Createur TikTok**
```
Reponse : "Bonjour! Pour vos videos TikTok, nos lunettes connectees sont parfaites : https://easycom-world.ch/?src=instagram_dm&need=creator"
```

**Route D — General**
```
Reponse : "Bonjour! Notre conseiller IA Elion peut vous aider : https://easycom-world.ch/?src=instagram_dm — Posez votre question directement sur le site!"
```

### Module 4 — Instagram : Send Message (API Graph)
```
Connection  : Instagram (INSTAGRAM_ACCESS_TOKEN dans Make)
Recipient   : {{entry[].messaging[].sender.id}}
Message     : {{texte de la route correspondante}}
```

### Module 5 — Google Sheets : Log du DM
```
Spreadsheet : GOOGLE_SHEET_ID
Sheet       : DM_Log
Colonnes    :
  - Date
  - User PSID
  - Message entrant
  - Intention detectee
  - Reponse envoyee
```

## Notes de securite
- INSTAGRAM_ACCESS_TOKEN : stocke uniquement dans la connexion Make
- INSTAGRAM_PAGE_ID : peut etre stocke dans Make comme variable
- Verifier le token webhook Meta avec INSTAGRAM_VERIFY_TOKEN (dans Meta Developer)
- Renouveler le long-lived token Instagram tous les 60 jours
