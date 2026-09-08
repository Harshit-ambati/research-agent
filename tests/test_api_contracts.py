import os
import unittest
from types import SimpleNamespace

from fastapi.testclient import TestClient

os.environ.setdefault("SIH_REQUIRE_ADMIN_TOKEN", "")

from server import app
from dataset_finder import DatasetFinder
from knowledge_finder import KnowledgeFinder
from sih_agent_core import SIHAgentCore


class ApiContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_stats_reports_live_archive_metadata(self):
        response = self.client.get("/api/stats")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertGreater(payload["total_statements"], 0)
        self.assertEqual(payload["total_statements"], payload["vector_store_count"])
        self.assertTrue(payload["years"])
        self.assertTrue(payload["categories"])

    def test_empty_search_is_valid_browsing_request(self):
        response = self.client.post("/api/search", json={"query": "", "limit": 3})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["results"]), 3)

    def test_search_rejects_out_of_range_limit(self):
        response = self.client.post("/api/search", json={"query": "drone", "limit": 0})
        self.assertEqual(response.status_code, 422)

    def test_research_rejects_blank_or_short_queries(self):
        response = self.client.post("/api/research/run", json={"query": "  "})
        self.assertEqual(response.status_code, 422)

    def test_unknown_topic_is_not_replaced_with_an_unrelated_match(self):
        response = self.client.get("/api/topic/not-a-real-topic")
        self.assertEqual(response.status_code, 404)

    def test_mentor_chat_requires_a_real_topic_id(self):
        response = self.client.post(
            "/api/llm/chat",
            json={"ps_id": "not-a-real-topic", "message": "Help me plan this."},
        )
        self.assertEqual(response.status_code, 404)

    def test_cors_does_not_grant_credentials_to_any_origin(self):
        response = self.client.options(
            "/api/search",
            headers={
                "Origin": "https://untrusted.example",
                "Access-Control-Request-Method": "POST",
            },
        )
        self.assertNotEqual(response.headers.get("access-control-allow-origin"), "*")
        self.assertNotEqual(response.headers.get("access-control-allow-credentials"), "true")

    def test_chat_history_is_bounded_and_has_known_roles(self):
        response = self.client.post(
            "/api/llm/chat",
            json={
                "ps_id": "SIH26001",
                "message": "Help me plan this.",
                "history": [{"role": "system", "content": "not accepted"}],
            },
        )
        self.assertEqual(response.status_code, 422)

    def test_admin_token_can_protect_mutating_routes(self):
        previous = os.environ.get("SIH_ADMIN_TOKEN")
        os.environ["SIH_ADMIN_TOKEN"] = "test-token"
        try:
            response = self.client.post("/api/sync")
            self.assertEqual(response.status_code, 403)
        finally:
            if previous is None:
                os.environ.pop("SIH_ADMIN_TOKEN", None)
            else:
                os.environ["SIH_ADMIN_TOKEN"] = previous

    def test_weather_without_location_requests_location_instead_of_guessing(self):
        response = self.client.post("/api/weather", json={})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"needs_location": True})


class ProviderFallbackTests(unittest.TestCase):
    def test_failed_llm_uses_matched_archive_records_and_is_not_marked_active(self):
        core = SIHAgentCore()
        core.nlp = SimpleNamespace(parse_prompt=lambda _: {
            "is_conversational": True,
            "enriched_vector_query": "ai ml capstone",
            "entities": ["AI"],
            "tech_stack": [],
        })
        core.vector_store = SimpleNamespace(search=lambda **_: [{
            "title": "Live archive problem",
            "domain": "Smart Automation",
            "tech_keywords": [],
        }])
        core.llm = SimpleNamespace(_active=True, _last_error="HTTP Error 429", answer_general_query=lambda _: None)
        core._generate_nlp_llm_chain_of_thought = lambda **_: []

        response = core.discover_topics("suggest an AI capstone", n_results=1)
        fallback = response["llm_answer"]
        self.assertFalse(fallback["llm_active"])
        self.assertTrue(fallback["fallback"])
        self.assertIn("Live archive problem", fallback["answer"])

    def test_dataset_provider_returns_no_synthetic_record_when_empty(self):
        finder = DatasetFinder()
        finder._fetch_huggingface_datasets = lambda query, limit: []
        finder._fetch_github_repos = lambda query, limit: []
        finder.cache = {}
        result = finder.search_datasets_and_repos("edge case topic", max_results=2)
        self.assertEqual(result["datasets"], [])
        self.assertEqual(result["repositories"], [])

    def test_knowledge_provider_returns_empty_when_no_article_is_found(self):
        finder = KnowledgeFinder()
        finder.cache = {}
        finder._find_best_page_title = lambda query: None
        finder._fetch_page_summary = lambda title: {}
        finder._fetch_related_topics = lambda title: []
        self.assertEqual(finder.search_knowledge("unavailable topic"), {})


if __name__ == "__main__":
    unittest.main()
