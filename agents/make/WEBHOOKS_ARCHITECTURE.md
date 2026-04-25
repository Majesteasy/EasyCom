# Make.com — Architecture Webhooks EasyCom

---

## Vue d'ensemble

```
Site EasyCom ──────────────► Webhook 1 ──► Notion (clics produits)
Email entrant ─────────────► Webhook 2 ──► Telegram (alertes)
TikTok mention ────────────► Webhook 3 ──► Notion (service client)
Script Izzy prêt ──────────► Webhook 4 ──► Telegram (validation CEO)
```

---

## Webhook 1 — Clic produit site → Notion

**But :** tracker chaque clic sur un lien Amazon depuis le site.

### Configuration Make.com

```
Webhook entrant (URL Make)
    → Data Store : incrémenter compteur ASIN
    → Notion : mettre à jour ligne produit (clics +1)
    → [Optionnel] Si clics > seuil → Telegram alerte "produit populaire"
```

### Code à ajouter dans index.html (côté tracking uniquement)

Les liens Amazon ont déjà le tag `easycom0ae-21`. Pour le tracking Make.com, chaque clic peut appeler le webhook via un `fetch` non-bloquant :

```javascript
// À déclencher au clic sur un lien produit
async function trackClick(asin, productName) {
  await fetch('WEBHOOK_URL_MAKE', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ asin, product: productName, ts: Date.now() })
  }).catch(() => {}); // silencieux si erreur
}
```

### Données reçues par Make

```json
{
  "asin": "B084NZL8G3",
  "product": "Timekettle WT2 Edge",
  "ts": 1714000000000
}
```

### Mise à jour Notion

| Champ Notion | Valeur |
|---|---|
| ASIN | asin reçu |
| Clics | +1 |
| Dernier clic | timestamp |

---

## Webhook 2 — Email entrant → Telegram alerte

**But :** être notifié en temps réel de tout email sur `contact@easycom-world.ch`.

### Configuration Make.com

```
IMAP Watch Emails (contact@easycom-world.ch, toutes les 5 min)
    → Text Parser : extraire expéditeur, sujet, extrait corps
    → Telegram Send Message (Chat ID 1921851243)
```

### Message Telegram type

```
📧 Nouvel email EasyCom
De : [expéditeur]
Objet : [sujet]
Aperçu : [100 premiers caractères]
```

### Filtre recommandé

Ignorer les emails automatiques (newsletters, confirmations) — filtrer sur `From` ne contenant pas : `noreply`, `no-reply`, `mailer-daemon`.

---

## Webhook 3 — TikTok mention → Notion service client

**But :** capturer les mentions d'EasyCom ou d'Izzy sur TikTok pour répondre.

### Configuration Make.com

**Option A — Via RSS/scraper tiers**
```
RSS Watch (flux mentions TikTok via Mention.com ou Brand24)
    → Text Parser : extraire username, contenu, URL vidéo
    → Notion : créer entrée dans base "Conversations"
    → Telegram : alerte CEO si mention négative détectée
```

**Option B — Zapier/Make natif (si intégration TikTok disponible)**
```
TikTok Trigger : nouvelle mention
    → Router :
        ├─ Mention positive → Notion log + Telegram info
        └─ Mention négative → Notion log urgent + Telegram alerte prioritaire
```

### Structure Notion "Service Client TikTok"

| Champ | Valeur |
|---|---|
| Date | Auto |
| Username TikTok | @utilisateur |
| Contenu | Texte mention |
| Sentiment | Positif / Neutre / Négatif |
| URL vidéo | lien TikTok |
| Statut | À traiter / Traité |

---

## Webhook 4 — Script Izzy prêt → Telegram validation CEO

**But :** envoyer chaque nouveau script Izzy au CEO pour validation avant publication.

### Déclencheur

Script généré automatiquement (ou manuellement posté dans Notion) → déclenche le webhook.

### Configuration Make.com

```
Notion Watch Database (base Scripts Izzy, statut = "Prêt à valider")
    → Formatter : mise en forme du script
    → Telegram Send Message (Chat ID 1921851243)
    → Notion : mettre statut → "En attente validation"
```

### Message Telegram CEO

```
🎬 Script Izzy — Validation requise

Produit : [nom produit]
ASIN : [ASIN]

HOOK (3s) : [texte hook]
PROBLÈME (5s) : [texte problème]
SOLUTION (10s) : [texte solution]
PREUVE (5s) : [texte preuve]
CTA (5s) : easycom-world.ch

✅ Répondre GO pour publier
❌ Répondre STOP pour retravailler
```

### Réponse CEO → Action Make.com

Un second scénario écoute les réponses Telegram :
- `GO` → Notion : statut = "Validé" + notifier Izzy
- `STOP` → Notion : statut = "À retravailler" + commentaire

---

## Récapitulatif URLs Webhooks

| Webhook | URL Make | Statut |
|---------|----------|--------|
| Webhook 1 — Clics produits | À générer dans Make | À créer |
| Webhook 2 — Email entrant | IMAP (pas de webhook URL) | À configurer |
| Webhook 3 — TikTok | À générer dans Make | À créer |
| Webhook 4 — Script Izzy | Déclenché par Notion | À configurer |

> Pour obtenir une URL webhook Make.com : Scénario → Module déclencheur Webhook → Copy URL
