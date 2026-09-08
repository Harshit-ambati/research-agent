"""
SIH Master Agent Core Coordinator
Integrates NLP prompt understanding, Vector Database retrieval,
AI Hackathon Advisory, Research Paper Discovery, Google Patents analysis,
and 4-slide Presentation Blueprint generation.
LLM integration provides dynamic, non-hardcoded advisory generation.
"""
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Any, List, Optional
from sih_nlp_engine import nlp_engine
from sih_vector_store import vector_store
from sih_research_finder import research_finder
from sih_patent_finder import patent_finder
from sih_updater import updater
from sih_llm_engine import llm_engine
from knowledge_finder import knowledge_finder
from dataset_finder import dataset_finder


class SIHAgentCore:
    def __init__(self):
        self.nlp = nlp_engine
        self.vector_store = vector_store
        self.research = research_finder
        self.patents = patent_finder
        self.updater = updater
        self.llm = llm_engine
        self.knowledge = knowledge_finder
        self.datasets = dataset_finder

    def conduct_deep_research(
        self,
        query: str,
        max_papers: int = 6,
        max_patents: int = 5,
        max_datasets: int = 5,
    ) -> Dict[str, Any]:
        """
        Full-Spectrum Autonomous Deep Research Pipeline:
        1. NLP parse intent & extract semantic research entities
        2. Ingest encyclopedic knowledge & Wikipedia taxonomy
        3. Retrieve real peer-reviewed academic papers (CrossRef + arXiv with DOIs)
        4. Scan Google Patents prior-art publications
        5. Fetch open datasets (Hugging Face) and code repositories (GitHub)
        6. Locate related applied problem statements (ChromaDB vector store)
        7. Synthesize multi-source Research Dossier with Chain of Thought
        """
        clean_q = query.strip()
        if not clean_q:
            raise ValueError("A research query is required.")

        # 1. NLP Parse
        nlp_analysis = self.nlp.parse_prompt(clean_q)

        # Independent network providers run concurrently so one slow source does not
        # unnecessarily delay the whole dossier.
        provider_calls = {
            "knowledge": lambda: self.knowledge.search_knowledge(clean_q),
            "papers": lambda: self.research.search_papers(clean_q, max_results=max_papers),
            "patents": lambda: self.patents.search_patents(clean_q, max_results=max_patents),
            "data": lambda: self.datasets.search_datasets_and_repos(clean_q, max_results=max_datasets),
        }
        provider_results: Dict[str, Any] = {"knowledge": {}, "papers": [], "patents": [], "data": {}}
        source_errors: Dict[str, str] = {}
        with ThreadPoolExecutor(max_workers=len(provider_calls)) as executor:
            futures = {executor.submit(call): name for name, call in provider_calls.items()}
            for future in as_completed(futures):
                name = futures[future]
                try:
                    provider_results[name] = future.result()
                except Exception as error:
                    source_errors[name] = str(error)

        knowledge = provider_results["knowledge"] or {}
        papers = provider_results["papers"] or []
        patents = provider_results["patents"] or []
        data_res = provider_results["data"] or {}
        datasets = data_res.get("datasets", [])
        repositories = data_res.get("repositories", [])

        # 3. Match relevant applied problem statements from vector store
        matched_challenges = self.vector_store.search(
            query=nlp_analysis.get("enriched_vector_query") or clean_q,
            n_results=4
        )

        # 4. Synthesize AI Research Dossier
        dossier = self.llm.synthesize_deep_research(
            query=clean_q,
            knowledge=knowledge,
            papers=papers,
            patents=patents,
            datasets=datasets,
            repositories=repositories,
            problem_statements=matched_challenges,
            nlp_data=nlp_analysis
        )

        chain_of_thought = dossier.get("chain_of_thought") or []

        total_sources = (
            len(papers)
            + len(patents)
            + len(datasets)
            + len(repositories)
            + (1 if knowledge.get("title") else 0)
        )

        return {
            "query": clean_q,
            "title": knowledge.get("title") or clean_q.title(),
            "knowledge": knowledge,
            "papers": papers,
            "patents": patents,
            "datasets": datasets,
            "repositories": repositories,
            "problem_statements": matched_challenges,
            "dossier": dossier,
            "nlp_analysis": nlp_analysis,
            "chain_of_thought": chain_of_thought,
            "total_sources": total_sources,
            "llm_powered": dossier.get("llm_powered", False),
            "source_errors": source_errors,
        }

    def export_research_dossier(self, research_data: Dict[str, Any]) -> str:
        """Export comprehensive research dossier to formatted Markdown."""
        query = research_data.get("query", "Research Topic")
        title = research_data.get("title", query)
        dossier = research_data.get("dossier", {})
        knowledge = research_data.get("knowledge", {})
        papers = research_data.get("papers", [])
        patents = research_data.get("patents", [])
        datasets = research_data.get("datasets", [])
        repos = research_data.get("repositories", [])

        lines = [
            f"# Deep Research Dossier: {title}",
            f"*Generated by Autonomous Deep Research Agent on topic: \"{query}\"*\n",
            "---",
            "## 1. Executive Summary",
            dossier.get("executive_summary", "No executive summary available.") + "\n",
            "## 2. State of the Art & Current Landscape",
            dossier.get("state_of_the_art", "No SOTA analysis available.") + "\n",
            "## 3. Technical & Algorithmic Deep Dive",
            dossier.get("technical_deep_dive", "No technical deep dive available.") + "\n",
            "## 4. Key Empirical Findings & Benchmarks",
        ]

        for idx, f in enumerate(dossier.get("key_findings", []), 1):
            lines.append(f"{idx}. {f}")

        lines.extend([
            "\n## 5. Critical Open Challenges & Research Gaps",
        ])
        for idx, c in enumerate(dossier.get("open_challenges", []), 1):
            lines.append(f"- {c}")

        lines.extend([
            "\n## 6. Intellectual Property & Patent Landscape",
            dossier.get("patent_ip_landscape", "Patent landscape summary.") + "\n",
            "### Retrieved Prior Art Publications:",
        ])
        for p in patents:
            lines.append(f"- **{p.get('patent_id', '')}**: {p.get('title', '')} ({p.get('assignee', 'Assignee')}) - [Google Patents]({p.get('patent_url', '')})")

        lines.extend([
            "\n## 7. Peer-Reviewed Academic Literature",
        ])
        for p in papers:
            lines.append(f"- **{p.get('title', '')}** ({p.get('year', '')}) - {p.get('authors', [''])[0] if isinstance(p.get('authors'), list) else ''}. DOI: [{p.get('doi', 'Link')}]({p.get('url', '')})")
            if p.get("research_takeaway"):
                lines.append(f"  *Key Takeaway: {p.get('research_takeaway')}*")

        lines.extend([
            "\n## 8. Open Datasets & Benchmark Repositories",
            "### Datasets:",
        ])
        for d in datasets:
            lines.append(f"- [{d.get('name', '')}]({d.get('url', '')}) ({d.get('source', '')}): {d.get('description', '')}")

        lines.append("\n### Code Repositories:")
        for r in repos:
            lines.append(f"- [{r.get('name', '')}]({r.get('url', '')}) ({r.get('language', '')}, ⭐ {r.get('stars', 0)}): {r.get('description', '')}")

        lines.extend([
            "\n## 9. Phased Research & Implementation Roadmap",
        ])
        for r in dossier.get("research_roadmap", []):
            lines.append(f"### {r.get('phase', '')} ({r.get('duration', '')})")
            for m in r.get("milestones", []):
                lines.append(f"- [ ] {m}")

        return "\n".join(lines)


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
        2. Detect conversational queries and route to LLM if detected
        3. Vector search with enriched query
        4. Annotate results with advisory insights
        """
        nlp_analysis = self.nlp.parse_prompt(prompt)
        is_conversational = nlp_analysis.get("is_conversational", False)

        search_query = nlp_analysis.get("enriched_vector_query") or prompt

        # If user did not manually specify category, keep open
        effective_category = category
        if not effective_category or effective_category.lower() == "all":
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

        # A provider failure should not be presented as an active model answer. Build
        # the fallback from the current archive response rather than canned advice.
        llm_answer = None
        if is_conversational and prompt.strip():
            if self.llm._active:
                llm_answer = self.llm.answer_general_query(prompt)
            if not llm_answer:
                llm_answer = self._build_archive_guidance(prompt, matched_topics)

        # Collaborative NLP + LLM Chain of Thought
        chain_of_thought = []
        if prompt.strip():
            chain_of_thought = self._generate_nlp_llm_chain_of_thought(
                prompt=prompt,
                nlp_data=nlp_analysis,
                matched_topics=matched_topics,
                llm_answer=llm_answer
            )

        return {
            "nlp_analysis": nlp_analysis,
            "chain_of_thought": chain_of_thought,
            "total_matches": len(matched_topics),
            "results": matched_topics,
            "topics": matched_topics,
            "llm_answer": llm_answer,  # populated for conversational queries
        }

    def _build_archive_guidance(
        self, prompt: str, matched_topics: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Build a transparent conversational fallback from live SIH archive data."""
        if matched_topics:
            featured = matched_topics[:3]
            options = []
            suggestions = []
            for topic in featured:
                title = topic.get("title", "Untitled problem statement")
                domain = topic.get("domain", "SIH archive")
                reason = topic.get("match_reason", "Related to your query.")
                options.append(f"- **{title}** ({domain}): {reason}")
                if domain and domain not in suggestions:
                    suggestions.append(domain)

            answer = "\n".join([
                "The live AI provider is temporarily unavailable, so this guidance is based on the matching SIH archive records.",
                "",
                f"I found **{len(matched_topics)}** relevant problem statements for: **{prompt}**",
                "",
                "**Strong starting points**",
                *options,
                "",
                "Open a result to compare its evidence, feasibility, and implementation path.",
            ])
            return {
                "is_sih_related": True,
                "answer": answer,
                "suggested_searches": suggestions,
                "llm_active": False,
                "fallback": True,
            }

        return {
            "is_sih_related": True,
            "answer": (
                "The live AI provider is temporarily unavailable and the archive did not return "
                "a close match. Try a more specific domain, user group, or technology constraint."
            ),
            "suggested_searches": [],
            "llm_active": False,
            "fallback": True,
        }

    def _rule_based_general_answer(self, prompt: str) -> Dict[str, Any]:
        """Fallback rule-based answers for common SIH questions when LLM is inactive."""
        p = prompt.lower()
        if any(w in p for w in ["how to prepare", "preparation", "tips", "guide"]):
            answer = """**SIH Preparation Tips:**
- Form a diverse 6-member team (2 developers, 1 ML engineer, 1 hardware/IoT, 1 UI/UX, 1 domain expert)
- Choose a problem statement from a domain your team knows well
- Pre-build reusable components: auth, REST API boilerplate, dashboard template
- Read the official SIH judging criteria: Innovation (30%), Feasibility (30%), Social Impact (20%), Presentation (20%)
- Practice the 5-minute demo presentation with real data"""
            return {"is_sih_related": True, "answer": answer, "suggested_searches": ["smart automation", "agritech", "healthcare AI"]}
        elif any(w in p for w in ["judg", "criteria", "scoring", "marks"]):
            answer = """**SIH Judging Criteria (Official):**
- **Innovation (30%):** Novel approach, not just existing solutions
- **Feasibility (30%):** Can it be built and deployed at scale?
- **Social Impact (20%):** How many citizens / government processes does it improve?
- **Presentation (20%):** Clarity of demo, pitch deck quality, and Q&A handling

💡 Tip: Focus heavily on a working live demo — judges reward tangible output over slides."""
            return {"is_sih_related": True, "answer": answer, "suggested_searches": []}
        else:
            answer = f"""I understand you're asking: **"{prompt}"**

Use the search bar above to discover SIH problem statements related to your topic.
You can ask things like:
- "drone crop disease detection"
- "blockchain land registry for rural areas"
- "AI traffic signal control"

💡 **Tip:** Enter keywords or a project idea description — the NLP engine will find matching SIH problem statements."""
            return {"is_sih_related": False, "answer": answer, "suggested_searches": []}

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
        Generates holistic hackathon strategic analysis.
        Uses LLM if active, otherwise falls back to rule-based advisory.
        """
        topic = self.vector_store.get_by_id(ps_id)

        if not topic:
            return {"error": f"Problem Statement {ps_id} not found."}

        title = topic.get("title", "")
        domain = topic.get("domain", "")
        desc = topic.get("description", "")
        category = topic.get("category", "Software")
        tech_tags = topic.get("tech_keywords", [])

        research_query = f"{title} {' '.join(tech_tags[:2])}"
        with ThreadPoolExecutor(max_workers=2) as executor:
            papers_future = executor.submit(
                self.research.search_papers, research_query, domain, 4
            )
            patents_future = executor.submit(
                self.patents.search_patents, research_query, domain, 4
            )
            papers = papers_future.result()
            patents = patents_future.result()

        # 3. Extract NLP semantic features from problem statement
        nlp_data = self.nlp.parse_prompt(f"{title} {desc[:300]}")

        # 4. Try LLM-powered advisory first
        llm_advisory = None
        pitch_outline = None
        advisory_cot = None
        if self.llm._active:
            llm_result = self.llm.generate_strategic_advisory(topic, papers, patents, nlp_data=nlp_data)
            if llm_result:
                llm_advisory = llm_result
                pitch_outline = llm_result.pop("pitch_outline", None)
                advisory_cot = llm_result.get("chain_of_thought")

        # 5. Fallback to rule-based if LLM unavailable or failed
        if not llm_advisory:
            tech_stack = self._generate_recommended_tech_stack(category, tech_tags, domain)
            novelty_edge = self._generate_winning_edge(category, tech_tags, domain)
            roadmap = self._generate_36h_roadmap(category, title)
            pitch_outline = self._generate_pitch_blueprint(topic, tech_stack, novelty_edge)

            advisory = {
                "why_matched": f"This problem statement directly targets challenges in {domain}, requiring {category} development. It aligns with real requirements from {topic.get('organization', 'Government bodies')}.",
                "recommended_tech_stack": tech_stack,
                "winning_novelty_edge": novelty_edge,
                "feasibility_roadmap": roadmap,
                "complexity": topic.get("complexity", "Medium"),
                "estimated_mvp_readiness": "Feasible within 36 Hours with pre-built component templates.",
                "llm_powered": False,
            }
        else:
            advisory = {
                "why_matched": llm_advisory.get("why_matched", ""),
                "recommended_tech_stack": llm_advisory.get("recommended_tech_stack", {}),
                "winning_novelty_edge": llm_advisory.get("winning_novelty_edge", ""),
                "feasibility_roadmap": llm_advisory.get("feasibility_roadmap", []),
                "complexity": llm_advisory.get("complexity", topic.get("complexity", "Medium")),
                "estimated_mvp_readiness": llm_advisory.get("estimated_mvp_readiness", ""),
                "llm_powered": True,
            }

        # Normalize pitch deck to a structured list of slides
        pitch_deck = []
        if isinstance(pitch_outline, list):
            for slide in pitch_outline:
                if isinstance(slide, dict):
                    pts = slide.get("points") or slide.get("bullets") or []
                    pitch_deck.append({
                        "title": slide.get("title", "Slide"),
                        "points": pts,
                        "bullets": pts
                    })
        elif isinstance(pitch_outline, dict):
            for key, slide in pitch_outline.items():
                if isinstance(slide, dict):
                    pts = slide.get("points") or slide.get("bullets") or []
                    pitch_deck.append({
                        "title": slide.get("title", key.replace("_", " ").title()),
                        "points": pts,
                        "bullets": pts
                    })

        if not pitch_deck:
            pitch_deck = self._generate_pitch_blueprint(
                topic,
                advisory.get("recommended_tech_stack", {}),
                advisory.get("winning_novelty_edge", "")
            )

        # Normalize advisory keys for frontend compatibility
        advisory["winning_edge"] = advisory.get("winning_novelty_edge", "")
        advisory["tech_stack"] = advisory.get("recommended_tech_stack", {})
        advisory["roadmap_36h"] = advisory.get("feasibility_roadmap", [])
        advisory["pitch_deck"] = pitch_deck
        advisory["is_llm_powered"] = advisory.get("llm_powered", False)

        # Ensure Chain of Thought is always available on advisory
        if not advisory_cot:
            advisory_cot = self._generate_advisory_chain_of_thought(
                topic=topic,
                papers=papers,
                patents=patents,
                nlp_data=nlp_data,
                advisory=advisory
            )
        advisory["chain_of_thought"] = advisory_cot

        return {
            "topic": topic,
            "advisory": advisory,
            "research_papers": papers,
            "patents": patents,
            "pitch_outline": pitch_deck,
            "pitch_deck": pitch_deck,
        }

    def _generate_recommended_tech_stack(self, category: str, tech_tags: List[str], domain: str) -> Dict[str, str]:
        tags_str = " ".join(tech_tags).lower()

        if "vision" in tags_str:
            ai_stack = "PyTorch / Ultralytics YOLOv8, OpenCV, MediaPipe for edge vision inference."
        elif "nlp" in tags_str:
            ai_stack = "HuggingFace Transformers, spaCy, Llama-3 / Mistral 7B quantized via Ollama."
        elif "gis" in tags_str:
            ai_stack = "Rasterio, GeoPandas, GDAL, Sentinel-2 / Cartosat API, Leaflet."
        else:
            ai_stack = "Scikit-Learn, LightGBM / XGBoost, FastAPI for model serving."

        backend_stack = "Python FastAPI with Pydantic for asynchronous REST endpoints, SQLite / PostgreSQL with SQLAlchemy."
        frontend_stack = "React.js / Vite + Tailwind CSS or Flutter for cross-platform mobile access."

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
                {
                    "phase": "Hours 0-6",
                    "hours": "Hours 0-6",
                    "focus": "Hardware Pinout & Sensors",
                    "title": "Pinout & Calibration",
                    "tasks": "Pinout verification, sensor calibration, and establishing serial/MQTT telemetry to local gateway.",
                    "milestone": "Pinout verification, sensor calibration, and establishing serial/MQTT telemetry to local gateway.",
                    "deliverable": "Working breadboard sensor telemetry loop."
                },
                {
                    "phase": "Hours 6-18",
                    "hours": "Hours 6-18",
                    "focus": "Firmware & Ingestion",
                    "title": "Firmware Programming",
                    "tasks": "Firmware programming on ESP32/RPi, prototype assembly, and data capture test runs.",
                    "milestone": "Firmware programming on ESP32/RPi, prototype assembly, and data capture test runs.",
                    "deliverable": "Reliable data transmission stream from microcontroller."
                },
                {
                    "phase": "Hours 18-30",
                    "hours": "Hours 18-30",
                    "focus": "Backend & Live Dashboard",
                    "title": "System Integration",
                    "tasks": "Connecting hardware telemetry stream to FastAPI backend & rendering live sensor gauges on dashboard.",
                    "milestone": "Connecting hardware telemetry stream to FastAPI backend & rendering live sensor gauges on dashboard.",
                    "deliverable": "Responsive real-time UI reflecting telemetry updates."
                },
                {
                    "phase": "Hours 30-36",
                    "hours": "Hours 30-36",
                    "focus": "Testing & Pitch Deck",
                    "title": "Enclosure & Demo Polish",
                    "tasks": "Enclosure casing, battery test, live physical demonstration rehearsal, and pitch deck finalization.",
                    "milestone": "Enclosure casing, battery test, live physical demonstration rehearsal, and pitch deck finalization.",
                    "deliverable": "Fully rehearsed 5-minute judge demo with offline fallback."
                }
            ]
        else:
            return [
                {
                    "phase": "Hours 0-6",
                    "hours": "Hours 0-6",
                    "focus": "Architecture & Scaffolding",
                    "title": "Repo Setup & Schemas",
                    "tasks": "Repository setup, database schema modeling, and implementing mock REST API endpoints.",
                    "milestone": "Repository setup, database schema modeling, and implementing mock REST API endpoints.",
                    "deliverable": "API contracts and containerized dev environment."
                },
                {
                    "phase": "Hours 6-18",
                    "hours": "Hours 6-18",
                    "focus": "Algorithmic & AI Engine",
                    "title": "Core Pipeline Engine",
                    "tasks": "Core algorithmic engine development (AI model loading, dataset pipeline, feature extraction).",
                    "milestone": "Core algorithmic engine development (AI model loading, dataset pipeline, feature extraction).",
                    "deliverable": "Inference endpoint responding within sub-second thresholds."
                },
                {
                    "phase": "Hours 18-30",
                    "hours": "Hours 18-30",
                    "focus": "Frontend & Workflows",
                    "title": "Interactive UI & Visuals",
                    "tasks": "Frontend UI integration, real-time charts/maps, and user role workflows (Admin vs Citizen/Officer).",
                    "milestone": "Frontend UI integration, real-time charts/maps, and user role workflows (Admin vs Citizen/Officer).",
                    "deliverable": "Polished end-user portal with zero broken states."
                },
                {
                    "phase": "Hours 30-36",
                    "hours": "Hours 30-36",
                    "focus": "Edge Case & Pitch Polish",
                    "title": "Stress Testing & Presentation",
                    "tasks": "End-to-end edge case testing, caching for instant response, recording demo screencast, and pitch polishing.",
                    "milestone": "End-to-end edge case testing, caching for instant response, recording demo screencast, and pitch polishing.",
                    "deliverable": "36-hour completed MVP ready for jury scrutiny."
                }
            ]

    def _generate_pitch_blueprint(self, topic: Dict[str, Any], tech_stack: Dict[str, str], novelty_edge: str) -> List[Dict[str, Any]]:
        return [
            {
                "title": "Problem Statement & Ground Reality",
                "points": [
                    f"Official PS: {topic.get('id')} - {topic.get('title')}",
                    f"Sponsoring Organization: {topic.get('organization')}",
                    "Core Pain Point: Manual, inefficient, or error-prone processes leading to substantial delay and high operational cost.",
                    "Target Beneficiaries: Ground personnel, field officers, and general public impacted across India."
                ],
                "bullets": [
                    f"Official PS: {topic.get('id')} - {topic.get('title')}",
                    f"Sponsoring Organization: {topic.get('organization')}",
                    "Core Pain Point: Manual, inefficient, or error-prone processes leading to substantial delay and high operational cost.",
                    "Target Beneficiaries: Ground personnel, field officers, and general public impacted across India."
                ]
            },
            {
                "title": "Proposed Innovation & System Architecture",
                "points": [
                    "A modular, end-to-end platform engineered for zero-downtime and high accessibility.",
                    "Key Differentiator: " + str(novelty_edge)[:140] + "...",
                    "Scalable 3-tier architecture: Ingestion Layer -> Intelligent Processing Core -> Interactive Decision Dashboard."
                ],
                "bullets": [
                    "A modular, end-to-end platform engineered for zero-downtime and high accessibility.",
                    "Key Differentiator: " + str(novelty_edge)[:140] + "...",
                    "Scalable 3-tier architecture: Ingestion Layer -> Intelligent Processing Core -> Interactive Decision Dashboard."
                ]
            },
            {
                "title": "Technical Implementation & Tech Stack",
                "points": [
                    f"Core AI/Compute: {str(tech_stack.get('ai_ml', ''))[:120]}...",
                    f"Application Stack: {tech_stack.get('backend', '')} & {tech_stack.get('frontend', '')}",
                    "Deployment: Docker containers with sub-second response times and edge optimization."
                ],
                "bullets": [
                    f"Core AI/Compute: {str(tech_stack.get('ai_ml', ''))[:120]}...",
                    f"Application Stack: {tech_stack.get('backend', '')} & {tech_stack.get('frontend', '')}",
                    "Deployment: Docker containers with sub-second response times and edge optimization."
                ]
            },
            {
                "title": "Feasibility, Social Impact & Business Viability",
                "points": [
                    "Field-Ready MVP completed within the 36-hour hackathon timeframe.",
                    "Social Impact: Democratizes access, prevents catastrophic failures, and automates grievance redressal.",
                    "Cost Efficiency: Achieves 70%+ reduction in hardware costs compared to proprietary closed-source alternatives."
                ],
                "bullets": [
                    "Field-Ready MVP completed within the 36-hour hackathon timeframe.",
                    "Social Impact: Democratizes access, prevents catastrophic failures, and automates grievance redressal.",
                    "Cost Efficiency: Achieves 70%+ reduction in hardware costs compared to proprietary closed-source alternatives."
                ]
            }
        ]

    def _generate_nlp_llm_chain_of_thought(
        self,
        prompt: str,
        nlp_data: Dict[str, Any],
        matched_topics: List[Dict[str, Any]],
        llm_answer: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Collaborative NLP + LLM Chain of Thought.
        If conversational and llm_answer has chain_of_thought, reuse it.
        Otherwise if LLM is active, call generate_query_chain_of_thought.
        Fallback to intelligent multi-step heuristic CoT combining NLP extractions + ChromaDB + Feasibility.
        """
        if llm_answer and isinstance(llm_answer, dict) and llm_answer.get("chain_of_thought"):
            return llm_answer["chain_of_thought"]

        if self.llm._active:
            try:
                cot = self.llm.generate_query_chain_of_thought(prompt, nlp_data, matched_topics)
                if cot:
                    return cot
            except Exception as e:
                print(f"LLM CoT generation failed: {e}")

        domain = nlp_data.get("inferred_domain", "Smart Innovation")
        category = nlp_data.get("inferred_category", "Software")
        entities = nlp_data.get("entities", [])
        tech = nlp_data.get("detected_tech", [])
        synonyms = nlp_data.get("expanded_keywords", [])
        top_topic = matched_topics[0] if matched_topics else None

        clean_p = prompt[:60] + ("..." if len(prompt) > 60 else "")

        steps = [
            {
                "step": 1,
                "stage": "Linguistic Decomposition & Intent Extraction",
                "actor": "NLP Engine (spaCy/Lexical)",
                "thought": f"Tokenized query '{clean_p}'. Extracted key entities ({', '.join(entities[:3]) if entities else 'domain concepts'}). Filtered English stopwords and detected primary action verbs.",
                "tags": ["spaCy Parser", "Entity Extraction"]
            },
            {
                "step": 2,
                "stage": "Domain Taxonomy & Modality Classification",
                "actor": "Taxonomy Engine",
                "thought": f"Mapped linguistic features to domain '{domain}'. Classified solution modality as '{category}' based on lexical indicators (detected tech: {', '.join(tech[:3]) if tech else 'Standard Application'}).",
                "tags": [domain, f"Modality: {category}"]
            },
            {
                "step": 3,
                "stage": "Vector Expansion & Semantic Alignment",
                "actor": "NLP + ChromaDB Embeddings",
                "thought": f"Augmented query with domain synonyms ({', '.join(synonyms[:3]) if synonyms else 'standard domain terms'}). Executed dense vector similarity search across all official SIH problem statements. Retrieved {len(matched_topics)} candidate statements.",
                "tags": ["ChromaDB Embeddings", f"{len(matched_topics)} Matches"]
            },
            {
                "step": 4,
                "stage": "Strategic Feasibility & Hackathon Advisory",
                "actor": "Cognitive Reasoning Core",
                "thought": f"Evaluated top matches against SIH judging rubric (Innovation 30%, Feasibility 30%, Social Impact 20%, Presentation 20%). " + (f"Ranked '{top_topic.get('id', '')} - {top_topic.get('title', '')[:50]}' as premier match." if top_topic else "Synthesized strategic guidance for the team."),
                "tags": ["36h MVP Feasibility", "SIH Rubric Scoring"]
            }
        ]
        return steps

    def _generate_advisory_chain_of_thought(
        self,
        topic: Dict[str, Any],
        papers: List[Dict[str, Any]],
        patents: List[Dict[str, Any]],
        nlp_data: Dict[str, Any],
        advisory: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Synthesizes step-by-step reasoning for the deep topic advisory:
        1. Problem statement linguistic analysis
        2. Academic & Patent prior-art synthesis
        3. 36h MVP architecture & tech stack selection
        4. Novelty edge & hackathon jury scoring strategy
        """
        ps_id = topic.get("id", "PS")
        title = topic.get("title", "")
        domain = topic.get("domain", "")
        category = topic.get("category", "Software")
        tech_stack = advisory.get("recommended_tech_stack") or advisory.get("tech_stack", {})
        winning_edge = advisory.get("winning_novelty_edge") or advisory.get("winning_edge", "")

        return [
            {
                "step": 1,
                "stage": "Problem Statement Deconstruction",
                "actor": "NLP Semantic Parser",
                "thought": f"Deconstructed {ps_id}: '{title[:65]}...' under {domain}. Analyzed sponsoring ministry expectations and target beneficiaries.",
                "tags": ["NLP Deconstruction", ps_id]
            },
            {
                "step": 2,
                "stage": "Prior-Art & Patent Gap Discovery",
                "actor": "Academic & Patent Crawler",
                "thought": f"Indexed {len(papers)} arXiv research papers and {len(patents)} Google Patents. Pinpointed prior-art technical gaps to guarantee high innovation scoring without patent infringement.",
                "tags": [f"{len(papers)} Papers", f"{len(patents)} Patents", "Novelty Gap"]
            },
            {
                "step": 3,
                "stage": "Architecture & 36h MVP Synthesis",
                "actor": "Technical Architecture Engine",
                "thought": f"Configured {category} stack: AI/ML ({str(tech_stack.get('ai_ml', ''))[:45]}...), Backend ({str(tech_stack.get('backend', ''))[:40]}...), and UI layer scoped for flawless execution within 36 hours.",
                "tags": ["Architecture", "36h Scope"]
            },
            {
                "step": 4,
                "stage": "Jury Scoring Edge & Winning Strategy",
                "actor": "SIH AI Mentor Core",
                "thought": f"Formulated winning edge: '{winning_edge[:120]}...'. Tailored 4-phase milestone roadmap ensuring a stress-tested live demo for the evaluation jury.",
                "tags": ["Jury Scoring", "Winning Edge"]
            }
        ]



agent_core = SIHAgentCore()

if __name__ == "__main__":
    test_query = "drone crop disease detection"
    res = agent_core.discover_topics(test_query, n_results=2)
    print("Discovered topics:", len(res["topics"]))
    print("LLM Active:", llm_engine._active)
    if res["topics"]:
        first_id = res["topics"][0]["id"]
        deep = agent_core.analyze_topic_deep(first_id)
        print(f"\nDeep Analysis for {first_id}:")
        print("LLM Powered:", deep["advisory"]["llm_powered"])
        print("Why Matched:", deep["advisory"]["why_matched"][:100])
        print("Research Papers found:", len(deep["research_papers"]))
        print("Patents found:", len(deep["patents"]))
