# RICO — Comptabilité & Finances EasyCom

**Mission :** tracker toutes les commissions Amazon, les dépenses outils, et alerter le CEO quand les seuils fiscaux approchent.

---

## Outils

- **Make.com** : scénario 9124171 (rapport 8h) + scénario ventes temps réel
- **Telegram** : alertes CEO (Chat ID 1921851243)
- **Notion** : base "Finances EasyCom"

---

## Base Notion — Finances EasyCom

### Table : Commissions Amazon (par mois)

| Colonne | Type | Source |
|---------|------|--------|
| Mois | Date | Auto |
| Clics total | Number | Amazon Associates |
| Commandes | Number | Amazon Associates |
| Taux conversion | Formula | commandes/clics |
| Commission brute | Number | Amazon Associates |
| Devise | Select | CHF / EUR |

### Table : Dépenses outils

| Colonne | Type | Valeur actuelle |
|---------|------|-----------------|
| Outil | Text | — |
| Coût mensuel | Number | — |
| Devise | Select | CHF / EUR |
| Catégorie | Select | IA / Hébergement / Marketing / Autre |

Dépenses récurrentes à enregistrer :
- Make.com : plan actuel
- GitHub Pages : 0€ (gratuit)
- Gemini API : selon usage
- Infomaniak hébergement email

### Table : Bénéfice net

| Colonne | Type |
|---------|------|
| Mois | Date |
| Revenus bruts | Number |
| Dépenses | Number |
| Bénéfice net | Formula |
| Cumul annuel | Formula |

---

## Seuils fiscaux à surveiller

### Suisse

- **Seuil déclaration TVA :** 100 000 CHF/an (pas de risque à court terme)
- **Seuil activité lucrative déclarée :** à partir de **2 300 CHF/an** de revenus annexes
- **Action :** dès que cumul annuel > 2 300 CHF → alerte Telegram CEO

### France (si micro-entrepreneur)

- **Seuil micro-BIC (vente) :** **77 700 €/an**
- **Franchissement seuil TVA :** 91 900 € (ventes de biens)
- **Action :** dès que cumul annuel > 70 000 € → alerte Telegram CEO (marge de sécurité)

---

## KPIs hebdomadaires RICO

| KPI | Cible |
|-----|-------|
| Commissions semaine | > 50€ |
| Taux conversion clics → achats | > 3% |
| Dépenses outils / revenus | < 20% |
| Cumul annuel | Suivi continu |

---

## Alertes Telegram automatiques

```
💰 Nouvelle commission Amazon
Produit : [nom]
Montant : [X]€
Cumul mois : [Y]€
Cumul année : [Z]€
```

```
⚠️ Seuil fiscal approche
Cumul annuel : [montant]
Seuil Suisse 2300 CHF : [%]
Action requise : consulter comptable
```

---

## Planning hebdomadaire RICO

| Jour | Tâche |
|------|-------|
| Lundi | Vérifier commissions Amazon de la semaine passée |
| Vendredi | Mise à jour Notion Finances |
| 1er du mois | Rapport mensuel → Telegram CEO |
| Décembre | Bilan annuel + vérification seuils fiscaux |
