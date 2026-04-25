# ELION — Chatbot IA EasyCom

## Rôle
Conseiller shopping IA du site easycom-world.ch. Répond aux visiteurs,
recommande des produits, augmente les conversions affiliées Amazon.

## Architecture actuelle
- **Mode production** : Webhook Make.com → Claude API (Haiku) → réponse JSON
- **Mode fallback** : Réponses locales JS basées sur mots-clés (aucun backend requis)
- **Hébergement** : GitHub Pages (site 100% statique)
- **Aucune clé API dans le code** : tout passe par Make.com

## Configuration

### Activer Elion avec Make.com
1. Importer le scénario `/automation/make-scenarios/elion-chat-webhook.json` dans Make.com
2. Configurer la connexion Anthropic API dans Make.com (module HTTP)
3. Copier l'URL du webhook Make.com
4. Dans `index.html`, remplacer le placeholder :
   ```javascript
   const ELION_WEBHOOK_URL = 'MAKE_WEBHOOK_URL';
   // → remplacer 'MAKE_WEBHOOK_URL' par l'URL réelle depuis Make.com
   ```
5. Ne jamais commiter l'URL réelle sur GitHub (utiliser une variable d'environnement CI ou remplacement au déploiement)

### Mode fallback (fonctionne sans Make.com)
Si `ELION_WEBHOOK_URL === 'MAKE_WEBHOOK_URL'`, Elion utilise `fallbackElion()` :
- Détection par mots-clés (voyage, enfant, sécurité, TikTok, stylo, traceur...)
- Recommande 1-2 produits avec liens Amazon affiliés `easycom0ae-21`
- Aucune API externe requise

## Mots-clés reconnus (fallback local)
| Intention | Mots-clés | Produits recommandés |
|-----------|-----------|---------------------|
| Traduction/Voyage | voyage, tradu, langue, reunion, anglais, chinois… | Timekettle M3, WT2 Edge |
| GPS Enfant | enfant, kids, gps, parent, montre, xplora… | Xplora X6Play, EUNICECG |
| TikTok/Créateurs | tiktok, video, lunette, createur, vlog… | Luckits 115L, BLESSOURCE |
| Stylo/Scan | stylo, scan, livre, document, etudiant, ocr… | Stylo AI, IRISPen |
| Traceurs | valise, cle, voiture, perdu, airtag, samsung… | AirTag, SmartTag2 |
| Sécurité | secur, protect, antivol, vol… | Invoxia GPS, SmartTag2 |

## Flow Make.com (mode production)
```
Visiteur envoie message
  → fetch MAKE_WEBHOOK_URL (POST JSON)
  → Make.com reçoit le message
  → Make.com appelle Claude Haiku (système prompt Elion)
  → Make.com retourne {reply: "..."}
  → Elion affiche la réponse dans le chat
  → Timeout/erreur → fallback local automatique
```

## Tag Amazon affilié
`easycom0ae-21` — intégré dans tous les liens produits générés dynamiquement.
