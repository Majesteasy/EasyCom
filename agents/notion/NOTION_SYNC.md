# Notion Sync — Plan d'automatisation EasyCom

---

## Scénarios Make.com qui alimentent Notion

| ID Make | Nom | Fréquence | Base Notion cible |
|---------|-----|-----------|-------------------|
| 9124171 | Rapport quotidien 8h | Chaque jour 8h | MASTER EasyCom / Rapports |
| À créer | Nouveaux contacts | Temps réel | CRM / Contacts |
| À créer | Ventes Amazon | Quotidien | Produits / Revenus |
| À créer | Log conversations Izzy | Temps réel | Conversations |

---

## Structure des bases de données Notion

### MASTER EasyCom

Base centrale de pilotage.

| Colonne | Type | Source |
|---------|------|--------|
| Date | Date | Auto |
| Statut site | Select | Manuel / GitHub Actions |
| Revenus jour | Number | Amazon Associates |
| Conversations Izzy | Number | Make → Notion |
| Alertes | Text | Make → Notion |
| Actions du jour | Text | Manuel |

### CRM / Contacts

| Colonne | Type | Source |
|---------|------|--------|
| Nom | Text | Formulaire site |
| Email | Email | Formulaire site |
| Date contact | Date | Auto Make |
| Source | Select | Site / Telegram / Autre |
| Statut | Select | Nouveau / En cours / Converti |

### Produits / Revenus

| Colonne | Type | Source |
|---------|------|--------|
| ASIN | Text | index.html |
| Nom produit | Text | Manuel |
| Clics | Number | Amazon Associates |
| Commandes | Number | Amazon Associates |
| Revenus | Number | Amazon Associates |
| Mois | Date | Auto |

### Conversations Izzy/Elion

| Colonne | Type | Source |
|---------|------|--------|
| Date | Date | Auto |
| Message utilisateur | Text | Make webhook |
| Réponse Elion | Text | Make webhook |
| Langue | Select | FR / EN / DE / IT / ES |

---

## Automatisation MASTER EasyCom

### Scénario quotidien 8h (ID 9124171)

Flux attendu :

```
Scheduler 8h00
    → Fetch stats Amazon Associates (si API disponible)
    → Fetch nombre conversations Elion (webhook counter)
    → Créer/Mettre à jour entrée Notion MASTER
    → Envoyer résumé Telegram (Chat ID 1921851243)
```

### Scénario Izzy → Telegram → Notion (ID 9121934 + extension)

Flux attendu :

```
Webhook reçu (message Izzy)
    → Envoyer message Telegram CEO
    → Logger dans Notion (Conversations Izzy)
```

---

## Configuration connexion Notion dans Make.com

1. Make.com → Connections → Add → **Notion**
2. Autoriser l'accès aux bases de données EasyCom
3. Sélectionner les bases : MASTER, CRM, Produits, Conversations
4. Nommer la connexion : `EasyCom-Notion`

---

## Prochaines étapes

- [ ] Créer les bases de données Notion si elles n'existent pas
- [ ] Récupérer les IDs des bases Notion (via URL Notion)
- [ ] Ajouter les modules Notion dans les scénarios Make.com 9121934 et 9124171
- [ ] Tester la synchronisation avec un Run once
- [ ] Activer les scénarios
