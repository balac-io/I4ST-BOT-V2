"""Économie WhatsApp — port de cogs/economy.py Discord."""

from datetime import date, datetime, timedelta
import random
from utils import db, messages as M

DAILY_AMOUNT = 200
DAILY_PREMIUM_MULT = 2
STREAK_BONUS_PER_DAY = 25
STREAK_CAP = 14
WORK_MIN, WORK_MAX = 50, 300
WORK_COOLDOWN = 3600
WORK_COOLDOWN_PREMIUM = 1800

WORK_MESSAGES = [
    "Tu as livré des pizzas 🍕",
    "Tu as codé toute la nuit 💻",
    "Tu as vendu des NFTs 🐦",
    "Tu as streamé 12h 🎮",
    "Tu as joué de la guitare dans le métro 🎸",
]

SLOTS_EMOJIS = ["🍎", "🍌", "🍊", "🍇", "⭐", "💎", "🍒"]
SLOTS_MULT = {
    ("💎", "💎", "💎"): 15,
    ("⭐", "⭐", "⭐"): 10,
}
ROULETTE_RED = {1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36}
ROULETTE_BLACK = {2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35}


def cmd_balance(uid: str) -> str:
    u = db.get_user(uid)
    prem = " ⭐" if db.is_premium(uid) else ""
    streak = u.get("daily_streak", 0)
    lines = [
        f"💰 *Solde*{prem}",
        f"👛 Portefeuille : *{u['coins']:,}* 🪙",
        f"🏦 Banque : *{u['bank']:,}* 🪙",
        f"💎 Total : *{u['coins'] + u['bank']:,}* 🪙",
    ]
    if streak:
        lines.append(f"🔥 Streak daily : *{streak}* jour(s)")
    return "\n".join(lines)


def cmd_daily(uid: str) -> str:
    u = db.get_user(uid)
    today = date.today()
    today_str = str(today)

    if u.get("last_daily") == today_str:
        return M.err(f"Déjà réclamé aujourd'hui. Streak : *{u.get('daily_streak', 0)}* 🔥")

    streak = u.get("daily_streak", 0) or 0
    last = u.get("last_daily")
    if last:
        try:
            last_date = date.fromisoformat(last)
            streak = streak + 1 if last_date == today - timedelta(days=1) else 1
        except Exception:
            streak = 1
    else:
        streak = 1

    streak_bonus = min(streak, STREAK_CAP) * STREAK_BONUS_PER_DAY
    amount = DAILY_AMOUNT + streak_bonus
    if db.is_premium(uid):
        amount *= DAILY_PREMIUM_MULT

    u["coins"] += amount
    u["last_daily"] = today_str
    u["daily_streak"] = streak
    db.save_user(uid, u)

    prem = " (⭐ Premium x2)" if db.is_premium(uid) else ""
    return M.ok(
        f"Daily : *+{amount:,}* 🪙{prem}\n"
        f"🔥 Streak : *{streak}* (+{streak_bonus} bonus)\n"
        f"Solde : *{u['coins']:,}*"
    )


def cmd_work(uid: str) -> str:
    u = db.get_user(uid)
    now = datetime.now()
    last = u.get("last_work")
    prem = db.is_premium(uid)
    cd = WORK_COOLDOWN_PREMIUM if prem else WORK_COOLDOWN

    if last:
        try:
            elapsed = (now - datetime.fromisoformat(last)).total_seconds()
            if elapsed < cd:
                rem = int(cd - elapsed)
                m, s = divmod(rem, 60)
                return M.err(f"Repose-toi encore *{m}min {s}s*.")
        except Exception:
            pass

    earned = random.randint(WORK_MIN, WORK_MAX)
    if prem:
        earned = int(earned * 1.25)
    job = random.choice(WORK_MESSAGES)
    u["coins"] += earned
    u["last_work"] = now.isoformat()
    db.save_user(uid, u)
    star = " ⭐" if prem else ""
    return M.ok(f"{job}\n*+{earned}* 🪙{star}\nSolde : *{u['coins']:,}*")


def cmd_pay(uid: str, args: list) -> str:
    if len(args) < 2:
        return M.err("Usage : `/pay <numéro> <montant>`")
    try:
        amount = int(args[1])
    except ValueError:
        return M.err("Montant invalide.")
    if amount <= 0:
        return M.err("Montant invalide.")
    target = args[0].lstrip("+")
    if target == str(uid).lstrip("+"):
        return M.err("Tu ne peux pas te payer toi-même.")
    src = db.get_user(uid)
    if src["coins"] < amount:
        return M.err(f"Solde insuffisant (*{src['coins']:,}*).")
    src["coins"] -= amount
    dst = db.get_user(target)
    dst["coins"] += amount
    db.save_user(uid, src)
    db.save_user(target, dst)
    return M.ok(f"Envoyé *{amount:,}* 🪙 à `{target}`.\nSolde : *{src['coins']:,}*")


def cmd_deposit(uid: str, args: list) -> str:
    u = db.get_user(uid)
    raw = args[0] if args else "all"
    n = u["coins"] if raw.lower() == "all" else int(raw)
    if n <= 0 or n > u["coins"]:
        return M.err(f"Montant invalide. Solde : *{u['coins']:,}*")
    u["coins"] -= n
    u["bank"] += n
    db.save_user(uid, u)
    return M.ok(f"*+{n:,}* déposés 🏦\nBanque : *{u['bank']:,}*")


def cmd_withdraw(uid: str, args: list) -> str:
    u = db.get_user(uid)
    raw = args[0] if args else "all"
    n = u["bank"] if raw.lower() == "all" else int(raw)
    if n <= 0 or n > u["bank"]:
        return M.err(f"Montant invalide. Banque : *{u['bank']:,}*")
    u["bank"] -= n
    u["coins"] += n
    db.save_user(uid, u)
    return M.ok(f"*{n:,}* retirés 👛\nPortefeuille : *{u['coins']:,}*")


def cmd_leaderboard() -> str:
    top = db.get_leaderboard_economy()
    if not top:
        return M.info("Aucune donnée.")
    medals = ["🥇", "🥈", "🥉"]
    lines = ["🏆 *Classement — Économie*"]
    for i, (uid, data) in enumerate(top):
        medal = medals[i] if i < 3 else f"`{i+1}.`"
        total = data.get("coins", 0) + data.get("bank", 0)
        name = data.get("name") or uid[-4:]
        star = " ⭐" if data.get("premium") else ""
        lines.append(f"{medal} *{name}*{star} — {total:,} 🪙")
    return "\n".join(lines)


def cmd_coinflip(uid: str, args: list) -> str:
    if len(args) < 2:
        return M.err("Usage : `/coinflip <mise> pile|face`")
    try:
        amount = int(args[0])
    except ValueError:
        return M.err("Mise invalide.")
    choice = args[1].lower()
    if choice not in ("pile", "face"):
        return M.err("Choix : `pile` ou `face`.")
    max_bet = 25000 if db.is_premium(uid) else 10000
    if amount < 10 or amount > max_bet:
        return M.err(f"Mise entre 10 et {max_bet}.")
    u = db.get_user(uid)
    if u["coins"] < amount:
        return M.err(f"Solde : *{u['coins']:,}*")
    result = random.choice(["pile", "face"])
    if result == choice:
        u["coins"] += amount
        db.save_user(uid, u)
        return M.ok(f"🪙 *{result.upper()}* ! +*{amount:,}*\nSolde : *{u['coins']:,}*")
    u["coins"] -= amount
    db.save_user(uid, u)
    return M.err(f"🪙 *{result.upper()}*... -*{amount:,}*\nSolde : *{u['coins']:,}*")


def cmd_slots(uid: str, args: list) -> str:
    if not args:
        return M.err("Usage : `/slots <mise>`")
    try:
        amount = int(args[0])
    except ValueError:
        return M.err("Mise invalide.")
    max_bet = 15000 if db.is_premium(uid) else 5000
    if amount < 20 or amount > max_bet:
        return M.err(f"Mise entre 20 et {max_bet}.")
    u = db.get_user(uid)
    if u["coins"] < amount:
        return M.err(f"Solde : *{u['coins']:,}*")
    reels = [random.choice(SLOTS_EMOJIS) for _ in range(3)]
    display = " | ".join(reels)
    mult = SLOTS_MULT.get(tuple(reels), 0)
    if mult == 0 and (reels[0] == reels[1] or reels[1] == reels[2] or reels[0] == reels[2]):
        mult = 2
    if mult > 0:
        win = amount * mult
        u["coins"] += win
        db.save_user(uid, u)
        return M.ok(f"🎰 `{display}`\nx*{mult}* → +*{win:,}*\nSolde : *{u['coins']:,}*")
    u["coins"] -= amount
    db.save_user(uid, u)
    return M.err(f"🎰 `{display}`\nRien... -*{amount:,}*\nSolde : *{u['coins']:,}*")


def cmd_dice(uid: str, args: list) -> str:
    if not args:
        return M.err("Usage : `/dice <mise>`")
    try:
        amount = int(args[0])
    except ValueError:
        return M.err("Mise invalide.")
    max_bet = 15000 if db.is_premium(uid) else 5000
    if amount < 10 or amount > max_bet:
        return M.err(f"Mise entre 10 et {max_bet}.")
    u = db.get_user(uid)
    if u["coins"] < amount:
        return M.err(f"Solde : *{u['coins']:,}*")
    p = random.randint(1, 6) + random.randint(1, 6)
    b = random.randint(1, 6) + random.randint(1, 6)
    if p > b:
        u["coins"] += amount
        db.save_user(uid, u)
        return M.ok(f"🎲 Toi *{p}* vs BOOYAH *{b}*\n+*{amount:,}* → *{u['coins']:,}*")
    if p < b:
        u["coins"] -= amount
        db.save_user(uid, u)
        return M.err(f"🎲 Toi *{p}* vs BOOYAH *{b}*\n-*{amount:,}* → *{u['coins']:,}*")
    return M.info(f"🎲 Toi *{p}* vs BOOYAH *{b}*\nÉgalité — mise rendue.")


def cmd_roulette(uid: str, args: list) -> str:
    if len(args) < 2:
        return M.err("Usage : `/roulette <mise> rouge|noir|0-36`")
    try:
        amount = int(args[0])
    except ValueError:
        return M.err("Mise invalide.")
    bet = args[1].lower()
    max_bet = 20000 if db.is_premium(uid) else 8000
    if amount < 20 or amount > max_bet:
        return M.err(f"Mise entre 20 et {max_bet}.")
    u = db.get_user(uid)
    if u["coins"] < amount:
        return M.err(f"Solde : *{u['coins']:,}*")

    if bet in ("rouge", "red", "r"):
        bet_type, bet_val = "color", "red"
    elif bet in ("noir", "black", "n"):
        bet_type, bet_val = "color", "black"
    elif bet.isdigit() and 0 <= int(bet) <= 36:
        bet_type, bet_val = "number", int(bet)
    else:
        return M.err("Mise : `rouge`, `noir` ou `0-36`.")

    result = random.randint(0, 36)
    if result == 0:
        color, emoji = "vert", "🟢"
    elif result in ROULETTE_RED:
        color, emoji = "rouge", "🔴"
    else:
        color, emoji = "noir", "⚫"

    won, payout = False, 0
    if bet_type == "color":
        if bet_val == "red" and result in ROULETTE_RED:
            won, payout = True, amount * 2
        elif bet_val == "black" and result in ROULETTE_BLACK:
            won, payout = True, amount * 2
    elif result == bet_val:
        won, payout = True, amount * 36

    if won:
        gain = payout - amount
        u["coins"] += gain
        db.save_user(uid, u)
        return M.ok(f"🎰 {emoji} *{result}* ({color})\n+*{gain:,}* → *{u['coins']:,}*")
    u["coins"] -= amount
    db.save_user(uid, u)
    return M.err(f"🎰 {emoji} *{result}* ({color})\n-*{amount:,}* → *{u['coins']:,}*")
