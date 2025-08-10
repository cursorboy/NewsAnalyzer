from __future__ import annotations

import httpx
from typing import Any
from ..config import settings

BASE_URL = "https://www.googleapis.com/customsearch/v1"


async def search_news(query: str, num: int = 10) -> list[dict[str, Any]]:
    if not settings.google_api_key or not settings.google_cse_id:
        return []
    params = {
        "q": query,
        "cx": settings.google_cse_id,
        "key": settings.google_api_key,
        "num": min(max(num, 1), 10),
        "safe": "medium",
        "lr": "lang_en",
    }
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(BASE_URL, params=params)
        r.raise_for_status()
        data = r.json()
        return data.get("items", []) 