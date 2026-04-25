# Telegram CEO Dashboard — EasyCom

Chat ID CEO : **1921851243**
Bot : **@EasyComCEObot2_bot**

---

## Messages automatiques programmés

### 8h00 — Rapport quotidien

**Scénario Make.com :** 9124171 (Rapport quotidien 8h)

```
📊 EasyCom — Rapport du [DATE]

💰 Revenus hier
   Commissions Amazon : [montant]€
   Clics produits : [nombre]
   Taux conversion : [%]

💬 Elion
   Conversations : [nombre]
   Langue principale : [FR/EN/DE/IT/ES]
   Question la plus posée : [texte]

📧 Emails
   Reçus : [nombre]
   Demandes produits : [nombre]
   Sans réponse : [nombre]

📋 À faire aujourd'hui
   [liste tirée de Notion MASTER]
```

**Configuration Make.com :**
- Scheduler → 8h00 chaque jour
- Sources : Notion MASTER, logs Elion, IMAP Infomaniak
- Destination : Telegram Chat ID 1921851243

---

### Temps réel — Nouvelle vente Amazon

**Déclencheur :** Email Amazon Associates reçu

```
💰 Vente Amazon !

Produit : [nom produit]
ASIN : [ASIN]
Commission : [montant]€
Cumul du mois : [montant]€
```

**Configuration Make.com :**
- IMAP Watch → filtre expéditeur Amazon Associates
- Text Parser → extraire montant et produit
- Telegram → envoi immédiat

---

### Temps réel — Nouveau follower TikTok

**Déclencheur :** Nouveau follower détecté (via API TikTok ou outil tiers)

```
🎵 Nouveau follower TikTok

@[username]
Followers total : [nombre]
Objectif : [prochain palier]
```

**Configuration Make.com :**
- TikTok Watch ou RSS Mention
- Telegram → envoi immédiat
- Notion → mise à jour compteur

---

### 18h00 — Script Izzy du jour à valider

**Scénario Make.com :** Nouveau (à créer)

```
🎬 Script Izzy — À valider

Produit : [nom]
ASIN : [ASIN]
Durée estimée : 28s

HOOK (3s)
[texte]

PROBLÈME (5s)
[texte]

SOLUTION (10s)
[texte]

PREUVE (5s)
[texte]

CTA (5s)
easycom-world.ch

─────────────
✅ Tapez GO pour valider
✏️ Tapez EDIT + correction
❌ Tapez STOP pour retravailler
```

**Configuration Make.com :**
- Scheduler → 18h00
- Notion Watch → scripts statut "Prêt à valider"
- Telegram → envoi avec formatage
- Écoute réponse CEO → mise à jour Notion

---

### 23h00 — Bilan journée

**Scénario Make.com :** Extension du 9124171

```
🌙 Bilan EasyCom — [DATE]

✅ Accompli aujourd'hui
   [tiré de Notion MASTER]

💰 Total revenus journée : [montant]€
💬 Conversations Elion : [nombre]
📱 Scripts Izzy validés : [nombre]
📧 Emails traités : [nombre]

🎯 Demain
   [priorités Notion]

Bonne nuit. 🌙
```

**Configuration Make.com :**
- Scheduler → 23h00
- Agrégation données Notion du jour
- Telegram → envoi résumé

---

## Configuration Make.com — Réception des réponses CEO

Pour que Make.com réagisse aux réponses Telegram (GO / STOP / EDIT) :

1. Créer un scénario **Telegram Watch Updates**
2. Filtrer sur Chat ID `1921851243`
3. Router selon le texte reçu :
   - `GO` → Notion : statut script = "Validé"
   - `STOP` → Notion : statut script = "À retravailler"
   - `EDIT [texte]` → Notion : ajouter commentaire de correction

---

## Récapitulatif scénarios Make.com nécessaires

| Heure | Message | Scénario | Statut |
|-------|---------|----------|--------|
| 8h00 | Rapport quotidien | 9124171 | Inactif (token manquant) |
| Temps réel | Vente Amazon | À créer | À faire |
| Temps réel | Follower TikTok | À créer | À faire |
| 18h00 | Script Izzy | À créer | À faire |
| 23h00 | Bilan journée | Extension 9124171 | À faire |
| En continu | Écoute réponses CEO | À créer | À faire |

---

## Priorité d'activation

1. Token Telegram → activer scénario 9124171 (rapport 8h) ← **maintenant**
2. Créer scénario vente Amazon
3. Créer scénario script Izzy 18h + écoute réponses
4. Créer scénario bilan 23h
5. TikTok en dernier (dépend de l'accès API)
