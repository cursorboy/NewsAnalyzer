from __future__ import annotations

from dataclasses import dataclass
from typing import Optional
import tldextract

# Minimal seed mapping; expand later
OUTLET_BIAS: dict[str, float] = {
    "reuters.com": 0.0,
    "apnews.com": 0.0,
    "bbc.com": 0.0,
    "nytimes.com": -0.4,
    "washingtonpost.com": -0.4,
    "foxnews.com": 0.6,
    "wsj.com": 0.2,
    "thehill.com": 0.2,
    "breitbart.com": 0.9,
}


@dataclass
class Classification:
    score: float
    confidence: float
    method: str


def extract_domain(url: str) -> Optional[str]:
    try:
        parts = tldextract.extract(url)
        if not parts.domain:
            return None
        domain = ".".join(p for p in [parts.domain, parts.suffix] if p)
        return domain.lower()
    except Exception:
        return None


def classify_by_outlet(url: str) -> Classification:
    domain = extract_domain(url) or ""
    if domain in OUTLET_BIAS:
        return Classification(score=OUTLET_BIAS[domain], confidence=0.9, method="outlet")
    return Classification(score=0.0, confidence=0.3, method="unknown") 