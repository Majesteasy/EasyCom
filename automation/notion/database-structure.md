# Notion — Bases de données EasyCom

## Variables requises
- `NOTION_API_KEY` — Dans Make.com › Connections › Notion
- `NOTION_DATABASE_ID` — ID de chaque base (visible dans l'URL Notion)

---

## Base 1 : Suivi Ventes Affiliées

**Nom suggéré** : `EasyCom — Ventes Affiliées`

| Propriété | Type Notion | Description |
|-----------|------------|-------------|
| Produit | Title | Nom du produit vendu |
| ASIN | Text | Identifiant Amazon |
| Commission | Number (€) | Montant de la commission |
| Date vente | Date | Date de la vente |
| Statut | Select | Validée / En attente / Annulée |
| Source trafic | Select | TikTok / Instagram / Direct / Telegram |
| Tag utilisé | Text | easycom0ae-21 |
| Semaine | Formula | `formatDate(prop("Date vente"), "W")` |
| Total cumul | Rollup | Somme des commissions validées |

**Objectif** : 3 premières ventes → déclenche l'alerte Telegram "PREMIER PALIER ATTEINT".

---

## Base 2 : Calendrier Contenu IZZY

**Nom suggéré** : `EasyCom — Calendrier Contenu`

| Propriété | Type Notion | Description |
|-----------|------------|-------------|
| Titre | Title | Ex : "AirTag — Script valise" |
| Produit | Relation | Lié à base Produits |
| Plateforme | Multi-select | TikTok / Instagram Reels / Stories |
| Script | Text | Script IZZY complet |
| Statut | Select | Brouillon / Approuvé / Publié / Archivé |
| Date publication | Date | Date prévue ou réelle |
| Métriques | Number | Vues / likes (remplir après publication) |
| Clics Amazon | Number | Estimé depuis Amazon Associates |
| Script généré par | Select | IZZY-Make / Manuel |

---

## Base 3 : Catalogue Produits

**Nom suggéré** : `EasyCom — Catalogue`

| Propriété | Type Notion | Description |
|-----------|------------|-------------|
| Nom | Title | Nom du produit |
| ASIN | Text | B0... |
| Catégorie | Select | traduction / lunettes / stylos / gps / traceurs |
| Prix Amazon | Number (€) | Prix indicatif |
| Lien affilié | URL | amazon.fr/dp/{ASIN}?tag=easycom0ae-21 |
| Commission estimée | Formula | `prop("Prix Amazon") * 0.04` (4% Amazon) |
| Image | Files | Image produit |
| Actif | Checkbox | Visible sur le site |
| Ventes | Rollup | Depuis base Ventes |

---

## Base 4 : Dashboard CEO (Vue consolidée)

**Type** : Linked views des 3 bases + widgets

**Métriques à afficher** :
- Ventes du mois (somme commissions)
- Posts publiés cette semaine
- Taux de conversion estimé
- Top produit (le plus vendu)
- Prochaine publication IZZY (calendrier)

---

## Intégration Make.com → Notion

### Enregistrer une vente
```
Module : Notion › Create Database Item
Database ID : NOTION_DATABASE_ID (base Ventes)
Properties :
  - Produit : {{nom_produit}}
  - ASIN : {{asin}}
  - Commission : {{commission}}
  - Date vente : {{date}}
  - Statut : Validée
  - Tag utilisé : easycom0ae-21
```

### Créer une entrée calendrier contenu
```
Module : Notion › Create Database Item
Database ID : NOTION_DATABASE_ID (base Calendrier)
Properties :
  - Titre : {{nom_produit}} — {{type_script}}
  - Script : {{script_izzy}}
  - Statut : Brouillon
  - Date publication : {{date_prevue}}
  - Script généré par : IZZY-Make
```

---

## Template page hebdomadaire (Manuel)

```
# Semaine {N} — EasyCom Dashboard

## Ventes
- Total commissions : X €
- Nouvelles ventes : X
- Objectif 3 ventes : [X/3]

## Contenu publié
- TikTok : X vidéos
- Instagram Reels : X
- Stories : X

## Top produit semaine
{nom} — {N} clics Amazon

## À faire semaine prochaine
- [ ] Publier script {produit}
- [ ] Vérifier rapport Amazon Associates
- [ ] Répondre commentaires Instagram
```
