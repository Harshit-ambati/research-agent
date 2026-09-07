"""
SIH Natural Language Processing (NLP) Engine
Parses user prompts, extracts key entities, technical domains, stakeholder targets,
infers Software/Hardware category, and enriches queries with domain taxonomy synonyms.
"""
import re
import os
from typing import Dict, List, Any

# Try importing spaCy, with graceful fallback to regex tokenizer
try:
    import spacy
    try:
        nlp = spacy.load("en_core_web_sm")
    except Exception:
        nlp = None
except ImportError:
    nlp = None

# Domain Knowledge Taxonomy for SIH
DOMAIN_TAXONOMY = {
    "Agriculture, FoodTech & Rural Development": [
        "crop", "farming", "farmer", "agriculture", "soil", "harvest", "fertilizer", "pest",
        "plant", "irrigation", "agritech", "potato", "wheat", "rice", "cotton", "yield",
        "horticulture", "livestock", "dairy", "animal husbandry", "orchard"
    ],
    "Disaster Management": [
        "disaster", "flood", "earthquake", "landslide", "cyclone", "fire", "wildfire",
        "emergency", "evacuation", "rescue", "tsunami", "hazard", "calamity", "early warning"
    ],
    "Clean & Green Technology": [
        "green", "solar", "renewable", "carbon", "pollution", "waste", "recycling", "emission",
        "water quality", "effluent", "air quality", "environment", "sustainable", "clean energy"
    ],
    "MedTech / BioTech / HealthTech": [
        "health", "medical", "hospital", "patient", "doctor", "disease", "diagnosis", "clinical",
        "medicine", "biomarker", "telemedicine", "ecg", "xray", "ct scan", "cancer", "cough"
    ],
    "Blockchain & Cybersecurity": [
        "cyber", "security", "blockchain", "spoofing", "phishing", "encryption", "crypto",
        "smart contract", "firewall", "vulnerability", "malware", "authentication", "tamper", "ledger"
    ],
    "Transportation & Logistics": [
        "traffic", "railway", "train", "vehicle", "transit", "road", "cargo", "logistics",
        "fleet", "highway", "toll", "accident", "congestion", "signal", "bus", "transport"
    ],
    "Smart Education": [
        "education", "student", "learning", "school", "college", "exam", "teacher", "curriculum",
        "sign language", "pedagogy", "skill", "personalized learning", "tutor", "classroom"
    ],
    "Smart Automation": [
        "automation", "robotic", "automated", "workflow", "inspection", "audit", "governance",
        "citizen", "grievance", "portal", "tracking", "land registry", "dispatch"
    ],
    "Robotics and Drones": [
        "drone", "uav", "robot", "robotics", "unmanned", "quadcopter", "autonomous vehicle",
        "manipulator", "rover", "aerial"
    ]
}

TECH_TAXONOMY = {
    "Computer Vision": ["vision", "camera", "image", "opencv", "object detection", "yolo", "segmentation", "facial recognition", "deep learning"],
    "NLP & LLMs": ["nlp", "text", "speech", "translation", "chatbot", "language", "llm", "transformer", "sentiment"],
    "IoT & Sensors": ["iot", "sensor", "arduino", "raspberry pi", "esp32", "lorawan", "rfid", "telemetry", "embedded", "smart meter"],
    "Drones & Autonomous": ["drone", "uav", "autonomous", "flight", "aerial", "robot", "lidar"],
    "Blockchain & Web3": ["blockchain", "smart contract", "decentralized", "ledger", "web3", "hash", "ethereum", "solidity"],
    "GIS & Remote Sensing": ["gis", "satellite", "mapping", "geospatial", "remote sensing", "gps", "spatial"],
    "Cloud & Mobile": ["mobile app", "android", "ios", "react", "flutter", "fastapi", "dashboard", "web portal"]
}

HARDWARE_INDICATORS = [
    "drone", "uav", "sensor", "hardware", "device", "trolley", "camera", "circuit", "arduino",
    "raspberry pi", "microcontroller", "embedded", "quadcopter", "robot", "robotic arm", "node", "lora"
]

SOFTWARE_INDICATORS = [
    "app", "application", "portal", "website", "dashboard", "platform", "algorithm",
    "software", "web app", "mobile app", "nlp", "classifier", "model", "system", "blockchain"
]

SYNONYM_MAP = {
    "pest": ["pest infestation", "crop pathology", "insect attack"],
    "disease": ["pathology", "infection", "anomaly detection", "diagnosis"],
    "drone": ["unmanned aerial vehicle", "UAV", "aerial surveillance"],
    "traffic": ["intelligent transportation", "congestion management", "signal optimization"],
    "water": ["water quality", "effluent monitoring", "hydrological resources"],
    "land": ["land registry", "cadastral mapping", "property title"],
    "accident": ["crash detection", "collision warning", "road safety"],
    "spoofing": ["phishing", "impersonation", "email security"],
    "waste": ["solid waste management", "recycling automation", "cleanliness"]
}

class NLPEngine:
    def __init__(self):
        self.nlp = nlp

    def parse_prompt(self, user_prompt: str) -> Dict[str, Any]:
        """
        Extracts tokens, entities, domain classifications, inferred modality,
        and query expansions from user natural language input.
        """
        raw_text = str(user_prompt or "").strip()
        if not raw_text:
            return {
                "raw_query": "",
                "clean_query": "",
                "entities": [],
                "tech_stack": [],
                "inferred_category": "Software",
                "suggested_domains": ["Smart Innovation"],
                "expanded_keywords": [],
                "summary": "Empty query"
            }

        text_lower = raw_text.lower()

        # 1. Linguistic extraction using spaCy if available
        noun_chunks = []
        named_entities = []
        if self.nlp:
            try:
                doc = self.nlp(raw_text)
                for chunk in doc.noun_chunks:
                    clean_chunk = chunk.text.strip().lower()
                    if len(clean_chunk) > 2 and clean_chunk not in ["i", "we", "the idea", "an agent", "a solution"]:
                        noun_chunks.append(clean_chunk)
                for ent in doc.ents:
                    named_entities.append(ent.text.strip())
            except Exception:
                pass

        # Fallback noun / word extraction
        words = re.findall(r'\b[a-zA-Z0-9_\-\.\+]{2,}\b', text_lower)
        stopwords = {"the", "and", "for", "with", "that", "this", "from", "into", "using", "want", "build", "create", "looking", "help", "need", "make"}
        filtered_words = [w for w in words if w not in stopwords]

        # 2. Extract technical tags
        detected_tech = []
        for tech_label, keywords in TECH_TAXONOMY.items():
            for kw in keywords:
                if kw in text_lower or any(kw in w for w in filtered_words):
                    if tech_label not in detected_tech:
                        detected_tech.append(tech_label)
                    break

        # 3. Detect Domain Matches & Scores
        domain_scores = {}
        for domain, domain_keywords in DOMAIN_TAXONOMY.items():
            score = 0
            for dkw in domain_keywords:
                if re.search(r'\b' + re.escape(dkw) + r'\b', text_lower):
                    score += 2
            if score > 0:
                domain_scores[domain] = score

        sorted_domains = sorted(domain_scores.items(), key=lambda x: x[1], reverse=True)
        suggested_domains = [d[0] for d in sorted_domains[:3]]
        if not suggested_domains:
            suggested_domains = ["Smart Innovation"]

        # 4. Infer Category (Software vs. Hardware vs. Hybrid)
        hw_count = sum(1 for hw in HARDWARE_INDICATORS if re.search(r'\b' + re.escape(hw) + r'\b', text_lower))
        sw_count = sum(1 for sw in SOFTWARE_INDICATORS if re.search(r'\b' + re.escape(sw) + r'\b', text_lower))

        if hw_count > 0 and sw_count > 0:
            inferred_category = "Hybrid (Software + Hardware)"
        elif hw_count > 0:
            inferred_category = "Hardware"
        else:
            inferred_category = "Software"

        # 5. Extract Key Entities (combining noun chunks & filtered keywords)
        key_entities = list(dict.fromkeys(noun_chunks + filtered_words[:6]))[:8]

        # 6. Query Expansion with Synonyms
        expanded_keywords = []
        for term, synonyms in SYNONYM_MAP.items():
            if term in text_lower:
                expanded_keywords.extend(synonyms)

        # 7. Formulate enriched search vector query
        enriched_vector_query = f"{raw_text} {' '.join(expanded_keywords[:4])} {' '.join(detected_tech)}"

        # 8. Human-friendly Summary
        tech_str = ", ".join(detected_tech) if detected_tech else "General Tech"
        summary = f"Detected {inferred_category} solution in {suggested_domains[0]}. Technical stack: {tech_str}."

        return {
            "raw_query": raw_text,
            "clean_query": " ".join(filtered_words),
            "enriched_vector_query": enriched_vector_query.strip(),
            "entities": key_entities,
            "tech_stack": detected_tech,
            "inferred_category": inferred_category,
            "suggested_domains": suggested_domains,
            "expanded_keywords": list(set(expanded_keywords)),
            "summary": summary
        }

# Global singleton instance
nlp_engine = NLPEngine()

if __name__ == "__main__":
    test_queries = [
        "I want to build a drone to detect diseases in potato leaves and notify farmers through SMS",
        "Smart traffic signal control with computer vision and emergency ambulance priority",
        "Blockchain based land registry for rural villages to prevent fraud"
    ]
    for q in test_queries:
        res = nlp_engine.parse_prompt(q)
        print("\nQuery:", q)
        print("Inferred Category:", res["inferred_category"])
        print("Domains:", res["suggested_domains"])
        print("Tech Stack:", res["tech_stack"])
        print("Entities:", res["entities"])
        print("Summary:", res["summary"])
