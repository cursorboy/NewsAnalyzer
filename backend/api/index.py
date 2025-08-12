import json
import sys
import os
from urllib.parse import parse_qs, urlparse

def handler(event, context):
    """Vercel serverless handler with FastAPI routes"""
    try:
        # Extract request details
        path = event.get('rawPath', '/')
        method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
        query_params = event.get('queryStringParameters') or {}
        
        # CORS headers
        cors_headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        }
        
        # Handle CORS preflight
        if method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': ''
            }
        
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
            response_body = {
                "total_requests": 0,
                "failed_requests": 0,
                "success_rate": 100.0,
                "rate_limited": False,
                "quota_exceeded": False,
                "last_error": None,
                "last_request_time": None,
                "api_configured": False
            }
            
        elif path == '/search':
            # Get query parameter
            query = query_params.get('q', '')
            if len(query) < 2:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({"error": "Query parameter 'q' must be at least 2 characters"})
                }
            
            # Mock articles
            mock_articles = [
                {
                    "id": "a1",
                    "url": "https://www.reuters.com/world/us/example-article-1",
                    "title": "Bipartisan group advances student loan policy compromise",
                    "snippet": "Lawmakers from both parties introduced a compromise framework...",
                    "source": "reuters.com",
                    "published_at": None,
                    "spectrum_score": 0.0,
                    "confidence": 0.8,
                    "method": "outlet",
                    "reasoning": "Reuters maintains neutral reporting with balanced language."
                },
                {
                    "id": "a2",
                    "url": "https://www.foxnews.com/politics/example-article-2",
                    "title": "Critics say loan forgiveness unfair to taxpayers",
                    "snippet": "Opponents argue the plan shifts costs to working families...",
                    "source": "foxnews.com",
                    "published_at": None,
                    "spectrum_score": 0.6,
                    "confidence": 0.85,
                    "method": "outlet",
                    "reasoning": "Fox News typically leans conservative."
                },
                {
                    "id": "a3",
                    "url": "https://www.nytimes.com/2024/01/01/us/politics/example-article-3.html",
                    "title": "Supporters say relief targets borrowers most in need",
                    "snippet": "Advocates contend the program reduces default risk and boosts mobility...",
                    "source": "nytimes.com",
                    "published_at": None,
                    "spectrum_score": -0.5,
                    "confidence": 0.82,
                    "method": "outlet",
                    "reasoning": "The New York Times generally has a center-left editorial stance."
                }
            ]
            
            # Filter articles based on query
            filtered_articles = [
                article for article in mock_articles 
                if query.lower() in article['title'].lower() or query.lower() in article['snippet'].lower()
            ]
            
            response_body = {
                "query": query,
                "articles": filtered_articles,
                "api_status": {
                    "message": "Using mock data - API keys not configured",
                    "requests_made": 0,
                    "success_rate": 100.0
                }
            }
            
        elif path == '/articles':
            # Return all mock articles
            response_body = [
                {
                    "id": "a1",
                    "url": "https://www.reuters.com/world/us/example-article-1",
                    "title": "Bipartisan group advances student loan policy compromise",
                    "snippet": "Lawmakers from both parties introduced a compromise framework...",
                    "source": "reuters.com",
                    "published_at": None,
                    "spectrum_score": 0.0,
                    "confidence": 0.8,
                    "method": "outlet",
                    "reasoning": "Reuters maintains neutral reporting with balanced language."
                },
                {
                    "id": "a2",
                    "url": "https://www.foxnews.com/politics/example-article-2",
                    "title": "Critics say loan forgiveness unfair to taxpayers",
                    "snippet": "Opponents argue the plan shifts costs to working families...",
                    "source": "foxnews.com",
                    "published_at": None,
                    "spectrum_score": 0.6,
                    "confidence": 0.85,
                    "method": "outlet",
                    "reasoning": "Fox News typically leans conservative."
                },
                {
                    "id": "a3",
                    "url": "https://www.nytimes.com/2024/01/01/us/politics/example-article-3.html",
                    "title": "Supporters say relief targets borrowers most in need",
                    "snippet": "Advocates contend the program reduces default risk and boosts mobility...",
                    "source": "nytimes.com",
                    "published_at": None,
                    "spectrum_score": -0.5,
                    "confidence": 0.82,
                    "method": "outlet",
                    "reasoning": "The New York Times generally has a center-left editorial stance."
                }
            ]
            
        else:
            return {
                'statusCode': 404,
                'headers': cors_headers,
                'body': json.dumps({"error": "Not found", "path": path})
            }
        
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps(response_body)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'message': 'Internal server error',
                'path': event.get('rawPath', '/')
            })
        }