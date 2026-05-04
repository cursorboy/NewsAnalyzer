"""Brave Search API news provider.

Implements the same interface as services.google so the rest of the codebase
can swap providers via the SEARCH_PROVIDER env var without code changes.

Brave Search news endpoint indexes the entire web (no per-site allow list
required), so this is the recommended replacement for Google CSE which
deprecated 'Search the entire web'.

Free tier docs: https://api.search.brave.com/app/documentation
Sign up + get key: https://api.search.brave.com/app/keys
"""
from __future__ import annotations

import httpx
import logging
from typing import Any, Dict
from datetime import datetime

from ..config import settings

NEWS_URL = "https://api.search.brave.com/res/v1/news/search"

logger = logging.getLogger(__name__)


class APIStatus:
    def __init__(self) -> None:
        self.total_requests = 0
        self.failed_requests = 0
        self.rate_limited = False
        self.last_error: dict | None = None
        self.last_request_time: datetime | None = None
        self.quota_exceeded = False

    def record_request(self) -> None:
        self.total_requests += 1
        self.last_request_time = datetime.now()

    def record_error(self, error_type: str, message: str) -> None:
        self.failed_requests += 1
        self.last_error = {
            "type": error_type,
            "message": message,
            "time": datetime.now().isoformat(),
        }
        if "quota" in message.lower() or "limit" in message.lower():
            self.quota_exceeded = True
            self.rate_limited = True
        elif error_type == "rate_limit":
            self.rate_limited = True


api_status = APIStatus()


async def search_news(query: str, num: int = 12) -> list[dict[str, Any]]:
    """Search Brave news index. Returns Google-CSE-shaped dicts so downstream
    code (api/index.py, classifier) doesn't need to know which provider it is.
    """
    if not settings.brave_api_key:
        return []

    api_status.record_request()

    headers = {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": settings.brave_api_key,
    }
    params = {
        "q": query,
        "count": min(max(num, 1), 20),  # Brave news caps at 20 per call
        "freshness": "pw",  # past week — wider net than past day
        "search_lang": "en",
        "country": "US",
        "safesearch": "moderate",
    }

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(NEWS_URL, headers=headers, params=params)

            if r.status_code == 429:
                api_status.record_error("rate_limit", "Brave API rate limited (1 req/sec on free tier)")
                logger.warning("Brave API rate limit exceeded")
                return []
            if r.status_code == 401:
                api_status.record_error("unauthorized", "Invalid Brave API key")
                logger.error("Brave API key invalid (check BRAVE_API_KEY env var)")
                return []
            if r.status_code == 422:
                error_data = r.json() if r.content else {}
                msg = (error_data.get("message") or "Bad request") if isinstance(error_data, dict) else "Bad request"
                api_status.record_error("bad_request", f"Brave API rejected query: {msg}")
                logger.error(f"Brave API 422: {msg}")
                return []

            r.raise_for_status()
            data = r.json()

            raw = data.get("results", []) or []
            mapped: list[dict[str, Any]] = []
            for item in raw:
                url = item.get("url", "")
                if not url:
                    continue
                meta = item.get("meta_url") or {}
                hostname = meta.get("hostname") or ""
                mapped.append({
                    # Match Google CSE shape so callers don't change
                    "link": url,
                    "title": item.get("title", ""),
                    "snippet": item.get("description", ""),
                    "published_at": item.get("page_age") or item.get("age") or None,
                    "displayLink": hostname,
                })

            logger.info(f"Brave news: {len(mapped)} results for '{query[:60]}'")
            return mapped[:num]

    except httpx.TimeoutException:
        api_status.record_error("timeout", "Brave API request timed out")
        logger.warning("Brave API request timed out")
        return []
    except httpx.HTTPStatusError as e:
        api_status.record_error("http_error", f"HTTP {e.response.status_code}: {e}")
        logger.error(f"Brave API HTTP error: {e}")
        return []
    except Exception as e:
        api_status.record_error("unknown", str(e))
        logger.error(f"Unexpected Brave API error: {e}")
        return []


def get_api_status() -> Dict[str, Any]:
    return {
        "total_requests": api_status.total_requests,
        "failed_requests": api_status.failed_requests,
        "success_rate": (api_status.total_requests - api_status.failed_requests)
        / max(api_status.total_requests, 1) * 100,
        "rate_limited": api_status.rate_limited,
        "quota_exceeded": api_status.quota_exceeded,
        "last_error": api_status.last_error,
        "last_request_time": api_status.last_request_time.isoformat() if api_status.last_request_time else None,
        "api_configured": bool(settings.brave_api_key),
        "provider": "brave",
    }
