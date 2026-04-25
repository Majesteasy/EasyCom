# Schemas des Bases de Donnees Notion EasyCom

---

## Base 1 — Produits EasyCom

| Propriete | Type Notion | Description |
|-----------|-------------|-------------|
| Produit | Title | Nom du produit |
| ASIN | Text | Code ASIN Amazon |
| Categorie | Select | traduction / lunettes / gps / stylos / traceurs |
| Angle TikTok | Text | Accroche principale pour les videos |
| Lien site | URL | https://easycom-world.ch/?src=notion |
| Lien Amazon | URL | https://www.amazon.fr/dp/{ASIN}?tag=easycom0ae-21 |
| Prix indicatif | Number | Prix en euros (approximate) |
| Priorite | Select | Haute / Moyenne / Basse |
| Statut | Select | Actif / En test / Archive |
| Notes | Text | Commentaires internes |

### Produits pre-remplis

| Produit | ASIN | Categorie | Priorite |
|---------|------|-----------|----------|
| Timekettle WT2 Edge | B084NZL8G3 | traduction | Haute |
| Timekettle M3 | B0B8NJR625 | traduction | Haute |
| ANFIER A8 | B0DP2G589V | traduction | Moyenne |
| Luckits 115L | B0F62TC6CN | lunettes | Haute |
| BLESSOURCE 116L | B0DQGD44LC | lunettes | Moyenne |
| Stylo Scanner AI | B0DS62X13F | stylos | Moyenne |
| IRISPen Reader 8 | B0D2JC29Q7 | stylos | Moyenne |
| Xplora X6Play | B0GQHHKCRH | gps | Haute |
| EUNICECG 4G | B0DZP1JB4K | gps | Moyenne |
| Invoxia GPS | B0FQYG8J4P | traceurs | Moyenne |
| Samsung SmartTag2 | B0CG7JHFKY | traceurs | Basse |
| Apple AirTag | B0GJTCB2QM | traceurs | Haute |

---

## Base 2 — Calendrier Contenu

| Propriete | Type Notion | Description |
|-----------|-------------|-------------|
| Titre | Title | Nom du contenu (ex: "WT2 - Script Voyage") |
| Date | Date | Date de publication prevue |
| Plateforme | Select | TikTok / Instagram / YouTube Shorts |
| Produit | Relation | Lien vers Base Produits |
| Hook | Text | Phrase d'accroche (0-3s) |
| Script complet | Text | Corps du script Izzy |
| CTA | Text | Appel a l'action |
| Hashtags | Text | Liste des hashtags |
| Statut | Select | A produire / A tourner / Envoye Telegram / Publie / A analyser |
| Lien video | URL | Lien vers la video publiee |
| Vues | Number | Nombre de vues (a mettre a jour manuellement) |
| Resultat | Select | En attente / Bon / Viral / Pas de resultat |

---

## Base 3 — Clics / Conversions

| Propriete | Type Notion | Description |
|-----------|-------------|-------------|
| ID clic | Title | Identifiant unique (date + asin + source) |
| Date | Date | Date et heure du clic |
| Source | Select | easycom-world.ch / instagram_dm / tiktok_bio |
| Produit | Relation | Lien vers Base Produits |
| ASIN | Text | Code ASIN |
| Page | URL | Page du site d'ou vient le clic |
| ClickSource | Select | product_card / elion_chat / bio_link |
| Notes | Text | Observations |

---

## Vues recommandees a creer

### Vue 1 — Dashboard CEO (page principale)
- Galerie produits priorite haute
- Kanban contenu par statut
- Table clics cette semaine (filtre date > aujourd'hui - 7j)

### Vue 2 — Calendrier editorial
- Base Calendrier Contenu en mode Calendar
- Filtre : Statut != "Archive"
- Trier par Date

### Vue 3 — Performance produits
- Base Produits + Base Clics (relation)
- Afficher : nombre de clics par produit ce mois
