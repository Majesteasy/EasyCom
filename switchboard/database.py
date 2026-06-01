"""
Database layer — SQLite with WAL mode.
Tables: clients, calls, messages, reservations
"""

import sqlite3
import json
import uuid
from datetime import datetime
from pathlib import Path
from contextlib import contextmanager

DB_PATH = Path(__file__).parent / "data" / "standard.db"


@contextmanager
def get_db():
    DB_PATH.parent.mkdir(exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    with get_db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS clients (
            id            TEXT PRIMARY KEY,
            name          TEXT NOT NULL,
            phone         TEXT,
            persona_name  TEXT DEFAULT 'ELION',
            system_prompt TEXT DEFAULT '',
            departments   TEXT DEFAULT '[]',
            transfer_numbers TEXT DEFAULT '{}',
            active        INTEGER DEFAULT 1,
            created_at    TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS calls (
            id            TEXT PRIMARY KEY,
            client_id     TEXT NOT NULL DEFAULT 'default',
            stream_sid    TEXT UNIQUE,
            from_number   TEXT,
            status        TEXT DEFAULT 'active',
            intent        TEXT,
            transcript    TEXT DEFAULT '[]',
            started_at    TEXT DEFAULT (datetime('now')),
            ended_at      TEXT,
            duration      INTEGER DEFAULT 0,
            FOREIGN KEY (client_id) REFERENCES clients(id)
        );

        CREATE TABLE IF NOT EXISTS messages (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id     TEXT NOT NULL DEFAULT 'default',
            call_id       TEXT,
            caller_name   TEXT,
            phone         TEXT,
            content       TEXT NOT NULL,
            is_read       INTEGER DEFAULT 0,
            created_at    TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS reservations (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id     TEXT NOT NULL DEFAULT 'default',
            call_id       TEXT,
            caller_name   TEXT,
            phone         TEXT,
            date          TEXT,
            time          TEXT,
            service       TEXT,
            party_size    INTEGER,
            notes         TEXT,
            status        TEXT DEFAULT 'pending',
            created_at    TEXT DEFAULT (datetime('now'))
        );

        INSERT OR IGNORE INTO clients (id, name, persona_name, system_prompt, departments)
        VALUES (
            'default',
            'EasyCom World',
            'ELION',
            '',
            '[{"id":"info","label":"Informations produits"},{"id":"reservations","label":"Réservations"},{"id":"messages","label":"Messages"}]'
        );
        """)


# ── Clients ──────────────────────────────────────────────────────────────────

def get_client(client_id: str) -> dict | None:
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM clients WHERE id = ?", (client_id,)
        ).fetchone()
        return dict(row) if row else None


def list_clients() -> list[dict]:
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM clients ORDER BY created_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]


def upsert_client(data: dict) -> dict:
    cid = data.get("id") or str(uuid.uuid4())[:8]
    with get_db() as conn:
        conn.execute("""
            INSERT INTO clients (id, name, phone, persona_name, system_prompt, departments, transfer_numbers)
            VALUES (:id, :name, :phone, :persona_name, :system_prompt, :departments, :transfer_numbers)
            ON CONFLICT(id) DO UPDATE SET
                name=excluded.name,
                phone=excluded.phone,
                persona_name=excluded.persona_name,
                system_prompt=excluded.system_prompt,
                departments=excluded.departments,
                transfer_numbers=excluded.transfer_numbers
        """, {
            "id": cid,
            "name": data.get("name", "Client"),
            "phone": data.get("phone", ""),
            "persona_name": data.get("persona_name", "ELION"),
            "system_prompt": data.get("system_prompt", ""),
            "departments": json.dumps(data.get("departments", [])),
            "transfer_numbers": json.dumps(data.get("transfer_numbers", {})),
        })
    return get_client(cid)


# ── Calls ─────────────────────────────────────────────────────────────────────

def create_call(client_id: str, stream_sid: str, from_number: str) -> str:
    call_id = str(uuid.uuid4())
    with get_db() as conn:
        conn.execute("""
            INSERT INTO calls (id, client_id, stream_sid, from_number)
            VALUES (?, ?, ?, ?)
        """, (call_id, client_id, stream_sid, from_number))
    return call_id


def end_call(stream_sid: str, duration: int):
    with get_db() as conn:
        conn.execute("""
            UPDATE calls SET status='ended', ended_at=datetime('now'), duration=?
            WHERE stream_sid=?
        """, (duration, stream_sid))


def append_transcript(call_id: str, role: str, text: str):
    with get_db() as conn:
        row = conn.execute(
            "SELECT transcript FROM calls WHERE id=?", (call_id,)
        ).fetchone()
        if not row:
            return
        transcript = json.loads(row["transcript"])
        transcript.append({
            "role": role,
            "text": text,
            "ts": datetime.utcnow().isoformat()
        })
        conn.execute(
            "UPDATE calls SET transcript=? WHERE id=?",
            (json.dumps(transcript), call_id)
        )


def update_call_intent(call_id: str, intent: str):
    with get_db() as conn:
        conn.execute(
            "UPDATE calls SET intent=? WHERE id=?", (intent, call_id)
        )


def list_calls(client_id: str, limit: int = 50) -> list[dict]:
    with get_db() as conn:
        rows = conn.execute("""
            SELECT * FROM calls WHERE client_id=?
            ORDER BY started_at DESC LIMIT ?
        """, (client_id, limit)).fetchall()
        return [dict(r) for r in rows]


def get_call_by_sid(stream_sid: str) -> dict | None:
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM calls WHERE stream_sid=?", (stream_sid,)
        ).fetchone()
        return dict(row) if row else None


# ── Messages ──────────────────────────────────────────────────────────────────

def save_message(client_id: str, call_id: str | None,
                 caller_name: str, phone: str, content: str) -> int:
    with get_db() as conn:
        cur = conn.execute("""
            INSERT INTO messages (client_id, call_id, caller_name, phone, content)
            VALUES (?, ?, ?, ?, ?)
        """, (client_id, call_id, caller_name, phone, content))
        return cur.lastrowid


def list_messages(client_id: str, unread_only: bool = False) -> list[dict]:
    with get_db() as conn:
        q = "SELECT * FROM messages WHERE client_id=?"
        params = [client_id]
        if unread_only:
            q += " AND is_read=0"
        q += " ORDER BY created_at DESC"
        return [dict(r) for r in conn.execute(q, params).fetchall()]


def mark_message_read(msg_id: int):
    with get_db() as conn:
        conn.execute("UPDATE messages SET is_read=1 WHERE id=?", (msg_id,))


# ── Reservations ──────────────────────────────────────────────────────────────

def save_reservation(client_id: str, call_id: str | None, data: dict) -> int:
    with get_db() as conn:
        cur = conn.execute("""
            INSERT INTO reservations
                (client_id, call_id, caller_name, phone, date, time, service, party_size, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            client_id,
            call_id,
            data.get("caller_name", ""),
            data.get("phone", ""),
            data.get("date", ""),
            data.get("time", ""),
            data.get("service", ""),
            data.get("party_size"),
            data.get("notes", ""),
        ))
        return cur.lastrowid


def list_reservations(client_id: str, status: str | None = None) -> list[dict]:
    with get_db() as conn:
        q = "SELECT * FROM reservations WHERE client_id=?"
        params = [client_id]
        if status:
            q += " AND status=?"
            params.append(status)
        q += " ORDER BY created_at DESC"
        return [dict(r) for r in conn.execute(q, params).fetchall()]


def update_reservation_status(res_id: int, status: str):
    with get_db() as conn:
        conn.execute(
            "UPDATE reservations SET status=? WHERE id=?", (status, res_id)
        )


# ── Stats ─────────────────────────────────────────────────────────────────────

def get_stats(client_id: str) -> dict:
    with get_db() as conn:
        calls_today = conn.execute("""
            SELECT COUNT(*) FROM calls
            WHERE client_id=? AND date(started_at)=date('now')
        """, (client_id,)).fetchone()[0]

        unread_msgs = conn.execute("""
            SELECT COUNT(*) FROM messages
            WHERE client_id=? AND is_read=0
        """, (client_id,)).fetchone()[0]

        pending_res = conn.execute("""
            SELECT COUNT(*) FROM reservations
            WHERE client_id=? AND status='pending'
        """, (client_id,)).fetchone()[0]

        total_calls = conn.execute(
            "SELECT COUNT(*) FROM calls WHERE client_id=?", (client_id,)
        ).fetchone()[0]

    return {
        "calls_today": calls_today,
        "unread_messages": unread_msgs,
        "pending_reservations": pending_res,
        "total_calls": total_calls,
    }
