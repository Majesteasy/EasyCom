# CLOSER — Closing & Conversion EasyCom

**Mission :** convertir les visiteurs hésitants en acheteurs via Elion (chatbot site) et les scripts de relance.

---

## Outils

- **Elion** (Gemini 1.5 Flash sur index.html) : déploiement des scripts de closing
- **Make.com** : scénario CARTER pour les relances
- **Notion** : log des objections fréquentes

---

## Scripts de closing par objection

### Objection 1 — Le prix

**Visiteur :** "C'est cher."

**Script CLOSER :**
```
Ce produit coûte [X]€ sur Amazon.
Livraison gratuite avec Prime.
Retours 30 jours, sans question.
Des milliers d'avis positifs.

Ramené à [durée d'utilisation estimée], c'est [X/durée]€ par [jour/semaine/mois].
```

**Exemples concrets :**
- Timekettle WT2 Edge (289€) → "289€ pour 3 ans = 0,26€ par jour de compréhension totale en voyage."
- Apple AirTag (32€) → "32€ pour ne plus jamais perdre une valise. Une seule valise retrouvée rembourse 10 AirTags."

---

### Objection 2 — La comparaison

**Visiteur :** "J'ai vu moins cher ailleurs." / "Il y a d'autres options."

**Script CLOSER :**
```
C'est le meilleur rapport qualité-prix dans cette catégorie.
Nos clients l'adorent — [noter nb avis Amazon].

Les alternatives moins chères ont souvent [précision moindre / pas de mode offline / pas de garantie].

Ce qu'on recommande ici, c'est ce qui a été testé et validé.
```

---

### Objection 3 — Le doute sur la technologie

**Visiteur :** "Ça marche vraiment ?"

**Script CLOSER :**
```
Oui — voilà comment :
[explication simple du produit en 2 phrases]

[Résultat concret d'un utilisateur réel ou stat produit]

Amazon affiche [X] avis, note moyenne [Y]/5.
Si ça ne vous convient pas : retour gratuit 30 jours.
Zéro risque.
```

---

### Objection 4 — La livraison

**Visiteur :** "Combien de temps pour la livraison ?"

**Script CLOSER :**
```
Livraison gérée par Amazon directement.
Avec Amazon Prime : livraison en 1-2 jours ouvrés.
Sans Prime : 3-5 jours selon votre adresse.

Le produit part d'un entrepôt Amazon France.
Suivi de commande en temps réel dans l'app Amazon.
```

---

### Objection 5 — La compatibilité

**Visiteur :** "Ça marche avec mon téléphone ?"

**Script CLOSER :**
```
[Produit] est compatible avec :
iOS (iPhone) et Android — à partir de la version [X].

Pas besoin d'installer d'application spéciale pour certains produits.
Pour les oreillettes Bluetooth : vérifier version Bluetooth de votre téléphone (BT 5.0+ recommandé).
```

---

## Intégration dans Elion

Ces scripts sont à intégrer dans la logique de réponse d'Elion.

Déclencheurs détectés dans le message utilisateur :
- "cher", "prix", "coûte" → Script Objection 1
- "comparaison", "moins cher", "autre" → Script Objection 2
- "marche vraiment", "efficace", "avis" → Script Objection 3
- "livraison", "délai", "délai" → Script Objection 4
- "compatible", "iPhone", "Android" → Script Objection 5

---

## KPIs CLOSER

| KPI | Cible |
|-----|-------|
| Taux conversion visiteur → clic Amazon | > 8% |
| Taux clic sur réponse Elion avec lien produit | > 15% |
| Objections les plus fréquentes | Suivi hebdo Notion |
| Scripts les plus efficaces | Suivi hebdo (A/B test) |

---

## Planning hebdomadaire CLOSER

| Moment | Tâche |
|--------|-------|
| Lundi | Analyser objections de la semaine dans Notion |
| Mercredi | Affiner scripts selon retours |
| Vendredi | Rapport efficacité → Telegram CEO |
