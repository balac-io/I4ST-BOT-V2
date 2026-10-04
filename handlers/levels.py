"""Système de niveaux / XP."""

import random
from utils import db, messages as M

XP_MIN, XP_MAX = 10, 25
XP_PREMIUM_BONUS = 1.20


def xp_for_level(level: int) -> int:
    return 100 * level * level


async def on_message(uid: str, name: str | None = None):
    u = db.get_user(uid)
    if name and not u.get("name"):
        u["name"] = name
    u["total_msgs"] = (u.get("total_msgs") or 0) + 1
    gained = random.randint(XP_MIN, XP_MAX)
    if db.is_premium(uid):
        gained = int(gained * XP_PREMIUM_BONUS)
    u["xp"] = (u.get("xp") or 0) + gained
    # Level up
    while u["xp"] >= xp_for_level(u.get("level", 1)):
        u["level"] = u.get("level", 1) + 1
    db.save_user(uid, u)


def cmd_level(uid: str) -> str:
    u = db.get_user(uid)
    lvl = u.get("level", 1)
    xp = u.get("xp", 0)
    need = xp_for_level(lvl)
    prev = xp_for_level(lvl - 1) if lvl > 1 else 0
    progress = max(0, xp - prev)
    span = max(1, need - prev)
    pct = min(100, int(progress / span * 100))
    bar_len = 10
    filled = int(bar_len * pct / 100)
    bar = "█" * filled + "░" * (bar_len - filled)
    prem = " ⭐" if db.is_premium(uid) else ""
    return (
        f"⭐ *Niveau {lvl}*{prem}\n"
        f"XP : *{xp:,}* / {need:,}\n"
        f"`[{bar}]` {pct}%\n"
        f"Messages : *{u.get('total_msgs', 0):,}*"
    )


def cmd_leaderboard() -> str:
    top = db.get_leaderboard_xp()
    if not top:
        return M.info("Aucune donnée.")
    medals = ["🥇", "🥈", "🥉"]
    lines = ["🏆 *Classement — XP*"]
    for i, (uid, data) in enumerate(top):
        medal = medals[i] if i < 3 else f"`{i+1}.`"
        name = data.get("name") or uid[-4:]
        star = " ⭐" if data.get("premium") else ""
        lines.append(f"{medal} *{name}*{star} — Nv.{data.get('level', 1)} ({data.get('xp', 0):,} XP)")
    return "\n".join(lines)
