"""
BOOYAH WhatsApp Database — SQLite
user_id = numéro WhatsApp (ex: 33612345678)
"""

import json
import os
import sqlite3
from datetime import datetime, timedelta
from contextlib import contextmanager

DB_PATH = "data/booyah.db"


def _get_conn() -> sqlite3.Connection:
    os.makedirs("data", exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


@contextmanager
def _db():
    conn = _get_conn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _init_tables(conn: sqlite3.Connection):
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        user_id          TEXT PRIMARY KEY,
        name             TEXT,
        bio              TEXT,
        coins            INTEGER DEFAULT 0,
        bank             INTEGER DEFAULT 0,
        xp               INTEGER DEFAULT 0,
        level            INTEGER DEFAULT 1,
        inventory        TEXT DEFAULT '[]',
        last_daily       TEXT,
        last_work        TEXT,
        total_msgs       INTEGER DEFAULT 0,
        premium          INTEGER DEFAULT 0,
        premium_until    TEXT,
        premium_reminded TEXT,
        daily_streak     INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp DESC);
    """)
    for sql in [
        "ALTER TABLE users ADD COLUMN name TEXT",
        "ALTER TABLE users ADD COLUMN premium INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN premium_until TEXT",
        "ALTER TABLE users ADD COLUMN premium_reminded TEXT",
        "ALTER TABLE users ADD COLUMN daily_streak INTEGER DEFAULT 0",
    ]:
        try:
            conn.execute(sql)
        except sqlite3.OperationalError:
            pass


def _boot():
    with _db() as conn:
        _init_tables(conn)


_boot()


def _row_to_user(row: sqlite3.Row) -> dict:
    if row is None:
        return None
    keys = row.keys()
    return {
        "name": row["name"] if "name" in keys else None,
        "bio": row["bio"],
        "coins": row["coins"] or 0,
        "bank": row["bank"] or 0,
        "xp": row["xp"] or 0,
        "level": row["level"] or 1,
        "inventory": json.loads(row["inventory"] or "[]"),
        "last_daily": row["last_daily"],
        "last_work": row["last_work"],
        "total_msgs": row["total_msgs"] or 0,
        "premium": bool(row["premium"]) if "premium" in keys else False,
        "premium_until": row["premium_until"] if "premium_until" in keys else None,
        "premium_reminded": row["premium_reminded"] if "premium_reminded" in keys else None,
        "daily_streak": (row["daily_streak"] or 0) if "daily_streak" in keys else 0,
    }


def get_user(user_id: str) -> dict:
    uid = str(user_id).lstrip("+")
    with _db() as conn:
        row = conn.execute("SELECT * FROM users WHERE user_id = ?", (uid,)).fetchone()
        if row:
            return _row_to_user(row)
        default = {
            "name": None, "bio": None, "coins": 0, "bank": 0, "xp": 0, "level": 1,
            "inventory": [], "last_daily": None, "last_work": None, "total_msgs": 0,
            "premium": False, "premium_until": None, "premium_reminded": None, "daily_streak": 0,
        }
        conn.execute(
            "INSERT INTO users (user_id, coins, bank, xp, level, inventory, total_msgs, premium, daily_streak) "
            "VALUES (?, 0, 0, 0, 1, '[]', 0, 0, 0)",
            (uid,),
        )
        return default


def save_user(user_id: str, data: dict):
    uid = str(user_id).lstrip("+")
    with _db() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO users
            (user_id, name, bio, coins, bank, xp, level, inventory, last_daily, last_work,
             total_msgs, premium, premium_until, premium_reminded, daily_streak)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                uid, data.get("name"), data.get("bio"),
                data.get("coins", 0), data.get("bank", 0),
                data.get("xp", 0), data.get("level", 1),
                json.dumps(data.get("inventory", [])),
                data.get("last_daily"), data.get("last_work"),
                data.get("total_msgs", 0),
                1 if data.get("premium") else 0,
                data.get("premium_until"), data.get("premium_reminded"),
                data.get("daily_streak", 0),
            ),
        )


def is_premium(user_id: str) -> bool:
    u = get_user(user_id)
    if not u.get("premium"):
        return False
    until = u.get("premium_until")
    if not until:
        return True
    try:
        exp = datetime.fromisoformat(until)
        if datetime.utcnow() > exp:
            u["premium"] = False
            u["premium_until"] = None
            save_user(user_id, u)
            return False
        return True
    except Exception:
        return bool(u.get("premium"))


def set_premium(user_id: str, days: int | None = None):
    u = get_user(user_id)
    u["premium"] = True
    u["premium_reminded"] = None
    u["premium_until"] = None if days is None else (datetime.utcnow() + timedelta(days=days)).isoformat()
    save_user(user_id, u)


def renew_premium(user_id: str, days: int):
    u = get_user(user_id)
    now = datetime.utcnow()
    if u.get("premium") and not u.get("premium_until"):
        return None
    base = now
    if u.get("premium") and u.get("premium_until"):
        try:
            current = datetime.fromisoformat(u["premium_until"])
            if current > now:
                base = current
        except Exception:
            pass
    new_exp = base + timedelta(days=days)
    u["premium"] = True
    u["premium_until"] = new_exp.isoformat()
    u["premium_reminded"] = None
    save_user(user_id, u)
    return new_exp


def remove_premium(user_id: str):
    u = get_user(user_id)
    u["premium"] = False
    u["premium_until"] = None
    u["premium_reminded"] = None
    save_user(user_id, u)


def get_leaderboard_economy(limit: int = 10) -> list:
    with _db() as conn:
        rows = conn.execute(
            "SELECT * FROM users ORDER BY (coins + bank) DESC LIMIT ?", (limit,)
        ).fetchall()
        return [(r["user_id"], _row_to_user(r)) for r in rows]


def get_leaderboard_xp(limit: int = 10) -> list:
    with _db() as conn:
        rows = conn.execute(
            "SELECT * FROM users ORDER BY xp DESC LIMIT ?", (limit,)
        ).fetchall()
        return [(r["user_id"], _row_to_user(r)) for r in rows]
