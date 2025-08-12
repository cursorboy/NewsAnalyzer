import json
import sys
import os
from urllib.parse import parse_qs

# Add parent directory to path for imports
parent_dir = os.path.dirname(os.path.dirname(__file__))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    from fastapi import FastAPI, Query, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    from typing import List, Literal, Dict, Any
    from mangum import Mangum
    
    # Create FastAPI app directly here
    app = FastAPI(title="Political Spectrum News Analyzer API", version="0.1.0")
    
    # CORS configuration - always allow localhost for development
    allowed_origins = [
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
        "https://your-frontend-project.vercel.app"
    ]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Pydantic models
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
    
    # Mock data for now
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
            reasoning="Reuters maintains neutral reporting with balanced language."
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
            reasoning="Fox News typically leans conservative."
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
            reasoning="The New York Times generally has a center-left editorial stance."
        ),
    ]
    
    # Routes
    @app.get("/")
    async def root():
        return {
            "message": "News Analyzer API",
            "version": "0.1.0",
            "endpoints": {
                "health": "/health",
                "search": "/search?q=query",
                "api_status": "/api-status",
                "articles": "/articles",
            }
        }
    
    @app.get("/health")
    async def health():
        return {"status": "ok"}
    
    @app.get("/api-status", response_model=APIStatusResponse)
    async def api_status():
        """Get current Google API usage status"""
        return APIStatusResponse(
            total_requests=0,
            failed_requests=0,
            success_rate=100.0,
            rate_limited=False,
            quota_exceeded=False,
            last_error=None,
            last_request_time=None,
            api_configured=False
        )
    
    @app.get("/search", response_model=SearchResponse)
    async def search(q: str = Query(..., min_length=2)):
        """Search for articles (mock data for now)"""
        # Filter mock articles based on query
        filtered_articles = [
            article for article in MOCK_ARTICLES 
            if q.lower() in article.title.lower() or q.lower() in article.snippet.lower()
        ]
        
        return SearchResponse(
            query=q,
            articles=filtered_articles,
            api_status={
                "message": "Using mock data - API keys not configured",
                "requests_made": 0,
                "success_rate": 100.0
            }
        )
    
    @app.get("/articles", response_model=List[Article])
    async def list_articles() -> List[Article]:
        """List all articles"""
        return MOCK_ARTICLES
    
    # Create Mangum handler
    handler = Mangum(app)
    
except Exception as e:
    # Fallback handler if imports fail
    def handler(event, context):
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': f'Failed to initialize FastAPI: {str(e)}',
                'message': 'Backend initialization failed',
                'type': str(type(e).__name__)
            })
        }
