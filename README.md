# EasyCom — Boutique Affiliée Amazon

Site de vente affiliée Amazon spécialisé en technologies de traduction IA,
lunettes connectées, stylos scanner et traceurs GPS.

## Liens importants
- **Site** : https://easycom-world.ch
- **GitHub** : https://github.com/Majesteasy/EasyCom
- **Email** : contact@easycom-world.ch
- **Amazon ID** : `easycom0ae-21`

## Structure du projet

```
EasyCom/
├── index.html          → Site principal (12 produits + Elion chatbot)
├── admin.html          → Interface d'administration
├── products.js         → Données produits (backup)
├── CNAME               → Domaine custom : easycom-world.ch
├── CHANGELOG.md        → Journal des modifications
├── /agents
│   ├── /elion          → Chatbot IA Gemini
│   └── /izzy           → Agent contenu TikTok/Instagram
├── /automation         → Make.com, Telegram bot
├── /docs               → Documentation technique
└── /.github/workflows  → GitHub Actions (deploy)
```

## Agents IA

### ELION — Chatbot site
Conseiller shopping IA intégré au site. Utilise Google Gemini 1.5 Flash.
Voir `/agents/elion/README.md`

**Action requise** : Insérer la clé Gemini dans `index.html` ligne ~672

### IZZY — Contenu TikTok
Agent génération de contenu viral pour @easycomworld.
Voir `/agents/izzy/README.md`

## Catalogue produits (12 produits)

| Catégorie | Produits |
|-----------|----------|
| Oreillettes traduction | Timekettle WT2 Edge, Timekettle M3, ANFIER A8 |
| Lunettes connectées | Luckits 115L, BLESSOURCE 116L |
| Stylos scanner | Stylo Scanner AI, IRISPen Reader 8 |
| GPS Enfant | Xplora X6Play, EUNICECG 4G |
| Traceurs GPS | Invoxia GPS, Samsung SmartTag2, Apple AirTag |

## Déploiement
GitHub Pages — branche `main`, répertoire `/(root)`
Domaine custom configuré via CNAME : `easycom-world.ch`

## Développement
⚠️ Le proxy git n'autorise que les pushs vers des branches `claude/`.
Toutes les modifications passent par Pull Request mergée dans `main`.
