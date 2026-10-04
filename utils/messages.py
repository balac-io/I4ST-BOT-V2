"""Formatage de messages texte WhatsApp (pas d'embeds Discord)."""


def ok(text: str) -> str:
    return f"✅ {text}"


def err(text: str) -> str:
    return f"❌ {text}"


def info(text: str) -> str:
    return f"ℹ️ {text}"


def warn(text: str) -> str:
    return f"⚠️ {text}"


def title(t: str, body: str = "") -> str:
    if body:
        return f"*{t}*\n\n{body}"
    return f"*{t}*"
