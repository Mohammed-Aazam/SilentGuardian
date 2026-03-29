# storage.py — PostgreSQL-backed storage for SilentGuardian
# Requires: pip install psycopg2-binary
# Set DATABASE_URL in your environment (Render provides this automatically)

import os
import json
import psycopg2
import psycopg2.extras
from datetime import datetime


def get_conn():
    url = os.environ["DATABASE_URL"]
    # Render gives postgres:// but psycopg2 needs postgresql://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return psycopg2.connect(url, cursor_factory=psycopg2.extras.RealDictCursor)


def init_db():
    """Create all tables if they don't exist. Call once on app startup."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id            SERIAL PRIMARY KEY,
                    name          TEXT NOT NULL,
                    email         TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at    TIMESTAMPTZ DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS clarity_baselines (
                    user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    data       JSONB NOT NULL,
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS clarity_entries (
                    id         SERIAL PRIMARY KEY,
                    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    entry_id   TEXT NOT NULL,
                    date       TIMESTAMPTZ NOT NULL,
                    data       JSONB NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(user_id, entry_id)
                );

                CREATE TABLE IF NOT EXISTS focus_baselines (
                    user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    data       JSONB NOT NULL,
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS focus_entries (
                    id         SERIAL PRIMARY KEY,
                    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    entry_id   TEXT NOT NULL,
                    date       TIMESTAMPTZ NOT NULL,
                    data       JSONB NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(user_id, entry_id)
                );
            """)
        conn.commit()


# ── User management ───────────────────────────────────────────────────────────

class DB:
    """Thin wrapper passed into auth routes so they can call db.get_user_by_email etc."""

    def get_user_by_email(self, email: str) -> dict | None:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM users WHERE email = %s", (email,))
                row = cur.fetchone()
                return dict(row) if row else None

    def create_user(self, name: str, email: str, password_hash: str) -> int:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s) RETURNING id",
                    (name, email, password_hash)
                )
                user_id = cur.fetchone()["id"]
            conn.commit()
        return user_id


# ── Clarity (memory tracker) ──────────────────────────────────────────────────

def load_baseline(user_id: str) -> dict | None:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT data FROM clarity_baselines WHERE user_id = %s", (int(user_id),))
            row = cur.fetchone()
            return dict(row["data"]) if row else None


def save_baseline(user_id: str, baseline: dict):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO clarity_baselines (user_id, data, updated_at)
                VALUES (%s, %s, NOW())
                ON CONFLICT (user_id)
                DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
            """, (int(user_id), json.dumps(baseline)))
        conn.commit()


def load_history(user_id: str) -> list:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT data FROM clarity_entries
                WHERE user_id = %s
                ORDER BY date ASC
            """, (int(user_id),))
            return [dict(row["data"]) for row in cur.fetchall()]


def save_entry(user_id: str, entry: dict):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO clarity_entries (user_id, entry_id, date, data)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (user_id, entry_id) DO UPDATE SET data = EXCLUDED.data
            """, (int(user_id), entry["id"], entry["date"], json.dumps(entry)))
        conn.commit()


def reset_clarity(user_id: str):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM clarity_entries WHERE user_id = %s", (int(user_id),))
            cur.execute("DELETE FROM clarity_baselines WHERE user_id = %s", (int(user_id),))
        conn.commit()


# ── Focus tracker ─────────────────────────────────────────────────────────────

def load_focus_baseline(user_id: str) -> dict | None:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT data FROM focus_baselines WHERE user_id = %s", (int(user_id),))
            row = cur.fetchone()
            return dict(row["data"]) if row else None


def save_focus_baseline(user_id: str, baseline: dict):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO focus_baselines (user_id, data, updated_at)
                VALUES (%s, %s, NOW())
                ON CONFLICT (user_id)
                DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
            """, (int(user_id), json.dumps(baseline)))
        conn.commit()


def load_focus_history(user_id: str) -> list:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT data FROM focus_entries
                WHERE user_id = %s
                ORDER BY date ASC
            """, (int(user_id),))
            return [dict(row["data"]) for row in cur.fetchall()]


def save_focus_entry(user_id: str, entry: dict):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO focus_entries (user_id, entry_id, date, data)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (user_id, entry_id) DO UPDATE SET data = EXCLUDED.data
            """, (int(user_id), entry["id"], entry["date"], json.dumps(entry)))
        conn.commit()


def reset_focus(user_id: str):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM focus_entries WHERE user_id = %s", (int(user_id),))
            cur.execute("DELETE FROM focus_baselines WHERE user_id = %s", (int(user_id),))
        conn.commit()


def reset_all(user_id: str):
    reset_clarity(user_id)
    reset_focus(user_id)
