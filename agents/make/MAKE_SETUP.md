# Make.com — Configuration EasyCom-World

Organisation : **Easycom-World**

## Scénarios existants

| ID | Nom | Statut |
|----|-----|--------|
| 9121934 | Izzy → Telegram | Inactif (token manquant) |
| 9124171 | Rapport quotidien 8h | Inactif (token manquant) |

---

## Mission 1 — Configurer le token Telegram

### Dans le scénario 9121934 (Izzy → Telegram)

1. Ouvrir Make.com → Organisation **Easycom-World**
2. Ouvrir le scénario **ID 9121934**
3. Cliquer sur le module **Telegram → Send a Message**
4. Dans **Connection**, cliquer **Add**
5. Champ **Bot Token** : coller le token fourni par @BotFather
6. Cliquer **Save**
7. Vérifier que le **Chat ID** est bien `1921851243`
8. Sauvegarder le scénario

### Dans le scénario 9124171 (Rapport quotidien 8h)

Même procédure — utiliser la même connexion Telegram ou en créer une nouvelle avec le même token.

---

## Mission 2 — Activer les scénarios

Une fois le token configuré dans les deux scénarios :

1. Ouvrir chaque scénario
2. Basculer le toggle **ON/OFF** en haut à droite sur **ON**
3. Confirmer l'activation

Le scénario 9124171 se déclenchera automatiquement à 8h chaque jour.
Le scénario 9121934 se déclenche via webhook (voir section Webhooks).

---

## Mission 3 — Tester l'envoi Telegram

### Test manuel

1. Ouvrir le scénario 9121934
2. Cliquer **Run once** (bouton en bas à gauche)
3. Déclencher le webhook (voir section Webhooks)
4. Vérifier la réception du message dans Telegram sur le chat `1921851243`

### Test du rapport quotidien

1. Ouvrir le scénario 9124171
2. Cliquer **Run once**
3. Vérifier la réception du rapport dans Telegram

---

## Mission 4 — Webhooks à configurer

### Webhook Izzy → Telegram (scénario 9121934)

Le webhook Make.com est le point d'entrée du scénario. URL à récupérer :

1. Ouvrir le scénario 9121934
2. Cliquer sur le module déclencheur (Webhook)
3. Copier l'URL générée (format : `https://hook.eu1.make.com/xxxxx`)
4. Cette URL sera utilisée par le site EasyCom ou Izzy pour envoyer les messages

### Webhooks futurs prévus

| Webhook | Usage | Scénario cible |
|---------|-------|----------------|
| Nouveau contact formulaire | Notifier Telegram | À créer |
| Alerte stock Amazon | Notifier Telegram | À créer |
| Résumé ventes quotidien | Rapport Notion | 9124171 |

---

## Variables d'environnement Make.com

Ne jamais mettre de tokens dans le code. Utiliser les **Connections** Make.com.

| Variable | Où la configurer |
|----------|-----------------|
| Token Telegram | Connection Telegram dans chaque scénario |
| Chat ID Telegram | Champ Chat ID du module Telegram (valeur : `1921851243`) |
