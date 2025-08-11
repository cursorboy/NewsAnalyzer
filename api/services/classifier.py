from __future__ import annotations

from dataclasses import dataclass
from typing import Optional
import tldextract
import httpx
import json
from ..config import settings

# Comprehensive political news source classification
OUTLET_BIAS: dict[str, float] = {
    # Far Left (-0.9 to -1.0)
    "jacobinmag.com": -1.0,
    "socialistworker.org": -1.0,
    "wsws.org": -1.0,
    "motherjones.com": -0.9,
    "thenation.com": -0.9,
    "commondreams.org": -0.9,
    "alternet.org": -0.9,
    "truthout.org": -0.9,
    "democracynow.org": -0.9,
    "counterpunch.org": -0.9,
    
    # Clear Left (-0.7 to -0.8)
    "theintercept.com": -0.8,
    "salon.com": -0.8,
    "rawstory.com": -0.8,
    "thedailybeast.com": -0.8,
    "thinkprogress.org": -0.8,
    "mediamatters.org": -0.8,
    "talkingpointsmemo.com": -0.8,
    "democraticunderground.com": -0.8,
    "crooksandliars.com": -0.8,
    "dailykos.com": -0.8,
    "msnbc.com": -0.7,
    "huffpost.com": -0.7,
    "vox.com": -0.7,
    "slate.com": -0.7,
    "theroot.com": -0.7,
    "jezebel.com": -0.7,
    "buzzfeednews.com": -0.7,
    
    # Left Leaning (-0.4 to -0.6) - AI Analysis Recommended
    "nytimes.com": -0.5,
    "washingtonpost.com": -0.5,
    "cnn.com": -0.5,
    "theguardian.com": -0.5,
    "npr.org": -0.4,
    "pbs.org": -0.4,
    "theatlantic.com": -0.4,
    "newyorker.com": -0.4,
    
    # Center (-0.3 to +0.3)
    "reuters.com": 0.0,
    "apnews.com": 0.0,
    "bbc.com": 0.0,
    "c-span.org": 0.0,
    "allsides.com": 0.0,
    "usatoday.com": -0.1,
    "politico.com": 0.1,
    "thehill.com": 0.1,
    "axios.com": 0.1,
    "time.com": -0.1,
    "newsweek.com": -0.1,
    "csmonitor.com": 0.2,
    "realclearpolitics.com": 0.2,
    "abcnews.go.com": 0.0,
    "cbsnews.com": -0.1,
    "nbcnews.com": -0.2,
    "bloomberg.com": 0.1,
    "marketwatch.com": 0.1,
    "yahoo.com": 0.0,
    "msn.com": 0.0,
    
    # Right Leaning (+0.4 to +0.6) - AI Analysis Recommended  
    "wsj.com": 0.4,
    "economist.com": 0.3,
    "forbes.com": 0.3,
    "reason.com": 0.5,
    "nypost.com": 0.5,
    "washingtontimes.com": 0.6,
    "theepochtimes.com": 0.5,
    "washingtonexaminer.com": 0.6,
    "spectator.org": 0.5,
    "city-journal.org": 0.5,
    
    # Clear Right (+0.7 to +0.8)
    "foxnews.com": 0.7,
    "dailywire.com": 0.8,
    "theblaze.com": 0.8,
    "redstate.com": 0.8,
    "townhall.com": 0.8,
    "pjmedia.com": 0.8,
    "americanthinker.com": 0.8,
    "thefederalist.com": 0.8,
    "nationalreview.com": 0.7,
    "theamericanconservative.com": 0.7,
    "dailycaller.com": 0.7,
    "freebeacon.com": 0.7,
    "hotair.com": 0.7,
    "twitchy.com": 0.7,
    "dailysignal.com": 0.7,
    "cnsnews.com": 0.7,
    "thepostmillennial.com": 0.7,
    "rightscoop.com": 0.8,
    "conservativereview.com": 0.8,
    "theepochtimes.com": 0.7,
    "lifenews.com": 0.8,
    
    # Far Right (+0.9 to +1.0)
    "breitbart.com": 1.0,
    "oann.com": 1.0,
    "newsmax.com": 0.9,
    "thegatewaypundit.com": 1.0,
    "wnd.com": 0.9,
    "infowars.com": 1.0,
}


@dataclass
class Classification:
    score: float
    confidence: float
    method: str
    reasoning: Optional[str] = None


def extract_domain(url: str) -> Optional[str]:
    try:
        parts = tldextract.extract(url)
        if not parts.domain:
            return None
        domain = ".".join(p for p in [parts.domain, parts.suffix] if p)
        return domain.lower()
    except Exception:
        return None


async def classify_with_ai(title: str, snippet: str, source: str) -> Classification:
    """Use OpenAI to analyze article bias with detailed reasoning"""
    if not settings.openai_api_key:
        # Fallback to outlet-based classification
        return classify_by_outlet(f"https://{source}")
    
    try:
        prompt = f"""
Analyze this news article for political bias on a scale from -1.0 (far left) to +1.0 (far right), where 0.0 is perfectly neutral.

Article Title: {title}
Article Snippet: {snippet}
Source: {source}

Please provide:
1. A bias score between -1.0 and +1.0
2. Your confidence level (0.0 to 1.0)
3. Detailed reasoning explaining why you assigned this score

Consider these factors:
- Language choices (emotional vs. neutral)
- Framing of issues
- Selection of facts presented
- Implicit assumptions
- Source credibility patterns

Respond in this exact JSON format:
{{
    "bias_score": <float between -1.0 and 1.0>,
    "confidence": <float between 0.0 and 1.0>,
    "reasoning": "<detailed explanation of your analysis>"
}}
"""

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o-mini",  # Cost-effective model
                    "messages": [
                        {
                            "role": "system", 
                            "content": "You are an expert media analyst specializing in detecting political bias in news articles. Provide objective, detailed analysis."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "temperature": 0.3,  # Lower temperature for more consistent analysis
                    "max_tokens": 500
                }
            )
            
            if response.status_code != 200:
                print(f"OpenAI API error: {response.status_code} - {response.text}")
                return classify_by_outlet(f"https://{source}")
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            # Parse the JSON response
            try:
                analysis = json.loads(content)
                return Classification(
                    score=float(analysis["bias_score"]),
                    confidence=float(analysis["confidence"]),
                    method="ai",
                    reasoning=analysis["reasoning"]
                )
            except (json.JSONDecodeError, KeyError, ValueError) as e:
                print(f"Failed to parse OpenAI response: {e}")
                print(f"Response content: {content}")
                return classify_by_outlet(f"https://{source}")
                
    except Exception as e:
        print(f"AI classification failed: {e}")
        return classify_by_outlet(f"https://{source}")


def classify_by_outlet(url: str) -> Classification:
    domain = extract_domain(url) or ""
    if domain in OUTLET_BIAS:
        reasoning = f"Based on {domain}'s known editorial stance and historical reporting patterns."
        return Classification(
            score=OUTLET_BIAS[domain], 
            confidence=0.9, 
            method="outlet",
            reasoning=reasoning
        )
    return Classification(
        score=0.0, 
        confidence=0.3, 
        method="unknown",
        reasoning="Unknown source - no bias information available."
    )


async def classify_hybrid(title: str, snippet: str, source: str, ai_limit_reached: bool = False) -> Classification:
    """
    Hybrid classification: Use outlet-based for known sources, AI for unknown sources
    This dramatically improves speed by avoiding unnecessary AI calls
    """
    domain = extract_domain(f"https://{source}") or ""
    
    # If it's a known outlet, use fast outlet-based classification
    if domain in OUTLET_BIAS:
        reasoning = f"Based on {domain}'s known editorial stance and historical reporting patterns."
        return Classification(
            score=OUTLET_BIAS[domain], 
            confidence=0.9, 
            method="outlet",
            reasoning=reasoning
        )
    
    # For unknown sources, use AI analysis (but respect limits)
    if not ai_limit_reached and settings.openai_api_key:
        return await classify_with_ai(title, snippet, source)
    
    # Fallback for unknown sources when AI limit reached
    return Classification(
        score=0.0, 
        confidence=0.3, 
        method="unknown",
        reasoning="Unknown source - no bias information available."
    ) 