import * as economy from "./handlers/economy.js"
import * as levels from "./handlers/levels.js"
import * as premium from "./handlers/premium.js"
import * as ai from "./handlers/ai.js"
import * as help from "./handlers/help.js"

/**
 * - Commandes /xxx → handlers
 * - Sinon → IA répond à TOUT message
 */
export async function dispatch(userId, text, name, jid) {
  text = (text || "").trim()
  if (!text) return null

  // XP sur chaque message
  levels.onMessage(userId, name)

  // Commandes
  if (text.startsWith("/") || text.startsWith("!")) {
    const body = text.slice(1).trim()
    if (!body) return null

    const parts = body.split(/\s+/)
    const cmd = parts[0].toLowerCase()
    const args = parts.slice(1)

    switch (cmd) {
      case "help":
      case "aide":
      case "menu":
      case "start":
        return help.cmdHelp()
      case "ping":
        return help.cmdPing()

      case "balance":
      case "bal":
      case "solde":
        return economy.cmdBalance(userId)
      case "daily":
        return economy.cmdDaily(userId)
      case "work":
        return economy.cmdWork(userId)
      case "pay":
        return economy.cmdPay(userId, args)
      case "deposit":
      case "dep":
        return economy.cmdDeposit(userId, args)
      case "withdraw":
      case "with":
        return economy.cmdWithdraw(userId, args)
      case "leaderboard":
      case "lb":
      case "top":
        return economy.cmdLeaderboard()
      case "coinflip":
      case "cf":
        return economy.cmdCoinflip(userId, args)
      case "slots":
        return economy.cmdSlots(userId, args)
      case "dice":
        return economy.cmdDice(userId, args)
      case "roulette":
        return economy.cmdRoulette(userId, args)

      case "level":
      case "lvl":
      case "rank":
      case "xp":
        return levels.cmdLevel(userId)
      case "xptop":
      case "xpleaderboard":
        return levels.cmdLeaderboard()

      case "premium":
        return premium.cmdPremium(userId)
      case "premium-buy":
      case "premiumbuy":
      case "buypremium":
        return premium.cmdBuy(userId, args)

      case "ai":
      case "ask":
      case "chat":
        return await ai.cmdAi(userId, args, name)

      case "reset":
      case "clear":
        ai.clearHistory(userId)
        return "🔄 Mémoire conversation effacée."

      default:
        // Commande inconnue → l'IA peut quand même répondre
        return await ai.chat(userId, text, name)
    }
  }

  // Pas de / → IA répond à tout message
  return await ai.chat(userId, text, name)
}
