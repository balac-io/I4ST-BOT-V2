import Groq from "groq-sdk"
import "dotenv/config"

const client = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null

// Free tier Groq (2026) : openai/gpt-oss-20b | openai/gpt-oss-120b | qwen/qwen3.8-27b
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b"

export async function cmdAi(args) {
  const prompt = args.join(" ").trim()
  if (!prompt) return "❌ `/ai <ta question>`"
  if (!client) return "❌ GROQ_API_KEY manquante dans .env"

  try {
    const chat = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "Tu es BOOYAH, assistant WhatsApp fun et utile. Reponds en francais, clair et concis.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 600,
      temperature: 0.7,
    })
    const reply = chat.choices[0]?.message?.content?.trim() || "..."
    return `🤖 *BOOYAH*\n\n${reply}`
  } catch (e) {
    return `❌ Erreur IA : ${e.message}`
  }
}
