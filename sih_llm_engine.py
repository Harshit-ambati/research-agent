"""
SIH LLM Integration Engine
Multi-provider LLM client supporting:
  - Google Gemini (Gemini 1.5 Flash / 2.0 Flash — free tier)
  - Groq (Llama 3.3 70B / 8B — ultra-fast, free tier)
  - OpenAI (GPT-4o / GPT-4o-mini)
  - Local Ollama (100% offline, no key needed)

Provides:
  - generate_strategic_advisory() — LLM-powered hackathon advisory (no hardcoding)
  - answer_general_query()       — Answers conversational / out-of-domain questions
  - chat_mentor()                — Multi-turn AI Hackathon Mentor chat
  - test_connection()            — Validate credentials + measure latency
  - get_status() / save_config() — Config management via .env
"""

import os
import ssl
import json
import time
import urllib.request
import urllib.parse
import urllib.error
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path

def _safe_urlopen(req, timeout=30):
    """Executes HTTP request with automatic SSL context fallback if self-signed or enterprise proxy certificates are encountered."""
    try:
        return urllib.request.urlopen(req, timeout=timeout)
    except urllib.error.URLError as e:
        err_str = str(e)
        if "CERTIFICATE_VERIFY_FAILED" in err_str or "certificate verify failed" in err_str.lower():
            ctx = ssl._create_unverified_context()
            return urllib.request.urlopen(req, context=ctx, timeout=timeout)
        raise

# .env loader (uses python-dotenv if available, else manual parse)
def reload_env():
    try:
        from dotenv import load_dotenv
        load_dotenv(dotenv_path=Path(__file__).parent / ".env", override=True)
    except ImportError:
        _env_file = Path(__file__).parent / ".env"
        if _env_file.exists():
            for line in _env_file.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, _, v = line.partition("=")
                    os.environ[k.strip()] = v.strip()

reload_env()

# ─── Provider Registry ────────────────────────────────────────────────────────

PROVIDERS = {
    "gemini": {
        "label": "Google Gemini",
        "default_model": "gemini-2.5-flash",
        "models": ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.5-pro", "gemini-2.5-flash-lite"],
        "key_env": "GEMINI_API_KEY",
        "base_url": "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
        "needs_key": True,
    },
    "groq": {
        "label": "Groq",
        "default_model": "llama-3.3-70b-versatile",
        "models": ["llama-3.3-70b-versatile", "llama3-8b-8192", "mixtral-8x7b-32768"],
        "key_env": "GROQ_API_KEY",
        "base_url": "https://api.groq.com/openai/v1/chat/completions",
        "needs_key": True,
    },
    "openai": {
        "label": "OpenAI",
        "default_model": "gpt-4o-mini",
        "models": ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
        "key_env": "OPENAI_API_KEY",
        "base_url": "https://api.openai.com/v1/chat/completions",
        "needs_key": True,
    },
    "ollama": {
        "label": "Local Ollama",
        "default_model": "llama3.2",
        "models": ["llama3.2", "llama3.1", "mistral", "phi3", "gemma2"],
        "key_env": None,
        "base_url": "http://localhost:11434/api/chat",
        "needs_key": False,
    },
}

# ─── System Prompts ───────────────────────────────────────────────────────────

SYSTEM_RESEARCH_ANALYST = """You are an elite Autonomous Deep Research Scientist and Technical Intelligence Analyst.
You synthesize multi-source empirical evidence (academic research papers, patents, open datasets, code repositories, and encyclopedic knowledge) into authoritative, comprehensive, structured research dossiers.
Provide deep technical depth, exact methodologies, empirical benchmarks, patent prior-art novelty gaps, and actionable implementation roadmaps.
Always format responses as clean, structured JSON matching the requested schema without markdown fences or extra commentary."""

SYSTEM_RESEARCH_CHAT = """You are an interactive AI Research Partner and Scientific Intelligence Specialist.
You have access to the complete research dossier, academic paper abstracts, patent claims, open datasets, and encyclopedic data for the active topic.
Answer the user's research questions with rigorous technical depth, citations of the retrieved papers/patents/datasets, comparative analysis, and practical prototyping guidance."""

SYSTEM_ADVISORY = """You are an elite hackathon strategy consultant and research scientist.
You provide hyper-specific, actionable technical advisory for problem statements and research domains.
Your responses are crisp, structured, and directly usable by research and engineering teams.
Format your output as clean, structured JSON exactly matching the schema requested.
Do not add markdown fencing or extra commentary outside the JSON."""

SYSTEM_MENTOR = """You are an AI Research Mentor & Technical Coach.
You have deep expertise in scientific research, engineering architectures, patent strategies, and rapid prototyping.
You give concise, practical, encouraging answers. Always be direct and actionable."""

SYSTEM_GENERAL = """You are the AI Deep Research Assistant. You help users exploring any research topic, technology, scientific domain, or problem statement.
Answer helpfully with deep technical clarity and structured bullet points."""

SYSTEM_COT = """You are the Cognitive Reasoning Core of the Autonomous Deep Research Agent.
You collaborate directly with NLP and multi-source retrieval engines to perform transparent, step-by-step Chain of Thought (CoT) reasoning for research queries.
Output only structured JSON matching the requested schema without markdown fences or extra commentary."""



class LLMEngine:
    def __init__(self):
        self._provider: str = os.environ.get("LLM_PROVIDER", "").lower() or ""
        self._api_key: str = os.environ.get("LLM_API_KEY", "")
        self._model: str = os.environ.get("LLM_MODEL", "")
        self._active: bool = False
        self._last_error: str = ""

        # Auto-detect active provider on startup
        self._auto_detect_provider()

    # ─── Config & Status ─────────────────────────────────────────────────────

    def _auto_detect_provider(self):
        """Try each provider in priority order, picking the first with a valid key."""
        reload_env()
        # First check explicitly configured provider
        env_prov = os.environ.get("LLM_PROVIDER", "").strip().lower()
        if env_prov and env_prov in PROVIDERS:
            prov = PROVIDERS[env_prov]
            self._provider = env_prov
            if not prov["needs_key"]:
                self._active = True
            else:
                key = os.environ.get("LLM_API_KEY", "") or os.environ.get(prov["key_env"], "")
                self._active = bool(key)
                self._api_key = key
            self._model = os.environ.get("LLM_MODEL", "") or prov["default_model"]
            return

        # Check for any API keys in environment
        for p in ["groq", "gemini", "openai"]:
            prov = PROVIDERS[p]
            key = os.environ.get(prov["key_env"], "")
            if key:
                self._provider = p
                self._api_key = key
                self._model = prov["default_model"]
                self._active = True
                return

    def get_status(self) -> Dict[str, Any]:
        prov_info = PROVIDERS.get(self._provider, {})
        return {
            "active": self._active,
            "provider": self._provider,
            "provider_label": prov_info.get("label", "None"),
            "model": self._model,
            "models": prov_info.get("models", []),
            "needs_key": prov_info.get("needs_key", True),
            "last_error": self._last_error,
            "all_providers": [
                {
                    "id": k,
                    "label": v["label"],
                    "models": v["models"],
                    "default_model": v["default_model"],
                    "needs_key": v["needs_key"],
                }
                for k, v in PROVIDERS.items()
            ],
        }

    def save_config(self, provider: str, api_key: str, model: str) -> Dict[str, Any]:
        """Persist LLM settings to .env file and update runtime state."""
        if provider not in PROVIDERS:
            return {"success": False, "error": f"Unknown provider: {provider}"}

        env_path = Path(__file__).parent / ".env"
        prov = PROVIDERS[provider]
        selected_model = model or prov["default_model"]
        if selected_model not in prov["models"]:
            return {"success": False, "error": f"Unsupported model for {provider}."}

        # Read existing .env
        lines = []
        if env_path.exists():
            lines = env_path.read_text(encoding="utf-8").splitlines()

        def _set_key(lines, k, v):
            for i, line in enumerate(lines):
                if line.strip().startswith(f"{k}=") or line.strip().startswith(f"{k} ="):
                    lines[i] = f"{k}={v}"
                    return lines
            lines.append(f"{k}={v}")
            return lines

        lines = _set_key(lines, "LLM_PROVIDER", provider)
        lines = _set_key(lines, "LLM_MODEL", selected_model)
        if api_key and prov["key_env"]:
            lines = _set_key(lines, "LLM_API_KEY", api_key)
            lines = _set_key(lines, prov["key_env"], api_key)

        env_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

        # Update runtime state
        self._provider = provider
        self._model = selected_model
        self._api_key = api_key or self._api_key
        self._active = (not prov["needs_key"]) or bool(api_key)
        self._last_error = ""
        return {"success": True, "provider": provider, "model": self._model, "active": self._active}

    def test_connection(self, provider: str, api_key: str, model: str) -> Dict[str, Any]:
        """Test a provider connection without persisting config."""
        if provider not in PROVIDERS:
            return {"success": False, "error": f"Unknown provider: {provider}"}

        prov = PROVIDERS[provider]
        clean_key = (api_key or "").strip()
        if not clean_key and prov.get("key_env"):
            clean_key = (os.environ.get(prov["key_env"], "") or (self._api_key if self._provider == provider else "")).strip()

        if prov["needs_key"] and not clean_key:
            return {"success": False, "error": f"API key required for {prov['label']}. Please paste your key in the field above."}

        self._last_error = ""
        t0 = time.time()
        try:
            msg = self._call_llm("Say: OK", provider=provider, api_key=clean_key,
                                  model=model or prov["default_model"], max_tokens=30)
            latency_ms = int((time.time() - t0) * 1000)
            if msg:
                return {
                    "success": True,
                    "response": msg.strip(),
                    "latency_ms": latency_ms,
                    "message": f"Connected successfully to {prov['label']} ({latency_ms}ms)!"
                }
            err = self._last_error or "Empty response from provider."
            return {"success": False, "error": err, "message": err}
        except Exception as e:
            return {"success": False, "error": str(e), "message": str(e)}

    # ─── Low-level HTTP caller ────────────────────────────────────────────────

    def _call_llm(
        self,
        prompt: str,
        system: str = "",
        history: Optional[List[Dict]] = None,
        provider: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        max_tokens: int = 1200,
        temperature: float = 0.7,
        timeout: int = 30,
    ) -> Optional[str]:
        """Universal LLM caller. Returns the assistant text or None on error."""
        p = (provider or self._provider).lower()
        key = api_key or self._api_key
        mdl = model or self._model

        if not p or p not in PROVIDERS:
            return None

        prov = PROVIDERS[p]
        if prov["needs_key"] and not key:
            return None

        try:
            if p == "gemini":
                return self._call_gemini(prompt, system, history, key, mdl, max_tokens, temperature, timeout)
            elif p in ("groq", "openai"):
                return self._call_openai_compat(prompt, system, history, key, mdl, max_tokens, temperature, timeout, prov["base_url"])
            elif p == "ollama":
                return self._call_ollama(prompt, system, history, mdl, max_tokens, temperature, timeout)
        except urllib.error.HTTPError as e:
            try:
                err_data = json.loads(e.read().decode("utf-8"))
                msg = err_data.get("error", {}).get("message") or str(e)
                self._last_error = f"{p.upper()} ({e.code}): {msg}"
            except Exception:
                self._last_error = f"{p.upper()} ({e.code}): {str(e)}"
            return None
        except Exception as e:
            self._last_error = str(e)
            return None

    def _call_gemini(self, prompt, system, history, api_key, model, max_tokens, temperature, timeout):
        clean_key = (api_key or "").strip()
        encoded_key = urllib.parse.quote(clean_key)
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={encoded_key}"

        contents = []
        if history:
            for h in history:
                role = "user" if h.get("role") == "user" else "model"
                text = h.get("content")
                if not text and "parts" in h:
                    parts = h["parts"]
                    text = parts[0] if isinstance(parts, list) and parts else ""
                contents.append({"role": role, "parts": [{"text": str(text or "")}]})
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }
        if system:
            payload["systemInstruction"] = {"parts": [{"text": system}]}

        body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url, data=body,
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": clean_key,
            },
            method="POST"
        )
        with _safe_urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        candidates = data.get("candidates", [])
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            if parts and "text" in parts[0]:
                return parts[0]["text"]
        return data.get("text", "")

    def _call_openai_compat(self, prompt, system, history, api_key, model, max_tokens, temperature, timeout, base_url):
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        if history:
            for h in history:
                text = h.get("content")
                if not text and "parts" in h:
                    parts = h["parts"]
                    text = parts[0] if isinstance(parts, list) and parts else ""
                messages.append({"role": h.get("role", "user"), "content": str(text or "")})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            base_url, data=body,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            method="POST"
        )
        with _safe_urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"]

    def _call_ollama(self, prompt, system, history, model, max_tokens, temperature, timeout):
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        if history:
            for h in history:
                text = h.get("content")
                if not text and "parts" in h:
                    parts = h["parts"]
                    text = parts[0] if isinstance(parts, list) and parts else ""
                messages.append({"role": h.get("role", "user"), "content": str(text or "")})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": temperature, "num_predict": max_tokens},
        }

        body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            PROVIDERS["ollama"]["base_url"], data=body,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return data["message"]["content"]

    # ─── High-level Application APIs ─────────────────────────────────────────

    def synthesize_deep_research(
        self,
        query: str,
        knowledge: Dict[str, Any],
        papers: List[Dict[str, Any]],
        patents: List[Dict[str, Any]],
        datasets: List[Dict[str, Any]],
        repositories: List[Dict[str, Any]],
        problem_statements: Optional[List[Dict[str, Any]]] = None,
        nlp_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Synthesizes a 360° comprehensive Research Dossier across all retrieved dimensions.
        Uses active LLM if available, otherwise falls back to smart rule-based synthesis.
        """
        if self._active:
            try:
                llm_result = self._llm_synthesize_deep_research(
                    query=query,
                    knowledge=knowledge,
                    papers=papers,
                    patents=patents,
                    datasets=datasets,
                    repositories=repositories,
                    problem_statements=problem_statements or [],
                    nlp_data=nlp_data
                )
                if llm_result:
                    llm_result["llm_powered"] = True
                    return llm_result
            except Exception as e:
                print(f"LLM deep research synthesis error: {e}")

        # Fallback rule-based synthesis
        return self._rule_based_deep_research(
            query=query,
            knowledge=knowledge,
            papers=papers,
            patents=patents,
            datasets=datasets,
            repositories=repositories,
            problem_statements=problem_statements or []
        )

    def _llm_synthesize_deep_research(
        self,
        query: str,
        knowledge: Dict[str, Any],
        papers: List[Dict[str, Any]],
        patents: List[Dict[str, Any]],
        datasets: List[Dict[str, Any]],
        repositories: List[Dict[str, Any]],
        problem_statements: List[Dict[str, Any]],
        nlp_data: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        papers_text = "\n".join([
            f"- [{p.get('source', 'CrossRef')}] {p.get('title', '')} ({p.get('year', '')}): {(p.get('abstract') or '')[:220]}"
            for p in papers[:4]
        ]) if papers else "No papers retrieved."

        patents_text = "\n".join([
            f"- [{p.get('patent_id', '?')}] {p.get('title', '')} ({p.get('assignee', 'Assignee')}): {(p.get('abstract') or '')[:200]}"
            for p in patents[:4]
        ]) if patents else "No patents retrieved."

        datasets_text = "\n".join([
            f"- {d.get('name', '')} ({d.get('source', '')}): {d.get('description', '')[:150]}"
            for d in datasets[:4]
        ]) if datasets else "No datasets retrieved."

        repos_text = "\n".join([
            f"- {r.get('name', '')} ({r.get('language', '')}, {r.get('stars', 0)} stars): {r.get('description', '')[:150]}"
            for r in repositories[:4]
        ]) if repositories else "No repos retrieved."

        challenges_text = "\n".join([
            f"- [{c.get('id', '')}] {c.get('title', '')} ({c.get('domain', '')})"
            for c in problem_statements[:3]
        ]) if problem_statements else "None."

        wiki_extract = knowledge.get("extract", "")[:600]

        prompt = f"""Conduct a deep, authoritative scientific & technological research synthesis for:
"{query}"

Retrieved Multi-Source Intelligence Context:
---
[Encyclopedic Knowledge / Overview]:
{wiki_extract}

[Academic Peer-Reviewed Papers]:
{papers_text}

[Patents & Intellectual Property]:
{patents_text}

[Open Datasets & Repositories]:
{datasets_text}
{repos_text}

[Applied Problem Statements]:
{challenges_text}
---

Generate a comprehensive, rigorous research dossier in the following exact JSON format:
{{
  "chain_of_thought": [
    {{
      "step": 1,
      "stage": "Multi-Source Corroboration",
      "actor": "Cross-Source Synthesis Engine",
      "thought": "Reasoning on how encyclopedic concepts, literature DOIs, and empirical datasets corroborate for '{query}'..."
    }},
    {{
      "step": 2,
      "stage": "State-of-the-Art Formulation",
      "actor": "Academic Intelligence Core",
      "thought": "Evaluating leading methodologies and benchmark thresholds identified in retrieved papers..."
    }},
    {{
      "step": 3,
      "stage": "IP White-Space & Commercial Landscape",
      "actor": "Patent Analysis Unit",
      "thought": "Deducing proprietary coverage vs open-access opportunities from patent claims..."
    }},
    {{
      "step": 4,
      "stage": "Actionable Implementation Blueprint",
      "actor": "Research Architect",
      "thought": "Synthesizing software stack, datasets, and phased execution roadmap..."
    }}
  ],
  "executive_summary": "2-3 detailed paragraphs providing an authoritative overview, foundational mechanisms, and global significance of {query}.",
  "state_of_the_art": "1-2 paragraphs detailing current cutting-edge methods, recent breakthroughs (2024-2026), and leading paradigms.",
  "technical_deep_dive": "2-3 paragraphs analyzing specific architectural mechanics, mathematical or physical principles, algorithmic pipelines, or system constraints.",
  "key_findings": [
    "Finding 1: Specific empirical evidence, benchmark figure, or methodology discovery.",
    "Finding 2: Performance or architectural observation from academic literature.",
    "Finding 3: Commercial or deployment reality observed in industry."
  ],
  "open_challenges": [
    "Bottleneck 1: Unsolved engineering or theoretical limitation.",
    "Bottleneck 2: Data, compute, hardware, or biological constraint.",
    "Bottleneck 3: Scalability, regulatory, or security challenge."
  ],
  "patent_ip_landscape": "Paragraph summarizing patent concentration, key commercial assignees, freedom-to-operate considerations, and unpatented innovation spaces.",
  "recommended_stack": {{
    "core_frameworks": ["Key library or tool 1", "Key library or tool 2", "Key library 3"],
    "datasets_models": ["Recommended benchmark dataset or foundation model 1", "Dataset 2"],
    "hardware_infra": ["Compute requirement or edge constraint", "Deployment platform"]
  }},
  "research_roadmap": [
    {{
      "phase": "Phase 1: Theoretical Baseline & Dataset Ingestion",
      "duration": "Weeks 1-3",
      "milestones": ["Milestone 1", "Milestone 2"]
    }},
    {{
      "phase": "Phase 2: Core Algorithmic & Pipeline Prototyping",
      "duration": "Weeks 4-7",
      "milestones": ["Milestone 1", "Milestone 2"]
    }},
    {{
      "phase": "Phase 3: Empirical Benchmarking & Ablation Testing",
      "duration": "Weeks 8-11",
      "milestones": ["Milestone 1", "Milestone 2"]
    }},
    {{
      "phase": "Phase 4: Production Optimization & Deployment",
      "duration": "Weeks 12-14",
      "milestones": ["Milestone 1", "Milestone 2"]
    }}
  ]
}}"""

        raw = self._call_llm(prompt, system=SYSTEM_RESEARCH_ANALYST, max_tokens=2200, temperature=0.4)
        if not raw:
            return None

        try:
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = "\n".join(cleaned.split("\n")[1:])
                if cleaned.endswith("```"):
                    cleaned = "\n".join(cleaned.split("\n")[:-1])
            parsed = json.loads(cleaned)
            if isinstance(parsed, dict) and "executive_summary" in parsed:
                return parsed
        except Exception:
            try:
                start = raw.index("{")
                end = raw.rindex("}") + 1
                return json.loads(raw[start:end])
            except Exception:
                pass
        return None

    def _rule_based_deep_research(
        self,
        query: str,
        knowledge: Dict[str, Any],
        papers: List[Dict[str, Any]],
        patents: List[Dict[str, Any]],
        datasets: List[Dict[str, Any]],
        repositories: List[Dict[str, Any]],
        problem_statements: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """High-grade offline rule-based research synthesis."""
        title = knowledge.get("title") or query.title()
        wiki_extract = knowledge.get("extract") or f"{query} represents a critical domain of research and applied technological innovation."
        
        # Build synthesis from retrieved papers
        paper_titles = [p.get("title", "") for p in papers if p.get("title")]
        paper_takeaways = [p.get("research_takeaway", "") for p in papers if p.get("research_takeaway")]
        
        # Build patent landscape
        assignees = list(set([p.get("assignee", "") for p in patents if p.get("assignee") and p.get("assignee") != "Unknown"]))
        assignee_str = f"Led by patent filings from {', '.join(assignees[:3])}." if assignees else "Patents span multiple commercial enterprises and academic research institutes."

        findings = []
        if paper_takeaways:
            findings.extend(paper_takeaways[:3])
        else:
            findings.append(f"Empirical literature highlights the need for robust validation protocols in {title}.")
            findings.append(f"Recent state-of-the-art models demonstrate significant performance gains when leveraging multimodal data.")

        return {
            "chain_of_thought": [
                {
                    "step": 1,
                    "stage": "Knowledge Graph Exploration",
                    "actor": "Wikipedia REST Engine",
                    "thought": f"Ingested canonical background definitions and historical milestones for '{query}'.",
                    "tags": ["Encyclopedic Overview", "Taxonomy"]
                },
                {
                    "step": 2,
                    "stage": "Peer-Reviewed Cross-Referencing",
                    "actor": "Academic Finder (CrossRef & arXiv)",
                    "thought": f"Indexed {len(papers)} peer-reviewed papers with real DOIs and methodological abstracts.",
                    "tags": ["Academic Literature", "Methodology"]
                },
                {
                    "step": 3,
                    "stage": "Prior-Art & Dataset Discovery",
                    "actor": "Google Patents & Hugging Face",
                    "thought": f"Cross-referenced {len(patents)} patent publications and {len(datasets)} open-access benchmark datasets.",
                    "tags": ["Patents", "Hugging Face Datasets"]
                },
                {
                    "step": 4,
                    "stage": "Autonomous Intelligence Synthesis",
                    "actor": "Research Agent Core",
                    "thought": f"Consolidated empirical findings, benchmark datasets, and structured execution milestones for '{query}'.",
                    "tags": ["Dossier Synthesis", "Roadmap"]
                }
            ],
            "executive_summary": f"### Executive Overview\n\n**{title}** is an essential focus area characterized by rapid theoretical evolution and diverse practical applications. {wiki_extract}\n\nRecent academic literature underscores a transition from isolated theoretical experiments to integrated, scalable architectures. By combining empirical datasets with domain-specific methodologies, current initiatives seek to overcome historical throughput and accuracy constraints.",
            "state_of_the_art": f"Current state-of-the-art approaches in **{title}** emphasize modular, data-driven frameworks. Top researchers actively incorporate state-of-the-art optimization algorithms, edge inference optimizations, and standardized benchmarking protocols to guarantee reproducibility and robust real-world performance.",
            "technical_deep_dive": f"At a technical level, {query} relies on the interplay of algorithmic optimization, data ingestion pipelines, and verification metrics. Key implementations prioritize low-latency inference, resilient state management, and fault-tolerant communication protocols to ensure seamless execution in both research and production environments.",
            "key_findings": findings,
            "open_challenges": [
                f"Data quality, domain-shift vulnerability, and generalizability across heterogeneous environments in {title}.",
                f"Computational complexity and resource constraints when deploying high-capacity models or experimental setups on standard hardware.",
                f"Integration hurdles with legacy infrastructure and absence of universally accepted standardized evaluation benchmarks."
            ],
            "patent_ip_landscape": f"The intellectual property landscape for **{title}** reflects active prior art in system architectures, sensor telemetry, and algorithmic pipelines. {assignee_str} Novelty opportunities lie primarily in lightweight edge adaptations, open-standard protocols, and cross-domain data integration.",
            "recommended_stack": {
                "core_frameworks": ["Python 3.11+", "PyTorch / TensorFlow", "FastAPI / Docker", "NumPy & Pandas"],
                "datasets_models": [d.get("name", "Benchmark Dataset") for d in datasets[:2]] + ["Hugging Face Transformers"],
                "hardware_infra": ["NVIDIA CUDA-enabled GPU (RTX 3060+ / T4)", "Edge deployment on Raspberry Pi 5 or Jetson Nano"]
            },
            "research_roadmap": [
                {
                    "phase": "Phase 1: Literature Audit & Baseline Reproduction",
                    "duration": "Weeks 1-2",
                    "milestones": [
                        "Review primary academic papers and extract evaluation baselines",
                        "Set up development environment and ingest open datasets"
                    ]
                },
                {
                    "phase": "Phase 2: Core Pipeline & Architecture Engineering",
                    "duration": "Weeks 3-5",
                    "milestones": [
                        "Implement modular prototype and data preprocessing pipeline",
                        "Validate baseline performance metrics against published literature"
                    ]
                },
                {
                    "phase": "Phase 3: Optimization & Novelty Integration",
                    "duration": "Weeks 6-8",
                    "milestones": [
                        "Introduce domain-specific optimizations and ablation experiments",
                        "Perform stress tests, latency benchmarks, and error analysis"
                    ]
                },
                {
                    "phase": "Phase 4: Synthesis & Publication / Deployment",
                    "duration": "Weeks 9-10",
                    "milestones": [
                        "Draft comprehensive technical documentation and reproducibility report",
                        "Package deployable artifacts, demo dashboard, and open-source repo"
                    ]
                }
            ],
            "llm_powered": False
        }

    def chat_research_agent(
        self,
        research_context: Dict[str, Any],
        history: List[Dict[str, str]],
        user_message: str,
    ) -> Optional[str]:
        """
        Multi-turn interactive chat with the AI Research Agent grounded in the full research dossier.
        """
        query = research_context.get("query", "the topic")
        dossier = research_context.get("dossier", {})
        exec_summary = dossier.get("executive_summary", "")[:600]
        state_of_art = dossier.get("state_of_the_art", "")[:400]
        findings = "\n".join([f"- {f}" for f in dossier.get("key_findings", [])[:4]])
        challenges = "\n".join([f"- {c}" for c in dossier.get("open_challenges", [])[:3]])
        
        papers = research_context.get("papers", [])
        papers_str = "\n".join([
            f"- [{p.get('source', 'CrossRef')}] '{p.get('title', '')}' ({p.get('year', '')}): {p.get('research_takeaway', '')[:120]}"
            for p in papers[:4]
        ])

        patents = research_context.get("patents", [])
        patents_str = "\n".join([
            f"- Patent {p.get('patent_id', '')} '{p.get('title', '')}' ({p.get('assignee', '')})"
            for p in patents[:3]
        ])

        datasets = research_context.get("datasets", [])
        datasets_str = "\n".join([
            f"- Dataset '{d.get('name', '')}' ({d.get('source', '')}): {d.get('description', '')[:100]}"
            for d in datasets[:3]
        ])

        context_prompt = f"""Current Research Subject: "{query}"

=== SYNTHESIZED RESEARCH DOSSIER ===
{exec_summary}

Current State of the Art:
{state_of_art}

Key Literature Findings:
{findings}

Critical Open Challenges:
{challenges}

Retrieved Peer-Reviewed Papers:
{papers_str or 'None retrieved'}

Retrieved Patents:
{patents_str or 'None retrieved'}

Retrieved Datasets:
{datasets_str or 'None retrieved'}
====================================="""

        system_prompt = SYSTEM_RESEARCH_CHAT + "\n\n" + context_prompt

        if not self._active:
            # Informative offline assistant response
            return f"💡 **Offline Research Note regarding '{user_message}':**\n\nBased on the retrieved research for **{query}**:\n- **Key Insights:** {findings or 'Literature shows active experimental focus on architectural optimization.'}\n- **Open Challenges:** {challenges or 'Scalability and empirical benchmarking remain focal bottlenecks.'}\n\n*(To unlock dynamic interactive multi-turn AI reasoning, connect Gemini, Groq, OpenAI, or local Ollama via LLM Settings in the top bar.)*"

        llm_resp = self._call_llm(
            user_message,
            system=system_prompt,
            history=history,
            max_tokens=900,
            temperature=0.6,
        )
        if llm_resp:
            return llm_resp

        # Robust grounded fallback if remote LLM call failed (e.g. 429 quota exhaustion, network):
        err_msg = self._last_error or "AI provider did not return a response."
        is_quota = "quota" in err_msg.lower() or "credit" in err_msg.lower() or "429" in err_msg
        advisory_note = (
            "⚠️ **OpenAI API Notice (Credit Balance Exhausted - 429):** Your configured OpenAI key has 0 remaining credits.\n"
            "👉 *Tip: Open **LLM Settings** in the top navigation bar to switch to **Groq** (free Llama 3.3 70B), **Google Gemini** (free tier), or **Ollama** (offline).*\n\n---\n\n"
            if is_quota else
            f"⚠️ **AI Provider Notice ({err_msg}):**\n\n---\n\n"
        )

        return (
            f"{advisory_note}"
            f"🔬 **Grounded Research Analysis for \"{user_message}\":**\n\n"
            f"Based on the synthesized research dossier for **{query}**:\n"
            f"- **Executive Summary:** {exec_summary or 'Multi-source empirical research synthesized.'}\n"
            f"- **Key Literature Insights:**\n{findings or '- Active academic and industry research underway.'}\n"
            f"- **Critical Open Challenges:**\n{challenges or '- Novelty verification and scalable implementation.'}\n"
            f"- **Retrieved Peer-Reviewed Evidence:**\n{papers_str or '- Check Literature tab for arXiv/CrossRef DOIs.'}\n"
            f"- **Patent & Innovation Landscape:**\n{patents_str or '- Check Patents tab for IP landscape.'}\n\n"
            f"*Tip: Use the tabs above to explore full paper abstracts, patent claims, and dataset downloads.*"
        )

    def generate_strategic_advisory(
        self,
        topic: Dict[str, Any],
        research_papers: List[Dict],
        patents: List[Dict],
        nlp_data: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Generate a fully LLM-powered strategic advisory for a SIH problem statement.
        Incorporates NLP linguistic features and returns a structured Chain of Thought.
        """
        if not self._active:
            return None

        title = topic.get("title", "")
        domain = topic.get("domain", "")
        desc = topic.get("description", "")
        category = topic.get("category", "Software")
        org = topic.get("organization", "Government of India")
        tech_tags = topic.get("tech_keywords", [])
        year = topic.get("year", "")

        papers_summary = "\n".join(
            [f"- [{p.get('source','CrossRef')}] {p.get('title','')}: {(p.get('abstract') or '')[:200]}"
             for p in research_papers[:3]]
        ) if research_papers else "No papers retrieved."

        patents_summary = "\n".join(
            [f"- [{p.get('patent_id','?')}] {p.get('title','')}: {(p.get('abstract') or '')[:200]}"
             for p in patents[:3]]
        ) if patents else "No patents retrieved."

        nlp_section = ""
        if nlp_data:
            nlp_section = f"""
NLP Engine Extracted Semantic Features:
- Primary Inferred Domain: {nlp_data.get('inferred_domain', domain)}
- Category Archetype: {nlp_data.get('inferred_category', category)}
- Key Entities: {', '.join(nlp_data.get('entities', []))}
- Detected Tech Stacks: {', '.join(nlp_data.get('detected_tech', []))}
- Technical Keywords: {', '.join(nlp_data.get('expanded_keywords', []))}
"""

        prompt = f"""SIH Problem Statement Analysis Request:
---
ID: {topic.get('id', 'N/A')}
Title: {title}
Organization: {org}
Domain: {domain}
Category: {category}
Year: {year}
Tech Keywords: {', '.join(tech_tags)}
Description: {desc[:800]}
{nlp_section}
Related Research Papers:
{papers_summary}

Relevant Google Patents:
{patents_summary}
---

Generate a comprehensive, non-generic hackathon strategy advisory in the following exact JSON format.
Synthesize the NLP linguistic extractions, prior-art papers, patents, and official SIH judging metrics into a step-by-step Chain of Thought (CoT):

{{
  "chain_of_thought": [
    {{
      "step": 1,
      "stage": "Linguistic & Operational Deconstruction",
      "actor": "NLP + Domain Engine",
      "thought": "Deep reasoning analyzing core ground-reality challenges and ministry operational bottlenecks..."
    }},
    {{
      "step": 2,
      "stage": "Prior-Art & Patent White-Space Discovery",
      "actor": "Patent & Research Finder",
      "thought": "Analysis of existing literature and Google Patents to identify unencumbered technical white-space..."
    }},
    {{
      "step": 3,
      "stage": "36-Hour Technical MVP Architecture",
      "actor": "LLM Cognitive Core",
      "thought": "Why this specific AI model quantization, edge/cloud backend, and database fits the 36h hackathon..."
    }},
    {{
      "step": 4,
      "stage": "Winning Novelty & Jury Scoring Alignment",
      "actor": "LLM Hackathon Advisor",
      "thought": "How this solution maximizes Innovation (30%), Feasibility (30%), Impact (20%), and Presentation (20%)..."
    }}
  ],
  "why_matched": "2-3 sentences explaining precisely why this problem is impactful and why a team should pick it",
  "winning_novelty_edge": "1 specific, actionable novel differentiator that would make judges score this team highest. Tie it to a specific gap in the research papers or patents found.",
  "recommended_tech_stack": {{
    "ai_ml": "Specific AI/ML frameworks, models and algorithms suited to this exact problem",
    "backend": "Specific backend stack with reasons tied to the problem requirements",
    "frontend": "Specific UI/dashboard tools appropriate for the end-user of this system",
    "hardware_iot": "Hardware components if applicable, or 'No specialized hardware needed'",
    "database": "Appropriate database architecture for this use case"
  }},
  "feasibility_roadmap": [
    {{"phase": "Hours 0-6", "milestone": "Specific task for this problem"}},
    {{"phase": "Hours 6-18", "milestone": "Specific task for this problem"}},
    {{"phase": "Hours 18-30", "milestone": "Specific task for this problem"}},
    {{"phase": "Hours 30-36", "milestone": "Specific task for this problem"}}
  ],
  "pitch_outline": {{
    "slide_1": {{
      "title": "Problem Statement & Ground Reality",
      "bullets": ["bullet1 specific to this PS", "bullet2", "bullet3", "bullet4"]
    }},
    "slide_2": {{
      "title": "Proposed Solution & Architecture",
      "bullets": ["bullet1", "bullet2", "bullet3"]
    }},
    "slide_3": {{
      "title": "Technical Implementation",
      "bullets": ["bullet1", "bullet2", "bullet3"]
    }},
    "slide_4": {{
      "title": "Impact, Feasibility & Scalability",
      "bullets": ["bullet1", "bullet2", "bullet3"]
    }}
  }},
  "complexity": "Low|Medium|High",
  "estimated_mvp_readiness": "One sentence on whether this is achievable in 36 hours and what the key risk is"
}}"""

        raw = self._call_llm(prompt, system=SYSTEM_ADVISORY, max_tokens=2000, temperature=0.6)
        if not raw:
            return None

        # Parse JSON from response
        try:
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = "\n".join(cleaned.split("\n")[1:])
                if cleaned.endswith("```"):
                    cleaned = "\n".join(cleaned.split("\n")[:-1])
            return json.loads(cleaned)
        except (json.JSONDecodeError, ValueError):
            try:
                start = raw.index("{")
                end = raw.rindex("}") + 1
                return json.loads(raw[start:end])
            except Exception:
                self._last_error = "LLM returned malformed JSON. Falling back to rule-based advisory."
                return None

    def generate_query_chain_of_thought(
        self,
        prompt: str,
        nlp_data: Dict[str, Any],
        matched_topics: List[Dict[str, Any]],
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Generates a 4-step collaborative Chain of Thought (CoT) explaining how NLP
        linguistic features and LLM semantic deduction collaborated to evaluate the query.
        """
        if not self._active:
            return None

        entities = nlp_data.get("entities", [])
        domain = nlp_data.get("inferred_domain", "General Technology")
        category = nlp_data.get("inferred_category", "Software")
        tech_tags = nlp_data.get("detected_tech", [])
        topics_summary = "\n".join(
            [f"- [{t.get('id', 'N/A')}] {t.get('title', '')} ({t.get('domain', '')})"
             for t in matched_topics[:3]]
        ) if matched_topics else "No vector matches yet."

        cot_prompt = f"""User Query: "{prompt}"

NLP Engine Extractions:
- Inferred Domain: {domain}
- Inferred Category: {category}
- Extracted Entities: {', '.join(entities) if entities else 'None'}
- Detected Tech: {', '.join(tech_tags) if tech_tags else 'None'}
- Enriched Vector Query: {nlp_data.get('enriched_vector_query', prompt)}

Top Retrieved SIH Statements:
{topics_summary}

Generate a 4-step collaborative Chain of Thought (CoT) showing how NLP linguistic parsing and LLM reasoning worked together to analyze this query and select the most relevant problem statements.
Respond in this exact JSON array format:
[
  {{
    "step": 1,
    "stage": "Linguistic Decomposition & Intent Extraction",
    "actor": "NLP Engine",
    "thought": "Concise explanation of the grammatical tokens, entities, and intent identified in '{prompt}'...",
    "tags": ["spaCy NLP", "Intent Analysis"]
  }},
  {{
    "step": 2,
    "stage": "Domain Taxonomy & Ministry Mapping",
    "actor": "Taxonomy Engine",
    "thought": "Concise reasoning about how '{domain}' and '{category}' map to government ministry domains...",
    "tags": ["Domain Taxonomy", "Category Classification"]
  }},
  {{
    "step": 3,
    "stage": "Vector Expansion & Semantic Alignment",
    "actor": "NLP + Embedding Core",
    "thought": "Concise reasoning on how query was expanded with synonyms and matched against ChromaDB vector embeddings...",
    "tags": ["ChromaDB Embeddings", "Synonym Expansion"]
  }},
  {{
    "step": 4,
    "stage": "Strategic Feasibility & Hackathon Advisory",
    "actor": "LLM Cognitive Core",
    "thought": "Strategic deduction on 36-hour MVP feasibility, potential technical hurdles, and judge scoring appeal...",
    "tags": ["36h MVP Feasibility", "Jury Scoring Edge"]
  }}
]"""

        raw = self._call_llm(cot_prompt, system=SYSTEM_COT, max_tokens=1000, temperature=0.5)
        if not raw:
            return None

        try:
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = "\n".join(cleaned.split("\n")[1:])
                if cleaned.endswith("```"):
                    cleaned = "\n".join(cleaned.split("\n")[:-1])
            parsed = json.loads(cleaned)
            if isinstance(parsed, list):
                return parsed
            elif isinstance(parsed, dict) and "chain_of_thought" in parsed:
                return parsed["chain_of_thought"]
            return None
        except Exception:
            return None

    def answer_general_query(
        self,
        query: str,
        nlp_data: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Answer a conversational, general, or out-of-domain query with Chain of Thought reasoning.
        """
        if not self._active:
            return None

        nlp_info = ""
        if nlp_data:
            nlp_info = f"\nNLP Inferred Domain: {nlp_data.get('inferred_domain')}, Entities: {', '.join(nlp_data.get('entities', []))}"

        prompt = f"""User query: "{query}"{nlp_info}

Determine if this is related to SIH, hackathons, technology, or innovation. Provide a step-by-step Chain of Thought and answer.
Respond in JSON format:
{{
  "is_sih_related": true|false,
  "chain_of_thought": [
    {{
      "step": 1,
      "stage": "Linguistic & Intent Parsing",
      "actor": "NLP Engine",
      "thought": "Identified conversational intent and extracted key conceptual terms..."
    }},
    {{
      "step": 2,
      "stage": "Contextual Deduction",
      "actor": "LLM Cognitive Core",
      "thought": "Evaluated against official SIH rules, evaluation rubric, and past hackathon winning patterns..."
    }},
    {{
      "step": 3,
      "stage": "Strategic Synthesis",
      "actor": "AI Mentor",
      "thought": "Synthesized actionable guidance with concrete tips..."
    }}
  ],
  "answer": "Your helpful answer in markdown (use bullet points for lists). If unrelated to SIH, still provide a brief helpful answer but suggest they use the search bar for SIH topics.",
  "suggested_searches": ["search term 1", "search term 2"]
}}"""

        raw = self._call_llm(prompt, system=SYSTEM_GENERAL, max_tokens=900, temperature=0.5)
        if not raw:
            return None

        try:
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = "\n".join(cleaned.split("\n")[1:])
                if cleaned.endswith("```"):
                    cleaned = "\n".join(cleaned.split("\n")[:-1])
            return json.loads(cleaned)
        except (json.JSONDecodeError, ValueError):
            try:
                start = raw.index("{")
                end = raw.rindex("}") + 1
                return json.loads(raw[start:end])
            except Exception:
                return {"is_sih_related": True, "answer": raw.strip(), "suggested_searches": []}

    def chat_mentor(
        self,
        topic: Dict[str, Any],
        history: List[Dict[str, str]],
        user_message: str,
    ) -> Optional[str]:
        """
        Multi-turn AI Hackathon Mentor chat scoped to a specific problem statement.
        Returns assistant text response or None if LLM inactive.
        """
        if not self._active:
            return None

        context = f"""Current Problem Statement Context:
- ID: {topic.get('id', 'N/A')} | Year: {topic.get('year', 'N/A')}
- Title: {topic.get('title', 'N/A')}
- Organization: {topic.get('organization', 'N/A')}
- Domain: {topic.get('domain', 'N/A')}
- Category: {topic.get('category', 'Software')}
- Tech Keywords: {', '.join(topic.get('tech_keywords', []))}"""

        system_with_context = SYSTEM_MENTOR + "\n\n" + context

        resp = self._call_llm(
            user_message,
            system=system_with_context,
            history=history,
            max_tokens=700,
            temperature=0.7,
        )
        if resp:
            return resp

        err_msg = self._last_error or "AI provider did not return a response."
        is_quota = "quota" in err_msg.lower() or "credit" in err_msg.lower() or "429" in err_msg
        if is_quota:
            return (
                f"⚠️ **OpenAI Credit Balance Exhausted (HTTP 429):**\n\n"
                f"Your configured OpenAI API key has run out of credits (`credit_balance_exhausted`).\n\n"
                f"To keep chatting, please open **LLM Settings** in the top navigation bar and switch to a free provider like **Groq** (free Llama 3.3 70B), **Google Gemini** (free tier), or **Ollama**."
            )
        return f"⚠️ **AI Mentor Notice:** {err_msg}. Please check your LLM configuration in the top bar."


# Global singleton
llm_engine = LLMEngine()

if __name__ == "__main__":
    print("LLM Engine Status:", json.dumps(llm_engine.get_status(), indent=2))
    if llm_engine._active:
        print("\nTesting general query...")
        resp = llm_engine.answer_general_query("How do I prepare for SIH 2025?")
        print(json.dumps(resp, indent=2))
