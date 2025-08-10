from __future__ import annotations

import httpx
from typing import Any
from ..config import settings

BASE_URL = "https://www.googleapis.com/customsearch/v1"

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
    
    # More comprehensive outlet searches for better diversity
    outlet_groups = [
        # Liberal outlets - more variety
        f"{query} site:cnn.com OR site:msnbc.com OR site:huffpost.com OR site:salon.com OR site:vox.com OR site:thedailybeast.com",
        # Center outlets - high quality sources
        f"{query} site:reuters.com OR site:apnews.com OR site:bbc.com OR site:axios.com OR site:politico.com OR site:npr.org",
        # Conservative outlets - beyond just Fox
        f"{query} site:wsj.com OR site:nypost.com OR site:dailywire.com OR site:nationalreview.com OR site:washingtonexaminer.com",
        # Fox News separate to limit dominance
        f"{query} site:foxnews.com",
        # Additional conservative sources
        f"{query} site:breitbart.com OR site:townhall.com OR site:redstate.com OR site:thepostmillennial.com",
        # Additional liberal sources  
        f"{query} site:motherjones.com OR site:thenation.com OR site:rawstory.com OR site:theintercept.com",
        # Quality mainstream sources
        f"{query} site:nytimes.com OR site:washingtonpost.com OR site:usatoday.com OR site:time.com",
        # Network news
        f"{query} site:abcnews.go.com OR site:cbsnews.com OR site:nbcnews.com",
        # Business/quality sources
        f"{query} site:bloomberg.com OR site:economist.com OR site:forbes.com OR site:marketwatch.com"
    ]
    
    # Search each group with more results per group
    for i, outlet_query in enumerate(outlet_groups):
        # Limit Fox News results to prevent dominance (index 3 is Fox News)
        num_results = 2 if i == 3 else 4
        outlet_results = await _search_with_params(outlet_query, num=num_results)
        all_results.extend(outlet_results)
    
    # Also do a general search for additional coverage
    general_results = await _search_with_params(query, num=8)
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
    """Helper function to perform actual Google search"""
    params = {
        "q": query,
        "cx": settings.google_cse_id,
        "key": settings.google_api_key,
        "num": min(max(num, 1), 10),
        "safe": "medium",
        "lr": "lang_en",
        "sort": "date",  # Get recent articles
    }
    
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(BASE_URL, params=params)
            r.raise_for_status()
            data = r.json()
            return data.get("items", [])
    except Exception as e:
        print(f"Google API Error: {e}")
        return [] 