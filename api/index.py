import json
import asyncio
import os
import re
import sys
import time
from typing import Optional
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

# File lives at <project>/api/index.py. Backend services live at
# <project>/backend/app/. Insert <project>/backend into sys.path so
# `from app.services...` imports resolve in the Vercel runtime.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.services.search import search_news, get_api_status
from app.services.classifier import (
    classify_with_ai,
    classify_by_outlet,
    classify_hybrid,
    extract_domain,
    score_dimensions,
)
from app.services.linguistic import (
    detect_loaded_language,
    compute_source_diversity,
    compute_headline_body_skew,
)
from app.services.headline_score import score_rewrite


def _zero_dimensions() -> dict:
    return {
        "factuality": 0.7,
        "economic": 0.0,
        "social": 0.0,
        "establishment": 0.0,
        "sensationalism": 0.0,
        "loaded_language": 0.0,
        "source_diversity": 0.0,
        "headline_body_skew": 0.0,
    }


def _fetch_url(url: str) -> tuple[str, str]:
    """Fetch a URL and extract (title, body_text). Best effort. Returns
    ("", "") on failure."""
    try:
        import httpx
        from bs4 import BeautifulSoup
    except Exception:
        return "", ""

    try:
        # 8s ceiling on URL body fetch. Slow paywalled / anti-bot sites take
        # ~15-30s; we'd rather fall back to snippet than blow the function
        # budget on a single page.
        with httpx.Client(timeout=8.0, follow_redirects=True, headers={
            "User-Agent": "Mozilla/5.0 (compatible; NewsAnalyzer/1.0)",
        }) as client:
            r = client.get(url)
            r.raise_for_status()
            html = r.text
    except Exception:
        return "", ""

    try:
        soup = BeautifulSoup(html, "html.parser")
        # Strip noise that pollutes body extraction
        for tag in soup(["script", "style", "nav", "footer", "header", "aside",
                          "form", "iframe", "noscript", "figure", "figcaption"]):
            tag.decompose()

        title = (soup.title.string if soup.title and soup.title.string else "") or ""
        og = soup.find("meta", property="og:title")
        if og and og.get("content"):
            title = og["content"]

        # Prefer <article>, then common article containers, then body.
        body_root = (
            soup.find("article")
            or soup.find(attrs={"role": "article"})
            or soup.find("main")
            or soup.find(attrs={"itemprop": "articleBody"})
            or soup.body
            or soup
        )

        # Take ONLY the lede + first 3 substantive paragraphs.
        # Bias signal (framing, loaded verbs, first-quote choice) is concentrated
        # in the opening — middle-of-article factual content dilutes it.
        # Skip very short paragraphs (likely captions, datelines, "Updated 2:14 PM" tags).
        MIN_PARAGRAPH_CHARS = 80
        MAX_PARAGRAPHS = 4  # lede + first 3
        kept: list[str] = []
        for p in body_root.find_all("p"):
            text = p.get_text(" ", strip=True)
            if len(text) < MIN_PARAGRAPH_CHARS:
                continue
            kept.append(text)
            if len(kept) >= MAX_PARAGRAPHS:
                break

        body = "\n\n".join(kept)
        return title.strip(), body.strip()
    except Exception:
        return "", ""


# ─────────────────────────────────────────────────────────────────────────────
# Simple in-memory TTL cache
# Same query/article within the TTL returns the IDENTICAL response. Two
# benefits: latency on repeat hits, and the response stays byte-identical
# (defeats stochastic-LLM-output as a leakage tell).
# Vercel keeps function instances warm for ~5–15 minutes, so this works for
# session-scoped repeat queries even though it's not persistent.
# ─────────────────────────────────────────────────────────────────────────────

_CACHE_TTL_SECONDS = 600  # 10 minutes
_response_cache: dict[str, tuple[float, object]] = {}


def _cache_get(key: str) -> Optional[object]:
    entry = _response_cache.get(key)
    if not entry:
        return None
    cached_at, value = entry
    if time.time() - cached_at > _CACHE_TTL_SECONDS:
        _response_cache.pop(key, None)
        return None
    return value


def _cache_put(key: str, value: object) -> None:
    _response_cache[key] = (time.time(), value)
    # Evict oldest entries if cache grows past a sane size (keeps memory bounded
    # in long-running warm functions). Cheap LRU-ish: keep newest 200.
    if len(_response_cache) > 200:
        oldest = sorted(_response_cache.items(), key=lambda kv: kv[1][0])[: len(_response_cache) - 200]
        for k, _ in oldest:
            _response_cache.pop(k, None)


def _public_method(internal: str) -> str:
    """Sanitize the classifier's internal method label so the client never
    sees 'ai' / 'ai+prior' (which would tell a savvy viewer there's an LLM
    behind it). Everything routed through the model returns 'model'; outlet
    baselines stay labeled because that's an honest description."""
    if internal in ("ai", "ai+prior"):
        return "model"
    return internal  # 'outlet' or 'unknown' pass through


_LLM_TELL_PATTERNS = [
    # First-person LLM-isms occasionally leak past the prompt.
    (r"\bas an? AI(?:\s+(?:language\s+model|assistant))?\b[\.,]?\s*", ""),
    (r"\bI(?:'m| am)\s+(?:an?\s+AI|a\s+language\s+model)\b[\.,]?\s*", ""),
    (r"\b(?:in my (?:assessment|analysis|opinion))\b[\.,]?\s*", ""),
    (r"\b(?:based on (?:my|the))\s+analysis\b[\.,]?\s*", ""),
    (r"\bI (?:would|will|cannot|can(?:'t| not)|am unable to|note that|believe|think|see|find|assess|evaluate|consider)\b\s*", ""),
    (r"\bIt is important to note that\b[\.,]?\s*", ""),
    (r"\bIt is worth noting that\b[\.,]?\s*", ""),
    (r"\bFurthermore,?\s*", ""),
    (r"\bMoreover,?\s*", ""),
    (r"\bIn conclusion,?\s*", ""),
    (r"\bOverall,?\s*", ""),
    # Outlet-stance boilerplate that occasionally slips through despite the
    # prompt's explicit ban.
    (r"\bbased on (?:the\s+)?outlet's? (?:editorial\s+)?stance\b[\.,]?\s*", ""),
    (r"\bconsistent with (?:the\s+)?(?:publisher's?|outlet's?) (?:historical\s+)?reporting (?:patterns?)?\b[\.,]?\s*", ""),
]


def _sanitize_reasoning(text: Optional[str]) -> Optional[str]:
    """Strip LLM tells from reasoning text before it reaches the client."""
    if not text:
        return text
    out = text
    for pattern, replacement in _LLM_TELL_PATTERNS:
        out = re.sub(pattern, replacement, out, flags=re.IGNORECASE)
    # Collapse whitespace introduced by stripping
    out = re.sub(r"\s{2,}", " ", out).strip()
    # Capitalize first letter if we lopped off a leading qualifier
    if out and out[0].islower():
        out = out[0].upper() + out[1:]
    return out or text  # never return empty if we accidentally stripped everything


def _build_article_detail(article_id: str, title: str, body: str, url: str = "", source: str = "") -> dict:
    """Run classifier + dimensions scorer + linguistic services and return an
    ArticleDetail-shaped dict with all 8 bias dimensions populated.

    All five LLM-backed calls run IN PARALLEL via asyncio.gather to keep total
    latency under the Vercel function's 60s ceiling. Sync linguistic functions
    are wrapped in to_thread so they don't block the event loop.
    """
    snippet = body[:600] if body else ""
    src = source or extract_domain(url) or "unknown"

    text_for_linguist = body or title

    async def _run_all():
        cls_t = classify_with_ai(title or "", snippet, src)
        dim_t = score_dimensions(title or "", body or snippet, src)
        loaded_t = asyncio.to_thread(detect_loaded_language, text_for_linguist)
        sd_t = asyncio.to_thread(compute_source_diversity, text_for_linguist)
        hbs_t = asyncio.to_thread(compute_headline_body_skew, title or "", body or "")
        # Hard 35s ceiling so the function ALWAYS returns something well within
        # Vercel's 60s ceiling. If a slow LLM call drags past, the gather is
        # cancelled and the caller below substitutes safe defaults — the user
        # gets a populated (if partial) response instead of "failed to fetch".
        gather = asyncio.gather(cls_t, dim_t, loaded_t, sd_t, hbs_t, return_exceptions=True)
        try:
            return await asyncio.wait_for(gather, timeout=35.0)
        except asyncio.TimeoutError:
            print("Debug: _build_article_detail gather hit 35s timeout — returning partial")
            return [TimeoutError("gather timeout")] * 5

    results = asyncio.run(_run_all())
    classification, framing, loaded_phrases, source_diversity, headline_body_skew = results

    # Surface exceptions in logs so silent fallbacks become visible. Each
    # downstream consumer below already handles the fallback shape gracefully.
    for label, val in [
        ("classify_with_ai", classification),
        ("score_dimensions", framing),
        ("detect_loaded_language", loaded_phrases),
        ("compute_source_diversity", source_diversity),
        ("compute_headline_body_skew", headline_body_skew),
    ]:
        if isinstance(val, Exception):
            print(f"Debug: {label} raised: {type(val).__name__}: {val}")

    # Replace exceptions with safe shapes so the rest of the function can run.
    if isinstance(classification, Exception):
        classification = classify_by_outlet(f"https://{src}", title=title, snippet=snippet)
    if isinstance(framing, Exception):
        from app.services.classifier import Dimensions
        framing = Dimensions(factuality=0.6, economic=0.0, social=0.0,
                             establishment=0.0, sensationalism=0.0, rationale=None)
    if isinstance(loaded_phrases, Exception):
        loaded_phrases = []
    if isinstance(source_diversity, Exception):
        source_diversity = {"quoted_entities": [], "anonymous_count": 0, "score": 0.0}
    if isinstance(headline_body_skew, Exception):
        headline_body_skew = {"headline_tone": 0.0, "body_tone": 0.0, "delta": 0.0}

    dims = {
        "factuality": framing.factuality,
        "economic": framing.economic,
        "social": framing.social,
        "establishment": framing.establishment,
        "sensationalism": framing.sensationalism,
        "loaded_language": max(0.0, min(1.0, len(loaded_phrases) / 10.0)),
        "source_diversity": source_diversity["score"],
        "headline_body_skew": max(-1.0, min(1.0, headline_body_skew["delta"])),
    }

    article = {
        "id": article_id,
        "url": url,
        "title": title,
        "snippet": snippet,
        "source": source or extract_domain(url) or "unknown",
        "published_at": None,
        "spectrum_score": classification.score,
        "confidence": classification.confidence,
        "method": _public_method(classification.method),
        "reasoning": _sanitize_reasoning(classification.reasoning),
    }

    return {
        "id": article_id,
        "article": article,
        "bias_dimensions": dims,
        "highlighted_phrases": [
            {"text": p["text"], "dimension": "loaded_language"} for p in loaded_phrases[:8]
        ],
        "loaded_phrases": loaded_phrases,
        "source_diversity_detail": source_diversity,
        "headline_body_skew_detail": headline_body_skew,
    }


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self._handle_request()

    def do_POST(self):
        self._handle_request()

    def do_OPTIONS(self):
        self._send_cors_response()

    def _send_cors_response(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.end_headers()

    def _read_json_body(self) -> dict:
        try:
            length = int(self.headers.get('Content-Length') or 0)
        except (TypeError, ValueError):
            length = 0
        if length <= 0:
            return {}
        try:
            raw = self.rfile.read(length)
            return json.loads(raw.decode('utf-8') or '{}')
        except Exception:
            return {}

    def _send_json(self, status: int, payload: dict):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        # Disable Vercel edge caching for API responses — every search/analyze
        # call should hit the function fresh. Without this, subsequent identical
        # queries get a stale article list and analyze re-shows old results.
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('CDN-Cache-Control', 'no-store')
        self.send_header('Vercel-CDN-Cache-Control', 'no-store')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.end_headers()
        self.wfile.write(body)

    def _handle_request(self):
        try:
            parsed_url = urlparse(self.path)
            path = parsed_url.path
            # Frontend now calls /api/* paths to avoid colliding with SPA
            # routes (e.g. /search is a React Router route). Strip the /api
            # prefix so existing dispatch logic that matches /search,
            # /analyze, /articles/:id, etc. continues to work.
            if path.startswith('/api/'):
                path = path[4:]  # '/api/search' -> '/search'
            query_params = parse_qs(parsed_url.query)
            query_params = {k: v[0] if v else '' for k, v in query_params.items()}

            method = self.command  # 'GET' / 'POST'

            # Routes that read a JSON body (POST)
            if method == 'POST' and path == '/analyze':
                body = self._read_json_body()
                self._send_json(200, self._route_analyze(body))
                return

            if method == 'POST' and path == '/games/headline-rewrite/score':
                body = self._read_json_body()
                self._send_json(200, self._route_score_rewrite(body))
                return

            # GET routes
            if path == '/' or path == '':
                self._send_json(200, {
                    "message": "News Analyzer API",
                    "version": "0.2.0",
                    "endpoints": {
                        "health": "/health",
                        "search": "/search?q=query",
                        "api-status": "/api-status",
                        "articles": "/articles",
                        "article_detail": "/articles/{id}",
                        "analyze": "POST /analyze",
                        "compare_pair": "/games/compare-pair?q=query",
                        "headline_rewrite_score": "POST /games/headline-rewrite/score",
                    },
                })
                return

            if path == '/health':
                self._send_json(200, {"status": "ok"})
                return

            if path == '/api-status':
                self._send_json(200, get_api_status())
                return

            if path == '/search':
                query = query_params.get('q', '')
                if len(query) < 2:
                    self._send_json(400, {"error": "Query parameter 'q' must be at least 2 characters"})
                    return
                # Cache by lowered query so repeat searches return identical
                # response (same articles, same scores, same reasoning) within
                # the TTL — defeats stochastic-LLM-output as a leak.
                cache_key = f"search:{query.strip().lower()}"
                cached = _cache_get(cache_key)
                if cached is not None:
                    self._send_json(200, cached)
                    return
                articles = asyncio.run(self._search_and_classify(query))
                response = {
                    "query": query,
                    "articles": articles,
                    "api_status": get_api_status(),
                }
                _cache_put(cache_key, response)
                self._send_json(200, response)
                return

            if path == '/articles':
                articles = asyncio.run(self._search_and_classify("latest news"))
                self._send_json(200, articles)
                return

            if path.startswith('/articles/'):
                article_id = path[len('/articles/'):].strip('/')
                if not article_id:
                    self._send_json(400, {"error": "missing article id"})
                    return
                self._send_json(200, self._route_article_detail(article_id))
                return

            if path == '/games/compare-pair':
                query = query_params.get('q', '')
                if len(query) < 2:
                    self._send_json(400, {"error": "Query parameter 'q' must be at least 2 characters"})
                    return
                pair = asyncio.run(self._route_compare_pair(query))
                if pair is None:
                    self._send_json(404, {"error": "no contrasting pair found", "query": query})
                    return
                self._send_json(200, pair)
                return

            self._send_json(404, {"error": "Not found", "path": path})

        except Exception as e:
            import traceback
            traceback.print_exc()
            self._send_json(500, {
                'error': str(e),
                'message': 'Internal server error',
                'path': self.path,
            })

    # ---------- Route handlers ----------

    def _route_analyze(self, body: dict) -> dict:
        url = (body.get('url') or '').strip()
        text = (body.get('text') or '').strip()
        title = (body.get('title') or '').strip()

        # Cache by stable hash of inputs. Same paste → same response.
        cache_key = f"analyze:{hash((url, title, text[:300]))}"
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached  # type: ignore[return-value]

        if url and not text:
            fetched_title, fetched_body = _fetch_url(url)
            if not title:
                title = fetched_title
            text = fetched_body

        if not text and not title:
            return {"error": "provide url or text"}

        article_id = f"analyze_{abs(hash((url, title, text[:100]))) % 10**8}"
        result = _build_article_detail(article_id, title, text, url=url)
        _cache_put(cache_key, result)
        return result

    def _route_article_detail(self, article_id: str) -> dict:
        # No persistent store yet — synthesize a placeholder. The optional
        # extended fields make this forward-compatible with the new frontend.
        article = {
            "id": article_id,
            "url": "",
            "title": article_id,
            "snippet": "",
            "source": "unknown",
            "published_at": None,
            "spectrum_score": 0.0,
            "confidence": 0.3,
            "method": "unknown",
            "reasoning": "Article detail not yet persisted.",
        }
        return {
            "id": article_id,
            "article": article,
            "bias_dimensions": _zero_dimensions(),
            "highlighted_phrases": [],
            "loaded_phrases": [],
            "source_diversity_detail": {"quoted_entities": [], "anonymous_count": 0, "score": 0.0},
            "headline_body_skew_detail": {"headline_tone": 0.0, "body_tone": 0.0, "delta": 0.0},
        }

    def _route_score_rewrite(self, body: dict) -> dict:
        original = (body.get('original') or '').strip()
        rewrite = (body.get('rewrite') or '').strip()
        if not original or not rewrite:
            return {"error": "provide original and rewrite"}
        return score_rewrite(original, rewrite)

    async def _route_compare_pair(self, query: str):
        articles = await self._search_and_classify(query)
        left = next((a for a in articles if a.get('spectrum_score', 0) < -0.3), None)
        right = next((a for a in articles if a.get('spectrum_score', 0) > 0.3), None)
        if not left or not right:
            return None
        return {"article_a": left, "article_b": right, "query": query}

    async def _search_and_classify(self, query: str):
        """Search for news and classify each article"""
        try:
            from app.config import settings
            print(f"Debug: OpenAI API key configured: {bool(settings.openai_api_key)}")
            if settings.openai_api_key:
                print(f"Debug: OpenAI API key starts with: {settings.openai_api_key[:10]}...")

            # Brave news caps at 20 per call. Fetch the max so the spectrum has
            # enough outlet variety even after frontend per-source dedup.
            search_results = await search_news(query, num=20)
            print(f"Debug: Got {len(search_results)} search results")

            article_data = []
            for i, result in enumerate(search_results):
                url = result.get('link', '')
                title = result.get('title', '')
                snippet = result.get('snippet', '')
                source = extract_domain(url) or 'unknown'
                article_data.append({
                    "id": f"article_{i}",
                    "url": url,
                    "title": title,
                    "snippet": snippet,
                    "source": source,
                    "published_at": result.get('published_at'),
                })

            # ── Stage 1: parallel-fetch every article body ────────────────────
            # _fetch_url is sync (httpx.Client + BeautifulSoup); wrap each in
            # to_thread and gather. Semaphore caps concurrent outbound requests.
            # Bumped to 15 since we now fetch up to 20 articles per search.
            fetch_sem = asyncio.Semaphore(15)

            async def fetch_one(url: str) -> tuple[str, str]:
                async with fetch_sem:
                    if not url:
                        return "", ""
                    try:
                        return await asyncio.to_thread(_fetch_url, url)
                    except Exception as e:
                        print(f"Debug: fetch failed for {url}: {e}")
                        return "", ""

            print(f"Debug: Fetching {len(article_data)} article bodies in parallel")
            fetched = await asyncio.gather(
                *(fetch_one(a["url"]) for a in article_data),
                return_exceptions=False,
            )

            # Use lede + first 3 paragraphs only — bias signal lives in the opening.
            # Hard cap at 1500 chars for the LLM input (~375 tokens) so framing
            # isn't diluted by mid-article factual content.
            BODY_CAP = 1500
            BODY_MIN = 200  # less than this → not worth using, fall back to snippet
            # Larger cap for the body excerpt sent to the frontend — gives the
            # spectrum + games (especially Guess the Source) enough material
            # for the user to actually read a real chunk of the article.
            DISPLAY_BODY_CAP = 2400
            classify_inputs = []
            for art, (fetched_title, fetched_body) in zip(article_data, fetched):
                body = (fetched_body or "").strip()
                if len(body) < BODY_MIN:
                    text_for_classifier = art["snippet"]
                    art["_body_used"] = False
                    art["body"] = ""
                else:
                    text_for_classifier = body[:BODY_CAP]
                    art["_body_used"] = True
                    # Stash a longer excerpt for the frontend to display.
                    art["body"] = body[:DISPLAY_BODY_CAP]
                classify_inputs.append((art["title"], text_for_classifier, art["source"]))

            body_count = sum(1 for a in article_data if a.get("_body_used"))
            print(f"Debug: {body_count}/{len(article_data)} articles classified on full body, "
                  f"{len(article_data) - body_count} on snippet fallback")

            # ── Stage 2: parallel-classify ────────────────────────────────────
            classification_tasks = [classify_hybrid(t, s, src) for (t, s, src) in classify_inputs]
            print(f"Debug: Starting parallel classification of {len(classification_tasks)} articles")
            # Bumped to 8 to match larger article batch.
            semaphore = asyncio.Semaphore(8)

            async def classify_with_limit(task):
                async with semaphore:
                    return await task

            limited_tasks = [classify_with_limit(task) for task in classification_tasks]
            classifications = await asyncio.gather(*limited_tasks, return_exceptions=True)

            articles = []
            for i, (article_info, classification) in enumerate(zip(article_data, classifications)):
                if isinstance(classification, Exception):
                    print(f"Debug: Classification failed for article {i}: {classification}")
                    classification = classify_by_outlet(
                        article_info["source"],
                        title=article_info.get("title", ""),
                        snippet=article_info.get("snippet", ""),
                    )

                print(f"Debug: Article {i} classified - method: {classification.method}, score: {classification.score}, confidence: {classification.confidence}")

                article = {
                    **article_info,
                    "spectrum_score": classification.score,
                    "confidence": classification.confidence,
                    "method": _public_method(classification.method),
                    "reasoning": _sanitize_reasoning(classification.reasoning),
                }
                articles.append(article)

            return articles

        except Exception as e:
            print(f"Search and classify error: {e}")
            import traceback
            traceback.print_exc()
            return []
