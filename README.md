# I4ST-BOT-V2 — BOOYAH WhatsApp (Baileys)

Bot WhatsApp **sans Meta / Facebook**. Connexion par **QR code** (comme WhatsApp Web).

## Prérequis

- Node.js **20+**
- Un téléphone avec WhatsApp

## Installation

```bash
git clone https://github.com/balac-io/I4ST-BOT-V2.git
cd I4ST-BOT-V2
npm install
cp .env.example .env
# édite .env → mets ta GROQ_API_KEY
```

## Lancer

```bash
npm start
```

1. Un **QR code** s'affiche dans le terminal
2. WhatsApp téléphone → **Appareils connectés** → **Connecter un appareil**
3. Scan le QR
4. Tu vois `BOOYAH connecté`

## Commandes

| Commande | Description |
|----------|-------------|
| `/help` | Liste des commandes |
| `/ping` | Test |
| `/balance` | Solde coins |
| `/daily` | Récompense + streak |
| `/work` | Travailler |
| `/pay <num> <montant>` | Envoyer des coins |
| `/deposit [montant\|all]` | Banque |
| `/withdraw [montant\|all]` | Retirer |
| `/leaderboard` | Top riches |
| `/coinflip <mise> pile\|face` | Pile ou face |
| `/slots <mise>` | Machine à sous |
| `/dice <mise>` | Dés |
| `/roulette <mise> rouge\|noir\|0-36` | Roulette |
| `/level` | Niveau XP |
| `/xptop` | Classement XP |
| `/premium` | Statut Premium |
| `/premium-buy 7\|30\|90` | Acheter Premium |
| `/ai <question>` | IA (Groq) |

## Fichiers importants

- `auth/` — session WhatsApp (**ne jamais commit / partager**)
- `data/booyah.db` — base SQLite
- `src/` — handlers économie, niveaux, IA, premium

## Notes

- Baileys est **non officiel** → évite le spam pour réduire le risque de ban
- L'ancien code Python (Meta API) n'est plus utilisé
