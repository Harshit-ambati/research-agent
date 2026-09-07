"""
SIH Master Agent Core Coordinator
Integrates NLP prompt understanding, Vector Database retrieval,
AI Hackathon Advisory, Research Paper Discovery, Google Patents analysis,
and 4-slide Presentation Blueprint generation.
"""
import json
import re
from typing import Dict, Any, List, Optional
from sih_nlp_engine import nlp_engine
from sih_vector_store import vector_store
from sih_research_finder import research_finder
from sih_patent_finder import patent_finder
from sih_updater import updater

class SIHAgentCore:
    def __init__(self):
        self.nlp = nlp_engine
        self.vector_store = vector_store
        self.research = research_finder
        self.patents = patent_finder
        self.updater = updater

    def discover_topics(
        self,
        prompt: str,
        n_results: int = 12,
        year: Optional[int] = None,
        category: Optional[str] = None,
        domain: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        End-to-end discovery pipeline:
        1. NLP parse prompt (entities, intent, category inference)
        2. Vector search with enriched query
        3. Annotate results with advisory insights
        """
        nlp_analysis = self.nlp.parse_prompt(prompt)
        search_query = nlp_analysis.get("enriched_vector_query") or prompt

        # If user did not manually specify category, we can optionally use NLP category if confidence is high
        effective_category = category
        if not effective_category or effective_category.lower() == "all":
            # Keep open unless user clicked a filter
            effective_category = None

        matched_topics = self.vector_store.search(
            query=search_query,
            n_results=n_results,
            year=year,
            category=effective_category,
            domain=domain
        )

        # Annotate top results with quick summary
        for topic in matched_topics:
            topic["match_reason"] = self._generate_quick_match_reason(topic, nlp_analysis)

        return {
            "nlp_analysis": nlp_analysis,
            "total_matches": len(matched_topics),
            "topics": matched_topics
        }

    def _generate_quick_match_reason(self, topic: Dict[str, Any], nlp_data: Dict[str, Any]) -> str:
        domain = topic.get("domain", "")
        entities = nlp_data.get("entities", [])
        tech = topic.get("tech_keywords", [])
        
        shared_tech = [t for t in tech if t in nlp_data.get("tech_stack", [])]
        if shared_tech:
            return f"Aligns with your requested {shared_tech[0]} stack in {domain}."
        elif entities:
            return f"Addresses core requirements related to '{entities[0]}' in {domain}."
        else:
            return f"Official problem statement under {domain}."

    def analyze_topic_deep(self, ps_id: str, user_prompt: str = "") -> Dict[str, Any]:
        """
        Generates holistic hackathon strategic analysis:
        - Advisory (Why matched, Tech Stack, Winning Edge, 36h MVP roadmap)
        - Academic Research Papers (arXiv)
        - Google Patents prior art & novelty advice
        - 4-slide Pitch Deck Outline
        """
        topic = self.vector_store.get_by_id(ps_id)
        if not topic:
            # Fallback search
            matches = self.vector_store.search(ps_id, n_results=1)
            topic = matches[0] if matches else None

        if not topic:
            return {"error": f"Problem Statement {ps_id} not found."}

        title = topic.get("title", "")
        domain = topic.get("domain", "")
        desc = topic.get("description", "")
        category = topic.get("category", "Software")
        tech_tags = topic.get("tech_keywords", [])

        # 1. Fetch Research Papers
        papers = self.research.search_papers(query=f"{title} {' '.join(tech_tags[:2])}", domain=domain, max_results=3)

        # 2. Fetch Google Patents
        patents = self.patents.search_patents(query=f"{title} {' '.join(tech_tags[:2])}", domain=domain, max_results=3)

        # 3. Formulate Recommended Tech Stack
        tech_stack = self._generate_recommended_tech_stack(category, tech_tags, domain)

        # 4. Formulate Winning Novelty Edge
        novelty_edge = self._generate_winning_edge(category, tech_tags, domain)

        # 5. Formulate 36-Hour Hackathon MVP Feasibility
        roadmap = self._generate_36h_roadmap(category, title)

        # 6. Generate Hackathon 4-Slide Pitch Outline
        pitch_outline = self._generate_pitch_blueprint(topic, tech_stack, novelty_edge)

        return {
            "topic": topic,
            "advisory": {
                "why_matched": f"This problem statement directly targets challenges in {domain}, requiring {category} development. It aligns with real requirements from {topic.get('organization', 'Government bodies')}.",
                "recommended_tech_stack": tech_stack,
                "winning_novelty_edge": novelty_edge,
                "feasibility_roadmap": roadmap,
                "complexity": topic.get("complexity", "Medium"),
                "estimated_mvp_readiness": "Feasible within 36 Hours with pre-built component templates."
            },
            "research_papers": papers,
            "patents": patents,
            "pitch_outline": pitch_outline
        }

    def _generate_recommended_tech_stack(self, category: str, tech_tags: List[str], domain: str) -> Dict[str, str]:
        tags_str = " ".join(tech_tags).lower()
        
        # AI / ML
        if "vision" in tags_str:
            ai_stack = "PyTorch / Ultralytics YOLOv8, OpenCV, MediaPipe for edge vision inference."
        elif "nlp" in tags_str:
            ai_stack = "HuggingFace Transformers, spaCy, Llama-3 / Mistral 7B quantized via Ollama."
        elif "gis" in tags_str:
            ai_stack = "Rasterio, GeoPandas, GDAL, Sentinel-2 / Cartosat API, Leaflet."
        else:
            ai_stack = "Scikit-Learn, LightGBM / XGBoost, FastAPI for model serving."

        # Backend
        backend_stack = "Python FastAPI with Pydantic for asynchronous REST endpoints, SQLite / PostgreSQL with SQLAlchemy."

        # Frontend
        frontend_stack = "React.js / Vite + Tailwind CSS or Flutter for cross-platform mobile access."

        # Hardware (if applicable)
        if "hard" in category.lower() or "iot" in tags_str or "drone" in tags_str:
            hardware_stack = "ESP32 / Raspberry Pi 4, LoRaWAN transceiver, telemetry sensor module, Pixhawk flight controller (for drones)."
        else:
            hardware_stack = "Standard cloud / mobile deployment (No specialized hardware needed)."

        return {
            "ai_ml": ai_stack,
            "backend": backend_stack,
            "frontend": frontend_stack,
            "hardware_iot": hardware_stack,
            "database": "PostgreSQL with TimescaleDB (for sensor/IoT) or SQLite (for local MVP demonstration)"
        }

    def _generate_winning_edge(self, category: str, tech_tags: List[str], domain: str) -> str:
        tags_str = " ".join(tech_tags).lower()
        if "vision" in tags_str:
            return "Implement OFFLINE edge inference: Most hackathon teams propose cloud-dependent APIs that fail in low-connectivity rural zones. By demonstrating real-time on-device quantization without internet, your team will immediately secure top marks."
        elif "drone" in tags_str:
            return "Incorporate dynamic geo-fencing and battery-aware path optimization: Show an interactive mission simulation with fail-safe return-to-launch (RTL) telemetry to prove field readiness."
        elif "blockchain" in tags_str:
            return "Use Zero-Knowledge Proofs (ZKP) for privacy: Allow citizens to verify credentials or land deeds without exposing personal Aadhaar/KYC data, fulfilling government data protection guidelines."
        else:
            return "Demonstrate measurable ROI and social impact metrics: Calculate tangible cost reduction (e.g. 60% faster turnaround time, 40% cost savings for the ministry) directly on your live demo dashboard."

    def _generate_36h_roadmap(self, category: str, title: str) -> List[Dict[str, str]]:
        if "hard" in category.lower():
            return [
                {"phase": "Hours 0-6", "milestone": "Pinout verification, sensor calibration, and establishing serial/MQTT telemetry to local gateway."},
                {"phase": "Hours 6-18", "milestone": "Firmware programming on ESP32/RPi, breadboard prototype assembly, and data capture test runs."},
                {"phase": "Hours 18-30", "milestone": "Connecting hardware telemetry stream to FastAPI backend & rendering live sensor gauges on dashboard."},
                {"phase": "Hours 30-36", "milestone": "Enclosure casing, battery test, live physical demonstration rehearsal, and pitch deck finalization."}
            ]
        else:
            return [
                {"phase": "Hours 0-6", "milestone": "Repository setup, database schema modeling, and implementing mock REST API endpoints."},
                {"phase": "Hours 6-18", "milestone": "Core algorithmic engine development (AI model loading, dataset pipeline, feature extraction)."},
                {"phase": "Hours 18-30", "milestone": "Frontend UI integration, real-time charts/maps, and user role workflows (Admin vs Citizen/Officer)."},
                {"phase": "Hours 30-36", "milestone": "End-to-end edge case testing, caching for instant response, recording demo screencast, and pitch polishing."}
            ]

    def _generate_pitch_blueprint(self, topic: Dict[str, Any], tech_stack: Dict[str, str], novelty_edge: str) -> Dict[str, Any]:
        return {
            "slide_1": {
                "title": "Problem Statement & Ground Reality",
                "bullets": [
                    f"Official PS: {topic.get('id')} - {topic.get('title')}",
                    f"Sponsoring Organization: {topic.get('organization')}",
                    "Core Pain Point: Manual, inefficient, or error-prone processes leading to substantial delay and high operational cost.",
                    "Target Beneficiaries: Ground personnel, field officers, and general public impacted across India."
                ]
            },
            "slide_2": {
                "title": "Proposed Innovation & System Architecture",
                "bullets": [
                    "A modular, end-to-end platform engineered for zero-downtime and high accessibility.",
                    "Key Differentiator: " + novelty_edge[:140] + "...",
                    "Scalable 3-tier architecture: Ingestion Layer -> Intelligent Processing Core -> Interactive Decision Dashboard."
                ]
            },
            "slide_3": {
                "title": "Technical Implementation & Tech Stack",
                "bullets": [
                    f"Core AI/Compute: {tech_stack.get('ai_ml')[:120]}...",
                    f"Application Stack: {tech_stack.get('backend')} & {tech_stack.get('frontend')}",
                    f"Deployment: Docker containers with sub-second response times and edge optimization."
                ]
            },
            "slide_4": {
                "title": "Feasibility, Social Impact & Business Viability",
                "bullets": [
                    "Field-Ready MVP completed within the 36-hour hackathon timeframe.",
                    "Social Impact: Democratizes access, prevents catastrophic failures, and automates grievance redressal.",
                    "Cost Efficiency: Achieves 70%+ reduction in hardware costs compared to proprietary closed-source alternatives."
                ]
            }
        }

agent_core = SIHAgentCore()

if __name__ == "__main__":
    test_query = "drone crop disease detection"
    res = agent_core.discover_topics(test_query, n_results=2)
    print("Discovered topics:", len(res["topics"]))
    if res["topics"]:
        first_id = res["topics"][0]["id"]
        deep = agent_core.analyze_topic_deep(first_id)
        print(f"\nDeep Analysis for {first_id}:")
        print("Why Matched:", deep["advisory"]["why_matched"])
        print("Research Papers found:", len(deep["research_papers"]))
        print("Patents found:", len(deep["patents"]))
        print("Slide 1 Title:", deep["pitch_outline"]["slide_1"]["title"])
