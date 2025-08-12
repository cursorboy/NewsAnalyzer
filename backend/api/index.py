import json
import asyncio
import os
import sys
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

# Add the parent directory to sys.path to import from app
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.google import search_news, get_api_status
from app.services.classifier import classify_with_ai, classify_by_outlet, extract_domain

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
    
    def _handle_request(self):
        try:
            # Extract path and query parameters
            from urllib.parse import urlparse, parse_qs
            parsed_url = urlparse(self.path)
            path = parsed_url.path
            query_params = parse_qs(parsed_url.query)
            
            # Convert query params to single values
            query_params = {k: v[0] if v else '' for k, v in query_params.items()}
            
            # Set CORS headers
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.end_headers()
            
            # Route handling
            if path == '/' or path == '':
                response_body = {
                    "message": "News Analyzer API",
                    "version": "0.1.0",
                    "endpoints": {
                        "health": "/health",
                        "search": "/search?q=query",
                        "api-status": "/api-status",
                        "articles": "/articles",
                    }
                }
                
            elif path == '/health':
                response_body = {"status": "ok"}
                
            elif path == '/api-status':
                response_body = get_api_status()
                
            elif path == '/search':
                # Get query parameter
                query = query_params.get('q', '')
                if len(query) < 2:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "Query parameter 'q' must be at least 2 characters"}).encode())
                    return
                
                # Perform real Google search
                articles = asyncio.run(self._search_and_classify(query))
                
                response_body = {
                    "query": query,
                    "articles": articles,
                    "api_status": get_api_status()
                }
                
            elif path == '/articles':
                # For now, return search results for a general query
                articles = asyncio.run(self._search_and_classify("latest news"))
                response_body = articles
                
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Not found", "path": path}).encode())
                return
            
            # Send response
            self.wfile.write(json.dumps(response_body).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': str(e),
                'message': 'Internal server error',
                'path': self.path
            }).encode())
    
    async def _search_and_classify(self, query: str):
        """Search for news and classify each article"""
        try:
            # Check if OpenAI API key is configured
            from app.config import settings
            print(f"Debug: OpenAI API key configured: {bool(settings.openai_api_key)}")
            if settings.openai_api_key:
                print(f"Debug: OpenAI API key starts with: {settings.openai_api_key[:10]}...")
            
            # Get search results from Google (reduced from 20 to 12 for faster response)
            search_results = await search_news(query, num=12)
            print(f"Debug: Got {len(search_results)} search results")
            
            # Prepare all classification tasks
            classification_tasks = []
            article_data = []
            
            for i, result in enumerate(search_results):
                # Extract article info
                url = result.get('link', '')
                title = result.get('title', '')
                snippet = result.get('snippet', '')
                source = extract_domain(url) or 'unknown'
                
                # Store article data for later
                article_data.append({
                    "id": f"article_{i}",
                    "url": url,
                    "title": title,
                    "snippet": snippet,
                    "source": source,
                    "published_at": result.get('published_at')
                })
                
                # Create classification task
                classification_tasks.append(classify_with_ai(title, snippet, source))
            
            print(f"Debug: Starting parallel classification of {len(classification_tasks)} articles")
            
            # Limit concurrent AI requests to avoid overwhelming the API (max 5 at once)
            semaphore = asyncio.Semaphore(5)
            
            async def classify_with_limit(task):
                async with semaphore:
                    return await task
            
            # Run classifications with concurrency limit
            limited_tasks = [classify_with_limit(task) for task in classification_tasks]
            classifications = await asyncio.gather(*limited_tasks, return_exceptions=True)
            
            # Build final articles list
            articles = []
            for i, (article_info, classification) in enumerate(zip(article_data, classifications)):
                # Handle any classification errors
                if isinstance(classification, Exception):
                    print(f"Debug: Classification failed for article {i}: {classification}")
                    # Use fallback outlet-based classification
                    from app.services.classifier import classify_by_outlet
                    classification = classify_by_outlet(article_info["source"])
                
                print(f"Debug: Article {i} classified - method: {classification.method}, score: {classification.score}, confidence: {classification.confidence}")
                
                article = {
                    **article_info,
                    "spectrum_score": classification.score,
                    "confidence": classification.confidence,
                    "method": classification.method,
                    "reasoning": classification.reasoning
                }
                articles.append(article)
            
            return articles
            
        except Exception as e:
            print(f"Search and classify error: {e}")
            import traceback
            traceback.print_exc()
            return []