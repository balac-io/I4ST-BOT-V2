from utils import messages as M


def cmd_help() -> str:
    return M.title(
        "📖 BOOYAH — Aide",
        "*Économie*\n"
        "`/balance` — solde\n"
        "`/daily` — récompense quotidienne + streak\n"
        "`/work` — travailler\n"
        "`/pay <numéro> <montant>` — envoyer des coins\n"
        "`/deposit [montant|all]` — banque\n"
        "`/withdraw [montant|all]` — retirer\n"
        "`/leaderboard` — top riches\n"
        "`/coinflip <mise> pile|face`\n"
        "`/slots <mise>`\n"
        "`/dice <mise>`\n"
        "`/roulette <mise> rouge|noir|0-36`\n\n"
        "*Niveaux*\n"
        "`/level` — ton niveau XP\n"
        "`/xptop` — classement XP\n\n"
        "*Premium*\n"
        "`/premium` — statut + avantages\n"
        "`/premium-buy <7|30|90>` — acheter avec coins\n\n"
        "*IA*\n"
        "`/ai <question>` — parler à BOOYAH\n\n"
        "*Util*\n"
        "`/ping` `/help`",
    )


def cmd_ping() -> str:
    return "🏓 *Pong!* BOOYAH est en ligne."
