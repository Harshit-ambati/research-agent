"""
Open Datasets & Code Repositories Engine
Fetches real open-access datasets from Hugging Face Datasets API
and open-source benchmark implementations from GitHub Search API.
Includes persistent disk caching.
"""
import os
import json
import urllib.request
import urllib.parse
import re
import sys
from typing import Dict, Any, List

# Fix Windows encoding
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CACHE_FILE = os.path.join(DATA_DIR, "dataset_cache.json")
os.makedirs(DATA_DIR, exist_ok=True)


class DatasetFinder:
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
            print(f"Error saving dataset cache: {e}")

    def clean_text(self, text: str) -> str:
        if not text:
            return ""
        text = re.sub(r'<[^>]+>', '', str(text))
        return re.sub(r'\s+', ' ', text).strip()

    def _clean_query(self, query: str) -> str:
        stopwords = {
            "what", "is", "how", "to", "the", "and", "for", "with", "in", "of", "on",
            "a", "an", "best", "find", "datasets", "data", "code", "github"
        }
        words = re.findall(r'\b[a-zA-Z0-9]{3,}\b', query.lower())
        filtered = [w for w in words if w not in stopwords]
        return " ".join(filtered[:4]) if filtered else query.strip()

    def search_datasets_and_repos(self, query: str, max_results: int = 5) -> Dict[str, Any]:
        """
        Retrieves real open-source datasets (Hugging Face) and benchmark repos (GitHub).
        """
        clean_q = self._clean_query(query)
        cache_key = clean_q.lower()
        if not clean_q:
            clean_q = query.strip()
            cache_key = clean_q.lower()

        if cache_key in self.cache:
            return self.cache[cache_key]

        datasets = self._fetch_huggingface_datasets(clean_q, max_results)
        repos = self._fetch_github_repos(clean_q, max_results)

        result = {
            "query": query,
            "cleaned_query": clean_q,
            "datasets": datasets,
            "repositories": repos,
            "total_datasets": len(datasets),
            "total_repos": len(repos),
        }

        if datasets or repos:
            self.cache[cache_key] = result
            self._save_cache()

        return result

    def _fetch_huggingface_datasets(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Query Hugging Face Datasets open API."""
        datasets = []
        try:
            url = f"https://huggingface.co/api/datasets?search={urllib.parse.quote(query)}&limit={limit}&full=false"
            req = urllib.request.Request(url, headers={"User-Agent": "ResearchAgent/3.0 (academic-research)"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                for item in data[:limit]:
                    ds_id = item.get("id") or item.get("_id", "")
                    if not ds_id:
                        continue
                    tags = item.get("tags", [])
                    downloads = item.get("downloads", 0)
                    likes = item.get("likes", 0)
                    author = item.get("author", ds_id.split("/")[0] if "/" in ds_id else "Community")
                    ds_name = ds_id.split("/")[-1] if "/" in ds_id else ds_id

                    datasets.append({
                        "id": ds_id,
                        "name": ds_name,
                        "author": author,
                        "url": f"https://huggingface.co/datasets/{ds_id}",
                        "downloads": downloads,
                        "likes": likes,
                        "tags": tags[:5] if isinstance(tags, list) else [],
                        "source": "Hugging Face Datasets",
                        "description": item.get("description") or f"Open-access benchmark dataset for {clean_title(ds_name)}."
                    })
        except Exception as e:
            print(f"Hugging Face dataset error: {e}")

        return datasets

    def _fetch_github_repos(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Query GitHub Search API for popular benchmark implementations."""
        repos = []
        try:
            url = f"https://api.github.com/search/repositories?q={urllib.parse.quote(query)}&sort=stars&order=desc&per_page={limit}"
            req = urllib.request.Request(url, headers={
                "User-Agent": "ResearchAgent/3.0 (academic-research)",
                "Accept": "application/vnd.github.v3+json"
            })
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                items = data.get("items", [])
                for item in items[:limit]:
                    full_name = item.get("full_name", "")
                    desc = self.clean_text(item.get("description", ""))
                    if len(desc) > 200:
                        desc = desc[:197] + "..."
                    repos.append({
                        "name": full_name,
                        "url": item.get("html_url", f"https://github.com/{full_name}"),
                        "description": desc or f"Open source implementation of {query}.",
                        "stars": item.get("stargazers_count", 0),
                        "forks": item.get("forks_count", 0),
                        "language": item.get("language") or "Python",
                        "license": item.get("license", {}).get("spdx_id") if item.get("license") else "Open Source",
                        "source": "GitHub Open Source"
                    })
        except Exception as e:
            print(f"GitHub search error: {e}")

        return repos


def clean_title(s: str) -> str:
    return s.replace("-", " ").replace("_", " ").title()


dataset_finder = DatasetFinder()
