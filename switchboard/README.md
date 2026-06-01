# EasyCom Standard IA — Serveur Téléphonique

Standard téléphonique IA qui décroche automatiquement les appels entrants.

## Architecture

```
Appelant
   ↓  (appel téléphonique)
Twilio (numéro de téléphone)
   ↓  (WebSocket audio mulaw)
Ce serveur Python (VPS)
   ↓  (WebSocket Grok Voice API)
Grok Voice Think Fast (xAI)
```

## Prérequis

| Service | Usage | Coût estimé |
|---------|-------|-------------|
| VPS (Hostinger, OVH…) | Héberge ce serveur | ~5-10€/mois |
| Twilio | Numéro de téléphone + appels | ~15-30€/mois |
| xAI (Grok Voice) | IA vocale | ~0.05$/min environ |

## Installation sur VPS

### 1. Installer Python et les dépendances

```bash
git clone https://github.com/Majesteasy/EasyCom.git
cd EasyCom/switchboard
pip install -r requirements.txt
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
nano .env
```

Remplir :
- `XAI_API_KEY` → clé API depuis [console.x.ai](https://console.x.ai/)
- `GROK_MODEL` → `grok-voice-think-fast-1.8` (recommandé)
- `PORT` → `5050` (ou adapter selon VPS)

### 3. Lancer le serveur

```bash
# Test
python server.py

# Production (avec SSL/HTTPS via nginx + certbot)
uvicorn server:app --host 0.0.0.0 --port 5050
```

### 4. Exposer le serveur (HTTPS obligatoire pour Twilio)

**Option A — ngrok (test local) :**
```bash
ngrok http 5050
```
Copier l'URL `https://xxxx.ngrok.io`

**Option B — VPS avec nginx + Let's Encrypt (production) :**
```nginx
server {
    listen 443 ssl;
    server_name standard.easycom-world.ch;

    ssl_certificate /etc/letsencrypt/live/standard.easycom-world.ch/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/standard.easycom-world.ch/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5050;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 5. Configurer Twilio

1. Aller sur [console.twilio.com](https://console.twilio.com/)
2. Acheter un numéro de téléphone
3. Dans les paramètres du numéro :
   - **Voice webhook (POST)** → `https://votre-serveur.com/incoming-call`
4. Tester en appelant le numéro !

## Test sans téléphone

Ouvrir `switchboard.html` dans un navigateur pour tester la version web (utilise Gemini).

## Variables d'environnement

| Variable | Requis | Description |
|----------|--------|-------------|
| `XAI_API_KEY` | ✅ | Clé API xAI (Grok Voice) |
| `GROK_MODEL` | Non | Modèle vocal (défaut: `grok-voice-think-fast-1.8`) |
| `PORT` | Non | Port serveur (défaut: `5050`) |
| `SYSTEM_PROMPT` | Non | Remplace le prompt EasyCom par défaut |

## Personnaliser le prompt

Par défaut, le serveur utilise un prompt EasyCom World complet (voir `server.py`).

Pour adapter à votre métier, modifier `SYSTEM_PROMPT` dans `.env` :
```
SYSTEM_PROMPT=Tu es le standard téléphonique de [VOTRE ENTREPRISE]...
```

## Lancer en production (systemd)

```ini
# /etc/systemd/system/easycom-standard.service
[Unit]
Description=EasyCom Standard IA
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/EasyCom/switchboard
EnvironmentFile=/home/ubuntu/EasyCom/switchboard/.env
ExecStart=/usr/bin/uvicorn server:app --host 0.0.0.0 --port 5050
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable easycom-standard
systemctl start easycom-standard
```
