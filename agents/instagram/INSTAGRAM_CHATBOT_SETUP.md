# INSTAGRAM CHATBOT EASYCOM — Guide de Configuration

## Objectif
Chatbot Instagram qui repond automatiquement aux DM et oriente vers le site
affilié easycom-world.ch.

---

## Prerequis

### Compte Instagram
- Compte Instagram Business ou Creator (pas un compte personnel)
- Connecte a une Page Facebook

### Meta App
1. Aller sur https://developers.facebook.com/apps/
2. Creer une app de type "Business"
3. Ajouter le produit "Instagram Graph API"
4. Ajouter le produit "Webhooks"

### Permissions necessaires (a demander dans Meta)
- `instagram_basic`
- `instagram_manage_messages`
- `pages_read_engagement`
- `pages_manage_metadata`

> Note : `instagram_manage_messages` necessite une validation Meta si > 500 utilisateurs.
> Pour commencer, tester en mode developpement avec votre compte personnel.

---

## Configuration Webhook Meta

### 1. Dans Make.com
- Creer un nouveau webhook "instant"
- Copier l'URL generee (ex: `https://hook.eu1.make.com/XXXXXXXXXX`)

### 2. Dans Meta Developer Platform
```
Products -> Webhooks -> Instagram
Callback URL    : URL du webhook Make.com ci-dessus
Verify Token    : INSTAGRAM_VERIFY_TOKEN (choisir une chaine aleatoire)
Champs a cocher : messages, messaging_postbacks
```

### 3. Verification du webhook
Meta va envoyer une requete GET avec `hub.challenge`.
Make doit repondre avec la valeur de `hub.challenge`.

Dans Make — Module Webhook -> Settings -> "Respond to a webhook" :
```
Status : 200
Body   : {{query.hub.challenge}}
```

---

## Variables a configurer (JAMAIS dans GitHub)

| Variable | Description | Ou configurer |
|----------|-------------|---------------|
| INSTAGRAM_ACCESS_TOKEN | Long-lived Page Access Token | Connexion Make |
| INSTAGRAM_PAGE_ID | ID de la Page Facebook connectee | Variable Make |
| INSTAGRAM_VERIFY_TOKEN | Token de verification webhook | Variable Make + Meta Dev |

### Obtenir un long-lived token
1. Meta Developer -> Tools -> Access Token Debugger
2. Generer un User Access Token avec les permissions necessaires
3. Echanger contre un Page Access Token longue duree (60 jours) :
```
GET https://graph.facebook.com/v19.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id=META_APP_ID
  &client_secret=META_APP_SECRET
  &fb_exchange_token=USER_TOKEN
```
4. Stocker dans Make — ne jamais dans GitHub.

---

## Flux de reponse

```
DM Instagram -> Meta -> Webhook Make -> Analyse intention -> Reponse
```

Regles de routage :
| Mots-cles | URL site |
|-----------|----------|
| traduction, voyage, langue, japon, anglais, espagnol | /?src=instagram_dm&need=translation |
| enfant, gps, securite, montre, parent, kids | /?src=instagram_dm&need=kids_gps |
| tiktok, video, lunette, createur, creator, film | /?src=instagram_dm&need=creator |
| question generale, aide, bonjour, info | /?src=instagram_dm (page principale) |

---

## Limites Meta a connaitre
- 24h pour repondre aux messages (fenetre de messagerie)
- Pas de messages promotionnels non sollicites
- Max 1 reponse automatique par DM entrant (recommande)
- Renouveler l'access token tous les 60 jours (ou utiliser un token systeme permanent)

---

## Test en mode developpement
1. Ajouter votre compte Instagram comme testeur dans Meta App
2. Envoyer un DM depuis votre compte test
3. Verifier dans Make que le webhook recoit bien le message
4. Verifier la reponse envoyee
