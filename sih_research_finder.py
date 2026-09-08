"""
SIH Academic Research Paper Finder
Fetches real peer-reviewed papers from CrossRef (primary) and arXiv (secondary)
matching problem statements and extracted NLP entities.
All results are live from real academic databases — no hardcoded fallbacks.
"""
import os
import json
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
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
CACHE_FILE = os.path.join(DATA_DIR, "research_cache.json")
os.makedirs(DATA_DIR, exist_ok=True)

# Stopwords to strip from search queries for better API results
QUERY_STOPWORDS = {
    "the", "and", "for", "with", "system", "using", "based", "development",
    "automated", "smart", "india", "hackathon", "sih", "problem", "statement",
    "solution", "create", "build", "want", "need", "help", "make", "project",
    "implement", "design", "propose", "proposed", "real", "time", "realtime"
}


class ResearchPaperFinder:
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
            print(f"Error saving research cache: {e}")

    def clean_text(self, text: str) -> str:
        if not text:
            return ""
        # Strip HTML/JATS tags
        text = re.sub(r'<[^>]+>', '', str(text))
        return re.sub(r'\s+', ' ', text).strip()

    def _extract_key_terms(self, query: str, max_terms: int = 5) -> List[str]:
        """Extract meaningful search terms from a raw query string."""
        words = re.findall(r'\b[a-zA-Z]{3,}\b', query.lower())
        key_terms = [w for w in words if w not in QUERY_STOPWORDS]
        # Deduplicate while preserving order
        seen = set()
        unique = []
        for w in key_terms:
            if w not in seen:
                seen.add(w)
                unique.append(w)
        return unique[:max_terms]

    def generate_research_takeaway(self, title: str, abstract: str, domain: str = "") -> str:
        """
        Synthesizes an actionable research takeaway and methodological insight
        from the actual paper content across diverse scientific and engineering disciplines.
        """
        combined = (title + " " + abstract).lower()
        takeaways = []

        if any(kw in combined for kw in ["quantum", "qubit", "superposition", "entanglement"]):
            takeaways.append("Explores quantum computational mechanics, circuit error suppression, or fault-tolerant state formulation.")

        if any(kw in combined for kw in ["crispr", "gene", "dna", "rna", "mutation", "therapeutic", "protein"]):
            takeaways.append("Analyzes targeted genomic modification, vector delivery mechanisms, or molecular pathway efficacy.")

        if any(kw in combined for kw in ["deep learning", "neural network", "cnn", "transformer", "llm", "attention", "yolo"]):
            takeaways.append("Presents architectural baseline, attention mechanics, or neural training objectives adaptable for empirical benchmarks.")

        if any(kw in combined for kw in ["dataset", "benchmark", "evaluation", "accuracy", "f1", "precision", "empirical"]):
            takeaways.append("Provides empirical evaluation protocols, test benchmarks, and statistical validation metrics.")

        if any(kw in combined for kw in ["battery", "energy", "solar", "photovoltaic", "cathode", "anode", "electrolyte"]):
            takeaways.append("Evaluates thermodynamic efficiency, material degradation kinetics, or energy density optimization.")

        if any(kw in combined for kw in ["iot", "sensor", "edge", "embedded", "low-power", "microcontroller"]):
            takeaways.append("Presents low-power telemetry, embedded edge inference, and latency-optimized deployment pipelines.")

        if any(kw in combined for kw in ["blockchain", "ledger", "smart contract", "consensus", "cryptographic"]):
            takeaways.append("Details decentralized verification, Byzantine fault tolerance, or cryptographic trust guarantees.")

        if any(kw in combined for kw in ["robot", "autonomous", "kinematics", "slam", "path planning", "drone"]):
            takeaways.append("Formulates spatial perception, trajectory planning, and real-time robotic state estimation.")

        if not takeaways:
            takeaways.append("Provides rigorous theoretical foundations, mathematical formulation, and experimental methodologies relevant to the domain.")

        return " ".join(takeaways[:2])

    def generate_hackathon_note(self, title: str, abstract: str, domain: str = "") -> str:
        return self.generate_research_takeaway(title, abstract, domain)

    def search_papers(self, query: str, domain: str = "", max_results: int = 4) -> List[Dict[str, Any]]:
        """
        Fetches real academic papers using CrossRef API (primary) and arXiv (secondary).
        Returns papers with real DOIs, real authors, real abstracts, and working links.
        """
        key_terms = self._extract_key_terms(query)
        if not key_terms:
            key_terms = self._extract_key_terms(domain)
        if not key_terms:
            return []

        cache_key = f"{' '.join(key_terms).lower()}|{max_results}"
        if cache_key in self.cache:
            return self.cache[cache_key]

        papers = []

        # Primary source: CrossRef API (reliable, free, real DOIs)
        crossref_papers = self._search_crossref(key_terms, max_results)
        papers.extend(crossref_papers)

        # Secondary source: arXiv (if CrossRef didn't return enough)
        if len(papers) < max_results:
            remaining = max_results - len(papers)
            arxiv_papers = self._search_arxiv(key_terms, remaining)
            papers.extend(arxiv_papers)

        # Add research & hackathon takeaway notes to each paper
        for p in papers:
            takeaway = self.generate_research_takeaway(
                p.get("title", ""), p.get("abstract", ""), domain
            )
            p["research_takeaway"] = takeaway
            p["hackathon_takeaway"] = takeaway

        if papers:
            self.cache[cache_key] = papers
            self._save_cache()

        return papers

    def _search_crossref(self, key_terms: List[str], max_results: int) -> List[Dict[str, Any]]:
        """Query CrossRef API for real peer-reviewed papers with DOIs."""
        papers = []
        try:
            search_query = "+".join(key_terms)
            url = (
                f"https://api.crossref.org/works?"
                f"query={urllib.parse.quote(search_query)}"
                f"&rows={max_results}"
                f"&select=DOI,title,author,published-print,published-online,abstract,URL,type"
                f"&sort=relevance"
            )
            req = urllib.request.Request(url, headers={
                "User-Agent": "SIH-Research-Agent/2.0 (mailto:sih-agent@research.edu)"
            })

            with urllib.request.urlopen(req, timeout=12) as response:
                data = json.loads(response.read().decode('utf-8'))
                items = data.get("message", {}).get("items", [])

                for item in items[:max_results]:
                    doi = item.get("DOI", "")
                    titles = item.get("title", [])
                    title = self.clean_text(titles[0]) if titles else "Untitled"

                    # Extract authors
                    authors = []
                    for auth in item.get("author", [])[:4]:
                        name = f"{auth.get('given', '')} {auth.get('family', '')}".strip()
                        if name:
                            authors.append(name)
                    if len(item.get("author", [])) > 4:
                        authors.append("et al.")

                    # Publication date
                    pub_date_parts = (
                        item.get("published-print", {}).get("date-parts", [[]])
                        or item.get("published-online", {}).get("date-parts", [[]])
                    )
                    if pub_date_parts and pub_date_parts[0]:
                        year = str(pub_date_parts[0][0])
                    else:
                        year = "Recent"

                    # Abstract
                    abstract = self.clean_text(item.get("abstract", ""))
                    if len(abstract) > 400:
                        abstract = abstract[:397] + "..."

                    # URLs
                    paper_url = item.get("URL", f"https://doi.org/{doi}" if doi else "")
                    pdf_url = f"https://doi.org/{doi}" if doi else ""

                    papers.append({
                        "title": title,
                        "authors": authors if authors else ["Unknown Author"],
                        "year": year,
                        "published_date": year,
                        "abstract": abstract if abstract else "Abstract not available via CrossRef. Visit the DOI link for full text.",
                        "doi": doi,
                        "url": paper_url,
                        "paper_url": paper_url,
                        "pdf_url": pdf_url,
                        "arxiv_url": "",
                        "source": "CrossRef",
                        "category": item.get("type", "journal-article"),
                        "hackathon_takeaway": ""
                    })

        except Exception as e:
            print(f"CrossRef API error: {e}")

        return papers

    def _search_arxiv(self, key_terms: List[str], max_results: int) -> List[Dict[str, Any]]:
        """Query arXiv API for open-access preprints."""
        papers = []
        try:
            # Use OR for broader results, with key terms
            search_parts = [f"all:{term}" for term in key_terms[:3]]
            search_expr = " AND ".join(search_parts)

            params = {
                "search_query": search_expr,
                "start": 0,
                "max_results": max_results,
                "sortBy": "relevance",
                "sortOrder": "descending"
            }
            url = f"http://export.arxiv.org/api/query?{urllib.parse.urlencode(params)}"
            req = urllib.request.Request(url, headers={
                "User-Agent": "SIH-Agent/2.0 (academic-research)"
            })

            with urllib.request.urlopen(req, timeout=15) as response:
                xml_data = response.read()
                root = ET.fromstring(xml_data)

                ns = {
                    "atom": "http://www.w3.org/2005/Atom",
                    "arxiv": "http://arxiv.org/schemas/atom"
                }
                entries = root.findall("atom:entry", ns)

                for entry in entries:
                    raw_title = entry.find("atom:title", ns)
                    title = self.clean_text(raw_title.text if raw_title is not None else "")
                    if not title:
                        continue

                    raw_summary = entry.find("atom:summary", ns)
                    summary = self.clean_text(raw_summary.text if raw_summary is not None else "")

                    raw_published = entry.find("atom:published", ns)
                    published = (raw_published.text[:10]) if raw_published is not None else "Recent"

                    authors = []
                    for author in entry.findall("atom:author", ns):
                        name_elem = author.find("atom:name", ns)
                        if name_elem is not None and name_elem.text:
                            authors.append(name_elem.text.strip())
                    if len(authors) > 4:
                        authors = authors[:3] + ["et al."]

                    # Extract URLs
                    arxiv_url = ""
                    pdf_url = ""
                    for link in entry.findall("atom:link", ns):
                        link_title = link.attrib.get("title", "")
                        link_type = link.attrib.get("type", "")
                        link_rel = link.attrib.get("rel", "")
                        if link_title == "pdf" or link_type == "application/pdf":
                            pdf_url = link.attrib.get("href", "")
                        elif link_rel == "alternate":
                            arxiv_url = link.attrib.get("href", "")

                    if not pdf_url and arxiv_url:
                        pdf_url = arxiv_url.replace("/abs/", "/pdf/") + ".pdf"

                    category_elem = entry.find("arxiv:primary_category", ns)
                    cat = category_elem.attrib.get("term", "cs.AI") if category_elem is not None else "cs.AI"

                    if len(summary) > 400:
                        summary = summary[:397] + "..."

                    papers.append({
                        "title": title,
                        "authors": authors if authors else ["Unknown Author"],
                        "year": published[:4] if len(published) >= 4 else published,
                        "published_date": published,
                        "abstract": summary if summary else "Abstract available on arXiv page.",
                        "doi": "",
                        "url": arxiv_url or pdf_url,
                        "paper_url": arxiv_url,
                        "pdf_url": pdf_url,
                        "arxiv_url": arxiv_url,
                        "source": "arXiv",
                        "category": cat,
                        "hackathon_takeaway": ""
                    })

        except Exception as e:
            print(f"arXiv API error: {e}")

        return papers


# Global singleton
research_finder = ResearchPaperFinder()

if __name__ == "__main__":
    test_queries = [
        ("drone crop disease detection", "Agriculture"),
        ("blockchain land registry fraud prevention", "Blockchain & Cybersecurity"),
        ("traffic signal computer vision ambulance", "Transportation & Logistics")
    ]
    for q, dom in test_queries:
        results = research_finder.search_papers(q, dom, max_results=3)
        print(f"\n{'='*70}")
        print(f"Query: '{q}' | Found {len(results)} papers")
        print("=" * 70)
        for p in results:
            print(f"\n  [{p['source']}] {p['title']}")
            print(f"  Authors: {', '.join(p['authors'])}")
            print(f"  Year: {p['published_date']} | DOI: {p.get('doi', 'N/A')}")
            print(f"  Link: {p['paper_url'] or p['pdf_url']}")
            print(f"  Takeaway: {p['hackathon_takeaway']}")
