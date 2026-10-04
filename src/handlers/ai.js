import Groq from "groq-sdk"
import "dotenv/config"

const client = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null

export async function cmdAi(args) {
  const prompt = args.join(" ").trim()
  if (!prompt) return "❌ `/ai <ta question>`"
  if (!client) return "❌ GROQ_API_KEY manquante dans .env"

  try {
    const chat = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "Tu es BOOYAH, assistant WhatsApp fun et utile. Réponds en français, clair et concis.",
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
