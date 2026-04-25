# Telegram Bot — Configuration EasyCom

Bot : **@EasyComCEObot2_bot**
Chat ID CEO : **1921851243**

---

## Étape 1 — Obtenir un nouveau token via @BotFather

1. Ouvrir Telegram
2. Rechercher **@BotFather** et ouvrir la conversation
3. Taper `/mybots`
4. Sélectionner **@EasyComCEObot2_bot**
5. Cliquer **API Token**
6. Copier le token affiché (format : `123456789:ABCdef...`)

> Le token est sensible. Ne jamais le committer dans le code.

---

## Étape 2 — Mettre le token dans Make.com

### Scénario 9121934 (Izzy → Telegram)

1. Ouvrir Make.com → Easycom-World → scénario 9121934
2. Cliquer sur le module **Telegram → Send a Message**
3. **Connection** → **Add**
4. Coller le token dans le champ **Bot Token**
5. Nommer la connexion : `EasyComCEObot2`
6. **Save**

### Scénario 9124171 (Rapport quotidien 8h)

1. Ouvrir le scénario 9124171
2. Sur le module Telegram, sélectionner la connexion `EasyComCEObot2` déjà créée
3. **Save**

---

## Étape 3 — Tester le bot

### Test direct via l'API Telegram

Remplacer `TON_TOKEN` par le token réel, puis ouvrir dans un navigateur :

```
https://api.telegram.org/botTON_TOKEN/sendMessage?chat_id=1921851243&text=Test+EasyCom+OK
```

Si le message arrive dans Telegram → le bot fonctionne.

### Test via Make.com

1. Ouvrir le scénario 9121934
2. Cliquer **Run once**
3. Déclencher le webhook manuellement
4. Vérifier la réception sur le chat `1921851243`

---

## Récapitulatif

| Paramètre | Valeur |
|-----------|--------|
| Bot | @EasyComCEObot2_bot |
| Chat ID CEO | `1921851243` |
| Token | Via @BotFather → /mybots → API Token |
| Connexion Make.com | `EasyComCEObot2` |

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Token invalide | Régénérer via @BotFather → /mybots → Revoke current token → Generate new token |
| Message non reçu | Vérifier que le Chat ID est `1921851243` |
| Bot bloqué | Ouvrir une conversation avec @EasyComCEObot2_bot et taper /start |
| Erreur 403 | Le bot a été bloqué — taper /start sur le bot |
