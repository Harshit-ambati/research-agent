"""
SIH Vector Database Store
Persistent Vector Database powered by ChromaDB with embedded cosine similarity
and hybrid NLP-token relevance scoring.
"""
import os
import json
import re
from typing import List, Dict, Any, Optional
import numpy as np

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
VECTOR_STORE_DIR = os.path.join(DATA_DIR, "vector_store")
MASTER_DATASET_PATH = os.path.join(DATA_DIR, "sih_master_dataset.json")

os.makedirs(VECTOR_STORE_DIR, exist_ok=True)

class SIHVectorStore:
    def __init__(self, persist_directory: str = VECTOR_STORE_DIR):
        self.persist_directory = persist_directory
        self.chroma_client = None
        self.collection = None
        self.dataset_cache: Dict[str, Dict[str, Any]] = {}
        self._init_chroma()
        self._load_dataset_cache()

    def _init_chroma(self):
        try:
            import chromadb
            from chromadb.config import Settings
            self.chroma_client = chromadb.PersistentClient(
                path=self.persist_directory,
                settings=Settings(anonymized_telemetry=False)
            )
            self.collection = self.chroma_client.get_or_create_collection(
                name="sih_problem_statements",
                metadata={"hnsw:space": "cosine"}
            )
            print("ChromaDB vector store initialized successfully.")
        except Exception as e:
            print(f"Warning initializing ChromaDB: {e}. Utilizing fallback vector engine.")
            self.chroma_client = None
            self.collection = None

    def _load_dataset_cache(self):
        if os.path.exists(MASTER_DATASET_PATH):
            with open(MASTER_DATASET_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                for item in data:
                    self.dataset_cache[item["id"]] = item

    def get_document_text(self, item: Dict[str, Any]) -> str:
        tech_str = ", ".join(item.get("tech_keywords", []))
        return (
            f"Title: {item.get('title', '')}. "
            f"Domain: {item.get('domain', '')}. "
            f"Category: {item.get('category', '')}. "
            f"Organization: {item.get('organization', '')}. "
            f"Technologies: {tech_str}. "
            f"Problem Description: {item.get('description', '')}"
        )

    def sync_dataset_to_vector_store(self, force: bool = False) -> int:
        """
        Indexes all items from sih_master_dataset.json into ChromaDB if not already indexed.
        """
        if not self.collection:
            return len(self.dataset_cache)

        existing_count = self.collection.count()
        if existing_count > 0 and not force:
            print(f"Vector collection already contains {existing_count} indexed items.")
            return existing_count

        print(f"Indexing {len(self.dataset_cache)} problem statements into ChromaDB...")
        ids = []
        documents = []
        metadatas = []

        for ps_id, item in self.dataset_cache.items():
            doc_text = self.get_document_text(item)
            ids.append(ps_id)
            documents.append(doc_text)
            metadatas.append({
                "id": str(ps_id),
                "year": int(item.get("year", 2024)),
                "category": str(item.get("category", "Software")),
                "domain": str(item.get("domain", "Miscellaneous")),
                "organization": str(item.get("organization", ""))[:100],
                "complexity": str(item.get("complexity", "Medium"))
            })

        # Batch insert
        batch_size = 64
        for i in range(0, len(ids), batch_size):
            end = min(i + batch_size, len(ids))
            self.collection.upsert(
                ids=ids[i:end],
                documents=documents[i:end],
                metadatas=metadatas[i:end]
            )

        new_count = self.collection.count()
        print(f"Indexing complete. Total vector store records: {new_count}")
        return new_count

    def add_or_update_statements(self, statements: List[Dict[str, Any]]) -> int:
        """
        Incrementally adds or updates new statements into the vector store.
        """
        if not statements:
            return 0

        # Update cache & json
        for s in statements:
            self.dataset_cache[s["id"]] = s

        # Save to master json
        with open(MASTER_DATASET_PATH, "w", encoding="utf-8") as f:
            json.dump(list(self.dataset_cache.values()), f, indent=2, ensure_ascii=False)

        if not self.collection:
            return len(statements)

        ids = []
        documents = []
        metadatas = []

        for item in statements:
            ids.append(item["id"])
            documents.append(self.get_document_text(item))
            metadatas.append({
                "id": str(item["id"]),
                "year": int(item.get("year", 2025)),
                "category": str(item.get("category", "Software")),
                "domain": str(item.get("domain", "Miscellaneous")),
                "organization": str(item.get("organization", ""))[:100],
                "complexity": str(item.get("complexity", "Medium"))
            })

        self.collection.upsert(ids=ids, documents=documents, metadatas=metadatas)
        return len(statements)

    def search(
        self,
        query: str,
        n_results: int = 15,
        year: Optional[int] = None,
        category: Optional[str] = None,
        domain: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Hybrid vector search combining ChromaDB semantic cosine similarity
        with NLP keyword boosts and metadata filters.
        """
        if not query or not query.strip():
            # Return top statements
            results = list(self.dataset_cache.values())
            if year:
                results = [r for r in results if r.get("year") == year]
            if category and category.lower() != "all":
                results = [r for r in results if category.lower() in r.get("category", "").lower()]
            if domain and domain.lower() != "all":
                results = [r for r in results if domain.lower() == r.get("domain", "").lower()]
            
            formatted = []
            for r in results[:n_results]:
                item = dict(r)
                item["semantic_score"] = 0.85
                item["relevance_percentage"] = 85
                formatted.append(item)
            return formatted

        where_filter = {}
        filters_list = []
        if year:
            filters_list.append({"year": int(year)})
        if category and category.lower() != "all":
            filters_list.append({"category": "Hardware" if "hard" in category.lower() else "Software"})
        if domain and domain.lower() != "all":
            filters_list.append({"domain": domain})

        if len(filters_list) == 1:
            where_filter = filters_list[0]
        elif len(filters_list) > 1:
            where_filter = {"$and": filters_list}

        chroma_hits = {}
        if self.collection and self.collection.count() > 0:
            try:
                chroma_results = self.collection.query(
                    query_texts=[query],
                    n_results=min(n_results * 3, self.collection.count()),
                    where=where_filter if where_filter else None
                )
                if chroma_results and chroma_results["ids"]:
                    retrieved_ids = chroma_results["ids"][0]
                    distances = chroma_results["distances"][0] if "distances" in chroma_results and chroma_results["distances"] else [0.5]*len(retrieved_ids)
                    for pid, dist in zip(retrieved_ids, distances):
                        # Cosine distance to similarity (0 to 1)
                        sim = max(0.0, 1.0 - float(dist))
                        chroma_hits[pid] = sim
            except Exception as e:
                print(f"Chroma query warning: {e}")

        # Fallback / Hybrid scoring across candidate dataset items
        query_words = set(re.findall(r'\w+', query.lower()))
        scored_candidates = []

        for pid, item in self.dataset_cache.items():
            # Apply metadata filters
            if year and item.get("year") != year:
                continue
            if category and category.lower() != "all":
                target_cat = "Hardware" if "hard" in category.lower() else "Software"
                if item.get("category") != target_cat:
                    continue
            if domain and domain.lower() != "all":
                if item.get("domain", "").lower() != domain.lower():
                    continue

            # Base vector score from Chroma
            vec_score = chroma_hits.get(pid, 0.20)

            # Keyword lexical overlap boost
            title_lower = item.get("title", "").lower()
            desc_lower = item.get("description", "").lower()
            domain_lower = item.get("domain", "").lower()
            tags_lower = " ".join(item.get("tech_keywords", [])).lower()

            match_count = 0
            for w in query_words:
                if len(w) <= 2:
                    continue
                if w in title_lower:
                    match_count += 3
                elif w in tags_lower:
                    match_count += 2
                elif w in domain_lower:
                    match_count += 1.5
                elif w in desc_lower:
                    match_count += 1

            lexical_score = min(1.0, match_count * 0.12)

            # Hybrid score: 65% Vector Semantic + 35% Lexical
            if pid in chroma_hits:
                combined_score = (vec_score * 0.65) + (lexical_score * 0.35)
            else:
                # Fallback if not hit by Chroma directly
                combined_score = max(0.15, lexical_score * 0.85)

            # Final relevance percentage
            relevance_pct = int(min(99, max(25, combined_score * 100)))

            entry = dict(item)
            entry["semantic_score"] = round(vec_score, 3)
            entry["lexical_score"] = round(lexical_score, 3)
            entry["relevance_percentage"] = relevance_pct
            scored_candidates.append(entry)

        # Sort by relevance percentage
        scored_candidates.sort(key=lambda x: x["relevance_percentage"], reverse=True)
        return scored_candidates[:n_results]

    def get_by_id(self, ps_id: str) -> Optional[Dict[str, Any]]:
        return self.dataset_cache.get(ps_id)

    def get_stats(self) -> Dict[str, Any]:
        years = {}
        categories = {}
        domains = {}
        for item in self.dataset_cache.values():
            y = str(item.get("year", "Unknown"))
            c = item.get("category", "Software")
            d = item.get("domain", "Miscellaneous")
            years[y] = years.get(y, 0) + 1
            categories[c] = categories.get(c, 0) + 1
            domains[d] = domains.get(d, 0) + 1

        return {
            "total_statements": len(self.dataset_cache),
            "vector_store_count": self.collection.count() if self.collection else 0,
            "years": years,
            "categories": categories,
            "top_domains": sorted(domains.items(), key=lambda x: x[1], reverse=True)[:10]
        }

vector_store = SIHVectorStore()

if __name__ == "__main__":
    count = vector_store.sync_dataset_to_vector_store()
    print("Vector store total records:", count)
    stats = vector_store.get_stats()
    print("Stats:", json.dumps(stats, indent=2))
    
    # Test query
    sample_query = "drone crop disease detection"
    results = vector_store.search(sample_query, n_results=3)
    print(f"\n--- Search results for '{sample_query}' ---")
    for r in results:
        print(f"[{r['relevance_percentage']}%] {r['id']} ({r['year']}) - {r['title']}")
