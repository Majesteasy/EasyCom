# CHANGELOG — EasyCom

Toutes les modifications notables du projet EasyCom sont documentées ici.
Format : `[DATE] type: description`

---

## [2026-04-26] — Session Claude Code

### docs: MASTER_CLAUDE_BRIEFING mis à jour
- Date de passation : 26 avril 2026
- Ajout bugs 9-11 (CORS Infomaniak, gemini-2.0-flash, encodage)
- État global du projet mis à jour (tableau section 15)
- Elion : modèle stable = gemini-1.5-flash, appel direct sans proxy

---

## [2026-04-12 → 2026-04-26] — Correctifs Elion (PRs #9 à #11)

### fix: Bascule Elion de proxy Infomaniak vers Gemini direct
- Erreur CORS résolue en appelant directement `generativelanguage.googleapis.com`
- Suppression du proxy Infomaniak

### feat: Elion — message d'erreur convivial si quota dépassé
- Affichage d'un message lisible si quota Gemini épuisé (au lieu de crash silencieux)

### debug: Affichage erreur Gemini exacte pour diagnostic
- Commit temporaire pour identifier les erreurs API

### fix: Encodage site corrompu + réparation Elion
- Restauration depuis commit stable `90e2016`
- Réapplication des correctifs Elion sur base propre

### fix: Elion — bascule gemini-2.0-flash → gemini-1.5-flash (PR #11)
- gemini-2.0-flash testé : instable, rejeté
- Retour à gemini-1.5-flash : état stable confirmé

---

## [2026-04-12] — Session Claude Code

### feat: Intégration Gemini 1.5 Flash dans Elion
- Remplacement du backend Anthropic par Google Gemini 1.5 Flash
- System prompt enrichi avec le catalogue complet des 12 produits
- Liens affiliés Amazon intégrés dans le prompt (`easycom0ae-21`)
- Format historique converti : `user/model` (requis par Gemini)
- Clé API : placeholder `GEMINI_KEY` à remplacer dans `index.html` ligne 672

### feat: Ouverture automatique du chatbot Elion
- Elion s'ouvre automatiquement après 4 secondes sur le site
- Message de bienvenue multilingue (FR/EN/DE/IT/ES)

### fix: Conflit de merge résolu (branche claude/ → main)
- Base prise depuis `origin/main` (PRODUITS avec ASIN corrects)
- Fix 1 : suppression de `renderPanier()` dans `setLang()` (fonction inexistante)
- Fix 2 : guard null sur `modal-panier` (crash TypeError résolu)
- Fix 3 : button onclick → `window.open('${getUrl(p)}','_blank')` (p résolu au rendu)
- PR #4 mergée dans main

### feat: Structure de dossiers projet créée
- `/agents/elion` — chatbot Gemini
- `/agents/izzy` — contenu TikTok/Instagram
- `/automation` — Make.com, Telegram bot
- `/docs` — documentation complète
- `CHANGELOG.md` — ce fichier
- `README.md` — vue d'ensemble projet

---

## [2026-03-29] — Corrections précédentes

### fix: CNAME corrigé
- Changement de `site.easycom-world.ch` → `easycom-world.ch`
- GitHub Pages configuré pour servir depuis main / (root)

### fix: Tag affilié Amazon corrigé
- `products.js` : `easycom0-21` → `easycom0ae-21`
- `index.html` : TAG mis à jour partout

### fix: Images Amazon (referrer policy)
- Ajout `<meta name="referrer" content="no-referrer">` dans le `<head>`
- Ajout `referrerpolicy="no-referrer"` sur toutes les balises `<img>`

### fix: Syntaxe JS corrigée dans index.html
- `return const buyLabels` → déclaration déplacée avant `.map()`
- Virgules manquantes après les valeurs `prix:` (12 occurrences)
- Commentaire HTML `<!--update>` → `<!-- update -->`

---

## État actuel du projet

| Élément | Statut |
|---------|--------|
| Site easycom-world.ch | ✅ En ligne |
| 12 produits affichés | ✅ Corrigé |
| Images Amazon | ✅ Visibles |
| Tag affilié `easycom0ae-21` | ✅ Partout |
| Chatbot Elion (Gemini 1.5 Flash) | ⚠️ Vérifier clé GitHub Secrets |
| Elion appel direct (sans proxy) | ✅ CORS résolu |
| Elion modèle stable | ✅ gemini-1.5-flash |
| Ouverture auto Elion | ✅ 4 secondes |
| Notion MASTER | ⏳ À créer/synchroniser |
| Agent IZZY (TikTok) | ⏳ À développer |
| Automation Make.com | ⏳ À configurer |
