# EasyCom Standard IA — v2.0

Standard téléphonique IA complet : routing, réservations, messages, dashboard admin.
Commercialisable à 100€/mois par client.

## Ce que ça fait

- **Décroche automatiquement** les appels via Twilio
- **Comprend la demande** (Grok Voice Think Fast 1.8)
- **Route les appels** vers le bon département
- **Prend les réservations** (nom, téléphone, date, heure, service)
- **Enregistre les messages** pour rappel
- **Transcrit les appels** automatiquement
- **Dashboard admin** pour piloter depuis n'importe quel navigateur
- **Multi-clients** : gérer plusieurs entreprises depuis un seul serveur

## Architecture

```
Appelant → Twilio (numéro) → VPS (ce serveur) → Grok Voice API
                                    ↓
                              SQLite (DB)
                                    ↓
                          Dashboard Admin (/admin)
```

## Installation rapide (VPS)

### 1. Cloner et installer

```bash
git clone https://github.com/Majesteasy/EasyCom.git
cd EasyCom/switchboard
pip install -r requirements.txt
```

### 2. Configurer

```bash
cp .env.example .env
nano .env
```

Variables à remplir :
| Variable | Description |
|----------|-------------|
| `XAI_API_KEY` | Clé depuis [console.x.ai](https://console.x.ai/) |
| `ADMIN_KEY` | Mot de passe pour le dashboard (choisir fort) |
| `PORT` | Port (défaut: 5050) |

### 3. Lancer

```bash
# Test
python server.py

# Production avec systemd (voir ci-dessous)
uvicorn server:app --host 0.0.0.0 --port 5050
```

### 4. Configurer HTTPS (Nginx + Let's Encrypt)

```nginx
server {
    listen 443 ssl;
    server_name standard.mon-domaine.com;
    ssl_certificate /etc/letsencrypt/live/standard.mon-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/standard.mon-domaine.com/privkey.pem;
    location / {
        proxy_pass http://127.0.0.1:5050;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
certbot --nginx -d standard.mon-domaine.com
```

### 5. Configurer Twilio

1. [console.twilio.com](https://console.twilio.com/) → Acheter un numéro
2. Dans les paramètres du numéro :
   - **Voice webhook (POST)** → `https://standard.mon-domaine.com/incoming-call`
3. Appeler le numéro → le standard décroche tout seul !

### 6. Accéder au dashboard

Ouvrir `https://standard.mon-domaine.com/admin`
→ Saisir votre `ADMIN_KEY`

## Dashboard Admin — Fonctionnalités

| Onglet | Description |
|--------|-------------|
| **Dashboard** | Vue d'ensemble : appels, messages, réservations |
| **Messages** | Messages laissés par les appelants, marquer comme lu |
| **Réservations** | Confirmer / annuler les réservations |
| **Appels** | Historique avec transcriptions complètes |
| **Configuration** | Personnaliser le prompt IA, les numéros de transfert |
| **Clients** | Gérer plusieurs entreprises (commercialisation) |

## Commercialisation (100€/mois/client)

Chaque client a :
- Son propre profil (nom entreprise, nom IA, prompt personnalisé)
- Ses données séparées (appels, messages, réservations)
- Son propre numéro Twilio

Créer un client via le dashboard → onglet **Clients** → formulaire **Ajouter**.

Webhook Twilio du client : `https://votre-serveur.com/incoming-call?client_id=ID_CLIENT`

## Systemd (production)

```ini
# /etc/systemd/system/easycom-standard.service
[Unit]
Description=EasyCom Standard IA
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/EasyCom/switchboard
EnvironmentFile=/home/ubuntu/EasyCom/switchboard/.env
ExecStart=uvicorn server:app --host 0.0.0.0 --port 5050
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable easycom-standard
systemctl start easycom-standard
systemctl status easycom-standard
```

## Coûts estimés (par client)

| Service | Coût |
|---------|------|
| VPS (1 serveur pour tous vos clients) | ~5-10€/mois |
| Twilio (numéro + ~200 min appels) | ~15-25€/mois/client |
| xAI Grok Voice | ~0.03-0.06$/min d'appel |
| **Total par client** | **~25-40€/mois de coût** |
| **Prix de vente suggéré** | **100€/mois** |
| **Marge** | **~60-75€/mois/client** |
