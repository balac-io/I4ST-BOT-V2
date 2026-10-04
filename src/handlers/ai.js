import Groq from "groq-sdk"
import "dotenv/config"
import * as db from "../db.js"

const client = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null

// Free tier : openai/gpt-oss-20b (rapide) | openai/gpt-oss-120b (plus puissant)
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b"

// Mémoire conversation par utilisateur (dernier messages)
const history = new Map()
const MAX_HISTORY = 12

const SYSTEM = `Tu es BOOYAH, un assistant WhatsApp ultra intelligent, fun et utile.

RÈGLES :
- Réponds TOUJOURS en français, clair, direct, utile.
- Sois concis sur mobile (2-8 phrases sauf si l'utilisateur demande un plan détaillé).
- Tu as accès au profil utilisateur (coins, niveau, premium) fourni dans le contexte.
- Si l'utilisateur veut une action économie / jeu / niveau, guide-le vers la commande ou résume le résultat si déjà exécuté.
- Commandes disponibles : /help /ping /balance /daily /work /pay /deposit /withdraw /leaderboard /coinflip /slots /dice /roulette /level /xptop /premium /premium-buy /ai
- Ne répète pas le salutation à chaque message si la conversation est déjà en cours.
- Pas de JSON, pas de markdown de tableau lourd : listes simples avec • ou numéros.
- Personnalité : confiant, motivant, un peu humoristique, jamais robotique.`

function getHistory(uid) {
  if (!history.has(uid)) history.set(uid, [])
  return history.get(uid)
}

function pushHistory(uid, role, content) {
  const h = getHistory(uid)
  h.push({ role, content })
  while (h.length > MAX_HISTORY) h.shift()
}

export function clearHistory(uid) {
  history.delete(uid)
}

/**
 * Réponse IA libre (tout message)
 */
export async function chat(uid, text, name) {
  if (!client) return "❌ GROQ_API_KEY manquante dans .env"

  const u = db.getUser(uid)
  const prem = db.isPremium(uid) ? "oui" : "non"
  const context =
    `[Profil] nom=${name || u.name || "?"} | coins=${u.coins} | banque=${u.bank} | niveau=${u.level} | xp=${u.xp} | premium=${prem} | streak=${u.daily_streak}`

  const messages = [
    { role: "system", content: SYSTEM },
    { role: "system", content: context },
    ...getHistory(uid),
    { role: "user", content: text },
  ]

  try {
    const res = await client.chat.completions.create({
      model: MODEL,
      messages,
      max_tokens: 900,
      temperature: 0.75,
    })
    let reply = res.choices[0]?.message?.content?.trim() || "..."
    // Nettoyage léger
    reply = reply.replace(/^```[\s\S]*?```$/g, "").trim()
    pushHistory(uid, "user", text)
    pushHistory(uid, "assistant", reply)
    return reply
  } catch (e) {
    return `❌ Erreur IA : ${e.message}`
  }
}

/** Commande /ai explicite (même moteur) */
export async function cmdAi(uid, args, name) {
  const prompt = args.join(" ").trim()
  if (!prompt) return "❌ Écris juste ton message, ou `/ai <question>`"
  return chat(uid, prompt, name)
}
