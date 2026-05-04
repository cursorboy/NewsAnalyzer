"""Multi-provider LLM abstraction.

Env-driven; no user-facing settings. The frontend reframes all of this as
outputs of the "NeuralBias v2" custom neural network — providers are an
operator implementation detail.

Selection: MODEL_PROVIDER=openai|anthropic|together (default openai)
Keys:     OPENAI_API_KEY, ANTHROPIC_API_KEY, TOGETHER_API_KEY
"""
from __future__ import annotations

import json
import os
from typing import Any, Optional, Protocol

from ..config import settings


OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions"
OPENAI_EMBED_URL = "https://api.openai.com/v1/embeddings"
DEFAULT_CHAT_MODEL = os.environ.get("OPENAI_CHAT_MODEL", "gpt-4o-mini")
DEFAULT_EMBED_MODEL = os.environ.get("OPENAI_EMBED_MODEL", "text-embedding-3-small")


class ModelProvider(Protocol):
    def complete(
        self,
        system: str,
        user: str,
        response_format: Optional[dict] = None,
    ) -> str: ...

    def embed(self, text: str) -> list[float]: ...


class OpenAIProvider:
    """Lifts the existing OpenAI integration from classifier.py into a reusable
    provider. Synchronous; uses httpx.Client so the same call works inside
    asyncio (via asyncio.to_thread) or sync handlers."""

    def __init__(self, api_key: Optional[str] = None) -> None:
        self.api_key = api_key or settings.openai_api_key or os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY not configured")

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def complete(
        self,
        system: str,
        user: str,
        response_format: Optional[dict] = None,
    ) -> str:
        import httpx
        payload: dict[str, Any] = {
            "model": DEFAULT_CHAT_MODEL,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            # temperature=0 → maximally deterministic output. Same input gives
            # the same response (modulo OpenAI-side load-balancing variation),
            # which makes responses look like a fixed model rather than a
            # creative LLM rolling fresh prose every call.
            "temperature": 0,
            "max_tokens": 600,
        }
        if response_format is not None:
            payload["response_format"] = response_format

        with httpx.Client(timeout=25.0) as client:
            r = client.post(OPENAI_CHAT_URL, headers=self._headers(), json=payload)
            r.raise_for_status()
            data = r.json()
            return data["choices"][0]["message"]["content"]

    def embed(self, text: str) -> list[float]:
        import httpx
        payload = {"model": DEFAULT_EMBED_MODEL, "input": text}
        with httpx.Client(timeout=25.0) as client:
            r = client.post(OPENAI_EMBED_URL, headers=self._headers(), json=payload)
            r.raise_for_status()
            data = r.json()
            return data["data"][0]["embedding"]


class AnthropicProvider:
    def __init__(self, api_key: Optional[str] = None) -> None:
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")

    def complete(self, system: str, user: str, response_format: Optional[dict] = None) -> str:
        raise NotImplementedError("AnthropicProvider not implemented yet")

    def embed(self, text: str) -> list[float]:
        raise NotImplementedError("AnthropicProvider not implemented yet")


class TogetherProvider:
    def __init__(self, api_key: Optional[str] = None) -> None:
        self.api_key = api_key or os.environ.get("TOGETHER_API_KEY")

    def complete(self, system: str, user: str, response_format: Optional[dict] = None) -> str:
        raise NotImplementedError("TogetherProvider not implemented yet")

    def embed(self, text: str) -> list[float]:
        raise NotImplementedError("TogetherProvider not implemented yet")


_PROVIDER_CACHE: dict[str, ModelProvider] = {}


def get_provider() -> ModelProvider:
    name = (os.environ.get("MODEL_PROVIDER") or "openai").lower()
    if name in _PROVIDER_CACHE:
        return _PROVIDER_CACHE[name]

    if name == "openai":
        provider: ModelProvider = OpenAIProvider()
    elif name == "anthropic":
        provider = AnthropicProvider()
    elif name == "together":
        provider = TogetherProvider()
    else:
        raise ValueError(f"Unknown MODEL_PROVIDER: {name}")

    _PROVIDER_CACHE[name] = provider
    return provider


def safe_json_complete(
    provider: ModelProvider,
    system: str,
    user: str,
    fallback: Any,
) -> Any:
    """Call provider.complete with JSON response_format and parse. Returns
    `fallback` on any failure so callers can stay total without try/except."""
    try:
        raw = provider.complete(system, user, response_format={"type": "json_object"})
        return json.loads(raw)
    except Exception:
        return fallback
