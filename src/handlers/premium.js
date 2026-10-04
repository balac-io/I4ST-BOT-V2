import * as db from "../db.js"

const PACKS = {
  "7": { days: 7, price: 2500 },
  "30": { days: 30, price: 8000 },
  "90": { days: 90, price: 20000 },
}

export function cmdPremium(uid) {
  const u = db.getUser(uid)
  let status = "❌ Non actif"
  if (db.isPremium(uid)) {
    if (!u.premium_until) status = "✅ Actif *à vie* ∞"
    else {
      const days = Math.max(0, Math.ceil((new Date(u.premium_until) - new Date()) / 86400000))
      status = `✅ Actif — *${days}j* restants`
    }
  }
  const packs = Object.entries(PACKS)
    .map(([k, v]) => `• \`${k}\` j — *${v.price.toLocaleString()}* 🪙`)
    .join("\n")
  return (
    `⭐ *BOOYAH Premium*\n\nStatut : ${status}\n\n` +
    `*Avantages*\n• Daily x2\n• Work -50% CD\n• Mises + élevées\n• XP +20%\n\n` +
    `*Packs* (/premium-buy)\n${packs}`
  )
}

export function cmdBuy(uid, args) {
  if (!args[0] || !PACKS[args[0]]) return "❌ `/premium-buy 7|30|90`"
  const pack = PACKS[args[0]]
  const u = db.getUser(uid)
  if (u.premium && !u.premium_until) return "ℹ️ Déjà Premium à vie."
  if (u.coins < pack.price) return `❌ Pas assez (*${u.coins}* / ${pack.price})`
  u.coins -= pack.price
  db.saveUser(uid, u)
  const exp = db.renewPremium(uid, pack.days)
  const expTxt = exp ? exp.toLocaleDateString("fr-FR") : "à vie"
  return `✅ Premium *+${pack.days}j*\nCoût *${pack.price}*\nExpire *${expTxt}*\nSolde *${u.coins}*`
}
