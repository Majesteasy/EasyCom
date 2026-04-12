# MASTER BRIEFING — Projet EasyCom
# Document de passation pour Claude
# Dernière mise à jour : 12 avril 2026

---

## 1. QUI EST LE PROPRIÉTAIRE

- **Nom** : Majesteasy (Vanessa)
- **Site** : easycom-world.ch
- **Email** : contact@easycom-world.ch
- **GitHub** : github.com/Majesteasy/EasyCom
- **Amazon Associates** : tag `easycom0ae-21` (3 ventes requises pour valider l'affiliation)

---

## 2. C'EST QUOI EASYCOM

Boutique affiliée Amazon 100% statique hébergée sur GitHub Pages.
**Pas de backend. Pas de Stripe. Pas de PayPal.**
Le site affiche 12 produits tech. Quand le visiteur clique → il va sur Amazon → Vanessa touche une commission.

---

## 3. STACK TECHNIQUE

| Élément | Valeur |
|---------|--------|
| Hébergement | GitHub Pages (branche `main`, root `/`) |
| Domaine | easycom-world.ch (DNS Infomaniak → GitHub Pages) |
| Fichier principal | `index.html` (~940 lignes, tout-en-un) |
| Déploiement | GitHub Actions (`.github/workflows/deploy.yml`) |
| Chatbot | Elion — Google Gemini 1.5 Flash (client-side) |
| Tag affilié | `easycom0ae-21` dans TOUS les liens Amazon |

---

## 4. LES 12 PRODUITS (ASIN exacts — ne jamais modifier)

### Oreillettes traduction
| Produit | ASIN | Prix |
|---------|------|------|
| Timekettle WT2 Edge | B084NZL8G3 | 289€ |
| Timekettle M3 | B0B8NJR625 | 153€ |
| ANFIER A8 | B0DP2G589V | 261€ |

### Lunettes connectées
| Produit | ASIN | Prix |
|---------|------|------|
| Luckits 115L | B0F62TC6CN | 33€ |
| BLESSOURCE 116L | B0DQGD44LC | 25€ |

### Stylos scanner
| Produit | ASIN | Prix |
|---------|------|------|
| Stylo Scanner AI | B0DS62X13F | 46€ |
| IRISPen Reader 8 | B0D2JC29Q7 | 134€ |

### GPS Enfant
| Produit | ASIN | Prix |
|---------|------|------|
| Xplora X6Play | B0GQHHKCRH | 45€ |
| EUNICECG 4G | B0DZP1JB4K | 51€ |

### Traceurs GPS
| Produit | ASIN | Prix |
|---------|------|------|
| Invoxia GPS | B0FQYG8J4P | 89€ |
| Samsung SmartTag2 | B0CG7JHFKY | 15€ |
| Apple AirTag | B0GJTCB2QM | 32€ |

**Format lien Amazon :** `https://www.amazon.fr/dp/{ASIN}?tag=easycom0ae-21`

---

## 5. STRUCTURE DU REPO GITHUB

```
EasyCom/
├── index.html              ← FICHIER PRINCIPAL (site complet)
├── admin.html              ← Interface admin (ne pas toucher)
├── products.js             ← Backup données produits
├── CNAME                   ← easycom-world.ch (ne jamais modifier)
├── .gitignore              ← .env, *.key exclus
├── .env.example            ← Template variables (sans valeurs réelles)
├── CHANGELOG.md            ← Journal des modifications
├── README.md               ← Vue d'ensemble
├── .github/
│   └── workflows/
│       └── deploy.yml      ← GitHub Actions : injection clé + déploiement
├── agents/
│   ├── elion/README.md     ← Doc chatbot Gemini
│   └── izzy/README.md      ← Doc agent TikTok (à développer)
├── automation/README.md    ← Make.com + Telegram bot (à configurer)
└── docs/
    ├── architecture.md     ← Architecture technique détaillée
    └── MASTER_CLAUDE_BRIEFING.md ← CE FICHIER
```

---

## 6. VARIABLES CLÉS DANS index.html

```javascript
const TAG = 'easycom0ae-21';        // ligne ~543 — TAG affilié Amazon
const GEMINI_KEY = '%%GEMINI_API_KEY%%'; // ligne ~672 — injecté par GitHub Actions
```

**Important :** `%%GEMINI_API_KEY%%` est un placeholder remplacé automatiquement
par le workflow GitHub Actions depuis le secret `GEMINI_API_KEY` du repo.
Ne jamais coller une vraie clé dans le code source.

---

## 7. COMMENT FONCTIONNE LE DÉPLOIEMENT

```
Push vers main
     ↓
GitHub Actions (deploy.yml)
     ↓
sed remplace %%GEMINI_API_KEY%% par la vraie clé (depuis GitHub Secrets)
     ↓
Fichier déployé sur GitHub Pages
     ↓
Site live sur easycom-world.ch
```

**Pour ajouter/modifier la clé Gemini :**
GitHub → Settings → Secrets and variables → Actions → `GEMINI_API_KEY`

---

## 8. CHATBOT ELION — ÉTAT ACTUEL

### Ce qui est codé
- Backend : Gemini 1.5 Flash (`generativelanguage.googleapis.com`)
- S'ouvre automatiquement après 4 secondes sur le site
- System prompt : inclut les 12 produits avec liens affiliés `easycom0ae-21`
- Répond en FR/EN/DE/IT/ES selon la langue du visiteur
- Historique 8 messages conservé

### Problème actuel (12 avril 2026)
Elion répond "Contactez-nous" à chaque message → l'appel Gemini échoue.

**Cause probable :** La clé dans GitHub Secrets est soit :
- La clé révoquée `AIzaSyDGSWhHmiaOtOLHkB2_kDl1H1x3B5yO3GA` (ne fonctionne plus)
- Vide ou incorrecte

**Fix en attente :** Une PR est ouverte avec affichage du vrai message d'erreur.
Après merge, Elion affichera l'erreur exacte au lieu de "Contactez-nous".

**Solution :**
1. Aller sur `aistudio.google.com/app/apikey` → créer une nouvelle clé
2. GitHub → Settings → Secrets → `GEMINI_API_KEY` → mettre à jour
3. Re-déclencher le déploiement (ou pusher un commit sur main)

### Appel API Gemini (format exact)
```javascript
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=CLE

Body:
{
  system_instruction: { parts: [{ text: SYSTEM_CHAT }] },
  contents: [ { role: "user"|"model", parts: [{ text }] } ],
  generationConfig: { maxOutputTokens: 250, temperature: 0.8 }
}

Réponse:
{ candidates: [{ content: { parts: [{ text: "..." }] } }] }
```

---

## 9. BUGS CORRIGÉS (historique complet)

### Bug 1 : Images Amazon bloquées
- **Cause :** Politique referrer bloquait les images `m.media-amazon.com`
- **Fix :** `<meta name="referrer" content="no-referrer">` dans le `<head>`

### Bug 2 : Collection vide (0 produits affichés)
- **Cause racine :** `document.getElementById('modal-panier').addEventListener(...)` → null crash → tout le script mourait avant `DOMContentLoaded`
- **Fix :** Guard `if(_mp) _mp.addEventListener(...)`

### Bug 3 : Syntaxe JS invalide
- **Cause :** `return const buyLabels` (syntaxe impossible)
- **Fix :** `const buyLabels` déclaré avant `.map()`, return supprimé

### Bug 4 : renderPanier() inexistante
- **Cause :** `setLang()` appelait `renderPanier()` qui n'existait pas
- **Fix :** Suppression de l'appel

### Bug 5 : Button onclick cassé
- **Cause :** `window.open(getUrl(p),'_blank')` — `p` pas en scope au clic
- **Fix :** `window.open('${getUrl(p)}','_blank')` — évalué au rendu

### Bug 6 : Virgules manquantes
- **Cause :** `prix: 289.00` sans virgule → SyntaxError JS
- **Fix :** `sed` pour ajouter virgules sur 12 occurrences

### Bug 7 : CNAME mauvais
- **Cause :** `site.easycom-world.ch` → 404
- **Fix :** `easycom-world.ch`

### Bug 8 : Tag affilié incorrect dans products.js
- **Cause :** `easycom0-21` (lettre `ae` manquante)
- **Fix :** `easycom0ae-21`

---

## 10. RÈGLES DE SÉCURITÉ ABSOLUES

1. **JAMAIS** mettre une clé API en dur dans un fichier commité
2. Toujours utiliser GitHub Secrets pour les clés
3. `.gitignore` contient `.env`, `*.key`, `*.secret`
4. Avant chaque commit : vérifier qu'aucune clé n'est exposée
5. Le placeholder `%%GEMINI_API_KEY%%` dans le code est intentionnel — ne pas le remplacer dans les fichiers

---

## 11. CONTRAINTE IMPORTANTE POUR CLAUDE CODE

Le proxy git de l'environnement Claude Code **n'autorise que les pushs vers des branches `claude/`**.

```
❌ git push origin main        → HTTP 403
✅ git push origin claude/xxx  → OK
```

**Workflow obligatoire :**
1. Claude Code travaille sur `claude/fix-xxx-PkmtT`
2. Pushe sur cette branche
3. Vanessa crée la PR sur GitHub et merge dans main
4. GitHub Actions déploie automatiquement

---

## 12. AGENTS À DÉVELOPPER

### IZZY (TikTok) — Non démarré
- Compte cible : @easycomworld
- Mission : scripts TikTok 15-30s, légendes Instagram
- Style : hook 3s, problème, solution, CTA
- Structure prête dans `/agents/izzy/`

### Make.com + Telegram — Non configuré
- Bot Telegram : @EasyComCEObot (Chat ID: 1921851243)
- Scénarios prévus : alerte ventes, pipeline contenu IZZY

---

## 13. PROCHAINES ÉTAPES PRIORITAIRES

1. **URGENT** — Corriger la clé Gemini dans GitHub Secrets → Elion fonctionnel
2. Restreindre la clé Gemini sur Google Cloud Console (referrers : easycom-world.ch)
3. Merger la PR debug ouverte (branche `claude/fix-index-github-infomaniak-PkmtT`)
4. Développer IZZY (scripts TikTok)
5. Configurer Make.com → Telegram bot alertes
6. Obtenir 3 ventes pour valider Amazon Associates

---

## 14. NOTION

Espace Notion connecté. Pages trouvées :
- `agents_easycom_43_autonomes` — base de données agents IA
- `Notion Dashboard Easy Com` — wiki principal
- `Guide_Kit_EasyCom` — guide de démarrage
- Elion défini dans Notion comme "Chef de projet IA" (rôle différent du chatbot)

Pas de page "MASTER EasyCom" trouvée — à créer.

---

*Ce document doit être mis à jour à chaque session de travail.*
*Format commit : `[DATE] type: description courte`*
