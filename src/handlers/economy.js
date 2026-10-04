import * as db from "../db.js"

const DAILY = 200
const STREAK_BONUS = 25
const STREAK_CAP = 14
const WORK_MIN = 50
const WORK_MAX = 300
const WORK_CD = 3600
const WORK_CD_PREM = 1800

const JOBS = [
  "Tu as livré des pizzas 🍕",
  "Tu as codé toute la nuit 💻",
  "Tu as streamé 12h 🎮",
  "Tu as joué de la guitare 🎸",
  "Tu as vendu des NFTs 🐦",
]

const SLOTS = ["🍎", "🍌", "🍊", "🍇", "⭐", "💎", "🍒"]
const SLOTS_MULT = { "💎💎💎": 15, "⭐⭐⭐": 10 }
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])
const BLACK = new Set([2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35])

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function cmdBalance(uid) {
  const u = db.getUser(uid)
  const star = db.isPremium(uid) ? " ⭐" : ""
  let t = `💰 *Solde*${star}\n👛 *${u.coins.toLocaleString()}* 🪙\n🏦 *${u.bank.toLocaleString()}* 🪙\n💎 Total *${(u.coins + u.bank).toLocaleString()}*`
  if (u.daily_streak) t += `\n🔥 Streak *${u.daily_streak}*j`
  return t
}

export function cmdDaily(uid) {
  const u = db.getUser(uid)
  const t = today()
  if (u.last_daily === t) return `❌ Déjà réclamé. Streak *${u.daily_streak}* 🔥`

  let streak = u.daily_streak || 0
  if (u.last_daily) {
    const last = new Date(u.last_daily)
    const diff = (new Date(t) - last) / 86400000
    streak = diff === 1 ? streak + 1 : 1
  } else streak = 1

  const bonus = Math.min(streak, STREAK_CAP) * STREAK_BONUS
  let amount = DAILY + bonus
  if (db.isPremium(uid)) amount *= 2

  u.coins += amount
  u.last_daily = t
  u.daily_streak = streak
  db.saveUser(uid, u)

  const prem = db.isPremium(uid) ? " (⭐ x2)" : ""
  return `✅ Daily *+${amount.toLocaleString()}* 🪙${prem}\n🔥 Streak *${streak}* (+${bonus})\nSolde *${u.coins.toLocaleString()}*`
}

export function cmdWork(uid) {
  const u = db.getUser(uid)
  const now = Date.now()
  const cd = db.isPremium(uid) ? WORK_CD_PREM : WORK_CD
  if (u.last_work) {
    const elapsed = (now - new Date(u.last_work).getTime()) / 1000
    if (elapsed < cd) {
      const rem = Math.ceil(cd - elapsed)
      const m = Math.floor(rem / 60)
      const s = rem % 60
      return `❌ Repose-toi *${m}min ${s}s*`
    }
  }
  let earned = WORK_MIN + Math.floor(Math.random() * (WORK_MAX - WORK_MIN + 1))
  if (db.isPremium(uid)) earned = Math.floor(earned * 1.25)
  const job = JOBS[Math.floor(Math.random() * JOBS.length)]
  u.coins += earned
  u.last_work = new Date().toISOString()
  db.saveUser(uid, u)
  const star = db.isPremium(uid) ? " ⭐" : ""
  return `✅ ${job}\n*+${earned}* 🪙${star}\nSolde *${u.coins.toLocaleString()}*`
}

export function cmdPay(uid, args) {
  if (args.length < 2) return "❌ `/pay <numéro> <montant>`"
  const target = args[0].replace(/\D/g, "")
  const amount = parseInt(args[1], 10)
  if (!target || !amount || amount <= 0) return "❌ Montant / numéro invalide."
  if (target === String(uid).replace(/\D/g, "")) return "❌ Pas toi-même."
  const src = db.getUser(uid)
  if (src.coins < amount) return `❌ Solde *${src.coins}*`
  src.coins -= amount
  const dst = db.getUser(target)
  dst.coins += amount
  db.saveUser(uid, src)
  db.saveUser(target, dst)
  return `✅ Envoyé *${amount}* 🪙 à ${target}\nSolde *${src.coins}*`
}

export function cmdDeposit(uid, args) {
  const u = db.getUser(uid)
  const raw = (args[0] || "all").toLowerCase()
  const n = raw === "all" ? u.coins : parseInt(raw, 10)
  if (!n || n <= 0 || n > u.coins) return `❌ Solde *${u.coins}*`
  u.coins -= n
  u.bank += n
  db.saveUser(uid, u)
  return `✅ *${n}* déposés 🏦\nBanque *${u.bank}*`
}

export function cmdWithdraw(uid, args) {
  const u = db.getUser(uid)
  const raw = (args[0] || "all").toLowerCase()
  const n = raw === "all" ? u.bank : parseInt(raw, 10)
  if (!n || n <= 0 || n > u.bank) return `❌ Banque *${u.bank}*`
  u.bank -= n
  u.coins += n
  db.saveUser(uid, u)
  return `✅ *${n}* retirés 👛\nPortefeuille *${u.coins}*`
}

export function cmdLeaderboard() {
  const top = db.leaderboardEconomy()
  if (!top.length) return "ℹ️ Aucune donnée."
  const medals = ["🥇", "🥈", "🥉"]
  let t = "🏆 *Classement — Économie*\n"
  top.forEach(([id, d], i) => {
    const m = medals[i] || `\`${i + 1}.\``
    const name = d.name || id.slice(-4)
    const star = d.premium ? " ⭐" : ""
    t += `${m} *${name}*${star} — ${(d.coins + d.bank).toLocaleString()} 🪙\n`
  })
  return t.trim()
}

export function cmdCoinflip(uid, args) {
  if (args.length < 2) return "❌ `/coinflip <mise> pile|face`"
  const amount = parseInt(args[0], 10)
  const choice = args[1].toLowerCase()
  if (!amount || !["pile", "face"].includes(choice)) return "❌ Mise / choix invalide."
  const max = db.isPremium(uid) ? 25000 : 10000
  if (amount < 10 || amount > max) return `❌ Mise 10–${max}`
  const u = db.getUser(uid)
  if (u.coins < amount) return `❌ Solde *${u.coins}*`
  const result = Math.random() < 0.5 ? "pile" : "face"
  if (result === choice) {
    u.coins += amount
    db.saveUser(uid, u)
    return `✅ 🪙 *${result.toUpperCase()}* ! +*${amount}*\nSolde *${u.coins}*`
  }
  u.coins -= amount
  db.saveUser(uid, u)
  return `❌ 🪙 *${result.toUpperCase()}*... -*${amount}*\nSolde *${u.coins}*`
}

export function cmdSlots(uid, args) {
  if (!args[0]) return "❌ `/slots <mise>`"
  const amount = parseInt(args[0], 10)
  const max = db.isPremium(uid) ? 15000 : 5000
  if (!amount || amount < 20 || amount > max) return `❌ Mise 20–${max}`
  const u = db.getUser(uid)
  if (u.coins < amount) return `❌ Solde *${u.coins}*`
  const reels = [0, 1, 2].map(() => SLOTS[Math.floor(Math.random() * SLOTS.length)])
  const key = reels.join("")
  let mult = SLOTS_MULT[key] || 0
  if (!mult && (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2])) mult = 2
  const display = reels.join(" | ")
  if (mult > 0) {
    const win = amount * mult
    u.coins += win
    db.saveUser(uid, u)
    return `✅ 🎰 \`${display}\`\nx*${mult}* +*${win}*\nSolde *${u.coins}*`
  }
  u.coins -= amount
  db.saveUser(uid, u)
  return `❌ 🎰 \`${display}\`\n-*${amount}*\nSolde *${u.coins}*`
}

export function cmdDice(uid, args) {
  if (!args[0]) return "❌ `/dice <mise>`"
  const amount = parseInt(args[0], 10)
  const max = db.isPremium(uid) ? 15000 : 5000
  if (!amount || amount < 10 || amount > max) return `❌ Mise 10–${max}`
  const u = db.getUser(uid)
  if (u.coins < amount) return `❌ Solde *${u.coins}*`
  const p = 1 + Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6)
  const b = 1 + Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6)
  if (p > b) {
    u.coins += amount
    db.saveUser(uid, u)
    return `✅ 🎲 Toi *${p}* vs *${b}*\n+*${amount}* → *${u.coins}*`
  }
  if (p < b) {
    u.coins -= amount
    db.saveUser(uid, u)
    return `❌ 🎲 Toi *${p}* vs *${b}*\n-*${amount}* → *${u.coins}*`
  }
  return `ℹ️ 🎲 *${p}* = *${b}* — égalité`
}

export function cmdRoulette(uid, args) {
  if (args.length < 2) return "❌ `/roulette <mise> rouge|noir|0-36`"
  const amount = parseInt(args[0], 10)
  const bet = args[1].toLowerCase()
  const max = db.isPremium(uid) ? 20000 : 8000
  if (!amount || amount < 20 || amount > max) return `❌ Mise 20–${max}`
  const u = db.getUser(uid)
  if (u.coins < amount) return `❌ Solde *${u.coins}*`

  let type, val
  if (["rouge", "red", "r"].includes(bet)) {
    type = "color"
    val = "red"
  } else if (["noir", "black", "n"].includes(bet)) {
    type = "color"
    val = "black"
  } else if (/^\d+$/.test(bet) && +bet >= 0 && +bet <= 36) {
    type = "number"
    val = +bet
  } else return "❌ rouge / noir / 0-36"

  const result = Math.floor(Math.random() * 37)
  let color = "vert",
    emoji = "🟢"
  if (RED.has(result)) {
    color = "rouge"
    emoji = "🔴"
  } else if (BLACK.has(result)) {
    color = "noir"
    emoji = "⚫"
  }

  let won = false
  let payout = 0
  if (type === "color") {
    if (val === "red" && RED.has(result)) {
      won = true
      payout = amount * 2
    }
    if (val === "black" && BLACK.has(result)) {
      won = true
      payout = amount * 2
    }
  } else if (result === val) {
    won = true
    payout = amount * 36
  }

  if (won) {
    const gain = payout - amount
    u.coins += gain
    db.saveUser(uid, u)
    return `✅ 🎰 ${emoji} *${result}* (${color})\n+*${gain}* → *${u.coins}*`
  }
  u.coins -= amount
  db.saveUser(uid, u)
  return `❌ 🎰 ${emoji} *${result}* (${color})\n-*${amount}* → *${u.coins}*`
}
