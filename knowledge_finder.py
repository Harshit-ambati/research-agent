"""
Knowledge & Encyclopedic Information Engine
Retrieves rich background knowledge, key facts, timelines, and entity relations
from Wikipedia REST and MediaWiki open APIs.
Includes persistent caching to reduce latency and provide offline availability.
"""
import os
import json
import urllib.request
import urllib.parse
import re
import sys
from typing import Dict, Any, List, Optional

# Fix Windows encoding
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CACHE_FILE = os.path.join(DATA_DIR, "knowledge_cache.json")
os.makedirs(DATA_DIR, exist_ok=True)


class KnowledgeFinder:
    def __init__(self):
        self.cache = self._load_cache()

    def _load_cache(self) -> Dict[str, Any]:
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

    def _save_cache(self):
        try:
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(self.cache, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving knowledge cache: {e}")

    def clean_text(self, text: str) -> str:
        if not text:
            return ""
        text = re.sub(r'<[^>]+>', '', str(text))
        return re.sub(r'\s+', ' ', text).strip()

    def search_knowledge(self, query: str) -> Dict[str, Any]:
        """
        Retrieves comprehensive encyclopedic overview, summary, key sections,
        related topics, and canonical links for any research query.
        """
        norm_query = query.strip().lower()
        if not norm_query:
            return {}

        if norm_query in self.cache:
            return self.cache[norm_query]

        # 1. Search Wikipedia for most relevant canonical page title
        best_title = self._find_best_page_title(query)
        if not best_title:
            best_title = query.strip()

        # 2. Fetch page summary & details
        details = self._fetch_page_summary(best_title)
        
        # 3. If direct title lookup returned nothing, try with search query directly
        if not details.get("extract") and best_title.lower() != query.lower():
            details = self._fetch_page_summary(query.strip())

        # 4. Fetch related pages / topics
        related_topics = self._fetch_related_topics(best_title)

        if not details.get("extract"):
            return {}

        result = {
            "query": query,
            "title": details.get("title", best_title),
            "display_title": details.get("displaytitle", best_title),
            "description": details.get("description", ""),
            "extract": details.get("extract", ""),
            "thumbnail": details.get("thumbnail", {}).get("source") if isinstance(details.get("thumbnail"), dict) else "",
            "page_url": details.get("content_urls", {}).get("desktop", {}).get("page", f"https://en.wikipedia.org/wiki/{urllib.parse.quote(best_title.replace(' ', '_'))}"),
            "related_topics": related_topics,
            "source": "Wikipedia Knowledge Base",
        }

        self.cache[norm_query] = result
        self._save_cache()
        return result

    def _find_best_page_title(self, query: str) -> Optional[str]:
        """Search Wikipedia API for top matching article title."""
        try:
            params = {
                "action": "query",
                "list": "search",
                "srsearch": query,
                "srlimit": 3,
                "format": "json"
            }
            url = f"https://en.wikipedia.org/w/api.php?{urllib.parse.urlencode(params)}"
            req = urllib.request.Request(url, headers={"User-Agent": "ResearchAgent/3.0 (academic-research)"})
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                search_results = data.get("query", {}).get("search", [])
                if search_results:
                    return search_results[0].get("title")
        except Exception as e:
            print(f"Wikipedia search query error: {e}")
        return None

    def _fetch_page_summary(self, page_title: str) -> Dict[str, Any]:
        """Fetch REST summary API for a given Wikipedia title."""
        try:
            slug = urllib.parse.quote(page_title.replace(" ", "_"))
            url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{slug}"
            req = urllib.request.Request(url, headers={"User-Agent": "ResearchAgent/3.0 (academic-research)"})
            with urllib.request.urlopen(req, timeout=8) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            print(f"Wikipedia summary error for '{page_title}': {e}")
            return {}

    def _fetch_related_topics(self, page_title: str) -> List[Dict[str, str]]:
        """Fetch related Wikipedia pages."""
        topics = []
        try:
            slug = urllib.parse.quote(page_title.replace(" ", "_"))
            url = f"https://en.wikipedia.org/api/rest_v1/page/related/{slug}"
            req = urllib.request.Request(url, headers={"User-Agent": "ResearchAgent/3.0 (academic-research)"})
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                pages = data.get("pages", [])
                for p in pages[:5]:
                    title = p.get("title", "").replace("_", " ")
                    extract = p.get("extract", "")
                    if len(extract) > 120:
                        extract = extract[:117] + "..."
                    url_link = p.get("content_urls", {}).get("desktop", {}).get("page", "")
                    if title:
                        topics.append({
                            "title": title,
                            "description": extract or p.get("description", ""),
                            "url": url_link
                        })
        except Exception as e:
            pass
        return topics


knowledge_finder = KnowledgeFinder()
