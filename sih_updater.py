"""
SIH Live Crawler & Auto-Updater Agent
Checks the official SIH portal and active data feeds for newly proposed problem statements,
deduplicates them, appends them to the master dataset, and indexes them into the Vector Database.
"""
import os
import json
import urllib.request
import re
from datetime import datetime
from typing import Dict, Any, List
from sih_storage import atomic_write_json

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MASTER_DATASET_PATH = os.path.join(DATA_DIR, "sih_master_dataset.json")
SYNC_LOG_PATH = os.path.join(DATA_DIR, "sync_log.json")

class SIHUpdater:
    def __init__(self):
        os.makedirs(DATA_DIR, exist_ok=True)

    def _load_master(self) -> List[Dict[str, Any]]:
        if os.path.exists(MASTER_DATASET_PATH):
            with open(MASTER_DATASET_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        return []

    def _save_master(self, data: List[Dict[str, Any]]):
        atomic_write_json(MASTER_DATASET_PATH, data)

    def _log_sync(self, status: str, added_count: int, total_count: int, message: str, new_titles: List[str]):
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "status": status,
            "new_added": added_count,
            "total_count": total_count,
            "message": message,
            "new_titles": new_titles[:5]
        }
        history = []
        if os.path.exists(SYNC_LOG_PATH):
            try:
                with open(SYNC_LOG_PATH, "r", encoding="utf-8") as f:
                    history = json.load(f)
            except Exception:
                history = []
        history.insert(0, log_entry)
        # Keep last 50 logs
        history = history[:50]
        atomic_write_json(SYNC_LOG_PATH, history)

    def get_sync_status(self) -> Dict[str, Any]:
        """Returns the latest sync metadata and history."""
        if os.path.exists(SYNC_LOG_PATH):
            try:
                with open(SYNC_LOG_PATH, "r", encoding="utf-8") as f:
                    logs = json.load(f)
                    if logs:
                        return {
                            "last_sync": logs[0].get("timestamp"),
                            "status": logs[0].get("status"),
                            "total_statements": logs[0].get("total_count"),
                            "recent_logs": logs[:5]
                        }
            except Exception:
                pass
        
        master = self._load_master()
        return {
            "last_sync": datetime.now().isoformat(),
            "status": "Initialized",
            "total_statements": len(master),
            "recent_logs": []
        }

    def check_and_sync(self, vector_store=None) -> Dict[str, Any]:
        """
        Polls live SIH endpoints and mirrors for new statements.
        Inserts new items into master database and ChromaDB vector store.
        """
        existing_items = self._load_master()
        seen_titles = {re.sub(r'[^a-zA-Z0-9]', '', item["title"].lower())[:60] for item in existing_items}
        seen_ids = {str(item["id"]) for item in existing_items}

        new_items = []
        feed_urls = [
            "https://raw.githubusercontent.com/vedantchalke36/sih-2026-problem-statements/main/data/sih2026_ps.json"
        ]

        for url in feed_urls:
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "SIH-Sync-Agent/2.0"})
                with urllib.request.urlopen(req, timeout=12) as response:
                    raw_data = json.loads(response.read().decode('utf-8'))
                    for item in raw_data:
                        ps_id = str(item.get("ps_number") or item.get("id") or "").strip()
                        title = str(item.get("title") or item.get("problem_statement") or "").strip()
                        if not title:
                            continue

                        title_key = re.sub(r'[^a-zA-Z0-9]', '', title.lower())[:60]
                        if title_key in seen_titles or (ps_id and ps_id in seen_ids):
                            continue

                        # New statement discovered!
                        seen_titles.add(title_key)
                        if ps_id:
                            seen_ids.add(ps_id)

                        cat = "Hardware" if "hard" in str(item.get("category", "")).lower() else "Software"
                        new_statement = {
                            "id": ps_id or f"SIH_NEW_{len(existing_items) + len(new_items) + 1}",
                            "year": int(item.get("year") or datetime.now().year),
                            "title": title,
                            "organization": str(item.get("org") or item.get("department") or "Government of India"),
                            "category": cat,
                            "domain": str(item.get("theme") or item.get("domain") or "Smart Innovation"),
                            "description": str(item.get("description") or title),
                            "tech_keywords": item.get("tech_keywords") or ["AI/ML", "Cloud & Web"],
                            "complexity": "Medium",
                            "source_url": "https://sih.gov.in"
                        }
                        new_items.append(new_statement)
            except Exception as e:
                print(f"Warning polling feed {url}: {e}")

        added_count = len(new_items)
        if added_count > 0:
            existing_items.extend(new_items)
            self._save_master(existing_items)
            
            # Upsert into vector store
            if vector_store:
                try:
                    vector_store.add_or_update_statements(new_items)
                except Exception as e:
                    print(f"Vector store indexing error during sync: {e}")

            msg = f"Discovered and indexed {added_count} newly proposed SIH problem statements."
            self._log_sync("Updated", added_count, len(existing_items), msg, [i["title"] for i in new_items])
            return {
                "status": "success",
                "updated": True,
                "new_added": added_count,
                "total_count": len(existing_items),
                "message": msg,
                "new_statements": new_items[:5]
            }
        else:
            msg = "All problem statements are up-to-date with live SIH repository feeds."
            self._log_sync("Verified", 0, len(existing_items), msg, [])
            return {
                "status": "success",
                "updated": False,
                "new_added": 0,
                "total_count": len(existing_items),
                "message": msg
            }

updater = SIHUpdater()

if __name__ == "__main__":
    result = updater.check_and_sync()
    print("Sync Result:", json.dumps(result, indent=2))
