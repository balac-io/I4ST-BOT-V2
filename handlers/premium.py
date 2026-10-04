"""Premium WhatsApp."""

from datetime import datetime
from utils import db, messages as M

BENEFITS = [
    "💰 Daily x2",
    "⏱️ Work cooldown -50%",
    "🎰 Mises plus élevées",
    "🌟 XP +20%",
]

PACKS = {
    "7": {"days": 7, "price": 2500},
    "30": {"days": 30, "price": 8000},
    "90": {"days": 90, "price": 20000},
}


def cmd_premium(uid: str) -> str:
    u = db.get_user(uid)
    is_prem = db.is_premium(uid)
    if is_prem:
        until = u.get("premium_until")
        if until:
            try:
                exp = datetime.fromisoformat(until)
                rem = exp - datetime.utcnow()
                status = f"✅ Actif — *{max(0, rem.days)}j* restants"
            except Exception:
                status = "✅ Actif"
        else:
            status = "✅ Actif *à vie* ∞"
    else:
        status = "❌ Non actif"

    packs = "\n".join(
        f"• `{k}` jours — *{v['price']:,}* 🪙" for k, v in PACKS.items()
    )
    return (
        f"⭐ *BOOYAH Premium*\n\n"
        f"Statut : {status}\n\n"
        f"*Avantages*\n" + "\n".join(f"• {b}" for b in BENEFITS) + "\n\n"
        f"*Packs* (`/premium-buy <jours>`)\n{packs}"
    )


def cmd_buy(uid: str, args: list) -> str:
    if not args or args[0] not in PACKS:
        return M.err("Usage : `/premium-buy 7|30|90`")
    pack = PACKS[args[0]]
    u = db.get_user(uid)
    if u.get("premium") and not u.get("premium_until"):
        return M.info("Tu as déjà le Premium à vie.")
    if u["coins"] < pack["price"]:
        return M.err(f"Pas assez de coins (*{u['coins']:,}* / {pack['price']:,}).")
    u["coins"] -= pack["price"]
    db.save_user(uid, u)
    new_exp = db.renew_premium(uid, pack["days"])
    exp_txt = new_exp.strftime("%d/%m/%Y") if new_exp else "à vie"
    return M.ok(
        f"Premium *+{pack['days']}j* !\n"
        f"Coût : *{pack['price']:,}* 🪙\n"
        f"Expire : *{exp_txt}*\n"
        f"Solde : *{u['coins']:,}*"
    )
