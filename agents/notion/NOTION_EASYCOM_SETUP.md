# NOTION EASYCOM — Guide de Configuration

## Objectif
Notion devient le tableau de bord editorial et business EasyCom :
suivi des produits, calendrier de contenu, performances affiliees.

---

## Bases de donnees a creer

### Base 1 — Produits EasyCom
### Base 2 — Calendrier Contenu
### Base 3 — Clics / Conversions

Voir `notion_database_schema.md` pour le schema detaille de chaque base.

---

## Etapes de mise en place

### 1. Creer l'integration Notion

1. Aller sur https://www.notion.so/my-integrations
2. Cliquer "+ New integration"
3. Nom : `EasyCom Make Integration`
4. Capacites : Read, Update, Insert content
5. Copier le **Internal Integration Token** -> stocker dans Make (NOTION_API_KEY)
6. Ne jamais commiter dans GitHub

### 2. Creer les 3 bases de donnees

Dans votre espace Notion :
- Creer une page "EasyCom Dashboard"
- Y ajouter les 3 bases (Full page database)
- Copier l'ID de chaque base (dans l'URL Notion apres le nom)

Format ID : `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (32 caracteres)
Stocker chaque ID dans Make comme variable.

### 3. Partager les bases avec l'integration

Pour chaque base :
- Ouvrir la base -> ... -> Connections -> Ajouter `EasyCom Make Integration`
- Sans ce partage, l'API ne peut pas acceder a la base

### 4. Configurer les scenarios Make

Voir `agents/make/make_notion_sync_blueprint.md` pour les details.

---

## Variables Notion (JAMAIS dans GitHub)

| Variable | Description |
|----------|-------------|
| NOTION_API_KEY | Internal Integration Token |
| NOTION_DATABASE_ID_PRODUITS | ID de la base Produits |
| NOTION_DATABASE_ID_CONTENU | ID de la base Calendrier Contenu |
| NOTION_DATABASE_ID_CLICS | ID de la base Clics/Conversions |

---

## Vues recommandees dans Notion

### Base Produits
- Vue Table : tous les produits avec priorite
- Vue Galerie : visuel des produits
- Vue Filtered : Priorite = Haute uniquement

### Base Calendrier Contenu
- Vue Calendar : vue calendrier par date
- Vue Kanban : colonnes par statut
- Vue Table : tous les scripts

### Base Clics
- Vue Table : tous les clics dates
- Vue Chart (si disponible) : clics par produit
- Vue Filtered : cette semaine uniquement

---

## Integration avec Make.com

```
Site EasyCom
    |
    v
Make.com Webhook (affiliate_click)
    |
    +-> Google Sheets (log immediat)
    |
    +-> Notion Base "Clics" (base de connaissance)
         |
         v
    Reporting hebdo (vue calendar + stats)
```
