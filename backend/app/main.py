from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
from typing import List, Literal, Dict, Any
from fastapi.middleware.cors import CORSMiddleware

from .services.google import search_news, get_api_status
from .services.classifier import classify_by_outlet, classify_with_ai, classify_hybrid
from .config import settings

app = FastAPI(title="Political Spectrum News Analyzer API", version="0.1.0")

# CORS configuration
allowed_origins = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173"
]

# Add production frontend origins
if settings.environment != "development":
    if settings.frontend_origin:
        allowed_origins.append(settings.frontend_origin)
    # Add common Vercel patterns - update these with your actual domains
    allowed_origins.extend([
        "https://*.vercel.app",
        "https://your-frontend-project.vercel.app"  # Replace with your actual frontend domain
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Article(BaseModel):
    id: str | None = None
    url: str
    title: str
    snippet: str
    source: str
    published_at: str | None = None
    spectrum_score: float
    confidence: float
    method: Literal["outlet", "ai", "unknown"]
    reasoning: str | None = None


class SearchResponse(BaseModel):
    query: str
    articles: List[Article]
    api_status: dict | None = None


class APIStatusResponse(BaseModel):
    total_requests: int
    failed_requests: int
    success_rate: float
    rate_limited: bool
    quota_exceeded: bool
    last_error: dict | None
    last_request_time: str | None
    api_configured: bool


class BiasDimensions(BaseModel):
    factuality: float
    economic: float
    social: float
    establishment: float
    sensationalism: float


class ArticleDetail(BaseModel):
    id: str
    article: Article
    bias_dimensions: BiasDimensions
    highlighted_phrases: List[Dict[str, str]]  # { text, dimension }


class Narrative(BaseModel):
    id: str
    title: str
    description: str
    article_ids: List[str]
    centroid_bias: BiasDimensions


MOCK_ARTICLES: List[Article] = [
    Article(
        id="a1",
        url="https://www.reuters.com/world/us/example-article-1",
        title="Bipartisan group advances student loan policy compromise",
        snippet="Lawmakers from both parties introduced a compromise framework...",
        source="reuters.com",
        published_at=None,
        spectrum_score=0.0,
        confidence=0.8,
        method="outlet",
        reasoning="Reuters maintains neutral reporting with balanced language. The use of 'bipartisan' and 'compromise' suggests objective coverage without partisan framing."
    ),
    Article(
        id="a2",
        url="https://www.foxnews.com/politics/example-article-2",
        title="Critics say loan forgiveness unfair to taxpayers",
        snippet="Opponents argue the plan shifts costs to working families...",
        source="foxnews.com",
        published_at=None,
        spectrum_score=0.6,
        confidence=0.85,
        method="outlet",
        reasoning="Fox News typically leans conservative. The framing emphasizes opposition viewpoints and taxpayer burden, which aligns with conservative fiscal concerns about government spending."
    ),
    Article(
        id="a3",
        url="https://www.nytimes.com/2024/01/01/us/politics/example-article-3.html",
        title="Supporters say relief targets borrowers most in need",
        snippet="Advocates contend the program reduces default risk and boosts mobility...",
        source="nytimes.com",
        published_at=None,
        spectrum_score=-0.5,
        confidence=0.82,
        method="outlet",
        reasoning="The New York Times generally has a center-left editorial stance. The article focuses on supportive viewpoints and social benefits like 'mobility' and helping those 'most in need', reflecting progressive policy preferences."
    ),
]


MOCK_DETAILS: Dict[str, ArticleDetail] = {
    "a1": ArticleDetail(
        id="a1",
        article=MOCK_ARTICLES[0],
        bias_dimensions=BiasDimensions(
            factuality=0.9, economic=0.0, social=0.1, establishment=0.2, sensationalism=0.1
        ),
        highlighted_phrases=[
            {"text": "bipartisan group", "dimension": "establishment"},
            {"text": "compromise framework", "dimension": "social"},
        ],
    ),
    "a2": ArticleDetail(
        id="a2",
        article=MOCK_ARTICLES[1],
        bias_dimensions=BiasDimensions(
            factuality=0.7, economic=0.6, social=-0.2, establishment=-0.3, sensationalism=0.5
        ),
        highlighted_phrases=[
            {"text": "unfair to taxpayers", "dimension": "economic"},
            {"text": "critics say", "dimension": "sensationalism"},
        ],
    ),
    "a3": ArticleDetail(
        id="a3",
        article=MOCK_ARTICLES[2],
        bias_dimensions=BiasDimensions(
            factuality=0.85, economic=-0.4, social=0.4, establishment=0.1, sensationalism=0.2
        ),
        highlighted_phrases=[
            {"text": "most in need", "dimension": "social"},
            {"text": "reduces default risk", "dimension": "economic"},
        ],
    ),
}


MOCK_NARRATIVES: List[Narrative] = [
    Narrative(
        id="n1",
        title="Fairness to taxpayers",
        description="Coverage emphasizing cost burden and fairness arguments",
        article_ids=["a2"],
        centroid_bias=BiasDimensions(
            factuality=0.75, economic=0.55, social=-0.1, establishment=-0.1, sensationalism=0.4
        ),
    ),
    Narrative(
        id="n2",
        title="Targeted relief and mobility",
        description="Stories focusing on relief for vulnerable borrowers",
        article_ids=["a1", "a3"],
        centroid_bias=BiasDimensions(
            factuality=0.88, economic=-0.2, social=0.3, establishment=0.15, sensationalism=0.15
        ),
    ),
]


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/api-status", response_model=APIStatusResponse)
async def api_status():
    """Get current Google API usage status and rate limit information"""
    return get_api_status()


@app.get("/api/search", response_model=SearchResponse)
async def search(q: str = Query(..., min_length=2)):
    # Check if Google API is configured
    if not settings.google_api_key or not settings.google_cse_id:
        # Return empty results when no API keys are configured
        return {
            "query": q,
            "articles": [],
            "api_status": {
                "error": "API not configured",
                "message": "Google API keys not found in environment variables"
            }
        }
    
    # Get current API status
    status = get_api_status()
    
    # Check if we're rate limited or quota exceeded
    if status["rate_limited"] or status["quota_exceeded"]:
        return {
            "query": q,
            "articles": [],
            "api_status": {
                "error": "rate_limited" if status["rate_limited"] else "quota_exceeded",
                "message": "Google API rate limit or quota exceeded. Please try again later.",
                "details": status["last_error"]
            }
        }
    
    # Use real Google search when API keys are available - limit to 20 articles for better UX
    items = await search_news(q, num=30)  # Get 30, filter to best 20
    articles: list[Article] = []
    ai_calls_made = 0
    max_ai_calls = 10  # Limit AI calls for speed
    
    for it in items:
        # Stop at 20 articles for better spectrum visualization
        if len(articles) >= 20:
            break
            
        link = it.get("link") or it.get("formattedUrl")
        title = it.get("title") or ""
        snippet = it.get("snippet") or ""
        source = (it.get("displayLink") or "").lower()
        
        # Use hybrid classification: fast for known outlets, AI for unknown (with limits)
        cls = await classify_hybrid(title, snippet, source, ai_calls_made >= max_ai_calls)
        
        if cls.method == "ai":
            ai_calls_made += 1
        
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
                reasoning=cls.reasoning
            )
        )
    
    print(f"Search completed: {len(articles)} articles, {ai_calls_made} AI calls made")
    
    # Include API status in response for monitoring
    final_status = get_api_status()
    return {
        "query": q, 
        "articles": articles,
        "api_status": {
            "requests_made": final_status["total_requests"],
            "success_rate": round(final_status["success_rate"], 1),
            "rate_limited": final_status["rate_limited"],
            "quota_exceeded": final_status["quota_exceeded"]
        }
    } 


# Prototype endpoints for the 72-hour deliverable
@app.get("/api/articles", response_model=List[Article])
async def list_articles() -> List[Article]:
    # Return mock data for now; could be replaced by live search
    return MOCK_ARTICLES


@app.get("/api/articles/{article_id}", response_model=ArticleDetail)
async def get_article(article_id: str) -> ArticleDetail:
    if article_id not in MOCK_DETAILS:
        raise HTTPException(status_code=404, detail="Article not found")
    return MOCK_DETAILS[article_id]


@app.get("/api/narratives", response_model=List[Narrative])
async def get_narratives() -> List[Narrative]:
    return MOCK_NARRATIVES