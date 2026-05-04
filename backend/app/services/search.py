"""Search-provider dispatcher.

Picks which news search backend to use based on settings.search_provider.
Default is 'brave' (works without site allow-lists). Set SEARCH_PROVIDER=google
to fall back to the legacy Google Custom Search code path.
"""
from __future__ import annotations

from typing import Any

from ..config import settings


def _provider():
    name = (settings.search_provider or "brave").lower()
    if name == "google":
        from . import google as p
        return p
    # default
    from . import brave as p
    return p


async def search_news(query: str, num: int = 12) -> list[dict[str, Any]]:
    return await _provider().search_news(query, num)


def get_api_status() -> dict[str, Any]:
    return _provider().get_api_status()
