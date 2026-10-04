"""Route les messages texte vers les handlers de commandes."""

from handlers import economy, levels, ai, premium, help as help_mod


async def dispatch(wa, sender: str, text: str, name: str | None = None) -> str | None:
    """
    Retourne la réponse texte, ou None si rien à répondre.
    Commandes préfixées par / ou !
    """
    text = (text or "").strip()
    if not text:
        return None

    # XP sur tout message (y compris non-commande)
    await levels.on_message(sender, name)

    raw = text
    if text.startswith(("/", "!")):
        text = text[1:].strip()
    else:
        # Message libre → IA si activée via mention, sinon ignore
        return None

    if not text:
        return None

    parts = text.split()
    cmd = parts[0].lower()
    args = parts[1:]

    # ── Help / util ──────────────────────────────────────────
    if cmd in ("help", "aide", "menu", "start"):
        return help_mod.cmd_help()
    if cmd == "ping":
        return help_mod.cmd_ping()

    # ── Economy ──────────────────────────────────────────────
    if cmd in ("balance", "bal", "solde"):
        return economy.cmd_balance(sender)
    if cmd == "daily":
        return economy.cmd_daily(sender)
    if cmd == "work":
        return economy.cmd_work(sender)
    if cmd == "pay":
        return economy.cmd_pay(sender, args)
    if cmd in ("deposit", "dep"):
        return economy.cmd_deposit(sender, args)
    if cmd in ("withdraw", "with"):
        return economy.cmd_withdraw(sender, args)
    if cmd in ("leaderboard", "lb", "top"):
        return economy.cmd_leaderboard()
    if cmd in ("coinflip", "cf"):
        return economy.cmd_coinflip(sender, args)
    if cmd == "slots":
        return economy.cmd_slots(sender, args)
    if cmd == "dice":
        return economy.cmd_dice(sender, args)
    if cmd == "roulette":
        return economy.cmd_roulette(sender, args)

    # ── Levels ───────────────────────────────────────────────
    if cmd in ("level", "lvl", "rank", "xp"):
        return levels.cmd_level(sender)
    if cmd in ("xpleaderboard", "xptop"):
        return levels.cmd_leaderboard()

    # ── Premium ──────────────────────────────────────────────
    if cmd == "premium":
        return premium.cmd_premium(sender)
    if cmd in ("premium-buy", "premiumbuy", "buypremium"):
        return premium.cmd_buy(sender, args)

    # ── AI ───────────────────────────────────────────────────
    if cmd in ("ai", "ask", "chat"):
        return await ai.cmd_ai(sender, args, raw)

    return (
        f"❓ Commande inconnue : `/{cmd}`\n"
        "Tape `/help` pour la liste."
    )
