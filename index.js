/**
 * BOOYAH WhatsApp — Baileys
 * I4ST-BOT-V2
 */
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys"
import pino from "pino"
import qrcode from "qrcode-terminal"
import "dotenv/config"
import { dispatch } from "./src/router.js"

const logger = pino({ level: "silent" })

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth")
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger,
    printQRInTerminal: false,
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
    markOnlineOnConnect: false,
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log("\n📱 Scanne ce QR avec WhatsApp → Appareils connectés\n")
      qrcode.generate(qr, { small: true })
    }

    if (connection === "open") {
      console.log("\n✅ BOOYAH connecté à WhatsApp\n")
    }

    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode
      const shouldReconnect = code !== DisconnectReason.loggedOut
      console.log(`⚠️ Déconnecté (code ${code}). Reconnect: ${shouldReconnect}`)
      if (shouldReconnect) {
        setTimeout(() => startBot(), 2000)
      } else {
        console.log("🔒 Session expirée. Supprime le dossier auth/ et relance pour un nouveau QR.")
      }
    }
  })

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return

    for (const msg of messages) {
      try {
        if (!msg.message || msg.key.fromMe) continue
        // Ignore status / newsletters
        const jid = msg.key.remoteJid
        if (!jid || jid === "status@broadcast" || jid.endsWith("@newsletter")) continue

        const text = extractText(msg)
        if (!text) continue

        const name = msg.pushName || null
        // user id = numéro (avant @s.whatsapp.net) ou jid groupe
        const userId = jid.replace(/@.*/, "")

        console.log(`[MSG] ${name || userId}: ${text.slice(0, 80)}`)

        const reply = await dispatch(userId, text, name, jid)
        if (reply) {
          await sock.sendMessage(jid, { text: reply })
        }
      } catch (err) {
        console.error("Handler error:", err)
        try {
          await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ Erreur: ${err.message}`,
          })
        } catch {}
      }
    }
  })
}

function extractText(msg) {
  const m = msg.message
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    ""
  )
}

console.log("🚀 Démarrage BOOYAH (Baileys)...")
startBot().catch((e) => {
  console.error("Fatal:", e)
  process.exit(1)
})
