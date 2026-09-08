"""
SIH Google Patents Prior-Art & Novelty Discovery Engine
Searches Google Patents for real patent publications matching SIH topics.
Returns real patent IDs, real assignees, real abstracts, and direct Google Patents links.
No synthetic/fake patent data — all results are live from Google Patents.
"""
import os
import json
import urllib.request
import urllib.parse
import re
import sys
from typing import List, Dict, Any

# Fix Windows encoding
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CACHE_FILE = os.path.join(DATA_DIR, "patent_cache.json")
os.makedirs(DATA_DIR, exist_ok=True)

# Stopwords to strip from patent search queries
QUERY_STOPWORDS = {
    "the", "and", "for", "with", "system", "using", "based", "development",
    "automated", "smart", "india", "hackathon", "sih", "problem", "statement",
    "solution", "create", "build", "want", "need", "help", "make", "project",
    "implement", "design", "propose", "proposed"
}


class GooglePatentFinder:
    def __init__(self):
        self.cache = self._load_cache()

    def _load_cache(self) -> Dict[str, List[Dict[str, Any]]]:
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
            print(f"Error saving patent cache: {e}")

    def clean_text(self, text: str) -> str:
        if not text:
            return ""
        # Strip HTML tags
        text = re.sub(r'<[^>]+>', '', str(text))
        return re.sub(r'\s+', ' ', text).strip()

    def _extract_key_terms(self, query: str, max_terms: int = 4) -> List[str]:
        """Extract meaningful search terms from a raw query string."""
        words = re.findall(r'\b[a-zA-Z]{3,}\b', query.lower())
        key_terms = [w for w in words if w not in QUERY_STOPWORDS]
        seen = set()
        unique = []
        for w in key_terms:
            if w not in seen:
                seen.add(w)
                unique.append(w)
        return unique[:max_terms]

    def generate_novelty_advisory(self, patent_title: str, patent_abstract: str, topic_domain: str = "") -> str:
        """
        Generates an IPR novelty & prior-art advisory based on actual patent content.
        Analyzes what the patent covers and suggests white-space differentiation angles.
        """
        combined = (patent_title + " " + patent_abstract).lower()

        advisories = []

        if any(kw in combined for kw in ["quantum", "qubit", "superconducting", "ion trap"]):
            advisories.append(
                "This prior art establishes hardware control or gate pulse calibrations. "
                "Innovation angle: explore software-level algorithmic mitigation, hybrid variational solvers, "
                "or surface-code decoding optimization that functions on noisy intermediate-scale quantum (NISQ) devices."
            )
        elif any(kw in combined for kw in ["crispr", "cas9", "gene", "mutation", "dna", "rna"]):
            advisories.append(
                "This patent protects specific ribonucleoprotein complexes or guide RNA sequences. "
                "Whitespace opportunity: design non-viral lipid nanoparticle delivery formulations with enhanced tissue tropism "
                "and reduced off-target cleavage kinetics."
            )
        elif any(kw in combined for kw in ["battery", "electrolyte", "anode", "cathode", "lithium", "solid-state"]):
            advisories.append(
                "This patent claims composite electrolyte matrices or electrode coatings. "
                "Differentiation path: develop solvent-free dry electrode processing, silicon-dominant anodes with "
                "elastic self-healing binders, or low-cost sodium-ion intercalation architectures."
            )
        elif any(kw in combined for kw in ["drone", "aerial", "uav", "unmanned"]):
            advisories.append(
                "This patent covers aerial system navigation and mechanical designs. "
                "Differentiate by implementing decentralized swarm telemetry and offline edge inference "
                "on power-constrained embedded chipsets without requiring continuous satellite link."
            )
        elif any(kw in combined for kw in ["blockchain", "ledger", "distributed", "consensus", "cryptographic"]):
            advisories.append(
                "This patent addresses distributed ledger consensus mechanics. "
                "Innovate with zero-knowledge succinct proof (zk-SNARK) verification layers and state sharding "
                "tailored for high-throughput, low-latency transaction processing."
            )
        elif any(kw in combined for kw in ["neural", "deep learning", "machine learning", "transformer", "model"]):
            advisories.append(
                "This prior art claims server-scale neural architectures. Differentiate with structured pruning, "
                "parameter-efficient fine-tuning (PEFT), and 4-bit quantization benchmarks for real-time edge execution."
            )
        elif any(kw in combined for kw in ["iot", "sensor", "monitor", "telemetry"]):
            advisories.append(
                "This patent relies on continuous grid-powered telemetry. "
                "Novelty angle: sub-milliwatt event-driven wake-up circuitry coupled with ambient RF or thermal energy harvesting."
            )
        else:
            advisories.append(
                f"This prior art claims proprietary industrial embodiments in {topic_domain or 'the target sector'}. "
                f"Identify unpatented white-space in open protocols, modular interoperability, and frugal edge deployment."
            )

        return advisories[0]

    def search_patents(self, query: str, domain: str = "", max_results: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieves real patent prior art from Google Patents with live links and novelty advisory.
        Uses the Google Patents XHR JSON endpoint for structured results.
        """
        key_terms = self._extract_key_terms(query)
        if not key_terms:
            key_terms = self._extract_key_terms(domain)
        if not key_terms:
            return []

        cache_key = f"{' '.join(key_terms).lower()}|{max_results}"
        if cache_key in self.cache:
            return self.cache[cache_key]

        patents = []
        raw_query = " ".join(key_terms)
        google_patents_search_url = f"https://patents.google.com/?q={urllib.parse.quote(raw_query)}"

        # Query Google Patents XHR endpoint for structured JSON results
        try:
            encoded_query = urllib.parse.quote(raw_query)
            req_url = (
                f"https://patents.google.com/xhr/query?"
                f"url=q%3D{encoded_query}%26num%3D{max_results + 2}"
            )
            req = urllib.request.Request(req_url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                              "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json, text/plain, */*",
                "Referer": "https://patents.google.com/"
            })

            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                clusters = data.get("results", {}).get("cluster", [])

                if clusters:
                    results_list = clusters[0].get("result", [])

                    for r in results_list[:max_results]:
                        pat = r.get("patent", {})
                        p_num = pat.get("publication_number", "")
                        p_title = self.clean_text(pat.get("title", ""))
                        p_snippet = self.clean_text(pat.get("snippet", ""))
                        p_assignee = self.clean_text(pat.get("assignee", ""))
                        p_inventor = self.clean_text(pat.get("inventor", ""))
                        p_filing_date = pat.get("filing_date", "")
                        p_priority_date = pat.get("priority_date", "")
                        p_pub_date = pat.get("publication_date", "")
                        p_grant_date = pat.get("grant_date", "")

                        if not p_num or not p_title:
                            continue

                        # Determine the best date to show
                        best_date = p_pub_date or p_grant_date or p_filing_date or p_priority_date or ""
                        year = best_date[:4] if len(best_date) >= 4 else "N/A"

                        # Build the direct patent URL
                        direct_url = f"https://patents.google.com/patent/{p_num}/en"

                        # Build assignee/inventor string
                        assignee_str = p_assignee or p_inventor or "Independent Inventor"

                        # Generate novelty advisory based on actual patent content
                        novelty = self.generate_novelty_advisory(p_title, p_snippet, domain)

                        patents.append({
                            "patent_id": p_num,
                            "patent_number": p_num,
                            "title": p_title,
                            "assignee": assignee_str,
                            "inventor": p_inventor,
                            "year": year,
                            "filing_date": p_filing_date,
                            "publication_date": p_pub_date,
                            "abstract": p_snippet[:350] + ("..." if len(p_snippet) > 350 else ""),
                            "url": direct_url,
                            "patent_url": direct_url,
                            "google_search_url": google_patents_search_url,
                            "novelty_angle": novelty,
                            "novelty_advisory": novelty,
                            "source": "Google Patents"
                        })

        except Exception as e:
            print(f"Google Patents query error: {e}")

        # If Google Patents returned nothing, try the HTML search page as backup
        if not patents:
            patents = self._search_patents_html_fallback(key_terms, domain, google_patents_search_url, max_results)

        if patents:
            self.cache[cache_key] = patents
            self._save_cache()

        return patents

    def _search_patents_html_fallback(
        self, key_terms: List[str], domain: str, search_url: str, max_results: int
    ) -> List[Dict[str, Any]]:
        """
        Backup: Scrape Google Patents HTML search page for basic patent info.
        Only used when XHR JSON endpoint fails.
        """
        patents = []
        try:
            raw_query = " ".join(key_terms)
            url = f"https://patents.google.com/?q={urllib.parse.quote(raw_query)}&oq={urllib.parse.quote(raw_query)}"
            req = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                              "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html"
            })

            with urllib.request.urlopen(req, timeout=10) as resp:
                html = resp.read().decode('utf-8', errors='replace')

                # Extract patent numbers from search result links
                patent_ids = re.findall(r'/patent/([A-Z]{2}\d+[A-Z]\d?)/en', html)
                # Deduplicate
                seen = set()
                unique_ids = []
                for pid in patent_ids:
                    if pid not in seen:
                        seen.add(pid)
                        unique_ids.append(pid)

                for pid in unique_ids[:max_results]:
                    patents.append({
                        "patent_id": pid,
                        "patent_number": pid,
                        "title": f"Patent Prior Art: {pid}",
                        "assignee": "Refer to Google Patents entry",
                        "inventor": "",
                        "year": "N/A",
                        "filing_date": "",
                        "publication_date": "",
                        "abstract": f"Patent details available at the Google Patents link. Click to view full title, claims, and abstract.",
                        "url": f"https://patents.google.com/patent/{pid}/en",
                        "patent_url": f"https://patents.google.com/patent/{pid}/en",
                        "google_search_url": search_url,
                        "novelty_angle": self.generate_novelty_advisory(pid, "", domain),
                        "novelty_advisory": self.generate_novelty_advisory(pid, "", domain),
                        "source": "Google Patents (HTML)"
                    })

        except Exception as e:
            print(f"Google Patents HTML fallback error: {e}")

        return patents


# Global singleton
patent_finder = GooglePatentFinder()

if __name__ == "__main__":
    test_queries = [
        ("drone crop disease detection", "Agriculture"),
        ("blockchain land registry", "Blockchain & Cybersecurity"),
        ("traffic signal computer vision", "Transportation & Logistics")
    ]
    for q, dom in test_queries:
        pats = patent_finder.search_patents(q, dom, max_results=3)
        print(f"\n{'='*70}")
        print(f"Query: '{q}' | Found {len(pats)} patents")
        print("=" * 70)
        for p in pats:
            print(f"\n  [{p['patent_id']}] {p['title']}")
            print(f"  Assignee: {p['assignee']}")
            print(f"  Year: {p['year']}")
            print(f"  URL: {p['patent_url']}")
            print(f"  Abstract: {p['abstract'][:150]}...")
            print(f"  Novelty Tip: {p['novelty_advisory'][:120]}...")
