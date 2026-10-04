"""IA via Groq."""

import os
from groq import Groq
from utils import messages as M

SYSTEM = (
    "Tu es BOOYAH, un assistant WhatsApp fun et utile. "
    "Réponds en français, de façon claire et concise (max ~400 mots). "
    "Ne renvoie jamais de JSON brut."
)


async def cmd_ai(uid: str, args: list, raw: str) -> str:
    prompt = " ".join(args).strip()
    if not prompt:
        # Si /ai sans args, prendre le reste après la commande dans raw
        parts = raw.split(maxsplit=1)
        prompt = parts[1].strip() if len(parts) > 1 else ""
    if not prompt:
        return M.err("Usage : `/ai <ta question>`")

    key = os.getenv("GROQ_API_KEY")
    if not key:
        return M.err("GROQ_API_KEY manquante.")

    try:
        client = Groq(api_key=key)
        chat = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": prompt},
            ],
            max_tokens=800,
            temperature=0.7,
        )
        reply = chat.choices[0].message.content.strip()
        return f"🤖 *BOOYAH*\n\n{reply}"
    except Exception as e:
        return M.err(f"Erreur IA : {e}")
