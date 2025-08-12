from __future__ import annotations

import httpx
import logging
from typing import Any, Dict, Optional
from datetime import datetime
from ..config import settings

BASE_URL = "https://www.googleapis.com/customsearch/v1"

# Configure logging
logger = logging.getLogger(__name__)

# API Status tracking
class APIStatus:
    def __init__(self):
        self.total_requests = 0
        self.failed_requests = 0
        self.rate_limited = False
        self.last_error = None
        self.last_request_time = None
        self.quota_exceeded = False
        
    def record_request(self):
        self.total_requests += 1
        self.last_request_time = datetime.now()
        
    def record_error(self, error_type: str, message: str):
        self.failed_requests += 1
        self.last_error = {"type": error_type, "message": message, "time": datetime.now()}
        
        if "quota" in message.lower() or "limit" in message.lower():
            self.quota_exceeded = True
            self.rate_limited = True
        elif error_type == "rate_limit":
            self.rate_limited = True

api_status = APIStatus()

# Major outlets to target for balanced coverage
TARGET_OUTLETS = [
    # Left
    "msnbc.com", "cnn.com", "huffpost.com", "salon.com", "vox.com",
    # Center
    "reuters.com", "apnews.com", "bbc.com", "axios.com", "politico.com",
    # Right  
    "foxnews.com", "nypost.com", "dailywire.com", "breitbart.com", "newsmax.com"
]


async def search_news(query: str, num: int = 10) -> list[dict[str, Any]]:
    if not settings.google_api_key or not settings.google_cse_id:
        return []
    
    all_results = []
    
    # Simplified search strategy - fewer API calls for faster response
    outlet_groups = [
        # Liberal sources
        f"{query} site:cnn.com OR site:msnbc.com OR site:huffpost.com OR site:vox.com",
        # Center sources  
        f"{query} site:reuters.com OR site:apnews.com OR site:bbc.com OR site:axios.com OR site:npr.org",
        # Conservative sources
        f"{query} site:foxnews.com OR site:wsj.com OR site:nypost.com OR site:dailywire.com",
        # Quality mainstream
        f"{query} site:nytimes.com OR site:washingtonpost.com OR site:politico.com"
    ]
    
    # Search each group - reduced from 9 to 4 API calls
    for outlet_query in outlet_groups:
        outlet_results = await _search_with_params(outlet_query, num=3)
        all_results.extend(outlet_results)
    
    # One general search for additional coverage
    general_results = await _search_with_params(query, num=6)
    all_results.extend(general_results)
    
    # Remove duplicates based on URL and title similarity
    seen_urls = set()
    seen_titles = set()
    unique_results = []
    
    for result in all_results:
        url = result.get("link", "")
        title = result.get("title", "").lower()
        
        # Skip if we've seen this URL
        if url and url in seen_urls:
            continue
            
        # Skip if we've seen a very similar title (first 50 chars)
        title_key = title[:50] if title else ""
        if title_key and title_key in seen_titles:
            continue
            
        if url:
            seen_urls.add(url)
            if title_key:
                seen_titles.add(title_key)
            unique_results.append(result)
    
    return unique_results[:num]


async def _search_with_params(query: str, num: int = 10) -> list[dict[str, Any]]:
    """Helper function to perform actual Google search with comprehensive error handling"""
    params = {
        "q": query,
        "cx": settings.google_cse_id,
        "key": settings.google_api_key,
        "num": min(max(num, 1), 10),
        "safe": "medium",
        "lr": "lang_en",
        "sort": "date",  # Get recent articles
    }
    
    api_status.record_request()
    
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(BASE_URL, params=params)
            
            # Handle different HTTP status codes
            if r.status_code == 429:
                api_status.record_error("rate_limit", "Too many requests - rate limited")
                logger.warning("Google API rate limit exceeded")
                return []
            elif r.status_code == 403:
                error_data = r.json() if r.content else {}
                error_message = error_data.get("error", {}).get("message", "Forbidden")
                
                if "quota" in error_message.lower() or "limit" in error_message.lower():
                    api_status.record_error("quota_exceeded", f"API quota exceeded: {error_message}")
                    logger.error(f"Google API quota exceeded: {error_message}")
                else:
                    api_status.record_error("forbidden", f"API access forbidden: {error_message}")
                    logger.error(f"Google API forbidden: {error_message}")
                return []
            elif r.status_code == 400:
                error_data = r.json() if r.content else {}
                error_message = error_data.get("error", {}).get("message", "Bad request")
                api_status.record_error("bad_request", f"Invalid API request: {error_message}")
                logger.error(f"Google API bad request: {error_message}")
                return []
            
            r.raise_for_status()
            data = r.json()
            
            # Check for API errors in response
            if "error" in data:
                error_info = data["error"]
                error_message = error_info.get("message", "Unknown API error")
                error_code = error_info.get("code", "unknown")
                
                if error_code == 403 or "quota" in error_message.lower():
                    api_status.record_error("quota_exceeded", f"API quota exceeded: {error_message}")
                    logger.error(f"Google API quota exceeded: {error_message}")
                else:
                    api_status.record_error("api_error", f"API error {error_code}: {error_message}")
                    logger.error(f"Google API error: {error_message}")
                return []
            
            items = data.get("items", [])
            logger.info(f"Successfully fetched {len(items)} results for query: {query[:50]}...")
            return items
            
    except httpx.TimeoutException:
        api_status.record_error("timeout", "Request timed out")
        logger.warning("Google API request timed out")
        return []
    except httpx.HTTPStatusError as e:
        api_status.record_error("http_error", f"HTTP {e.response.status_code}: {str(e)}")
        logger.error(f"Google API HTTP error: {e}")
        return []
    except Exception as e:
        api_status.record_error("unknown", str(e))
        logger.error(f"Unexpected Google API error: {e}")
        return []


def get_api_status() -> Dict[str, Any]:
    """Get current API status and usage information"""
    return {
        "total_requests": api_status.total_requests,
        "failed_requests": api_status.failed_requests,
        "success_rate": (api_status.total_requests - api_status.failed_requests) / max(api_status.total_requests, 1) * 100,
        "rate_limited": api_status.rate_limited,
        "quota_exceeded": api_status.quota_exceeded,
        "last_error": api_status.last_error,
        "last_request_time": api_status.last_request_time.isoformat() if api_status.last_request_time else None,
        "api_configured": bool(settings.google_api_key and settings.google_cse_id)
    } 