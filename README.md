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

## Pact IA et Easycom
# Pacte d'intervention IA et développeurs - EasyCom World

Ce dépôt concerne le site EasyCom World, accessible via easycom-world.ch.

Toute IA, assistant de codage, agent automatisé, développeur, prestataire ou contributeur intervenant sur ce dépôt doit respecter strictement les règles ci-dessous.

## Autorisation préalable obligatoire

Aucune modification du site, du code, des contenus, des produits, des images, des prix, des liens affiliés, des textes légaux, de la structure, du design, du logo, des couleurs, des scripts, des configurations GitHub, des fichiers de déploiement ou de tout autre élément du dépôt ne doit être effectuée sans autorisation préalable explicite.

Avant toute modification, l'intervenant doit :

1. expliquer clairement ce qu'il souhaite modifier ;
2. préciser les fichiers concernés ;
3. indiquer les conséquences possibles de la modification ;
4. attendre l'accord explicite de Vanessa JEAN-ALPHONSE, fondatrice d'EasyCom-World.ch, ou de la personne dûment autorisée par elle.

Une demande vague, implicite ou supposée ne vaut pas autorisation.

## Respect de l'identité EasyCom World

L'identité visuelle actuelle doit être préservée sauf accord explicite :

- logo Easy Com ;
- univers blanc et doré ;
- sobriété premium ;
- structure générale du site ;
- ton de marque ;
- mentions légales et informations d'affiliation.

Toute proposition de refonte, ajout interactif, ajout produit, optimisation commerciale ou changement visuel doit être présentée comme proposition avant codage.

## Confidentialité absolue

L'intervenant s'engage à ne jamais divulguer, exposer, publier, copier ou transmettre à un tiers :

- codes d'accès ;
- clés API ;
- identifiants ;
- mots de passe ;
- tokens GitHub, Infomaniak, Amazon, Stripe, PayPal ou tout autre service ;
- données personnelles ;
- informations commerciales confidentielles ;
- informations relevant du secret professionnel ;
- échanges privés ;
- fichiers non destinés à être publics.

Aucun secret ne doit être ajouté au code source, aux commits, aux issues, aux pull requests, aux logs ou aux commentaires.

## RGPD, nLPD et lois applicables

Toute intervention doit respecter les textes applicables, notamment :

- le RGPD ;
- la législation suisse sur la protection des données, dont la nLPD ;
- les règles relatives à l'affiliation commerciale ;
- les obligations liées à la confidentialité, au droit de la consommation, aux données personnelles et aux cookies.

Aucune collecte, transmission, analyse, traçage ou exploitation de données personnelles ne doit être ajouté sans base légale, information claire de l'utilisateur et accord préalable de Vanessa JEAN-ALPHONSE.

## Sécurité

L'intervenant doit appliquer une logique de sécurité stricte :

- ne jamais committer de secret ;
- ne jamais désactiver une protection existante sans autorisation ;
- ne jamais ajouter de script tiers non justifié ;
- ne jamais introduire de code malveillant, opaque ou non vérifiable ;
- ne jamais contourner GitHub, Infomaniak, Amazon, Stripe, PayPal ou tout autre service ;
- vérifier les liens externes avant ajout ;
- signaler immédiatement toute faille, exposition de secret ou risque de conformité.

## Processus de contribution obligatoire

Avant tout changement :

1. lire ce fichier ;
2. inspecter uniquement les fichiers nécessaires ;
3. préparer une proposition claire ;
4. demander l'autorisation ;
5. attendre validation ;
6. modifier uniquement ce qui a été validé ;
7. résumer précisément les changements effectués.

Après modification, l'intervenant doit fournir :

- la liste des fichiers modifiés ;
- la liste des produits, textes ou fonctions changés ;
- ce qui n'a pas été modifié ;
- les éventuels points nécessitant validation humaine.

## Interdictions explicites

Il est interdit de :

- refaire le site sans autorisation ;
- changer le design sans accord ;
- remplacer le logo ;
- modifier les couleurs de marque sans validation ;
- supprimer des produits sans confirmation ;
- ajouter des produits indisponibles ;
- inventer des ASIN, prix, promesses commerciales ou mentions légales ;
- modifier les liens affiliés sans instruction ;
- publier du code non relu ;
- pousser directement en production sans accord ;
- fusionner une pull request sans validation humaine ;
- utiliser des données personnelles pour tester ou générer du contenu.

## Validation finale

Toute publication sur la branche principale, tout déploiement ou toute mise en production doit être approuvé explicitement par Vanessa JEAN-ALPHONSE, fondatrice d'EasyCom-World.ch, ou par une personne qu'elle a autorisée.

