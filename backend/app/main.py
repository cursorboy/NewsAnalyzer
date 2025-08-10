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


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/search", response_model=SearchResponse)
async def search(q: str = Query(..., min_length=2)):
    # Check if Google API is configured
    if not settings.google_api_key or not settings.google_cse_id:
        # Return empty results when no API keys are configured
        return {
            "query": q,
            "articles": []
        }
    
    # Use real Google search when API keys are available - fetch more for better diversity
    items = await search_news(q, num=20)
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