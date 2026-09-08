"""
SIH Agent FastAPI Server
Exposes REST API endpoints for NLP prompt parsing, Vector Database retrieval,
Academic Research papers, Google Patents discovery, live sync,
and LLM-powered strategic advisory & mentor chat.
Serves the modern frontend dashboard.
"""
import os
import logging
import secrets
from typing import Any, Dict, List, Literal, Optional
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field, field_validator

from sih_agent_core import agent_core
from sih_vector_store import vector_store
from sih_updater import updater
from sih_nlp_engine import nlp_engine
from sih_llm_engine import llm_engine
from weather_service import weather_service

app = FastAPI(
    title="SIH Topic Discovery & Advisory Agent API",
    description="Vector Database, NLP Prompt Pipeline, Academic Papers, Google Patents & LLM Advisory for SIH",
    version="3.0.0"
)

logger = logging.getLogger("sih_agent.api")


def _allowed_origins() -> List[str]:
    configured = os.getenv("SIH_ALLOWED_ORIGINS", "")
    if configured.strip():
        return [origin.strip() for origin in configured.split(",") if origin.strip()]
    return ["http://127.0.0.1:5173", "http://localhost:5173"]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "frontend")


def _error_response(error: Exception, action: str) -> HTTPException:
    logger.exception("%s failed", action)
    detail = "The request could not be completed. Please try again."
    if os.getenv("SIH_DEBUG", "").lower() in {"1", "true", "yes"}:
        detail = str(error)
    return HTTPException(status_code=500, detail=detail)


def _require_admin_token(x_sih_admin_token: Optional[str] = Header(default=None)) -> None:
    expected_token = os.getenv("SIH_ADMIN_TOKEN", "")
    required = os.getenv("SIH_REQUIRE_ADMIN_TOKEN", "").lower() in {"1", "true", "yes"}
    if required and not expected_token:
        raise HTTPException(status_code=503, detail="Administrative endpoints are not configured.")
    if expected_token and not secrets.compare_digest(x_sih_admin_token or "", expected_token):
        raise HTTPException(status_code=403, detail="Administrative authorization is required.")

# ─── Request Models ────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str = Field(default="", max_length=500)
    limit: int = Field(default=15, ge=1, le=50)
    year: Optional[int] = Field(default=None, ge=2000, le=2100)
    category: Optional[str] = Field(default=None, max_length=80)
    domain: Optional[str] = Field(default=None, max_length=160)

    @field_validator("query", "category", "domain", mode="before")
    @classmethod
    def normalize_text(cls, value: Optional[str]) -> Optional[str]:
        return " ".join(str(value or "").split())

class AnalyzeRequest(BaseModel):
    ps_id: str = Field(min_length=1, max_length=120)
    prompt: str = Field(default="", max_length=1000)

class NLPRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=1000)

class LLMConfigRequest(BaseModel):
    provider: str = Field(min_length=1, max_length=32)
    api_key: str = Field(default="", max_length=512)
    model: str = Field(default="", max_length=128)

class LLMTestRequest(BaseModel):
    provider: str = Field(min_length=1, max_length=32)
    api_key: str = Field(default="", max_length=512)
    model: str = Field(default="", max_length=128)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"] = "user"
    content: str = Field(default="", max_length=15000)

class ChatRequest(BaseModel):
    ps_id: str = Field(min_length=1, max_length=120)
    message: str = Field(min_length=1, max_length=15000)
    history: List[ChatMessage] = Field(default_factory=list, max_length=50)

class GeneralQueryRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)

class ResearchRunRequest(BaseModel):
    query: str = Field(min_length=3, max_length=500)
    max_papers: int = Field(default=6, ge=1, le=10)
    max_patents: int = Field(default=5, ge=1, le=10)
    max_datasets: int = Field(default=5, ge=1, le=10)

class ResearchChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=15000)
    research_context: Dict[str, Any] = Field(default_factory=dict)
    history: List[ChatMessage] = Field(default_factory=list, max_length=50)


class WeatherRequest(BaseModel):
    location: Optional[str] = Field(default=None, max_length=120)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)

# ─── Deep Research Agent Endpoints ───────────────────────────────────────────

@app.post("/api/research/run")
async def api_research_run(req: ResearchRunRequest):
    """
    Executes full 360-degree deep research across knowledge bases, academic papers,
    patents, open datasets, and code repos with AI research synthesis.
    """
    try:
        return await run_in_threadpool(
            agent_core.conduct_deep_research,
            query=req.query,
            max_papers=req.max_papers,
            max_patents=req.max_patents,
            max_datasets=req.max_datasets,
        )
    except Exception as e:
        raise _error_response(e, "deep research")

@app.post("/api/research/chat")
async def api_research_chat(req: ResearchChatRequest):
    """
    Interactive multi-turn conversation with the AI Research Partner
    grounded in the active research dossier, papers, patents, and datasets.
    """
    try:
        reply = await run_in_threadpool(
            llm_engine.chat_research_agent,
            research_context=req.research_context,
            history=[message.model_dump() for message in req.history],
            user_message=req.message,
        )
        return {
            "reply": reply or "Could not generate a response. Please try again.",
            "llm_active": llm_engine._active
        }
    except Exception as e:
        raise _error_response(e, "research chat")

@app.post("/api/research/export")
async def api_research_export(data: Dict[str, Any]):
    """Export research dossier to structured Markdown document."""
    try:
        md = agent_core.export_research_dossier(data)
        return {"markdown": md}
    except Exception as e:
        raise _error_response(e, "research export")


@app.post("/api/weather")
async def api_weather(req: WeatherRequest):
    """Return current conditions from Open-Meteo without persisting location data."""
    try:
        return await run_in_threadpool(
            weather_service.get_current_weather,
            req.location,
            req.latitude,
            req.longitude,
        )
    except Exception as e:
        raise _error_response(e, "weather lookup")

# ─── Existing Endpoints ────────────────────────────────────────────────────────


@app.post("/api/search")
async def api_search(req: SearchRequest):
    try:
        results = await run_in_threadpool(
            agent_core.discover_topics,
            prompt=req.query,
            n_results=req.limit,
            year=req.year,
            category=req.category,
            domain=req.domain
        )
        return results
    except Exception as e:
        raise _error_response(e, "topic search")

@app.post("/api/nlp/parse")
async def api_nlp_parse(req: NLPRequest):
    try:
        return await run_in_threadpool(nlp_engine.parse_prompt, req.prompt)
    except Exception as e:
        raise _error_response(e, "NLP parsing")

@app.get("/api/topic/{ps_id}")
async def api_get_topic(ps_id: str):
    try:
        result = await run_in_threadpool(agent_core.analyze_topic_deep, ps_id, "")
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        topic_data = result.get("topic", {}) or {}
        merged = {**topic_data, **result}
        return merged
    except HTTPException:
        raise
    except Exception as e:
        raise _error_response(e, "topic analysis")

@app.post("/api/analyze")
async def api_analyze(req: AnalyzeRequest):
    try:
        result = await run_in_threadpool(agent_core.analyze_topic_deep, req.ps_id, req.prompt)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        topic_data = result.get("topic", {}) or {}
        merged = {**topic_data, **result}
        return merged
    except HTTPException:
        raise
    except Exception as e:
        raise _error_response(e, "topic analysis")

@app.get("/api/stats")
async def api_stats():
    try:
        stats = vector_store.get_stats()
        sync_status = updater.get_sync_status()
        stats["sync_status"] = sync_status
        return stats
    except Exception as e:
        raise _error_response(e, "statistics lookup")

@app.post("/api/sync")
async def api_sync(_: None = Depends(_require_admin_token)):
    try:
        result = await run_in_threadpool(updater.check_and_sync, vector_store)
        return result
    except Exception as e:
        raise _error_response(e, "SIH sync")

@app.get("/api/sync/status")
async def api_sync_status():
    return updater.get_sync_status()

# ─── LLM Endpoints ────────────────────────────────────────────────────────────

@app.get("/api/llm/status")
async def api_llm_status():
    """Returns current LLM provider config and active status."""
    try:
        return llm_engine.get_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/llm/config")
@app.post("/api/llm/configure")
async def api_llm_config(req: LLMConfigRequest, _: None = Depends(_require_admin_token)):
    """Persist LLM provider configuration to .env and update runtime state."""
    try:
        result = llm_engine.save_config(
            provider=req.provider,
            api_key=req.api_key or "",
            model=req.model or ""
        )
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Config failed"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise _error_response(e, "LLM configuration")

@app.post("/api/llm/test")
async def api_llm_test(req: LLMTestRequest):
    """Test LLM connection credentials without saving config."""
    try:
        result = await run_in_threadpool(
            llm_engine.test_connection,
            req.provider,
            req.api_key or "",
            req.model or "",
        )
        return result
    except Exception as e:
        raise _error_response(e, "LLM connection test")

@app.post("/api/llm/chat")
async def api_llm_chat(req: ChatRequest):
    """
    AI Hackathon Mentor — multi-turn chat scoped to a specific problem statement.
    """
    try:
        # Get topic from vector store
        topic = vector_store.get_by_id(req.ps_id)
        if not topic:
            raise HTTPException(status_code=404, detail="Problem statement not found.")

        if not llm_engine._active:
            return {
                "reply": "⚠️ LLM is not configured. Please open **LLM Settings** in the top navigation bar, choose a provider, and enter your API key to enable the AI Mentor feature.",
                "llm_active": False
            }

        response = await run_in_threadpool(
            llm_engine.chat_mentor,
            topic,
            [message.model_dump() for message in req.history],
            req.message,
        )

        if response:
            return {"reply": response, "llm_active": True}
        else:
            return {
                "reply": "The AI provider could not return a response. Check its availability or try again shortly.",
                "llm_active": False,
                "fallback": True,
            }
    except HTTPException:
        raise
    except Exception as e:
        raise _error_response(e, "mentor chat")

@app.post("/api/llm/answer")
async def api_llm_answer(req: GeneralQueryRequest):
    """Answer a general / conversational query via LLM."""
    try:
        if not llm_engine._active:
            return {
                "is_sih_related": True,
                "answer": "🤖 LLM is not configured. Set up an API key in LLM Settings to enable conversational AI answers.",
                "suggested_searches": [],
                "llm_active": False
            }
        result = await run_in_threadpool(llm_engine.answer_general_query, req.query)
        if result:
            result["llm_active"] = True
            return result
        return {
            "is_sih_related": True,
            "answer": "The AI provider could not generate an answer. Please try again shortly.",
            "suggested_searches": [],
            "llm_active": False,
            "fallback": True,
        }
    except Exception as e:
        raise _error_response(e, "general LLM answer")

# ─── Static files and frontend route ──────────────────────────────────────────

DIST_DIR = os.path.join(FRONTEND_DIR, "dist")
ASSETS_DIR = os.path.join(DIST_DIR, "assets")

if os.path.exists(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

@app.get("/")
async def serve_index():
    dist_index = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(dist_index):
        return FileResponse(dist_index)
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "SIH Agent API v3.0 is running. Frontend in progress."}

@app.get("/favicon.svg")
async def serve_favicon():
    fav = os.path.join(DIST_DIR, "favicon.svg")
    if os.path.exists(fav):
        return FileResponse(fav)
    fav_src = os.path.join(FRONTEND_DIR, "public", "favicon.svg")
    if os.path.exists(fav_src):
        return FileResponse(fav_src)
    return HTTPException(status_code=404)

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8765"))
    reload = os.getenv("RELOAD", "true").lower() in {"1", "true", "yes"}
    uvicorn.run("server:app", host=host, port=port, reload=reload)
