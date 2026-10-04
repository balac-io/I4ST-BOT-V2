import fs from "fs"
import path from "path"

const DATA_DIR = "./data"
const DB_FILE = path.join(DATA_DIR, "booyah.json")

fs.mkdirSync(DATA_DIR, { recursive: true })

function load() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, "utf8"))
    }
  } catch {}
  return { users: {} }
}

function save(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8")
}

function defaultUser() {
  return {
    name: null,
    coins: 0,
    bank: 0,
    xp: 0,
    level: 1,
    last_daily: null,
    last_work: null,
    total_msgs: 0,
    premium: false,
    premium_until: null,
    daily_streak: 0,
  }
}

function uid(userId) {
  const n = String(userId).replace(/\D/g, "")
  return n || String(userId)
}

export function getUser(userId) {
  const id = uid(userId)
  const data = load()
  if (!data.users[id]) {
    data.users[id] = defaultUser()
    save(data)
  }
  return { ...defaultUser(), ...data.users[id] }
}

export function saveUser(userId, userData) {
  const id = uid(userId)
  const data = load()
  data.users[id] = {
    name: userData.name ?? null,
    coins: userData.coins ?? 0,
    bank: userData.bank ?? 0,
    xp: userData.xp ?? 0,
    level: userData.level ?? 1,
    last_daily: userData.last_daily ?? null,
    last_work: userData.last_work ?? null,
    total_msgs: userData.total_msgs ?? 0,
    premium: !!userData.premium,
    premium_until: userData.premium_until ?? null,
    daily_streak: userData.daily_streak ?? 0,
  }
  save(data)
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
  const data = load()
  return Object.entries(data.users)
    .map(([id, u]) => [id, { ...defaultUser(), ...u }])
    .sort((a, b) => b[1].coins + b[1].bank - (a[1].coins + a[1].bank))
    .slice(0, limit)
}

export function leaderboardXp(limit = 10) {
  const data = load()
  return Object.entries(data.users)
    .map(([id, u]) => [id, { ...defaultUser(), ...u }])
    .sort((a, b) => b[1].xp - a[1].xp)
    .slice(0, limit)
}
