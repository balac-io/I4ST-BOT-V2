# I4ST-BOT-V2 — BOOYAH WhatsApp

Bot WhatsApp inspiré de **I4ST-BOT-V1** (Discord).

## Fonctionnalités

| Module | Commandes |
|--------|-----------|
| **Économie** | `/balance` `/daily` `/work` `/pay` `/deposit` `/withdraw` `/leaderboard` `/coinflip` `/slots` `/dice` `/roulette` |
| **Niveaux** | `/level` `/rank` (XP auto sur chaque message) |
| **Premium** | `/premium` `/premium-buy` |
| **IA** | `/ai` (Groq) |
| **Aide** | `/help` `/ping` |

## Stack

- **Python 3.11+**
- **FastAPI** — webhook Meta WhatsApp Cloud API
- **SQLite** — même logique que V1
- **Groq** — réponses IA

## Setup

1. Clone le repo
2. `pip install -r requirements.txt`
3. Copie `.env.example` → `.env` et remplis :

```env
WHATSAPP_TOKEN=EAAxxxx          # Meta Cloud API token
WHATSAPP_PHONE_NUMBER_ID=123   # Phone Number ID
WHATSAPP_VERIFY_TOKEN=booyah   # Token de vérification webhook
GROQ_API_KEY=gsk_xxxx
OWNER_PHONES=33612345678       # admins séparés par virgule (sans +)
```

4. Expose le serveur (ngrok / VPS) :

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

5. Dans [Meta Developers](https://developers.facebook.com/) → WhatsApp → Configuration webhook :
   - Callback URL : `https://ton-domaine/webhook`
   - Verify token : celui de `.env`
   - Abonne-toi aux événements **messages**

## Commandes exemples

```
/help
/daily
/balance
/work
/coinflip 100 pile
/ai Salut !
/level
```

## Différences avec Discord (V1)

WhatsApp n’a pas de salons, rôles, boutons ni embeds riches.
Les commandes passent par du **texte** (`/commande`).
Modération / tickets / vocal Discord ne sont pas portés 1:1.
