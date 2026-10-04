import * as db from "../db.js"

function xpForLevel(level) {
  return 100 * level * level
}

export function onMessage(uid, name) {
  const u = db.getUser(uid)
  if (name && !u.name) u.name = name
  u.total_msgs = (u.total_msgs || 0) + 1
  let gained = 10 + Math.floor(Math.random() * 16)
  if (db.isPremium(uid)) gained = Math.floor(gained * 1.2)
  u.xp = (u.xp || 0) + gained
  while (u.xp >= xpForLevel(u.level || 1)) {
    u.level = (u.level || 1) + 1
  }
  db.saveUser(uid, u)
}

export function cmdLevel(uid) {
  const u = db.getUser(uid)
  const lvl = u.level || 1
  const xp = u.xp || 0
  const need = xpForLevel(lvl)
  const prev = lvl > 1 ? xpForLevel(lvl - 1) : 0
  const progress = Math.max(0, xp - prev)
  const span = Math.max(1, need - prev)
  const pct = Math.min(100, Math.floor((progress / span) * 100))
  const filled = Math.floor((10 * pct) / 100)
  const bar = "█".repeat(filled) + "░".repeat(10 - filled)
  const star = db.isPremium(uid) ? " ⭐" : ""
  return `⭐ *Niveau ${lvl}*${star}\nXP *${xp.toLocaleString()}* / ${need.toLocaleString()}\n\`${bar}\` ${pct}%\nMessages *${u.total_msgs}*`
}

export function cmdLeaderboard() {
  const top = db.leaderboardXp()
  if (!top.length) return "ℹ️ Aucune donnée."
  const medals = ["🥇", "🥈", "🥉"]
  let t = "🏆 *Classement — XP*\n"
  top.forEach(([id, d], i) => {
    const m = medals[i] || `\`${i + 1}.\``
    const name = d.name || id.slice(-4)
    const star = d.premium ? " ⭐" : ""
    t += `${m} *${name}*${star} — Nv.${d.level} (${d.xp.toLocaleString()} XP)\n`
  })
  return t.trim()
}
