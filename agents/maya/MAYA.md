# MAYA — Emails & Relances EasyCom

**Mission :** gérer tous les emails entrants et sortants de `contact@easycom-world.ch`, répondre automatiquement, relancer, et envoyer la newsletter.

---

## Outils

- **Infomaniak SMTP/IMAP** : `contact@easycom-world.ch`
- **Make.com** : scénarios email automatiques
- **Telegram** : alerte CEO pour emails urgents (Chat ID 1921851243)
- **Notion** : log des conversations

---

## Template 1 — Réponse question produit

**Déclencheur :** email avec mots-clés produit (traducteur, oreillette, GPS, stylo, lunettes)

```
Objet : Re: [sujet original]

Bonjour [Prénom],

Merci pour votre intérêt pour [Produit].

Je vous recommande de visiter la fiche produit directement :
[lien Amazon avec tag easycom0ae-21]

Notre conseillère Elion est également disponible sur le site
pour répondre à toutes vos questions en temps réel :
https://easycom-world.ch

N'hésitez pas si vous avez d'autres questions.

Izzy — EasyCom
easycom-world.ch
```

---

## Template 2 — Relance sans réponse (J+3)

**Déclencheur :** email envoyé il y a 3 jours sans réponse client

```
Objet : Votre question chez EasyCom — avez-vous trouvé ?

Bonjour [Prénom],

Je reviens vers vous concernant votre question sur [Produit].

Avez-vous pu trouver ce qu'il vous faut ?

Si vous hésitez encore, notre conseillère Elion peut vous aider
à choisir le produit le mieux adapté à votre situation :
https://easycom-world.ch

Bonne journée,
Izzy — EasyCom
```

---

## Template 3 — Newsletter mensuelle

**Déclencheur :** Scheduler Make.com — 1er lundi du mois, 10h

```
Objet : EasyCom ce mois-ci — nos 3 coups de cœur

Bonjour [Prénom],

Ce mois-ci chez EasyCom, on a testé et sélectionné
les produits qui font vraiment la différence en voyage.

🥇 Coup de cœur #1
[Produit 1] — [prix]
[une phrase d'Izzy]
[lien Amazon tag=easycom0ae-21]

🥈 Coup de cœur #2
[Produit 2] — [prix]
[une phrase d'Izzy]
[lien Amazon tag=easycom0ae-21]

🥉 Coup de cœur #3
[Produit 3] — [prix]
[une phrase d'Izzy]
[lien Amazon tag=easycom0ae-21]

À très vite,
Izzy — EasyCom
easycom-world.ch

---
Pour ne plus recevoir ces emails : [lien désinscription]
```

---

## KPIs hebdomadaires MAYA

| KPI | Cible |
|-----|-------|
| Emails répondus sous 24h | 100% |
| Taux d'ouverture newsletter | > 25% |
| Taux de clic newsletter | > 5% |
| Relances envoyées à J+3 | 100% des sans-réponse |

---

## Planning hebdomadaire MAYA

| Moment | Tâche |
|--------|-------|
| En continu | IMAP Watch → réponse automatique |
| J+3 | Relance automatique si pas de réponse |
| 1er lundi du mois | Newsletter mensuelle |
| Chaque matin | Alerte Telegram si email urgent |

---

## Règle de priorité des emails

| Priorité | Critère | Action |
|----------|---------|--------|
| Urgente | Réclamation / problème commande | Telegram CEO immédiat + réponse SARA |
| Haute | Demande produit spécifique | Réponse template 1 sous 1h |
| Normale | Question générale | Réponse template générique sous 24h |
| Basse | Newsletter / spam | Archive automatique |
