# CODEX BRIEFING — Workflow IA pour Codex/ChatGPT
# Projet EasyCom — easycom-world.ch
# Dernière mise à jour : 9 mai 2026

---

## 1. QUI EST AUTORISÉ À TRAVAILLER SUR CE DÉPÔT

| Agent | Branches autorisées | Merge vers main |
|-------|---------------------|-----------------|
| Claude (Anthropic) | `claude/*` | Via PR — validation Vanessa |
| Codex (OpenAI) | `codex/*` | Via PR — validation Vanessa |
| Vanessa (propriétaire) | Toutes | Directement sur main |

---

## 2. RÈGLES ABSOLUES POUR CODEX

1. **Ne jamais pousser directement sur `main`**
2. **Toujours créer une branche `codex/nom-de-la-tâche`**
3. **Ouvrir une Pull Request** vers `main` et attendre la validation de Vanessa
4. **Ne jamais mettre de secrets, clés API, tokens** dans les fichiers commités
5. **Ne pas modifier le design** (CSS, mise en page, couleurs) sans accord explicite
6. **Ne pas modifier les ASINs** des produits existants sans accord Vanessa
7. **Ne pas publier** sur le site sans validation (le merge vers main déclenche le déploiement)

---

## 3. WORKFLOW CODEX — ÉTAPE PAR ÉTAPE

```
1. Créer une branche :
   git checkout -b codex/description-courte

2. Faire les modifications demandées par Vanessa

3. Committer :
   git add fichier1 fichier2
   git commit -m "codex: description de la modification"

4. Pousser :
   git push -u origin codex/description-courte

5. Créer une PR sur GitHub :
   → Base : main
   → Compare : codex/description-courte
   → Titre clair, description des changements
   → Attendre l'approbation de Vanessa

6. Vanessa merge la PR → GitHub Actions déploie automatiquement
```

---

## 4. FICHIERS CLÉS À CONNAÎTRE

| Fichier | Rôle | Attention |
|---------|------|-----------|
| `index.html` | Site complet | Ne pas modifier sans accord design |
| `products.js` | Base produits (12+) | Ne modifier ASINs qu'avec validation |
| `CNAME` | `easycom-world.ch` | **JAMAIS modifier** |
| `.github/workflows/deploy.yml` | CI/CD GitHub Pages | Ne pas modifier sans accord |
| `docs/MASTER_CLAUDE_BRIEFING.md` | Document de référence | Mettre à jour après chaque session |

---

## 5. VARIABLES ET SECRETS

- **Tag affilié Amazon** : `easycom0ae-21` — présent dans `products.js` et `index.html`
- **Clé Gemini AI** : `%%GEMINI_API_KEY%%` dans `index.html` — placeholder injecté par GitHub Actions
- **Toute clé réelle** doit aller dans GitHub Secrets, jamais dans le code

---

## 6. PRODUITS (liste de référence)

### Format lien affilié obligatoire
```
https://www.amazon.fr/dp/{ASIN}?tag=easycom0ae-21
```

### Produits actuels (ne pas modifier les ASINs sans accord)
| ID | Catégorie | Nom | ASIN |
|----|-----------|-----|------|
| p1 | earbuds | WT2 Plus | B084NZL8G3 |
| p2 | earbuds | Timekettle M3 | B0B8NJR625 |
| p3 | earbuds | ANFIER A8 | B0DP2G589V |
| p13 | earbuds | Traducteur 114 langues BT 5.3 | B0BGX7Z1FH |
| p4 | glasses | Luckits 115L | B0F62TC6CN |
| p5 | glasses | BLESSOURCE 116L | B0DQGD44LC |
| p6 | scanner | Stylo scanner | B0DS62X13F |
| p7 | scanner | IRISPen Reader 8 | B0D2JC29Q7 |
| p8 | gps-kids | Xplora X6Play | B0GQHHKCRH |
| p9 | gps-kids | EUNICECG 4G | B0DZP1JB4K |
| p10 | tracker | Invoxia GPS | B0FQYG8J4P |
| p11 | tracker | Samsung SmartTag2 | B0CG7JHFKY |
| p12 | tracker | Apple AirTag | B0GJTCB2QM |

---

## 7. COMMENT CODEX PEUT ACCÉDER AU GOOGLE SHEET (SOURCE DE VÉRITÉ)

Le Google Sheet EasyCom est la source de vérité pour les produits, prix et ASINs.
URL : https://docs.google.com/spreadsheets/d/1Ju5wXwtoeauzAmfWu10aNWj55Y4B2mLkOq4A3DGzQTs/

### Accès sécurisé recommandé (sans rendre le fichier public)

Vanessa doit :
1. Aller dans Google Drive → Sheet EasyCom → Partager
2. Ajouter l'adresse email de service Codex/ChatGPT comme **Éditeur** (pas public)
3. Ou utiliser une connexion OAuth2 via le compte Google de Vanessa

**Important** : Ne jamais mettre de clé API ou token Google dans le Sheet lui-même.

### Pour Make.com
Make.com peut lire/écrire dans ce Sheet via le module Google Sheets
en utilisant le compte Google de Vanessa (connexion OAuth2 sécurisée).

---

## 8. PACTE IA EASYCOM

Tout agent IA (Claude, Codex, autre) travaillant sur ce projet s'engage à :

- Aucune modification sans accord explicite de Vanessa
- Aucun changement de design sans validation
- Aucune modification de produits sans validation
- Aucune publication directe sur le site
- Aucun secret dans GitHub
- Respect strict RGPD et confidentialité des données

---

*Ce document doit être consulté avant chaque session de travail Codex.*
