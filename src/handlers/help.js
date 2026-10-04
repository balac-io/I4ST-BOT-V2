export function cmdHelp() {
  return (
    `*📖 BOOYAH — Aide*\n\n` +
    `🤖 *IA* : écris n'importe quoi, je réponds.\n` +
    `Commandes optionnelles :\n\n` +
    `*Économie*\n` +
    `/balance /daily /work\n` +
    `/pay <num> <montant>\n` +
    `/deposit /withdraw /leaderboard\n` +
    `/coinflip <mise> pile|face\n` +
    `/slots <mise> /dice <mise>\n` +
    `/roulette <mise> rouge|noir|0-36\n\n` +
    `*Niveaux* /level /xptop\n\n` +
    `*Premium* /premium /premium-buy 7|30|90\n\n` +
    `/reset — efface la mémoire chat\n` +
    `/ping`
  )
}

export function cmdPing() {
  return "🏓 *Pong!* BOOYAH est en ligne."
}
