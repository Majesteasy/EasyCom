# LEX — Juridique & Conformité EasyCom

**Mission :** assurer la conformité légale d'EasyCom — RGPD, mentions légales, Amazon Associates, droit suisse et français.

---

## Documents à créer / vérifier

### 1. Conditions Générales de Vente (CGV)

EasyCom est un site d'affiliation — il ne vend pas directement.
Les CGV doivent clarifier ce point.

Éléments obligatoires :
- EasyCom est un intermédiaire, pas vendeur
- Les achats se font sur Amazon.fr
- Amazon gère livraison, retours, garanties
- EasyCom perçoit une commission (programme Associates)
- Droit applicable : droit suisse (siège Suisse)

### 2. Mentions légales

```
Éditeur : EasyCom / Easycom-World
Adresse : [adresse Suisse]
Email : contact@easycom-world.ch
Hébergeur : GitHub Pages (Microsoft Corporation)
            88 Colin P Kelly Jr St, San Francisco, CA 94107, USA
Responsable publication : [nom CEO]
```

### 3. Politique de confidentialité & RGPD

Données collectées par EasyCom :
- Aucune donnée personnelle collectée directement par le site
- Les clics Amazon sont trackés par Amazon Associates (voir leur politique)
- Elion (Gemini) : les conversations ne sont pas stockées par EasyCom

Cookies :
- Pas de cookie publicitaire propre à EasyCom
- Amazon peut poser des cookies via les liens affiliés
- Bandeau cookie obligatoire si visiteurs UE

### 4. Clause Amazon Associates

Texte obligatoire Amazon Associates Program (à afficher sur le site) :

> "En tant que Partenaire Amazon, je réalise un bénéfice sur les achats remplissant les conditions requises."

Localisation recommandée : footer du site, page mentions légales.

Actuellement dans index.html : vérifier que cette mention est présente et visible.

### 5. Vérification compatibilité Foncia

**Contexte :** si le CEO est salarié chez Foncia, vérifier que l'activité EasyCom est compatible avec :
- Clause d'exclusivité du contrat de travail (si applicable)
- Obligation de loyauté
- Activité d'affiliation = revenus passifs (généralement compatible)
- Déclarer l'activité à l'employeur si clause de déclaration

**Action recommandée :**
1. Relire le contrat de travail Foncia (clause exclusivité / activité annexe)
2. Si doute → consulter un avocat droit du travail suisse
3. En général : l'affiliation Amazon sans activité commerciale directe est compatible avec un emploi salarié

---

## Checklist conformité RGPD

- [ ] Mentions légales sur le site
- [ ] Politique de confidentialité accessible
- [ ] Mention Amazon Associates visible
- [ ] Bandeau cookie (si applicable)
- [ ] CGV ou page "À propos" clarifiant le modèle affilié
- [ ] Pas de collecte email sans consentement explicite

---

## Seuils et obligations fiscales (résumé)

| Pays | Seuil déclaration | Action |
|------|------------------|--------|
| Suisse | 2 300 CHF/an revenus annexes | Déclarer dans déclaration fiscale annuelle |
| France (micro-BIC) | 77 700 €/an | Déclarer comme micro-entrepreneur |
| TVA Suisse | 100 000 CHF/an | Enregistrement TVA obligatoire |

---

## Planning LEX

| Quand | Tâche |
|-------|-------|
| Maintenant | Ajouter mention Amazon Associates dans footer index.html |
| Maintenant | Créer page mentions légales |
| Maintenant | Créer politique confidentialité |
| Trimestriel | Vérifier conformité Amazon Associates (changements conditions) |
| Annuel | Bilan fiscal avec comptable |
