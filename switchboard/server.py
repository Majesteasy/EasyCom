#!/usr/bin/env python3
"""
EasyCom Standard IA — Serveur Principal
========================================
Gestion des appels téléphoniques IA via Twilio + Grok Voice.
API REST pour le dashboard admin.

Pipeline : Appelant → Twilio → WebSocket → Grok Voice (outils IA) → DB
"""

import asyncio
import json
import os
import time
import uuid
from datetime import datetime
from pathlib import Path

import uvicorn
import websockets
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

import database as db

load_dotenv()

# ── Configuration ─────────────────────────────────────────────────────────────

XAI_API_KEY  = os.getenv("XAI_API_KEY", "")
GROK_MODEL   = os.getenv("GROK_MODEL", "grok-voice-think-fast-1.8")
GROK_WS_URL  = f"wss://api.x.ai/v1/realtime?model={GROK_MODEL}"
ADMIN_KEY    = os.getenv("ADMIN_KEY", "changeme")
PORT         = int(os.getenv("PORT", 5050))

# ── Default system prompt (can be overridden per client) ─────────────────────

DEFAULT_PROMPT = """
Tu es {persona_name}, le standard téléphonique IA de {business_name}.
Tu réponds aux appels en français (ou dans la langue de l'appelant si différente).

Ton rôle :
1. ACCUEIL — Accueille chaleureusement et identifie le besoin
2. INFORMATION — Réponds aux questions sur {business_name}
3. RÉSERVATION — Prends une réservation (collecte : nom, téléphone, date, heure, service)
4. MESSAGE — Enregistre un message pour être rappelé (collecte : nom, téléphone, message)
5. TRANSFERT — Transfère si demandé à un département spécifique

Instructions importantes :
- Parle naturellement, comme une vraie standardiste professionnelle
- Collecte les informations manquantes une par une, sans interrogatoire
- Confirme toujours avant d'enregistrer une réservation ou un message
- Si tu ne sais pas répondre, propose de laisser un message
- Sois concise (tu parles au téléphone, pas à l'écrit)
- Maximum 2-3 phrases par réponse

{custom_instructions}
""".strip()

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="EasyCom Standard IA", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

db.init_db()

# ── Auth ──────────────────────────────────────────────────────────────────────

def require_admin(request: Request):
    key = request.headers.get("X-Admin-Key") or request.query_params.get("key")
    if key != ADMIN_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "online",
        "model": GROK_MODEL,
        "api_configured": bool(XAI_API_KEY),
    }


# ── Twilio Webhook ────────────────────────────────────────────────────────────

@app.post("/incoming-call")
async def incoming_call(request: Request):
    """
    Twilio appelle ce endpoint quand un appelant compose le numéro.
    Retourne du TwiML qui démarre le streaming audio vers /media-stream.
    """
    host = request.headers.get("host", "localhost")
    client_id = request.query_params.get("client_id", "default")

    client = db.get_client(client_id)
    persona = client["persona_name"] if client else "ELION"

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="fr-FR" voice="Polly.Lea">Bienvenue. Je vous mets en relation avec {persona}.</Say>
    <Connect>
        <Stream url="wss://{host}/media-stream">
            <Parameter name="client_id" value="{client_id}"/>
        </Stream>
    </Connect>
</Response>"""
    return Response(content=twiml, media_type="application/xml")


# ── WebSocket Bridge ──────────────────────────────────────────────────────────

def build_session_config(client: dict | None) -> dict:
    """Build Grok Voice session config from client settings."""
    business_name = client["name"] if client else "notre entreprise"
    persona_name  = client["persona_name"] if client else "ELION"
    custom_instrs = client.get("system_prompt", "") if client else ""

    system = DEFAULT_PROMPT.format(
        persona_name=persona_name,
        business_name=business_name,
        custom_instructions=custom_instrs,
    )

    tools = [
        {
            "type": "function",
            "name": "save_reservation",
            "description": "Enregistre une réservation quand toutes les infos sont collectées.",
            "parameters": {
                "type": "object",
                "properties": {
                    "caller_name": {"type": "string", "description": "Nom complet de l'appelant"},
                    "phone":       {"type": "string", "description": "Numéro de téléphone de rappel"},
                    "date":        {"type": "string", "description": "Date de la réservation (ex: 15 juin, demain)"},
                    "time":        {"type": "string", "description": "Heure de la réservation (ex: 19h30)"},
                    "service":     {"type": "string", "description": "Service ou prestation demandé"},
                    "party_size":  {"type": "integer", "description": "Nombre de personnes (si applicable)"},
                    "notes":       {"type": "string", "description": "Informations complémentaires"},
                },
                "required": ["caller_name", "date", "time"],
            },
        },
        {
            "type": "function",
            "name": "save_message",
            "description": "Enregistre un message pour être rappelé.",
            "parameters": {
                "type": "object",
                "properties": {
                    "caller_name": {"type": "string", "description": "Nom de l'appelant"},
                    "phone":       {"type": "string", "description": "Numéro de rappel"},
                    "content":     {"type": "string", "description": "Contenu du message"},
                },
                "required": ["caller_name", "content"],
            },
        },
        {
            "type": "function",
            "name": "update_intent",
            "description": "Met à jour le sujet de l'appel pour le tableau de bord.",
            "parameters": {
                "type": "object",
                "properties": {
                    "intent": {
                        "type": "string",
                        "enum": ["information", "reservation", "message", "transfert", "reclamation", "autre"],
                    }
                },
                "required": ["intent"],
            },
        },
    ]

    # Add transfer numbers if configured
    if client:
        transfer_numbers = json.loads(client.get("transfer_numbers") or "{}")
        if transfer_numbers:
            dept_enum = list(transfer_numbers.keys())
            tools.append({
                "type": "function",
                "name": "transfer_call",
                "description": "Transfère l'appel à un département ou une personne.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "department": {
                            "type": "string",
                            "enum": dept_enum,
                            "description": "Département vers lequel transférer",
                        }
                    },
                    "required": ["department"],
                },
            })

    return {
        "type": "session.update",
        "session": {
            "instructions": system,
            "voice": "bright",
            "input_audio_format": "g711_ulaw",
            "output_audio_format": "g711_ulaw",
            "input_audio_transcription": {"model": "grok-whisper-1"},
            "turn_detection": {
                "type": "server_vad",
                "threshold": 0.5,
                "prefix_padding_ms": 300,
                "silence_duration_ms": 700,
            },
            "tools": tools,
            "tool_choice": "auto",
            "modalities": ["audio", "text"],
        },
    }


@app.websocket("/media-stream")
async def media_stream(twilio_ws: WebSocket):
    """Bridge Twilio Media Stream ↔ Grok Voice API avec gestion des outils."""
    await twilio_ws.accept()

    if not XAI_API_KEY:
        print("[!] XAI_API_KEY manquant")
        await twilio_ws.close(code=1008)
        return

    # State for this call
    stream_sid   = None
    call_id      = None
    client_id    = "default"
    call_start   = time.time()
    fn_call_buf  = {}  # accumulate function call args by call_id

    try:
        async with websockets.connect(
            GROK_WS_URL,
            additional_headers={"Authorization": f"Bearer {XAI_API_KEY}"},
            ping_interval=30,
        ) as grok_ws:

            # ── Twilio → Server → Grok ────────────────────────────────
            async def from_twilio():
                nonlocal stream_sid, call_id, client_id, call_start

                try:
                    async for raw in twilio_ws.iter_text():
                        msg = json.loads(raw)
                        event = msg.get("event")

                        if event == "start":
                            stream_sid  = msg["start"]["streamSid"]
                            custom_params = msg["start"].get("customParameters", {})
                            client_id   = custom_params.get("client_id", "default")
                            from_number = msg["start"].get("from", "inconnu")
                            call_start  = time.time()

                            client = db.get_client(client_id)
                            call_id = db.create_call(client_id, stream_sid, from_number)
                            print(f"[+] Appel démarré — client:{client_id} sid:{stream_sid}")

                            # Configure Grok session
                            await grok_ws.send(json.dumps(build_session_config(client)))

                        elif event == "media" and stream_sid:
                            await grok_ws.send(json.dumps({
                                "type": "input_audio_buffer.append",
                                "audio": msg["media"]["payload"],
                            }))

                        elif event == "stop":
                            print(f"[-] Appel terminé — sid:{stream_sid}")
                            break

                except WebSocketDisconnect:
                    pass
                except Exception as e:
                    print(f"[!] Erreur Twilio recv: {e}")
                finally:
                    await grok_ws.close()

            # ── Grok → Server → Twilio ────────────────────────────────
            async def from_grok():
                nonlocal fn_call_buf

                try:
                    async for raw in grok_ws:
                        msg = json.loads(raw)
                        t = msg.get("type", "")

                        # Stream audio to caller
                        if t == "response.audio.delta" and stream_sid:
                            await twilio_ws.send_text(json.dumps({
                                "event": "media",
                                "streamSid": stream_sid,
                                "media": {"payload": msg.get("delta", "")},
                            }))

                        elif t == "response.audio.done" and stream_sid:
                            await twilio_ws.send_text(json.dumps({
                                "event": "mark",
                                "streamSid": stream_sid,
                                "mark": {"name": "end"},
                            }))

                        # Transcription (log + save)
                        elif t == "conversation.item.input_audio_transcription.completed":
                            text = msg.get("transcript", "")
                            if text and call_id:
                                db.append_transcript(call_id, "user", text)
                                print(f"[👤] {text}")

                        elif t == "response.text.done":
                            text = msg.get("text", "")
                            if text and call_id:
                                db.append_transcript(call_id, "assistant", text)
                                print(f"[🤖] {text}")

                        # Function call: accumulate arguments
                        elif t == "response.output_item.added":
                            item = msg.get("item", {})
                            if item.get("type") == "function_call":
                                fn_id = item.get("call_id", "")
                                fn_call_buf[fn_id] = {
                                    "name": item.get("name", ""),
                                    "args": "",
                                }

                        elif t == "response.function_call_arguments.delta":
                            fn_id = msg.get("call_id", "")
                            if fn_id in fn_call_buf:
                                fn_call_buf[fn_id]["args"] += msg.get("delta", "")

                        elif t == "response.function_call_arguments.done":
                            fn_id = msg.get("call_id", "")
                            if fn_id in fn_call_buf:
                                fn_info = fn_call_buf.pop(fn_id)
                                result = await handle_tool(
                                    fn_info["name"],
                                    fn_info["args"],
                                    call_id,
                                    client_id,
                                    stream_sid,
                                    twilio_ws,
                                )
                                # Send result back to Grok
                                await grok_ws.send(json.dumps({
                                    "type": "conversation.item.create",
                                    "item": {
                                        "type": "function_call_output",
                                        "call_id": fn_id,
                                        "output": json.dumps(result),
                                    },
                                }))
                                # Ask Grok to continue
                                await grok_ws.send(json.dumps({"type": "response.create"}))

                        elif t == "error":
                            err = msg.get("error", {})
                            print(f"[!] Grok error: {err.get('message')} ({err.get('code')})")

                except websockets.ConnectionClosed:
                    pass
                except Exception as e:
                    print(f"[!] Erreur Grok recv: {e}")

            await asyncio.gather(from_twilio(), from_grok())

    except websockets.InvalidHandshake as e:
        print(f"[!] Grok auth échouée: {e}")
    except Exception as e:
        print(f"[!] Erreur bridge: {e}")
    finally:
        if stream_sid and call_id:
            duration = int(time.time() - call_start)
            db.end_call(stream_sid, duration)
            print(f"[-] Session fermée — durée: {duration}s")
        try:
            await twilio_ws.close()
        except Exception:
            pass


# ── Tool execution ────────────────────────────────────────────────────────────

async def handle_tool(name: str, args_str: str, call_id, client_id, stream_sid, twilio_ws) -> dict:
    """Execute a tool call from Grok Voice and return result."""
    try:
        args = json.loads(args_str) if args_str else {}
    except json.JSONDecodeError:
        return {"status": "error", "message": "Arguments invalides"}

    print(f"[🔧] Tool: {name}({args})")

    if name == "save_reservation":
        res_id = db.save_reservation(client_id, call_id, args)
        return {
            "status": "confirmed",
            "reservation_id": res_id,
            "message": f"Réservation #{res_id} enregistrée avec succès.",
        }

    elif name == "save_message":
        msg_id = db.save_message(
            client_id,
            call_id,
            args.get("caller_name", "Inconnu"),
            args.get("phone", ""),
            args.get("content", ""),
        )
        return {
            "status": "confirmed",
            "message_id": msg_id,
            "message": f"Message #{msg_id} enregistré. Nous vous rappellerons.",
        }

    elif name == "update_intent":
        if call_id:
            db.update_call_intent(call_id, args.get("intent", "autre"))
        return {"status": "ok"}

    elif name == "transfer_call":
        dept = args.get("department", "")
        client = db.get_client(client_id)
        if client:
            numbers = json.loads(client.get("transfer_numbers") or "{}")
            target = numbers.get(dept)
            if target and stream_sid:
                # Redirect Twilio call via TwiML (requires Twilio REST API call in production)
                # For now, log and confirm — full implementation needs TWILIO_ACCOUNT_SID
                print(f"[📞] Transfert vers {dept}: {target}")
                return {
                    "status": "transferring",
                    "message": f"Transfert vers {dept} en cours.",
                }
        return {"status": "error", "message": "Numéro de transfert non configuré."}

    return {"status": "unknown_tool"}


# ── REST API — Admin ──────────────────────────────────────────────────────────

@app.get("/api/stats")
async def api_stats(client_id: str = "default", _=Depends(require_admin)):
    return db.get_stats(client_id)


@app.get("/api/calls")
async def api_calls(client_id: str = "default", _=Depends(require_admin)):
    calls = db.list_calls(client_id)
    for c in calls:
        c["transcript"] = json.loads(c.get("transcript") or "[]")
    return calls


@app.get("/api/messages")
async def api_messages(client_id: str = "default", unread: bool = False, _=Depends(require_admin)):
    return db.list_messages(client_id, unread)


@app.post("/api/messages/{msg_id}/read")
async def api_mark_read(msg_id: int, _=Depends(require_admin)):
    db.mark_message_read(msg_id)
    return {"status": "ok"}


@app.get("/api/reservations")
async def api_reservations(client_id: str = "default", status: str = None, _=Depends(require_admin)):
    return db.list_reservations(client_id, status)


@app.post("/api/reservations/{res_id}/status")
async def api_update_reservation(res_id: int, request: Request, _=Depends(require_admin)):
    body = await request.json()
    db.update_reservation_status(res_id, body.get("status", "pending"))
    return {"status": "ok"}


@app.get("/api/clients")
async def api_clients(_=Depends(require_admin)):
    clients = db.list_clients()
    for c in clients:
        c["departments"] = json.loads(c.get("departments") or "[]")
        c["transfer_numbers"] = json.loads(c.get("transfer_numbers") or "{}")
    return clients


@app.post("/api/clients")
async def api_create_client(request: Request, _=Depends(require_admin)):
    data = await request.json()
    if isinstance(data.get("departments"), list):
        data["departments"] = json.dumps(data["departments"])
    if isinstance(data.get("transfer_numbers"), dict):
        data["transfer_numbers"] = json.dumps(data["transfer_numbers"])
    client = db.upsert_client(data)
    client["departments"] = json.loads(client.get("departments") or "[]")
    client["transfer_numbers"] = json.loads(client.get("transfer_numbers") or "{}")
    return client


# ── Admin Dashboard ───────────────────────────────────────────────────────────

ADMIN_DIR = Path(__file__).parent / "admin"

@app.get("/admin")
@app.get("/admin/")
async def serve_admin():
    index = ADMIN_DIR / "index.html"
    if index.exists():
        return FileResponse(str(index))
    return JSONResponse({"error": "Admin dashboard not found"}, status_code=404)


if ADMIN_DIR.exists():
    app.mount("/admin/assets", StaticFiles(directory=str(ADMIN_DIR)), name="admin-assets")


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"""
╔═══════════════════════════════════════════════════╗
║   EasyCom Standard IA  v2.0                       ║
║   Grok : {GROK_MODEL:<40} ║
║   Port : {PORT:<40} ║
║   Admin: http://localhost:{PORT}/admin             ║
╚═══════════════════════════════════════════════════╝
""")
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="info")
