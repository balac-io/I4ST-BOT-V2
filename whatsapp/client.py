"""Client Meta WhatsApp Cloud API."""

import os
import httpx

GRAPH_URL = "https://graph.facebook.com/v21.0"


class WhatsAppClient:
    def __init__(self):
        self.token = os.getenv("WHATSAPP_TOKEN", "")
        self.phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")

    @property
    def _headers(self):
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    async def send_text(self, to: str, text: str) -> dict:
        """Envoie un message texte. `to` = numéro sans + (ex: 33612345678)."""
        to = str(to).lstrip("+")
        url = f"{GRAPH_URL}/{self.phone_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "text",
            "text": {"preview_url": False, "body": text[:4096]},
        }
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(url, headers=self._headers, json=payload)
            try:
                return r.json()
            except Exception:
                return {"status_code": r.status_code, "text": r.text}

    async def mark_read(self, message_id: str):
        url = f"{GRAPH_URL}/{self.phone_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": message_id,
        }
        async with httpx.AsyncClient(timeout=15) as client:
            await client.post(url, headers=self._headers, json=payload)
