"""Linguistic bias signals: loaded language, source diversity, headline-vs-body skew.

All three call out to the configured `provider.complete` in JSON mode. They are
synchronous (matching provider.py) and total — on any failure they return an
empty/zero structure so callers stay simple.
"""
from __future__ import annotations

from typing import Optional

from .provider import ModelProvider, get_provider, safe_json_complete


SYSTEM_LINGUIST = (
    "You are a careful linguistic analyst. Always respond with valid JSON "
    "matching the requested schema. Do not include any prose outside the JSON."
)


def _provider(p: Optional[ModelProvider]) -> Optional[ModelProvider]:
    if p is not None:
        return p
    try:
        return get_provider()
    except Exception:
        return None


def detect_loaded_language(text: str, provider: Optional[ModelProvider] = None) -> list[dict]:
    """Return a list of [{text, offset, reason}] flagging emotionally charged
    or evaluative phrases. Offsets are character indices into `text` (best
    effort — model may miss on long text)."""
    p = _provider(provider)
    if not p or not text.strip():
        return []

    user = f"""Identify emotionally loaded, evaluative, or rhetorically charged phrases in the passage below.
Skip purely factual statements. Up to 12 phrases.

For each phrase, return the EXACT substring as it appears, plus a short reason (<= 12 words) explaining why it is loaded.

Respond with JSON: {{"phrases": [{{"text": "...", "reason": "..."}}, ...]}}

PASSAGE:
\"\"\"
{text}
\"\"\""""

    data = safe_json_complete(p, SYSTEM_LINGUIST, user, fallback={"phrases": []})
    out: list[dict] = []
    for item in data.get("phrases", []) or []:
        phrase = (item.get("text") or "").strip()
        if not phrase:
            continue
        offset = text.find(phrase)
        out.append({
            "text": phrase,
            "offset": offset,
            "reason": (item.get("reason") or "")[:140],
        })
    return out


def compute_source_diversity(text: str, provider: Optional[ModelProvider] = None) -> dict:
    """Return {quoted_entities, anonymous_count, score} where score is 0..1
    (higher = more diverse sourcing)."""
    p = _provider(provider)
    fallback = {"quoted_entities": [], "anonymous_count": 0, "score": 0.0}
    if not p or not text.strip():
        return fallback

    user = f"""Identify the named sources QUOTED or PARAPHRASED in this article (people, organizations, agencies). Also count the number of anonymous attributions ("a senior official", "sources said", "people familiar", etc.).

Score source diversity from 0 to 1, where:
  0 = no sourcing or single perspective
  1 = many distinct sources spanning multiple viewpoints/sides

Respond with JSON: {{"quoted_entities": ["..."], "anonymous_count": <int>, "score": <float 0..1>}}

ARTICLE:
\"\"\"
{text}
\"\"\""""

    data = safe_json_complete(p, SYSTEM_LINGUIST, user, fallback=fallback)
    try:
        return {
            "quoted_entities": [str(e) for e in (data.get("quoted_entities") or [])][:30],
            "anonymous_count": int(data.get("anonymous_count") or 0),
            "score": max(0.0, min(1.0, float(data.get("score") or 0.0))),
        }
    except (TypeError, ValueError):
        return fallback


def compute_headline_body_skew(
    headline: str,
    body: str,
    provider: Optional[ModelProvider] = None,
) -> dict:
    """Return {headline_tone, body_tone, delta} with each tone in [-1, 1]
    (negative = critical/alarming, positive = approving/celebratory)."""
    p = _provider(provider)
    fallback = {"headline_tone": 0.0, "body_tone": 0.0, "delta": 0.0}
    if not p or (not headline.strip() and not body.strip()):
        return fallback

    user = f"""Score the emotional/evaluative tone of the HEADLINE and BODY independently. Tone is a float in [-1, 1]:
  -1 = strongly critical / alarming / negative
   0 = neutral / factual
  +1 = strongly approving / celebratory / positive

Respond with JSON: {{"headline_tone": <float>, "body_tone": <float>}}

HEADLINE:
\"\"\"
{headline}
\"\"\"

BODY:
\"\"\"
{body}
\"\"\""""

    data = safe_json_complete(p, SYSTEM_LINGUIST, user, fallback={"headline_tone": 0.0, "body_tone": 0.0})
    try:
        ht = max(-1.0, min(1.0, float(data.get("headline_tone") or 0.0)))
        bt = max(-1.0, min(1.0, float(data.get("body_tone") or 0.0)))
    except (TypeError, ValueError):
        return fallback
    return {"headline_tone": ht, "body_tone": bt, "delta": ht - bt}
