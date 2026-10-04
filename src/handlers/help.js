export function cmdHelp() {
  return (
    `*📖 BOOYAH — Aide*\n\n` +
    `*Économie*\n` +
    `/balance — solde\n` +
    `/daily — récompense + streak\n` +
    `/work — travailler\n` +
    `/pay <num> <montant>\n` +
    `/deposit [montant|all]\n` +
    `/withdraw [montant|all]\n` +
    `/leaderboard\n` +
    `/coinflip <mise> pile|face\n` +
    `/slots <mise>\n` +
    `/dice <mise>\n` +
    `/roulette <mise> rouge|noir|0-36\n\n` +
    `*Niveaux*\n` +
    `/level — ton XP\n` +
    `/xptop — classement XP\n\n` +
    `*Premium*\n` +
    `/premium\n` +
    `/premium-buy 7|30|90\n\n` +
    `*IA*\n` +
    `/ai <question>\n\n` +
    `/ping`
  )
}

export function cmdPing() {
  return "🏓 *Pong!* BOOYAH est en ligne."
}
