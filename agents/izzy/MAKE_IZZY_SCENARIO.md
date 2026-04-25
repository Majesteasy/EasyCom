# IZZY — Scenario Make.com : Google Sheets -> Telegram

## Objectif
Izzy lit automatiquement le Google Sheet des scripts, trouve les scripts
"A tourner" et les envoie sur Telegram pour approbation du CEO.

## Prerequis
- Google Sheet cree avec les colonnes du fichier `sheets_template.csv`
- Bot Telegram @EasyComCEObot2_bot configure dans Make
- Compte Make.com (organisation Easycom-World)
- Variables configurees dans Make (pas dans GitHub) :
  - GOOGLE_SHEET_ID
  - TELEGRAM_BOT_TOKEN
  - TELEGRAM_CHAT_ID

---

## Structure du scenario Make

### Module 1 — Declencheur : Schedule
```
Type     : Schedule
Frequence: Chaque jour a 09:00
Timezone : Europe/Zurich
```

### Module 2 — Google Sheets : Search Rows
```
Connection    : Google Sheets (votre compte)
Spreadsheet ID: {{GOOGLE_SHEET_ID}}
Sheet Name    : Scripts
Filter        : Colonne "Statut" = "A tourner"
Limit         : 5 (max 5 scripts par envoi)
```

### Module 3 — Router (bifurcation)
```
Route A : Si le bundle n'est pas vide -> continuer
Route B : Si vide -> stop (rien a envoyer)
```

### Module 4 — Telegram : Send a Message
```
Connection  : Telegram Bot (token TELEGRAM_BOT_TOKEN)
Chat ID     : {{TELEGRAM_CHAT_ID}}
Text        :
---
🎬 *SCRIPT IZZY — {{Produit}}*

📅 Date : {{Date}}
📱 Plateforme : {{Plateforme}}
🛒 ASIN : {{ASIN}}

🪝 *HOOK* : {{Hook}}

📝 *CORPS* : {{Corps}}

📣 *CTA* : {{CTA}}

#️⃣ *HASHTAGS* : {{Hashtags}}

🔗 Site : {{URL_Site}}
🛍️ Amazon : {{URL_Amazon}}

_Statut actuel : {{Statut}}_
---
Parse mode    : Markdown
```

### Module 5 — Google Sheets : Update a Row
```
Spreadsheet ID: {{GOOGLE_SHEET_ID}}
Sheet Name    : Scripts
Row number    : {{numero de la ligne}}
Colonne Statut: Envoye Telegram
```

---

## Variables d'environnement Make (ne jamais exposer dans GitHub)

| Variable | Description | Ou la trouver |
|----------|-------------|---------------|
| GOOGLE_SHEET_ID | ID du Google Sheet (dans l'URL) | URL du sheet |
| TELEGRAM_BOT_TOKEN | Token du bot Telegram | @BotFather sur Telegram |
| TELEGRAM_CHAT_ID | ID du chat CEO | @userinfobot sur Telegram |

---

## Test du scenario

1. Mettre un script en statut "A tourner" dans le Google Sheet
2. Executer le scenario manuellement (bouton "Run once")
3. Verifier la reception du message Telegram
4. Verifier que le statut est passe a "Envoye Telegram"

---

## Calendrier suggere

```
Lundi    09:00 -> Oreillettes traduction
Mardi    09:00 -> Traceur GPS
Mercredi 09:00 -> Lunettes connectees
Jeudi    09:00 -> GPS enfant
Vendredi 09:00 -> Stylo scanner
Samedi   10:00 -> Best-of semaine
Dimanche -> Pas d'envoi
```
