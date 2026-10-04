"""
BOOYAH WhatsApp Bot — I4ST-BOT-V2
Meta Cloud API + FastAPI webhook
"""

import os
import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request, Query, Response
from fastapi.responses import PlainTextResponse

load_dotenv()

from whatsapp.client import WhatsAppClient
from handlers.router import dispatch

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("booyah")

VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "booyah_verify")
wa = WhatsAppClient()


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("BOOYAH WhatsApp démarré")
    if not os.getenv("WHATSAPP_TOKEN"):
        log.warning("WHATSAPP_TOKEN manquant")
    if not os.getenv("WHATSAPP_PHONE_NUMBER_ID"):
        log.warning("WHATSAPP_PHONE_NUMBER_ID manquant")
    yield
    log.info("BOOYAH arrêté")


app = FastAPI(title="BOOYAH WhatsApp", version="2.0", lifespan=lifespan)


@app.get("/")
async def root():
    return {"bot": "BOOYAH", "status": "online", "platform": "whatsapp"}


@app.get("/webhook")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    """Vérification Meta webhook."""
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        log.info("Webhook vérifié")
        return PlainTextResponse(content=hub_challenge or "", status_code=200)
    return Response(status_code=403)


@app.post("/webhook")
async def receive_webhook(request: Request):
    body = await request.json()
    try:
        for entry in body.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                messages = value.get("messages", [])
                contacts = {c.get("wa_id"): c.get("profile", {}).get("name") for c in value.get("contacts", [])}

                for msg in messages:
                    if msg.get("type") != "text":
                        continue
                    sender = msg.get("from")  # ex: 33612345678
                    text = msg.get("text", {}).get("body", "")
                    msg_id = msg.get("id")
                    name = contacts.get(sender)

                    log.info("MSG %s (%s): %s", sender, name, text[:80])

                    try:
                        if msg_id:
                            await wa.mark_read(msg_id)
                    except Exception:
                        pass

                    try:
                        reply = await dispatch(wa, sender, text, name)
                        if reply:
                            await wa.send_text(sender, reply)
                    except Exception as e:
                        log.exception("Handler error: %s", e)
                        try:
                            await wa.send_text(sender, f"❌ Erreur interne : {e}")
                        except Exception:
                            pass
    except Exception as e:
        log.exception("Webhook parse error: %s", e)

    # Toujours 200 pour Meta
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
