import Database from "better-sqlite3"
import fs from "fs"

fs.mkdirSync("./data", { recursive: true })
const db = new Database("./data/booyah.db")
db.pragma("journal_mode = WAL")

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  name TEXT,
  coins INTEGER DEFAULT 0,
  bank INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  last_daily TEXT,
  last_work TEXT,
  total_msgs INTEGER DEFAULT 0,
  premium INTEGER DEFAULT 0,
  premium_until TEXT,
  daily_streak INTEGER DEFAULT 0
);
`)

function rowToUser(row) {
  if (!row) return null
  return {
    name: row.name,
    coins: row.coins || 0,
    bank: row.bank || 0,
    xp: row.xp || 0,
    level: row.level || 1,
    last_daily: row.last_daily,
    last_work: row.last_work,
    total_msgs: row.total_msgs || 0,
    premium: !!row.premium,
    premium_until: row.premium_until,
    daily_streak: row.daily_streak || 0,
  }
}

export function getUser(userId) {
  const uid = String(userId).replace(/\D/g, "") || String(userId)
  let row = db.prepare("SELECT * FROM users WHERE user_id = ?").get(uid)
  if (!row) {
    db.prepare("INSERT INTO users (user_id) VALUES (?)").run(uid)
    row = db.prepare("SELECT * FROM users WHERE user_id = ?").get(uid)
  }
  return rowToUser(row)
}

export function saveUser(userId, data) {
  const uid = String(userId).replace(/\D/g, "") || String(userId)
  db.prepare(`
    INSERT OR REPLACE INTO users
    (user_id, name, coins, bank, xp, level, last_daily, last_work, total_msgs, premium, premium_until, daily_streak)
    VALUES (@user_id, @name, @coins, @bank, @xp, @level, @last_daily, @last_work, @total_msgs, @premium, @premium_until, @daily_streak)
  `).run({
    user_id: uid,
    name: data.name ?? null,
    coins: data.coins ?? 0,
    bank: data.bank ?? 0,
    xp: data.xp ?? 0,
    level: data.level ?? 1,
    last_daily: data.last_daily ?? null,
    last_work: data.last_work ?? null,
    total_msgs: data.total_msgs ?? 0,
    premium: data.premium ? 1 : 0,
    premium_until: data.premium_until ?? null,
    daily_streak: data.daily_streak ?? 0,
  })
}

export function isPremium(userId) {
  const u = getUser(userId)
  if (!u.premium) return false
  if (!u.premium_until) return true
  if (new Date(u.premium_until) < new Date()) {
    u.premium = false
    u.premium_until = null
    saveUser(userId, u)
    return false
  }
  return true
}

export function renewPremium(userId, days) {
  const u = getUser(userId)
  const now = new Date()
  if (u.premium && !u.premium_until) return null
  let base = now
  if (u.premium && u.premium_until) {
    const cur = new Date(u.premium_until)
    if (cur > now) base = cur
  }
  const exp = new Date(base.getTime() + days * 86400000)
  u.premium = true
  u.premium_until = exp.toISOString()
  saveUser(userId, u)
  return exp
}

export function leaderboardEconomy(limit = 10) {
  return db
    .prepare("SELECT * FROM users ORDER BY (coins + bank) DESC LIMIT ?")
    .all(limit)
    .map((r) => [r.user_id, rowToUser(r)])
}

export function leaderboardXp(limit = 10) {
  return db
    .prepare("SELECT * FROM users ORDER BY xp DESC LIMIT ?")
    .all(limit)
    .map((r) => [r.user_id, rowToUser(r)])
}
