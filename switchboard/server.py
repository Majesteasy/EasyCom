#!/usr/bin/env python3
"""
EasyCom Standard IA — Telephone Switchboard Server
===================================================
Bridges Twilio phone calls with Grok Voice AI (xAI).

Pipeline:
  Caller → Twilio → This Server (WebSocket) → Grok Voice API

Requirements:
  - Twilio account + phone number (webhook → /incoming-call)
  - xAI API key (GROK_VOICE)
  - VPS with public HTTPS (ngrok works for testing)

Usage:
  python server.py
  or: uvicorn server:app --host 0.0.0.0 --port 5050
"""

import asyncio
import json
import os
import websockets
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import Response, JSONResponse
import uvicorn

# ─── Configuration ──────────────────────────────────────────────────────────

XAI_API_KEY   = os.getenv("XAI_API_KEY")
GROK_MODEL    = os.getenv("GROK_MODEL", "grok-voice-think-fast-1.8")
GROK_WS_URL   = f"wss://api.x.ai/v1/realtime?model={GROK_MODEL}"
PORT          = int(os.getenv("PORT", 5050))

SYSTEM_PROMPT = os.getenv("SYSTEM_PROMPT", """
Tu es le standard téléphonique IA d'EasyCom World, une boutique tech premium
spécialisée en outils IA de communication.

Tu réponds aux appels entrants en français, anglais, allemand, italien ou espagnol
selon la langue de l'appelant. Commence toujours en français puis adapte-toi.

== PRODUITS EASYCOM ==
Oreillettes traducteurs IA :
  - Timekettle WT2 Edge (~289€) : traduction simultanée bilatérale, 2 oreillettes
  - Timekettle M3 (~153€) : 40 langues, 93 accents, bidirectionnel
  - ANFIER A8 (~261€) : 84 langues, 5 modes, Bluetooth 5.2
  - MONODEAL M62 Conduction Osseuse : 134 langues, sport, open-ear
  - MONODEAL Clip 156 Langues : 42h autonomie, design discret
  - MONODEAL Open Ear 164 Langues : parfait voyage et affaires

Lunettes connectées :
  - Luckits 115L (~33€) : photo/vidéo discrète, légères
  - BLESSOURCE 116L (~25€) : audio intégré, usage quotidien

Stylos scanner :
  - Stylo Scanner AI (~46€) : numérisation instantanée, compact
  - IRISPen Reader 8 (~134€) : 130 langues, OCR professionnel

GPS Enfant :
  - Xplora X6Play (~45€) : 4G, appels, SOS, géofencing
  - EUNICECG 4G (~51€) : caméra, suivi temps réel, SOS

Traceurs GPS :
  - Invoxia GPS (~89€) : voiture/moto/vélo, longue autonomie
  - Samsung SmartTag2 (~15€) : réseau Find My Samsung
  - Apple AirTag (~32€) : réseau Find My Apple, précision UWB

== SITE WEB ==
easycom-world.ch — commandes via Amazon, livraison UE 5-10 jours.
Contact email : contact@easycom-world.ch

== CONSIGNES ==
- Sois chaleureuse, professionnelle, concise (tu parles au téléphone)
- Identifie le besoin de l'appelant et propose le produit adapté
- Si la question dépasse tes connaissances, propose d'envoyer un email
- Ne cite jamais les ASIN ni les liens Amazon directement
- Parle naturellement, comme une vraie standardiste humaine
""".strip())

# ─── App ────────────────────────────────────────────────────────────────────

app = FastAPI(title="EasyCom Standard IA", version="1.0.0")


@app.get("/")
async def root():
    return {"service": "EasyCom Standard IA", "status": "online"}


@app.get("/health")
async def health():
    configured = bool(XAI_API_KEY)
    return JSONResponse({
        "status": "online",
        "grok_model": GROK_MODEL,
        "api_configured": configured
    })


@app.post("/incoming-call")
async def incoming_call(request: Request):
    """
    Twilio webhook — called when someone dials the EasyCom number.
    Returns TwiML that streams audio to our WebSocket endpoint.
    """
    host = request.headers.get("host", "localhost")
    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="fr-FR">Bienvenue chez EasyCom World. Je vous mets en relation avec notre assistante IA.</Say>
    <Connect>
        <Stream url="wss://{host}/media-stream"/>
    </Connect>
    <Say language="fr-FR">Merci d'avoir appelé EasyCom World. À bientôt.</Say>
</Response>"""
    return Response(content=twiml, media_type="application/xml")


@app.websocket("/media-stream")
async def media_stream(twilio_ws: WebSocket):
    """
    WebSocket endpoint — bridges Twilio audio stream to Grok Voice API.
    Twilio sends/receives mulaw G.711 audio at 8kHz.
    """
    await twilio_ws.accept()
    print("[+] Twilio WebSocket connected")

    if not XAI_API_KEY:
        print("[!] ERROR: XAI_API_KEY not configured")
        await twilio_ws.close(code=1008)
        return

    stream_sid = None

    try:
        async with websockets.connect(
            GROK_WS_URL,
            additional_headers={"Authorization": f"Bearer {XAI_API_KEY}"},
            ping_interval=30
        ) as grok_ws:
            print(f"[+] Connected to Grok Voice — model: {GROK_MODEL}")

            # Configure the Grok voice session for telephony
            await grok_ws.send(json.dumps({
                "type": "session.update",
                "session": {
                    "instructions": SYSTEM_PROMPT,
                    "voice": "bright",
                    "input_audio_format": "g711_ulaw",
                    "output_audio_format": "g711_ulaw",
                    "input_audio_transcription": {"model": "grok-whisper-1"},
                    "turn_detection": {
                        "type": "server_vad",
                        "threshold": 0.5,
                        "prefix_padding_ms": 300,
                        "silence_duration_ms": 700
                    },
                    "modalities": ["audio", "text"]
                }
            }))

            # ── Twilio → Grok ──────────────────────────────────────────
            async def from_twilio():
                nonlocal stream_sid
                try:
                    async for raw in twilio_ws.iter_text():
                        msg = json.loads(raw)
                        event = msg.get("event")

                        if event == "start":
                            stream_sid = msg["start"]["streamSid"]
                            print(f"[+] Call started — StreamSID: {stream_sid}")

                        elif event == "media":
                            await grok_ws.send(json.dumps({
                                "type": "input_audio_buffer.append",
                                "audio": msg["media"]["payload"]
                            }))

                        elif event == "mark":
                            # Twilio confirms audio playback finished
                            pass

                        elif event == "stop":
                            print(f"[-] Call ended — StreamSID: {stream_sid}")
                            break

                except WebSocketDisconnect:
                    print("[-] Twilio disconnected")
                except Exception as e:
                    print(f"[!] Twilio receive error: {e}")
                finally:
                    await grok_ws.close()

            # ── Grok → Twilio ──────────────────────────────────────────
            async def from_grok():
                try:
                    async for raw in grok_ws:
                        msg = json.loads(raw)
                        t = msg.get("type", "")

                        if t == "response.audio.delta" and stream_sid:
                            # Stream Grok's audio back to the caller via Twilio
                            await twilio_ws.send_text(json.dumps({
                                "event": "media",
                                "streamSid": stream_sid,
                                "media": {"payload": msg.get("delta", "")}
                            }))

                        elif t == "response.audio.done" and stream_sid:
                            # Signal end of audio chunk
                            await twilio_ws.send_text(json.dumps({
                                "event": "mark",
                                "streamSid": stream_sid,
                                "mark": {"name": "response_end"}
                            }))

                        elif t == "session.created":
                            print("[+] Grok session created")

                        elif t == "error":
                            err = msg.get("error", {})
                            print(f"[!] Grok error: {err.get('message', 'unknown')} "
                                  f"(code: {err.get('code', '?')})")

                        elif t == "response.text.delta":
                            # Log transcription for debugging
                            pass

                except websockets.ConnectionClosed:
                    print("[-] Grok connection closed")
                except Exception as e:
                    print(f"[!] Grok receive error: {e}")

            await asyncio.gather(from_twilio(), from_grok())

    except websockets.InvalidURI:
        print(f"[!] Invalid Grok WebSocket URL: {GROK_WS_URL}")
    except websockets.InvalidHandshake as e:
        print(f"[!] Grok auth failed: {e} — check XAI_API_KEY")
    except Exception as e:
        print(f"[!] Bridge error: {e}")
    finally:
        print("[-] Call session closed")
        try:
            await twilio_ws.close()
        except Exception:
            pass


# ─── Entry point ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"""
╔══════════════════════════════════════════╗
║   EasyCom Standard IA — v1.0             ║
║   Grok Model : {GROK_MODEL:<25} ║
║   Port       : {PORT:<25} ║
╚══════════════════════════════════════════╝
    """)
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="info")
