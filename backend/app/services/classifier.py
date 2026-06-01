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


# Charged framing words used by the heuristic fallback reasoning. Compact,
# not exhaustive — the goal is to surface a SPECIFIC piece of language from
# the headline rather than punt to "outlet's editorial stance."
_LEFT_LOADED_WORDS = {
    "slammed", "blasted", "gutted", "stripped", "draconian", "extreme",
    "cruel", "harsh", "reckless", "giveaway", "billionaires", "corporate",
    "regressive", "ripped", "lashed", "decried", "rebuked", "denounced",
    "attacked", "deplored", "dangerous",
}
_RIGHT_LOADED_WORDS = {
    "radical", "woke", "rammed", "imposed", "lectured", "elite", "elites",
    "establishment", "open-borders", "lawless", "agenda", "activist",
    "reckoning", "weaponized", "unhinged", "extreme",
}


def _heuristic_reasoning(title: str, snippet: str, score: float) -> str:
    """Generate objective, content-based reasoning when the LLM is unavailable.
    Pulls specific framing words from the headline + snippet rather than
    falling back to 'because of the outlet's editorial stance.'"""
    text = f"{title} {snippet}".lower()
    left_hits = [w for w in _LEFT_LOADED_WORDS if w in text]
    right_hits = [w for w in _RIGHT_LOADED_WORDS if w in text]

    pieces: list[str] = []
    if left_hits:
        pieces.append(
            f'The text uses framing language like "{left_hits[0]}"'
            + (f' and "{left_hits[1]}"' if len(left_hits) > 1 else '')
            + ', associated with progressive editorial voice.'
        )
    if right_hits:
        pieces.append(
            f'The text uses framing language like "{right_hits[0]}"'
            + (f' and "{right_hits[1]}"' if len(right_hits) > 1 else '')
            + ', associated with conservative editorial voice.'
        )
    if not pieces:
        # No specific framing words detected. Be honest about the limitation
        # rather than blaming the outlet.
        if abs(score) < 0.15:
            return "No strongly charged framing detected in the headline or lede; reads near-neutral on visible cues."
        direction = "left" if score < 0 else "right"
        return (
            f"Score positions this article toward the {direction}, but no "
            f"charged framing words surfaced in the headline. The score "
            f"reflects broader content cues that require deeper analysis to articulate."
        )
    return " ".join(pieces)


SYSTEM_PROMPT = (
    "You are a forensic media analyst trained to detect political slant in US news writing. "
    "You score articles aggressively and decisively. You do NOT default to neutral when uncertain — "
    "every piece of US political journalism leans somewhere, and your job is to find where. "
    "Reuters and the AP are your nearest reference points for genuine 0.0 neutrality; "
    "almost everything else has detectable directional framing. "
    "Scores in the [-0.1, +0.1] range are RARE — reserve them for genuine wire-service copy. "
    "If you find yourself wanting to score 0.1 or -0.1, ask: would the opposite-leaning outlet "
    "write this story the same way? If no, push the score further from center. "
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
            f"\nOutlet baseline: {source} has a known editorial leaning near {prior:+.1f} "
            f"({direction}). Use this as a STARTING anchor only — your job is to evaluate "
            f"THIS specific article. A sober AP-style piece from a left-leaning outlet may "
            f"score 0.3 closer to center; an especially heated piece may score 0.2 further out. "
            f"Your reasoning MUST focus on this article's framing choices — DO NOT write "
            f"generic statements like 'based on the outlet's editorial stance'. Cite specific "
            f"words/phrases from the headline or lede.\n"
        )

    return f"""
Score this article for US political bias on -1.0 (far left) to +1.0 (far right). 0.0 is reserved for true wire-service neutrality (AP/Reuters style). Most articles are NOT 0.0.

The text below is the article's HEADLINE + LEDE (first paragraphs). This is the section where editorial framing is most concentrated — leading verbs, first-quote choice, adjectives applied to political actors. Score based on the framing decisions visible HERE, not on what a longer article might say.

HEADLINE: {title}
LEDE: {snippet}
SOURCE: {source}
{prior_block}
{_FEW_SHOT}

Now score this article. In your reasoning:
- Cite at least TWO specific words, phrases, or framing choices from the headline or lede that pushed the score in the direction you chose. Quote them directly.
- DO NOT cite the publisher's history, masthead, or "editorial stance" as the basis for the score. Those are inputs to your prior, not your reasoning. If you mention the outlet at all, it must be in the form "the outlet's typical lean would suggest X but this article's framing of [phrase] pulls toward Y." NEVER write "based on this outlet's editorial stance" or "consistent with the publisher's historical reporting" as the reasoning.
- Be specific — generic reasoning like "the article seems balanced" or "the language is loaded" is not acceptable. Quote actual words.

Respond in this exact JSON format:
{{
    "bias_score": <float between -1.0 and 1.0>,
    "confidence": <float between 0.0 and 1.0>,
    "reasoning": "<2-4 sentences citing specific words/framings from the headline or lede>"
}}
"""


def _classify_with_ai_sync(title: str, snippet: str, source: str) -> Classification:
    try:
        provider = get_provider()
    except Exception as e:
        print(f"Debug: provider unavailable, falling back to outlet: {e}")
        return classify_by_outlet(f"https://{source}", title=title, snippet=snippet)

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

        # Blend the outlet prior with the LLM's article-specific reading. The
        # weighting (0.45 prior, 0.55 LLM) lets the article's framing dominate
        # while keeping a known-leaning outlet from being washed to neutral on
        # one soft piece. Previously this was 0.6/0.4, which pulled every
        # article toward the outlet center and flattened the spectrum.
        # No "decisiveness floor" or content-based nudge here — if the LLM
        # genuinely reads neutral and the prior agrees, we trust that and
        # avoid manufacturing skew from incidental word matches.
        if prior is not None:
            score = 0.45 * prior + 0.55 * score

        # Sanitize: if the LLM still leaks "based on the outlet's editorial
        # stance" boilerplate (rare with the strengthened prompt, but possible),
        # replace with a heuristic reasoning that cites words from the article.
        raw_reasoning = (analysis.get("reasoning") or "").strip()
        bad_phrases = (
            "based on the outlet",
            "based on this outlet",
            "outlet's editorial stance",
            "outlet's known editorial",
            "publisher's editorial",
            "publisher's history",
            "historical reporting patterns",
        )
        if not raw_reasoning or any(p in raw_reasoning.lower() for p in bad_phrases):
            raw_reasoning = _heuristic_reasoning(title, snippet, score)

        return Classification(
            score=max(-1.0, min(1.0, score)),
            confidence=float(analysis["confidence"]),
            method="ai" if prior is None else "ai+prior",
            reasoning=raw_reasoning,
        )
    except Exception as e:
        print(f"Debug: AI classification failed: {e}")
        return classify_by_outlet(f"https://{source}", title=title, snippet=snippet)


async def classify_with_ai(title: str, snippet: str, source: str) -> Classification:
    """Async wrapper around the sync provider call so existing async callers
    in api/index.py keep working unchanged."""
    if not settings.openai_api_key:
        return classify_by_outlet(f"https://{source}", title=title, snippet=snippet)
    return await asyncio.to_thread(_classify_with_ai_sync, title, snippet, source)


# ─────────────────────────────────────────────────────────────────────────────
# Full 8-dimension scorer used by /api/analyze and /api/articles/:id detail
# ─────────────────────────────────────────────────────────────────────────────

DIMENSIONS_SYSTEM_PROMPT = (
    "You are a forensic media analyst. You score US political news articles on "
    "five orthogonal framing dimensions, returning numeric values that reflect the "
    "article's framing choices. You never default to neutral when there is signal."
)


def _build_dimensions_prompt(title: str, body: str, source: str) -> str:
    return f"""
Score this article on five framing dimensions. Use the article's HEADLINE + LEDE (opening paragraphs) — that's where editorial framing concentrates.

HEADLINE: {title}
LEDE: {body}
SOURCE: {source}

Score these on the specified ranges. Most articles are NOT 0.0 on the bipolar ones.

1. factuality (0..1, where 1.0 = sourced/cited claims, 0.0 = pure opinion/unverifiable assertions)
2. economic (-1..+1, where -1 = pro-redistribution / anti-corporate framing, +1 = pro-market / pro-business framing)
3. social (-1..+1, where -1 = progressive framing on identity/culture, +1 = traditional framing on identity/culture)
4. establishment (-1..+1, where -1 = anti-establishment / outsider framing, +1 = pro-establishment / institutional framing)
5. sensationalism (0..1, where 1.0 = heavy emotional language, breathless tone, 0.0 = dry wire-service tone)

Cite at least one specific phrase from the article that drove each dimension.

Respond in this exact JSON format. All numeric values are floats.
{{
    "factuality": <0..1>,
    "economic": <-1..1>,
    "social": <-1..1>,
    "establishment": <-1..1>,
    "sensationalism": <0..1>,
    "rationale": "<one sentence per dimension citing specific phrases>"
}}
"""


@dataclass
class Dimensions:
    factuality: float
    economic: float
    social: float
    establishment: float
    sensationalism: float
    rationale: Optional[str] = None


def _score_dimensions_sync(title: str, body: str, source: str) -> Dimensions:
    """Compute the 5 framing dimensions in one LLM call. Falls back to safe
    defaults on any failure so the analyze endpoint never crashes."""
    fallback = Dimensions(
        factuality=0.6,
        economic=0.0,
        social=0.0,
        establishment=0.0,
        sensationalism=0.0,
        rationale=None,
    )
    if not settings.openai_api_key:
        return fallback
    try:
        provider = get_provider()
    except Exception as e:
        print(f"Debug: dimensions provider unavailable: {e}")
        return fallback

    try:
        content = provider.complete(
            system=DIMENSIONS_SYSTEM_PROMPT,
            user=_build_dimensions_prompt(title, body or title, source),
            response_format={"type": "json_object"},
        )
        d = json.loads(content)
        clamp01 = lambda v: max(0.0, min(1.0, float(v)))
        clampUnit = lambda v: max(-1.0, min(1.0, float(v)))
        return Dimensions(
            factuality=clamp01(d.get("factuality", 0.6)),
            economic=clampUnit(d.get("economic", 0.0)),
            social=clampUnit(d.get("social", 0.0)),
            establishment=clampUnit(d.get("establishment", 0.0)),
            sensationalism=clamp01(d.get("sensationalism", 0.0)),
            rationale=d.get("rationale"),
        )
    except Exception as e:
        print(f"Debug: dimensions scoring failed: {e}")
        return fallback


async def score_dimensions(title: str, body: str, source: str) -> Dimensions:
    return await asyncio.to_thread(_score_dimensions_sync, title, body, source)


def classify_by_outlet(url: str, title: str = "", snippet: str = "") -> Classification:
    """Outlet-baseline classifier used as the fallback when the LLM is
    unavailable. The reasoning text describes content cues (charged words in
    title/snippet) rather than punting to 'this outlet leans X.' Outlet
    history is an INPUT to the score, never the explanation given to the user."""
    domain = extract_domain(url) or ""
    if domain in OUTLET_BIAS:
        score = OUTLET_BIAS[domain]
        return Classification(
            score=score,
            confidence=0.9,
            method="outlet",
            reasoning=_heuristic_reasoning(title, snippet, score),
        )
    return Classification(
        score=0.0,
        confidence=0.3,
        method="unknown",
        reasoning=_heuristic_reasoning(title, snippet, 0.0),
    )


async def classify_hybrid(title: str, snippet: str, source: str, ai_limit_reached: bool = False) -> Classification:
    """
    Hybrid classification:
    - When the OpenAI key is configured, ALWAYS run the LLM (with the outlet
      prior as a documented anchor in the prompt). This produces article-specific
      reasoning that quotes the headline/lede instead of returning generic
      "based on outlet's editorial stance" boilerplate for every article.
    - When the LLM is unavailable (no key, rate-limited), fall back to the
      outlet lookup so search still returns scored results — slower path uses
      the outlet baseline as the score with a generic reasoning.
    """
    if not ai_limit_reached and settings.openai_api_key:
        return await classify_with_ai(title, snippet, source)

    # Fallback path — no LLM available. Pass title + snippet so the heuristic
    # reasoning surfaces actual framing words from the article.
    return classify_by_outlet(f"https://{source}", title=title, snippet=snippet)