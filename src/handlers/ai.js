import Groq from "groq-sdk"
import "dotenv/config"

const client = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null

// Modele accessible sur le free tier Groq
const MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant"

export async function cmdAi(args) {
  const prompt = args.join(" ").trim()
  if (!prompt) return "\u274c `/ai <ta question>`"
  if (!client) return "\u274c GROQ_API_KEY manquante dans .env"

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
    return `\ud83e\udd16 *BOOYAH*\n\n${reply}`
  } catch (e) {
    return `\u274c Erreur IA : ${e.message}`
  }
}
