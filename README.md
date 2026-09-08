# 🚀 Smart India Hackathon (SIH) Topic Discovery & Advisory Agent

An intelligent, full-stack AI research agent designed to search, analyze, and strategically advise on **Smart India Hackathon (SIH) problem statements across all editions**.

Powered by a **Persistent Vector Database (ChromaDB)**, an **NLP Prompt Understanding Pipeline (spaCy/NLTK)**, **Academic Research Paper Integration (arXiv)**, **Google Patents Prior-Art & Novelty Discovery**, and an **Automated Live Sync Crawler** for newly proposed statements.

---

## 🌟 Key Highlights

- **Complete SIH Historical Dataset**:
  - Indexed 430+ authentic problem statements spanning SIH editions (2025/2026, 2024, 2023, 2022, 2020, 2019).
  - Categorized into Software & Hardware, ministries, and official technology buckets.
- **ChromaDB Persistent Vector Database**:
  - Contextual dense vector embeddings with cosine similarity matching.
  - Hybrid scoring combining semantic embeddings (65%) with lexical token overlap (35%).
- **NLP Query Processing Engine**:
  - Evaluates user prompts to extract entities, target stakeholders, and technical stacks.
  - Infers solution modality (`Software`, `Hardware`, `Hybrid`) and suggests SIH domains.
  - Expands colloquial words into domain taxonomy synonyms.
- **Academic Research Paper Discovery**:
  - Direct integration with **arXiv API** to retrieve relevant peer-reviewed papers.
  - Direct PDF download links and actionable hackathon application takeaways.
- **Google Patents Prior-Art & Novelty Analysis**:
  - Identifies existing patents on **Google Patents** (`patents.google.com`).
  - Formulates unencumbered patent novelty and workaround strategies for SIH judges.
- **Hackathon Strategic Advisory & 4-Slide Pitch Blueprint**:
  - Provides tailored tech stack recommendations, 36-hour feasibility milestones, and presentation slides.
- **Live SIH Auto-Updater & Crawler**:
  - Monitors SIH portal feeds and automatically indexes newly proposed statements into ChromaDB.
- **Dual Interfaces**:
  - Modern Dark-Glassmorphism Web Dashboard (`http://localhost:8000`).
  - Terminal Command-Line Interface (`python agent_cli.py`).

---

## 🏗️ Architecture

```
User Prompt ("I want to build a drone to detect crop disease...")
       │
       ▼
┌────────────────────────────────────────────────────────┐
│               SIH NLP Intelligence Engine              │
│   • spaCy entity extraction & noun chunking            │
│   • Category inference (Hardware vs. Software)         │
│   • Domain classification & synonym expansion          │
└──────────────────────────┬─────────────────────────────┘
                           │
       ▼───────────────────┴───────────────────▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│     Persistent Vector DB      │   │     Academic Research Agent   │
│          (ChromaDB)           │   │          (arXiv API)          │
│ • 430+ indexed SIH statements │   │ • Peer-reviewed papers        │
│ • Hybrid cosine vector search │   │ • Direct PDF links            │
└──────────────┬────────────────┘   └──────────────┬────────────────┘
               │                                   │
               ▼                                   ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│      Google Patents Agent     │   │      Live SIH Sync Agent      │
│   (Google Patents Search)     │   │    • Real-time crawler        │
│ • Patent prior art & links    │   │ • Auto-embeds new statements  │
│ • Novelty & IPR workarounds   │   │ • Changelog audit trails      │
└──────────────┬────────────────┘   └──────────────┬────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────┐
│               Hackathon Strategic Advisory             │
│   • Why matched & fit explanation                      │
│   • Tailored full-stack & AI architecture              │
│   • 36-Hour Hackathon MVP roadmap                      │
│   • 4-Slide SIH Presentation Blueprint                 │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌─────────────────────────┐ ┌─────────────────────────┐
│  Modern Web Dashboard   │ │      Terminal CLI       │
│  (FastAPI + Vanilla JS) │ │   (agent_cli.py)        │
└─────────────────────────┘ └─────────────────────────┘
```

---

## ⚡ Getting Started

### 1. Prerequisites
- Python 3.10+ (Tested on Python 3.14 on Windows)
- Required packages:
  ```bash
  pip install fastapi uvicorn chromadb pydantic requests spacy
  python -m spacy download en_core_web_sm
  ```

### 2. Launch the Web Application
```bash
python server.py
```
Open your browser at **[http://localhost:8000](http://localhost:8000)**.

---

## 💻 Command Line Interface (CLI)

### Search Problem Statements
```bash
python agent_cli.py search "drone crop disease detection" --limit 5
```

### Strategic Topic Analysis (Advisory + Papers + Patents + Pitch)
```bash
python agent_cli.py analyze --id SIH2023_1204
```

### Live SIH Sync
```bash
python agent_cli.py sync
```

### View Database Metrics
```bash
python agent_cli.py stats
```

### Interactive Shell
```bash
python agent_cli.py interactive
```

---

## 📁 Project Structure

```
sih-agent/
├── data/
│   ├── sih_master_dataset.json   # 430+ master SIH problem statements
│   ├── sync_log.json             # Live update audits
│   ├── research_cache.json       # Cached academic papers
│   ├── patent_cache.json         # Cached Google Patents prior art
│   └── vector_store/             # ChromaDB persistent vector collection
├── frontend/
│   ├── index.html                # Modern glassmorphism dashboard
│   ├── style.css                 # Dark mode styling & animations
│   └── app.js                    # Reactive frontend controller
├── sih_nlp_engine.py             # NLP extraction & query expansion
├── sih_vector_store.py           # ChromaDB index & hybrid similarity
├── sih_research_finder.py        # arXiv paper integration
├── sih_patent_finder.py          # Google Patents discovery engine
├── sih_updater.py                # Crawler & synchronization agent
├── sih_agent_core.py             # Master intelligence coordinator
├── server.py                     # FastAPI REST API & static server
├── agent_cli.py                  # Command-line interface
├── scripts/
│   └── build_master_dataset.py   # Dataset consolidation script
└── README.md
```

---

## 📜 License
MIT License. Built for Smart India Hackathon innovators and research teams.
