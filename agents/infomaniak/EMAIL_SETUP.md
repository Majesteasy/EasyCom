# Infomaniak Email — Configuration Make.com

Adresse : **contact@easycom-world.ch**
Hébergeur : **Infomaniak**

---

## Paramètres SMTP (envoi)

| Paramètre | Valeur |
|-----------|--------|
| Serveur SMTP | `mail.infomaniak.com` |
| Port | `465` (SSL) ou `587` (STARTTLS) |
| Utilisateur | `contact@easycom-world.ch` |
| Mot de passe | Mot de passe Infomaniak du compte |
| Chiffrement | SSL/TLS |

## Paramètres IMAP (réception)

| Paramètre | Valeur |
|-----------|--------|
| Serveur IMAP | `mail.infomaniak.com` |
| Port | `993` |
| Utilisateur | `contact@easycom-world.ch` |
| Mot de passe | Mot de passe Infomaniak du compte |
| Chiffrement | SSL/TLS |

---

## Connexion dans Make.com

### Créer la connexion SMTP

1. Make.com → Connections → **Add** → chercher **Email (SMTP)**
2. Remplir avec les paramètres SMTP ci-dessus
3. Nommer : `EasyCom-Infomaniak-SMTP`
4. Tester → Save

### Créer la connexion IMAP

1. Make.com → Connections → **Add** → chercher **Email (IMAP)**
2. Remplir avec les paramètres IMAP ci-dessus
3. Nommer : `EasyCom-Infomaniak-IMAP`
4. Tester → Save

---

## Scénario 1 — Réponse automatique aux demandes produits

**Déclencheur :** Email entrant sur `contact@easycom-world.ch` avec mot-clé produit

```
IMAP Watch Emails (contact@easycom-world.ch)
    → Text Parser : détecter mots-clés (traducteur, oreillette, produit)
    → Router :
        ├─ Si demande produit → SMTP : envoyer réponse catalogue
        └─ Sinon → SMTP : envoyer réponse générique + Telegram alerte
```

**Template réponse produit :**
```
Objet : Votre demande EasyCom — Nos recommandations

Bonjour,

Merci pour votre intérêt ! Voici nos produits recommandés :
[lien easycom-world.ch]

Notre assistante Elion peut aussi vous aider directement sur le site.

L'équipe EasyCom
```

---

## Scénario 2 — Alerte nouvelle commande Amazon

**Déclencheur :** Email Amazon Associates avec confirmation de commande

```
IMAP Watch Emails
    → Text Parser : détecter email Amazon Associates
    → Router : si "commission" ou "commande" dans sujet
        → Extraire : montant, produit, ASIN
        → Notion : ajouter ligne dans base Produits/Revenus
        → Telegram : envoyer alerte au Chat ID 1921851243
        → SMTP : accusé interne (optionnel)
```

**Message Telegram type :**
```
💰 Nouvelle commission Amazon !
Produit : [nom]
Commission : [montant]€
```

---

## Scénario 3 — Newsletter hebdomadaire

**Déclencheur :** Scheduler — chaque lundi 9h

```
Scheduler (Lundi 9h00)
    → Notion : récupérer liste abonnés newsletter
    → Notion : récupérer top produits de la semaine
    → Iterator : pour chaque abonné
        → SMTP : envoyer newsletter personnalisée
    → Telegram : confirmer envoi (nombre d'emails)
```

**Structure newsletter :**
```
Objet : EasyCom Weekly — Les meilleures trouvailles de la semaine

[Logo EasyCom]

Cette semaine chez EasyCom...
[Top 3 produits avec liens Amazon tag=easycom0ae-21]

Izzy recommande : [citation script de la semaine]

[Bouton CTA → easycom-world.ch]
```

---

## Sécurité

- Ne jamais stocker le mot de passe Infomaniak dans le code
- Utiliser uniquement les Connections Make.com
- Activer l'authentification à deux facteurs sur le compte Infomaniak
