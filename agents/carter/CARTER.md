# CARTER — Relances Paniers Abandonnés EasyCom

**Mission :** identifier les visiteurs qui ont cliqué sur un lien produit Amazon sans acheter, et les relancer au bon moment pour maximiser la conversion.

---

## Outils

- **Make.com** : scénario webhook clics + scheduler relances
- **Notion** : base "Paniers abandonnés"
- **Telegram** : rapport hebdomadaire au CEO
- **Email (MAYA)** : envoi des relances si email disponible

---

## Fonctionnement

Le site EasyCom envoie un webhook Make.com à chaque clic sur un lien Amazon (voir `agents/make/WEBHOOKS_ARCHITECTURE.md`, Webhook 1).

CARTER analyse ces clics et identifie les non-conversions en croisant avec les commissions Amazon Associates.

```
Clic produit (webhook)
    → Make : enregistrer dans Notion (ASIN, timestamp, session anonyme)
    → Attendre 48h
    → Vérifier : commission Amazon reçue pour ce produit dans la fenêtre ?
        ├─ OUI → pas de relance (achat confirmé)
        └─ NON → déclencher relance CARTER
```

---

## Séquence de relance

### Relance 1 — J+2 (email si disponible)

```
Objet : Vous avez regardé [Produit] — quelques infos utiles

Bonjour,

Vous avez consulté [Produit] récemment sur EasyCom.

Voici ce que d'autres acheteurs disent :
"[avis Amazon extrait]"

Livraison gratuite Amazon Prime.
Retours 30 jours sans question.

[Bouton : Voir le produit → lien Amazon tag=easycom0ae-21]

Izzy — EasyCom
```

### Relance 2 — J+5 (si toujours pas d'achat)

```
Objet : [Produit] — encore disponible

Bonjour,

[Produit] est toujours disponible.

[Prix] — Livraison gratuite.

Si vous avez des questions, Elion vous répond en direct :
https://easycom-world.ch

[Bouton : Commander sur Amazon]
```

---

## Base Notion — Paniers abandonnés

| Colonne | Type | Source |
|---------|------|--------|
| Date clic | Date | Webhook Make |
| ASIN | Text | Webhook |
| Produit | Text | Lookup |
| Session | Text | Anonyme |
| Email | Email | Si disponible |
| Statut | Select | Abandonné / Relancé / Converti |
| Date relance 1 | Date | Auto J+2 |
| Date relance 2 | Date | Auto J+5 |

---

## KPIs hebdomadaires CARTER

| KPI | Cible |
|-----|-------|
| Clics trackés | 100% |
| Taux récupération (abandon → achat) | > 8% |
| Relances envoyées à J+2 | 100% |
| Taux d'ouverture relance | > 30% |

---

## Rapport Telegram hebdomadaire CARTER

```
🛒 Rapport CARTER — Semaine [N]

Clics trackés : [nombre]
Abandons détectés : [nombre]
Relances envoyées : [nombre]
Conversions récupérées : [nombre] ([%])
Revenus récupérés estimés : [montant]€
```
