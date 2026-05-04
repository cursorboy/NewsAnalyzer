from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from typing import Optional

import tldextract

from ..config import settings
from .provider import get_provider

# Comprehensive political news source classification
OUTLET_BIAS: dict[str, float] = {
    # Far Left (-0.9 to -1.0)
    "jacobinmag.com": -1.0,
    "socialistworker.org": -1.0,
    "wsws.org": -1.0,
    "motherjones.com": -0.9,
    "thenation.com": -0.9,
    "commondreams.org": -0.9,
    "alternet.org": -0.9,
    "truthout.org": -0.9,
    "democracynow.org": -0.9,
    "counterpunch.org": -0.9,
    
    # Clear Left (-0.7 to -0.8)
    "theintercept.com": -0.8,
    "salon.com": -0.8,
    "rawstory.com": -0.8,
    "thedailybeast.com": -0.8,
    "thinkprogress.org": -0.8,
    "mediamatters.org": -0.8,
    "talkingpointsmemo.com": -0.8,
    "democraticunderground.com": -0.8,
    "crooksandliars.com": -0.8,
    "dailykos.com": -0.8,
    "msnbc.com": -0.7,
    "huffpost.com": -0.7,
    "vox.com": -0.7,
    "slate.com": -0.7,
    "theroot.com": -0.7,
    "jezebel.com": -0.7,
    "buzzfeednews.com": -0.7,
    
    # Left Leaning (-0.4 to -0.6) - AI Analysis Recommended
    "nytimes.com": -0.5,
    "washingtonpost.com": -0.5,
    "cnn.com": -0.5,
    "theguardian.com": -0.5,
    "npr.org": -0.4,
    "pbs.org": -0.4,
    "theatlantic.com": -0.4,
    "newyorker.com": -0.4,
    
    # Center (-0.3 to +0.3)
    "reuters.com": 0.0,
    "apnews.com": 0.0,
    "bbc.com": 0.0,
    "c-span.org": 0.0,
    "allsides.com": 0.0,
    "usatoday.com": -0.1,
    "politico.com": 0.1,
    "thehill.com": 0.1,
    "axios.com": 0.1,
    "time.com": -0.1,
    "newsweek.com": -0.1,
    "csmonitor.com": 0.2,
    "realclearpolitics.com": 0.2,
    "abcnews.go.com": 0.0,
    "cbsnews.com": -0.1,
    "nbcnews.com": -0.2,
    "bloomberg.com": 0.1,
    "marketwatch.com": 0.1,
    "yahoo.com": 0.0,
    "msn.com": 0.0,
    
    # Right Leaning (+0.4 to +0.6) - AI Analysis Recommended  
    "wsj.com": 0.4,
    "economist.com": 0.3,
    "forbes.com": 0.3,
    "reason.com": 0.5,
    "nypost.com": 0.5,
    "washingtontimes.com": 0.6,
    "theepochtimes.com": 0.5,
    "washingtonexaminer.com": 0.6,
    "spectator.org": 0.5,
    "city-journal.org": 0.5,
    
    # Clear Right (+0.7 to +0.8)
    "foxnews.com": 0.7,
    "dailywire.com": 0.8,
    "theblaze.com": 0.8,
    "redstate.com": 0.8,
    "townhall.com": 0.8,
    "pjmedia.com": 0.8,
    "americanthinker.com": 0.8,
    "thefederalist.com": 0.8,
    "nationalreview.com": 0.7,
    "theamericanconservative.com": 0.7,
    "dailycaller.com": 0.7,
    "freebeacon.com": 0.7,
    "hotair.com": 0.7,
    "twitchy.com": 0.7,
    "dailysignal.com": 0.7,
    "cnsnews.com": 0.7,
    "thepostmillennial.com": 0.7,
    "rightscoop.com": 0.8,
    "conservativereview.com": 0.8,
    "theepochtimes.com": 0.7,
    "lifenews.com": 0.8,
    
    # Far Right (+0.9 to +1.0)
    "breitbart.com": 1.0,
    "oann.com": 1.0,
    "newsmax.com": 0.9,
    "thegatewaypundit.com": 1.0,
    "wnd.com": 0.9,
    "infowars.com": 1.0,
}


@dataclass
class Classification:
    score: float
    confidence: float
    method: str
    reasoning: Optional[str] = None


def extract_domain(url: str) -> Optional[str]:
    try:
        parts = tldextract.extract(url)
        if not parts.domain:
            return None
        domain = ".".join(p for p in [parts.domain, parts.suffix] if p)
        return domain.lower()
    except Exception:
        return None


SYSTEM_PROMPT = (
    "You are a forensic media analyst trained to detect political slant in US news writing. "
    "You score articles aggressively and decisively. You do NOT default to neutral when uncertain — "
    "every piece of US political journalism leans somewhere, and your job is to find where. "
    "Reuters and the AP are your nearest reference points for genuine 0.0 neutrality; "
    "almost everything else has detectable directional framing. "
    "You weigh word-level cues (loaded verbs, partisan adjectives), framing of policy "
    "(who is the actor, who is the victim, what is normalized vs. what is contested), "
    "source selection (which experts are quoted, which voices are dismissed or excluded), "
    "and what a comparable article from the opposite-leaning outlet would say differently."
)


_FEW_SHOT = """
Calibration anchors (use these as scoring references):

  -1.0 — Jacobin, Socialist Worker, WSWS (revolutionary-left framing, capitalism is the enemy)
  -0.8 — The Intercept, Salon, Daily Beast, Mother Jones (clearly progressive, partisan-left framing)
  -0.7 — MSNBC, HuffPost, Vox, Slate (consistent left framing on most political stories)
  -0.5 — CNN, NYT, Washington Post, Guardian (mainstream-left bias: word choice favors progressive
          framing, sources skew left, conservative positions are described rather than steelmanned)
  -0.3 — Atlantic, New Yorker, NPR (sophisticated-left framing, more measured but still directional)
   0.0 — Reuters, AP, BBC (true wire-service neutrality, dry factual reporting, balanced sourcing)
  +0.3 — Economist, Forbes (center-right but globalist/business-leaning)
  +0.5 — WSJ news pages, NY Post, Washington Examiner (clearly right-leaning framing)
  +0.7 — Fox News, National Review, Daily Caller (consistent right framing on most stories)
  +0.8 — Daily Wire, The Blaze, Townhall (clearly partisan-right framing)
  +1.0 — Breitbart, OAN, Newsmax, Gateway Pundit (revolutionary-right framing)

Concrete cues that push the score toward a side:

LEFT-leaning cues:
- Verbs framing conservative action negatively: "slammed", "blasted", "ignored", "downplayed"
- Adjectives framing conservative policy as harmful: "harsh", "draconian", "cruel", "extreme"
- Centering of marginalized identities and equity language
- Quoting progressive policy advocates as default expert voices
- Framing GOP positions as "controversial" while DEM equivalents are "ambitious"
- Climate/healthcare/immigration framed in progressive activist terms

RIGHT-leaning cues:
- Verbs framing progressive action negatively: "imposed", "rammed through", "lectured"
- Adjectives framing progressive policy as harmful: "radical", "woke", "reckless", "extreme"
- Centering of family/faith/sovereignty language
- Quoting business and conservative think-tank voices as default experts
- Framing DEM positions as "controversial" while GOP equivalents are "principled"
- Crime/immigration/economy framed in conservative framing terms

Be decisive. A score of 0.0 is reserved for ACTUAL wire-service neutrality. If the article shows
ANY of the cues above, score accordingly — do not hedge to 0.1 or -0.1.
"""


def _build_prompt(title: str, snippet: str, source: str, prior: float | None = None) -> str:
    prior_block = ""
    if prior is not None:
        direction = "left" if prior < 0 else "right" if prior > 0 else "center"
        prior_block = (
            f"\nOutlet prior: {source} has a known editorial baseline near {prior:+.1f} "
            f"({direction}). Use this as a starting anchor, but adjust UP or DOWN based on the "
            f"specific framing of THIS article. An especially sober AP-style piece from a "
            f"left-leaning outlet might score 0.3 closer to center; an especially heated piece "
            f"might score 0.2 further out.\n"
        )

    return f"""
Score this article for US political bias on -1.0 (far left) to +1.0 (far right). 0.0 is reserved for true wire-service neutrality (AP/Reuters style). Most articles are NOT 0.0.

ARTICLE TITLE: {title}
ARTICLE SNIPPET: {snippet}
SOURCE: {source}
{prior_block}
{_FEW_SHOT}

Now score this article. In your reasoning, cite at least TWO specific words, phrases, or framing choices from the title or snippet that pushed the score in the direction you chose. Be specific.

Respond in this exact JSON format:
{{
    "bias_score": <float between -1.0 and 1.0>,
    "confidence": <float between 0.0 and 1.0>,
    "reasoning": "<2-4 sentences citing specific words/framings from the article>"
}}
"""


def _classify_with_ai_sync(title: str, snippet: str, source: str) -> Classification:
    try:
        provider = get_provider()
    except Exception as e:
        print(f"Debug: provider unavailable, falling back to outlet: {e}")
        return classify_by_outlet(f"https://{source}")

    domain = extract_domain(f"https://{source}") or source.lower()
    prior = OUTLET_BIAS.get(domain)

    try:
        content = provider.complete(
            system=SYSTEM_PROMPT,
            user=_build_prompt(title, snippet, source, prior=prior),
            response_format={"type": "json_object"},
        )
        analysis = json.loads(content)
        score = float(analysis["bias_score"])

        # If we have an outlet prior, blend it with the LLM result so the model
        # cannot wash a known-leaning outlet to neutral on a single soft article.
        if prior is not None:
            score = 0.6 * prior + 0.4 * score

        return Classification(
            score=max(-1.0, min(1.0, score)),
            confidence=float(analysis["confidence"]),
            method="ai" if prior is None else "ai+prior",
            reasoning=analysis.get("reasoning"),
        )
    except Exception as e:
        print(f"Debug: AI classification failed: {e}")
        return classify_by_outlet(f"https://{source}")


async def classify_with_ai(title: str, snippet: str, source: str) -> Classification:
    """Async wrapper around the sync provider call so existing async callers
    in api/index.py keep working unchanged."""
    if not settings.openai_api_key:
        return classify_by_outlet(f"https://{source}")
    return await asyncio.to_thread(_classify_with_ai_sync, title, snippet, source)


def classify_by_outlet(url: str) -> Classification:
    domain = extract_domain(url) or ""
    if domain in OUTLET_BIAS:
        reasoning = f"Based on {domain}'s known editorial stance and historical reporting patterns."
        return Classification(
            score=OUTLET_BIAS[domain], 
            confidence=0.9, 
            method="outlet",
            reasoning=reasoning
        )
    return Classification(
        score=0.0, 
        confidence=0.3, 
        method="unknown",
        reasoning="Unknown source - no bias information available."
    )


async def classify_hybrid(title: str, snippet: str, source: str, ai_limit_reached: bool = False) -> Classification:
    """
    Hybrid classification: Use outlet-based for known sources, AI for unknown sources
    This dramatically improves speed by avoiding unnecessary AI calls
    """
    domain = extract_domain(f"https://{source}") or ""
    
    # If it's a known outlet, use fast outlet-based classification
    if domain in OUTLET_BIAS:
        reasoning = f"Based on {domain}'s known editorial stance and historical reporting patterns."
        return Classification(
            score=OUTLET_BIAS[domain], 
            confidence=0.9, 
            method="outlet",
            reasoning=reasoning
        )
    
    # For unknown sources, use AI analysis (but respect limits)
    if not ai_limit_reached and settings.openai_api_key:
        return await classify_with_ai(title, snippet, source)
    
    # Fallback for unknown sources when AI limit reached
    return Classification(
        score=0.0, 
        confidence=0.3, 
        method="unknown",
        reasoning="Unknown source - no bias information available."
    ) 