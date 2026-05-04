import json
import asyncio
import os
import sys
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
        with httpx.Client(timeout=15.0, follow_redirects=True, headers={
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


def _build_article_detail(article_id: str, title: str, body: str, url: str = "", source: str = "") -> dict:
    """Run classifier + dimensions scorer + linguistic services and return an
    ArticleDetail-shaped dict with all 8 bias dimensions populated."""
    snippet = body[:600] if body else ""
    src = source or extract_domain(url) or "unknown"

    classification = asyncio.run(classify_with_ai(title or "", snippet, src))
    framing = asyncio.run(score_dimensions(title or "", body or snippet, src))

    loaded_phrases = detect_loaded_language(body or title)
    source_diversity = compute_source_diversity(body or title)
    headline_body_skew = compute_headline_body_skew(title or "", body or "")

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
        "method": classification.method,
        "reasoning": classification.reasoning,
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
                articles = asyncio.run(self._search_and_classify(query))
                self._send_json(200, {
                    "query": query,
                    "articles": articles,
                    "api_status": get_api_status(),
                })
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

        if url and not text:
            fetched_title, fetched_body = _fetch_url(url)
            if not title:
                title = fetched_title
            text = fetched_body

        if not text and not title:
            return {"error": "provide url or text"}

        article_id = f"analyze_{abs(hash((url, title, text[:100]))) % 10**8}"
        return _build_article_detail(article_id, title, text, url=url)

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

            search_results = await search_news(query, num=12)
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
            fetch_sem = asyncio.Semaphore(10)

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
            # Hard cap at 1500 chars (~375 tokens) keeps LLM input focused on framing
            # rather than mid-article factual content that dilutes the score.
            BODY_CAP = 1500
            BODY_MIN = 200  # less than this → not worth using, fall back to snippet
            classify_inputs = []
            for art, (fetched_title, fetched_body) in zip(article_data, fetched):
                body = (fetched_body or "").strip()
                if len(body) < BODY_MIN:
                    text_for_classifier = art["snippet"]
                    art["_body_used"] = False
                else:
                    text_for_classifier = body[:BODY_CAP]
                    art["_body_used"] = True
                classify_inputs.append((art["title"], text_for_classifier, art["source"]))

            body_count = sum(1 for a in article_data if a.get("_body_used"))
            print(f"Debug: {body_count}/{len(article_data)} articles classified on full body, "
                  f"{len(article_data) - body_count} on snippet fallback")

            # ── Stage 2: parallel-classify ────────────────────────────────────
            classification_tasks = [classify_hybrid(t, s, src) for (t, s, src) in classify_inputs]
            print(f"Debug: Starting parallel classification of {len(classification_tasks)} articles")
            semaphore = asyncio.Semaphore(5)

            async def classify_with_limit(task):
                async with semaphore:
                    return await task

            limited_tasks = [classify_with_limit(task) for task in classification_tasks]
            classifications = await asyncio.gather(*limited_tasks, return_exceptions=True)

            articles = []
            for i, (article_info, classification) in enumerate(zip(article_data, classifications)):
                if isinstance(classification, Exception):
                    print(f"Debug: Classification failed for article {i}: {classification}")
                    classification = classify_by_outlet(article_info["source"])

                print(f"Debug: Article {i} classified - method: {classification.method}, score: {classification.score}, confidence: {classification.confidence}")

                article = {
                    **article_info,
                    "spectrum_score": classification.score,
                    "confidence": classification.confidence,
                    "method": classification.method,
                    "reasoning": classification.reasoning,
                }
                articles.append(article)

            return articles

        except Exception as e:
            print(f"Search and classify error: {e}")
            import traceback
            traceback.print_exc()
            return []
