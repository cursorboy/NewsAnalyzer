"""Multi-signal Headline Rewrite scoring.

Score = weighted sum of seven signals, normalized to 0..100 and returned with a
per-signal breakdown so the frontend can show "you nailed neutrality but lost
meaning" feedback.

Default weights (sum to 1.0):
    bias_delta         0.30
    cosine_meaning     0.20
    nli_entailment     0.20
    loaded_reduction   0.10
    length_similarity  0.10
    ner_preservation   0.07
    hedge_penalty      0.03
"""
from __future__ import annotations

import math
import re
from typing import Optional

from .linguistic import detect_loaded_language
from .provider import ModelProvider, get_provider, safe_json_complete


WEIGHTS: dict[str, float] = {
    "bias_delta": 0.30,
    "cosine_meaning": 0.20,
    "nli_entailment": 0.20,
    "loaded_reduction": 0.10,
    "length_similarity": 0.10,
    "ner_preservation": 0.07,
    "hedge_penalty": 0.03,
}

HEDGE_WORDS = {
    "might", "possibly", "perhaps", "may", "could", "seemingly", "apparently",
}
HEDGE_THRESHOLD = 1


SYSTEM_SCORER = (
    "You are a careful linguistic analyst. Always respond with valid JSON. "
    "Do not include any prose outside the JSON."
)


def _resolve(provider: Optional[ModelProvider]) -> Optional[ModelProvider]:
    if provider is not None:
        return provider
    try:
        return get_provider()
    except Exception:
        return None


def _bias_score(text: str, provider: ModelProvider) -> float:
    """Float in [-1, 1]: negative = left, positive = right. Magnitude = bias."""
    user = f"""Score the political bias of this headline on a scale from -1.0 (far left) to +1.0 (far right). 0.0 is neutral.
Respond with JSON: {{"bias": <float>}}

HEADLINE: "{text}\""""
    data = safe_json_complete(provider, SYSTEM_SCORER, user, fallback={"bias": 0.0})
    try:
        return max(-1.0, min(1.0, float(data.get("bias") or 0.0)))
    except (TypeError, ValueError):
        return 0.0


def bias_delta(orig: str, rewrite: str, provider: ModelProvider) -> float:
    """Reduction toward neutral (0..1). 1.0 = perfect neutralization, 0 = no
    improvement (or made worse — clamped at 0)."""
    o = abs(_bias_score(orig, provider))
    r = abs(_bias_score(rewrite, provider))
    if o <= 0.0:
        return 1.0 if r == 0.0 else max(0.0, 1.0 - r)
    return max(0.0, min(1.0, (o - r) / o))


def length_similarity(orig: str, rewrite: str) -> float:
    lo, lr = len(orig), len(rewrite)
    if lo == 0 and lr == 0:
        return 1.0
    return 1.0 - abs(lo - lr) / max(lo, lr)


def _cosine(a: list[float], b: list[float]) -> float:
    if not a or not b:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def cosine_meaning(orig: str, rewrite: str, provider: ModelProvider) -> float:
    try:
        ea = provider.embed(orig)
        eb = provider.embed(rewrite)
    except Exception:
        return 0.0
    return max(0.0, min(1.0, _cosine(ea, eb)))


def loaded_language_reduction(orig: str, rewrite: str, provider: Optional[ModelProvider] = None) -> float:
    """Concrete reduction in charged vocabulary, using the same loaded-language
    detector built for article analysis. Returns 0..1."""
    p = _resolve(provider)
    if p is None:
        return 0.0
    o = len(detect_loaded_language(orig, p))
    r = len(detect_loaded_language(rewrite, p))
    if o == 0:
        return 1.0 if r == 0 else 0.5  # no loaded words to reduce; modest credit
    return max(0.0, min(1.0, (o - r) / o))


def _ner(text: str, provider: ModelProvider) -> set[str]:
    user = f"""Extract named entities (people, organizations, places) from the text. Return canonical surface forms only.
Respond with JSON: {{"entities": ["..."]}}

TEXT: "{text}\""""
    data = safe_json_complete(provider, SYSTEM_SCORER, user, fallback={"entities": []})
    return {str(e).strip().lower() for e in (data.get("entities") or []) if str(e).strip()}


def ner_preservation(orig: str, rewrite: str, provider: ModelProvider) -> float:
    a = _ner(orig, provider)
    b = _ner(rewrite, provider)
    if not a and not b:
        return 1.0
    union = a | b
    if not union:
        return 1.0
    return len(a & b) / len(union)


def hedge_penalty(rewrite: str) -> float:
    """Negative penalty: returns a number <= 0. Frontend adds it to the
    weighted sum, so over-hedging drops the final score."""
    tokens = re.findall(r"[A-Za-z']+", rewrite.lower())
    count = sum(1 for t in tokens if t in HEDGE_WORDS)
    if count <= HEDGE_THRESHOLD:
        return 0.0
    excess = count - HEDGE_THRESHOLD
    return -min(1.0, 0.25 * excess)


def nli_entailment(orig: str, rewrite: str, provider: ModelProvider) -> float:
    """Bidirectional textual entailment via the provider. 0..1."""
    user = f"""Decide if each statement entails the other (i.e. preserves the same factual claim and subject).

A: "{orig}"
B: "{rewrite}"

Score forward (A entails B) and backward (B entails A) each in [0, 1]:
  1 = clearly entails
  0.5 = compatible but not entailing
  0 = contradicts or unrelated

Respond with JSON: {{"forward": <float>, "backward": <float>}}"""
    data = safe_json_complete(provider, SYSTEM_SCORER, user, fallback={"forward": 0.0, "backward": 0.0})
    try:
        f = max(0.0, min(1.0, float(data.get("forward") or 0.0)))
        b = max(0.0, min(1.0, float(data.get("backward") or 0.0)))
    except (TypeError, ValueError):
        return 0.0
    return (f + b) / 2.0


def score_rewrite(original: str, rewrite: str) -> dict:
    """Aggregate all signals into {total: 0-100, breakdown, weights}."""
    provider = _resolve(None)

    if provider is None:
        # No provider configured — degrade gracefully to length+hedge only.
        breakdown = {
            "bias_delta": 0.0,
            "cosine_meaning": 0.0,
            "nli_entailment": 0.0,
            "loaded_reduction": 0.0,
            "length_similarity": length_similarity(original, rewrite),
            "ner_preservation": 0.0,
            "hedge_penalty": hedge_penalty(rewrite),
        }
    else:
        breakdown = {
            "bias_delta": bias_delta(original, rewrite, provider),
            "cosine_meaning": cosine_meaning(original, rewrite, provider),
            "nli_entailment": nli_entailment(original, rewrite, provider),
            "loaded_reduction": loaded_language_reduction(original, rewrite, provider),
            "length_similarity": length_similarity(original, rewrite),
            "ner_preservation": ner_preservation(original, rewrite, provider),
            "hedge_penalty": hedge_penalty(rewrite),
        }

    weighted = sum(breakdown[k] * WEIGHTS[k] for k in WEIGHTS)
    total = max(0.0, min(100.0, round(weighted * 100, 1)))

    return {
        "total": total,
        "breakdown": breakdown,
        "weights": dict(WEIGHTS),
    }
