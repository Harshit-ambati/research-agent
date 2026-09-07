"""
SIH Master Dataset Compiler
Fetches and consolidates SIH problem statements across years into data/sih_master_dataset.json.
"""
import os
import json
import urllib.request
import re

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(DATA_DIR, exist_ok=True)
MASTER_PATH = os.path.join(DATA_DIR, "sih_master_dataset.json")

def clean_text(text):
    if not text:
        return ""
    return re.sub(r'\s+', ' ', str(text)).strip()

def download_online_dataset():
    statements = []
    # Source: SIH 2024 / 2025 raw JSON from verified repo
    url_2024 = "https://raw.githubusercontent.com/vedantchalke36/sih-2026-problem-statements/main/data/sih2026_ps.json"
    print(f"Fetching from {url_2024}...")
    try:
        req = urllib.request.Request(url_2024, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f"Fetched {len(data)} items from GitHub SIH repository")
            
            for item in data:
                # Inspect fields
                ps_id = str(item.get("id") or item.get("problem_statement_id") or item.get("ps_id") or "").strip()
                title = clean_text(item.get("title") or item.get("problem_statement") or item.get("title_of_problem_statement") or "")
                org = clean_text(item.get("organization") or item.get("ministry") or item.get("department") or "")
                cat = clean_text(item.get("category") or item.get("type") or "Software")
                domain = clean_text(item.get("domain") or item.get("theme") or item.get("bucket") or "Miscellaneous")
                desc = clean_text(item.get("description") or item.get("details") or item.get("problem_description") or title)
                tech = item.get("tech_keywords") or item.get("technology_bucket") or []
                if isinstance(tech, str):
                    tech = [t.strip() for t in tech.split(",") if t.strip()]
                
                # Normalize category
                if "hard" in cat.lower():
                    cat = "Hardware"
                else:
                    cat = "Software"
                
                year = item.get("year") or 2024
                
                if title:
                    statements.append({
                        "id": ps_id if ps_id else f"SIH_{len(statements)+1}",
                        "year": int(year),
                        "title": title,
                        "organization": org or "Government of India / Public Sector",
                        "category": cat,
                        "domain": domain,
                        "description": desc or title,
                        "tech_keywords": tech,
                        "complexity": item.get("complexity", "Medium"),
                        "source_url": item.get("url") or item.get("youtube_link") or "https://sih.gov.in"
                    })
    except Exception as e:
        print(f"Warning fetching online dataset: {e}")

    return statements

if __name__ == "__main__":
    download_online_dataset()
