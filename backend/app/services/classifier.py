from __future__ import annotations

from dataclasses import dataclass
from typing import Optional
import tldextract

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


def extract_domain(url: str) -> Optional[str]:
    try:
        parts = tldextract.extract(url)
        if not parts.domain:
            return None
        domain = ".".join(p for p in [parts.domain, parts.suffix] if p)
        return domain.lower()
    except Exception:
        return None


def classify_by_outlet(url: str) -> Classification:
    domain = extract_domain(url) or ""
    if domain in OUTLET_BIAS:
        return Classification(score=OUTLET_BIAS[domain], confidence=0.9, method="outlet")
    return Classification(score=0.0, confidence=0.3, method="unknown") 