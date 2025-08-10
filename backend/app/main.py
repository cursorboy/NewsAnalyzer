from fastapi import FastAPI, Query
from pydantic import BaseModel
from typing import List, Literal
from fastapi.middleware.cors import CORSMiddleware

from .services.google import search_news
from .services.classifier import classify_by_outlet
from .config import settings

app = FastAPI(title="Political Spectrum News Analyzer API", version="0.1.0")

# CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Article(BaseModel):
    url: str
    title: str
    snippet: str
    source: str
    published_at: str | None = None
    spectrum_score: float
    confidence: float
    method: Literal["outlet", "ai", "unknown"]


class SearchResponse(BaseModel):
    query: str
    articles: List[Article]


# Demo data for testing when no API keys are configured
DEMO_ARTICLES = [
    {
        "url": "https://www.reuters.com/world/us/demo-article-1",
        "title": "Economic Policy Changes Announced by Administration",
        "snippet": "The administration announced new economic policies affecting trade and taxation.",
        "source": "reuters.com",
        "spectrum_score": 0.0,
        "confidence": 0.9,
        "method": "outlet"
    },
    {
        "url": "https://www.foxnews.com/politics/demo-article-2", 
        "title": "Conservative Analysis of New Policies",
        "snippet": "Critics argue the new policies will harm business growth and economic freedom.",
        "source": "foxnews.com",
        "spectrum_score": 0.6,
        "confidence": 0.9,
        "method": "outlet"
    },
    {
        "url": "https://www.nytimes.com/politics/demo-article-3",
        "title": "Progressive Perspective on Economic Reforms",
        "snippet": "Supporters say the policies will reduce inequality and help working families.",
        "source": "nytimes.com", 
        "spectrum_score": -0.4,
        "confidence": 0.9,
        "method": "outlet"
    },
    {
        "url": "https://www.wsj.com/economy/demo-article-4",
        "title": "Market Response to Policy Announcements",
        "snippet": "Financial markets showed mixed reactions to the policy changes.",
        "source": "wsj.com",
        "spectrum_score": 0.2,
        "confidence": 0.9,
        "method": "outlet"
    }
]


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/search", response_model=SearchResponse)
async def search(q: str = Query(..., min_length=2)):
    # Check if Google API is configured
    if not settings.google_api_key or not settings.google_cse_id:
        # Return demo data for testing
        return {
            "query": q,
            "articles": [Article(**article) for article in DEMO_ARTICLES]
        }
    
    # Use real Google search when API keys are available
    items = await search_news(q, num=10)
    articles: list[Article] = []
    for it in items:
        link = it.get("link") or it.get("formattedUrl")
        title = it.get("title") or ""
        snippet = it.get("snippet") or ""
        source = (it.get("displayLink") or "").lower()
        cls = classify_by_outlet(link or "")
        articles.append(
            Article(
                url=link or "",
                title=title,
                snippet=snippet,
                source=source,
                published_at=None,
                spectrum_score=cls.score,
                confidence=cls.confidence,
                method=cls.method,  # type: ignore
            )
        )
    return {"query": q, "articles": articles} 