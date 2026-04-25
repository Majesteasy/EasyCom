# Instagram Graph API — Setup EasyCom

## Objectif
Publier les scripts IZZY sur Instagram via Make.com (Reels + Stories + Posts).

## Compte cible
- **Instagram** : @easycom_world (Business Account requis)
- **Géré via** : Meta Business Suite → Page Facebook liée

---

## Étapes de configuration

### 1. Créer une app Meta Developer
1. Aller sur https://developers.facebook.com
2. Créer une app → Type : "Business"
3. Ajouter le produit "Instagram Graph API"
4. Passer l'app en mode "Live"

### 2. Obtenir les identifiants (ne jamais commiter)
Les valeurs réelles vont dans Make.com › Connections :
- `INSTAGRAM_ACCESS_TOKEN` — Token d'accès Page (longue durée, 60 jours)
- `INSTAGRAM_PAGE_ID` — ID numérique du compte Business Instagram
- `INSTAGRAM_VERIFY_TOKEN` — Pour valider le webhook Meta (chaîne aléatoire)

### 3. Permissions requises
Dans Meta Developer › App Review :
- `instagram_basic`
- `instagram_content_publish`
- `pages_show_list`
- `pages_read_engagement`

### 4. Renouvellement du token
Le token expire après 60 jours. Configurer un scénario Make.com pour le renouveler :
- Module : Facebook Graph API → Exchange Token
- Planifier 50 jours après émission

---

## Structure des posts Instagram

### Post produit standard
```json
{
  "image_url": "URL_IMAGE_PRODUIT",
  "caption": "LEGENDE_IZZY\n\n#easycom #gadgettech #amazonfrance",
  "media_type": "IMAGE"
}
```

### Reel court (27s)
```json
{
  "video_url": "URL_VIDEO",
  "caption": "LEGENDE_IZZY",
  "media_type": "REELS",
  "share_to_feed": true
}
```

### Story produit
```json
{
  "image_url": "URL_IMAGE",
  "media_type": "STORIES"
}
```

---

## Templates légendes par catégorie

### Traduction
```
🎧 Plus jamais bloqué par la barrière des langues.

{script_hook}

🔗 Lien en bio → Amazon.fr
#traducteurinstantané #voyageurfuté #timekettle #gadget2026 #easycom
```

### GPS Enfant
```
👶 La tranquillité d'esprit de chaque parent.

{script_hook}

🔗 Lien en bio → Amazon.fr
#gpskids #securiteenfant #parentalité #montre4G #easycom
```

### Lunettes caméra
```
👓 Filme ta vie. Main libre. Invisible.

{script_hook}

🔗 Lien en bio → Amazon.fr
#lunettesconnectées #contentcreator #vlog #gadget #easycom
```

### Traceurs GPS
```
🔍 Retrouve tout ce qui compte.

{script_hook}

🔗 Lien en bio → Amazon.fr
#airtag #traceur #samsung #antivol #easycom
```

---

## Webhook Meta (pour événements futurs)

### Endpoint à configurer dans Make.com
URL Make.com Webhook → copier dans Meta Developer › Webhooks

### Paramètres de vérification
```
Verify Token : INSTAGRAM_VERIFY_TOKEN  (placeholder — définir une valeur aléatoire dans Make.com)
Callback URL : MAKE_WEBHOOK_URL
```

### Événements à souscrire
- `messages` — Messages directs Instagram
- `comments` — Commentaires sur les posts
- `mentions` — Mentions @easycom_world

---

## Fréquence publication recommandée
- **Reels** : 1/jour (lundi → vendredi)
- **Stories** : 2/jour
- **Posts caroussel** : 2/semaine

Voir le calendrier éditorial dans `/agents/izzy/scripts.md`
