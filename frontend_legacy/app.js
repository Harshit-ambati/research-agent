/**
 * SIH Topic Discovery & Advisory Agent - Client Controller
 * v3.0 — LLM Integration: AI Mentor Chat, LLM Settings, Conversational Q&A
 */

// Application State
const state = {
  query: "",
  year: "all",
  category: "all",
  domain: "all",
  topics: [],
  comparedTopics: [],
  currentModalData: null,
  isSearching: false,
  llmStatus: { active: false, provider: "", model: "", all_providers: [] },
  mentorHistory: [],     // [{role, content}]
  selectedProvider: null // for LLM settings modal
};

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const resultsGrid = document.getElementById("resultsGrid");
const resultsCount = document.getElementById("resultsCount");
const activeFilterNote = document.getElementById("activeFilterNote");
const nlpInsightSection = document.getElementById("nlpInsightSection");
const nlpSummaryText = document.getElementById("nlpSummaryText");
const inferredCategoryBadge = document.getElementById("inferredCategoryBadge");
const nlpDomainBadge = document.getElementById("nlpDomainBadge");
const nlpEntitiesList = document.getElementById("nlpEntitiesList");
const nlpTechList = document.getElementById("nlpTechList");
const syncBtn = document.getElementById("syncBtn");
const vectorStoreStatus = document.getElementById("vectorStoreStatus");

// Modal Elements
const detailModal = document.getElementById("detailModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalCloseBottomBtn = document.getElementById("modalCloseBottomBtn");
const modalCompareToggleBtn = document.getElementById("modalCompareToggleBtn");
const modalPsId = document.getElementById("modalPsId");
const modalYear = document.getElementById("modalYear");
const modalCategory = document.getElementById("modalCategory");
const modalDomain = document.getElementById("modalDomain");
const modalTitle = document.getElementById("modalTitle");
const modalOrg = document.getElementById("modalOrg");
const modalDesc = document.getElementById("modalDesc");
const modalTechTags = document.getElementById("modalTechTags");
const modalSourceLink = document.getElementById("modalSourceLink");
const modalLlmBadge = document.getElementById("modalLlmBadge");

// Advisory Elements
const advWhyMatched = document.getElementById("advWhyMatched");
const advWinningEdge = document.getElementById("advWinningEdge");
const advStackAi = document.getElementById("advStackAi");
const advStackBackend = document.getElementById("advStackBackend");
const advStackFrontend = document.getElementById("advStackFrontend");
const advStackHardware = document.getElementById("advStackHardware");
const advRoadmap = document.getElementById("advRoadmap");
const papersList = document.getElementById("papersList");
const patentsList = document.getElementById("patentsList");
const pitchDeckSlides = document.getElementById("pitchDeckSlides");
const copyPitchBtn = document.getElementById("copyPitchBtn");

// Compare Elements
const viewCompareBtn = document.getElementById("viewCompareBtn");
const compareCountBadge = document.getElementById("compareCountBadge");
const compareDrawer = document.getElementById("compareDrawer");
const compareCardsContainer = document.getElementById("compareCardsContainer");
const drawerCount = document.getElementById("drawerCount");
const clearCompareBtn = document.getElementById("clearCompareBtn");
const closeDrawerBtn = document.getElementById("closeDrawerBtn");

// LLM Elements
const llmSettingsBtn = document.getElementById("llmSettingsBtn");
const llmStatusLabel = document.getElementById("llmStatusLabel");
const llmStatusIcon = document.getElementById("llmStatusIcon");
const llmModal = document.getElementById("llmModal");
const closeLlmModalBtn = document.getElementById("closeLlmModalBtn");
const llmConfigForm = document.getElementById("llmConfigForm");
const selectedProviderLabel = document.getElementById("selectedProviderLabel");
const llmApiKeyInput = document.getElementById("llmApiKeyInput");
const llmApiKeyRow = document.getElementById("llmApiKeyRow");
const llmModelSelect = document.getElementById("llmModelSelect");
const llmTestBtn = document.getElementById("llmTestBtn");
const llmSaveBtn = document.getElementById("llmSaveBtn");
const llmTestResult = document.getElementById("llmTestResult");
const llmCurrentStatusBadge = document.getElementById("llmCurrentStatusBadge");
const llmCurrentProvider = document.getElementById("llmCurrentProvider");
const llmCurrentModel = document.getElementById("llmCurrentModel");

// LLM Answer Banner
const llmAnswerSection = document.getElementById("llmAnswerSection");
const llmAnswerContent = document.getElementById("llmAnswerContent");
const llmSuggestedSearches = document.getElementById("llmSuggestedSearches");
const llmSuggestionPills = document.getElementById("llmSuggestionPills");
const closeLlmAnswerBtn = document.getElementById("closeLlmAnswerBtn");
const llmAnswerBadge = document.getElementById("llmAnswerBadge");

// Mentor Chat Elements
const mentorInput = document.getElementById("mentorInput");
const mentorSendBtn = document.getElementById("mentorSendBtn");
const mentorChatWindow = document.getElementById("mentorChatWindow");
const mentorLlmInfo = document.getElementById("mentorLlmInfo");

// ─── Initialize App ────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initEventListeners();
  loadStats();
  loadLLMStatus();
  executeSearch("drone crop disease detection");
});

function initEventListeners() {
  // Search submit
  searchBtn.addEventListener("click", () => {
    state.query = searchInput.value.trim();
    executeSearch(state.query);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      state.query = searchInput.value.trim();
      executeSearch(state.query);
    }
  });

  searchInput.addEventListener("input", () => {
    clearSearchBtn.style.display = searchInput.value ? "block" : "none";
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearSearchBtn.style.display = "none";
    state.query = "";
    llmAnswerSection.style.display = "none";
    executeSearch("");
  });

  // Quick idea pills
  document.querySelectorAll(".prompt-pills .pill").forEach(pill => {
    pill.addEventListener("click", () => {
      const q = pill.getAttribute("data-query");
      searchInput.value = q;
      clearSearchBtn.style.display = "block";
      state.query = q;
      executeSearch(q);
    });
  });

  // Year filter pills
  document.querySelectorAll("#yearFilterGroup .f-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#yearFilterGroup .f-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.year = btn.getAttribute("data-year");
      executeSearch(state.query);
    });
  });

  // Category filter pills
  document.querySelectorAll("#categoryFilterGroup .f-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#categoryFilterGroup .f-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.category = btn.getAttribute("data-cat");
      executeSearch(state.query);
    });
  });

  // Domain select dropdown
  document.getElementById("domainSelect").addEventListener("change", (e) => {
    state.domain = e.target.value;
    executeSearch(state.query);
  });

  // Sync button
  syncBtn.addEventListener("click", handleLiveSync);

  // Modal close
  closeModalBtn.addEventListener("click", closeModal);
  modalCloseBottomBtn.addEventListener("click", closeModal);
  detailModal.addEventListener("click", (e) => {
    if (e.target === detailModal) closeModal();
  });

  // Modal tabs
  document.querySelectorAll(".modal-tabs .m-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".modal-tabs .m-tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      const targetPane = document.getElementById(tab.getAttribute("data-tab"));
      if (targetPane) targetPane.classList.add("active");
    });
  });

  // Copy Pitch Deck
  copyPitchBtn.addEventListener("click", copyPitchMarkdown);

  // Compare toggles
  modalCompareToggleBtn.addEventListener("click", () => {
    if (state.currentModalData && state.currentModalData.topic) {
      toggleCompare(state.currentModalData.topic);
      updateModalCompareButton();
    }
  });

  viewCompareBtn.addEventListener("click", () => { compareDrawer.style.display = "block"; });
  closeDrawerBtn.addEventListener("click", () => { compareDrawer.style.display = "none"; });
  clearCompareBtn.addEventListener("click", () => {
    state.comparedTopics = [];
    updateCompareUI();
  });

  // LLM Settings Modal
  llmSettingsBtn.addEventListener("click", openLlmModal);
  closeLlmModalBtn.addEventListener("click", closeLlmModal);
  llmModal.addEventListener("click", (e) => { if (e.target === llmModal) closeLlmModal(); });

  // LLM Provider Cards
  document.querySelectorAll(".llm-provider-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("llm-get-key-link")) return; // Don't intercept link clicks
      selectProvider(card.getAttribute("data-provider"));
    });
  });

  // LLM Test & Save
  llmTestBtn.addEventListener("click", handleLlmTest);
  llmSaveBtn.addEventListener("click", handleLlmSave);

  // LLM Answer Banner close
  closeLlmAnswerBtn.addEventListener("click", () => {
    llmAnswerSection.style.display = "none";
  });

  // AI Mentor Chat
  mentorSendBtn.addEventListener("click", sendMentorMessage);
  mentorInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMentorMessage();
    }
  });

  // Mentor quick prompt chips
  document.querySelectorAll(".mentor-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const q = chip.getAttribute("data-question");
      mentorInput.value = q;
      sendMentorMessage();
    });
  });
}

// ─── Stats & LLM Status ────────────────────────────────────────────────────────

async function loadStats() {
  try {
    const res = await fetch("/api/stats");
    const data = await res.json();
    if (data && data.total_statements) {
      vectorStoreStatus.textContent = `ChromaDB • ${data.total_statements} Statements Indexed`;
    }
  } catch (err) {
    console.warn("Could not load stats:", err);
  }
}

async function loadLLMStatus() {
  try {
    const res = await fetch("/api/llm/status");
    const data = await res.json();
    state.llmStatus = data;
    updateLLMStatusUI(data);
  } catch (err) {
    console.warn("Could not load LLM status:", err);
  }
}

function updateLLMStatusUI(status) {
  if (status.active) {
    llmStatusLabel.textContent = `LLM: ${status.provider_label} (${status.model})`;
    llmStatusIcon.textContent = "✨";
    llmSettingsBtn.classList.add("llm-active");
    llmCurrentStatusBadge.textContent = "Active";
    llmCurrentStatusBadge.className = "llm-badge-active";
  } else {
    llmStatusLabel.textContent = "LLM: Setup Key";
    llmStatusIcon.textContent = "🤖";
    llmSettingsBtn.classList.remove("llm-active");
    llmCurrentStatusBadge.textContent = "Inactive";
    llmCurrentStatusBadge.className = "badge-cat";
  }
  llmCurrentProvider.textContent = status.provider_label || "—";
  llmCurrentModel.textContent = status.model || "—";
}

// ─── Search Execution ─────────────────────────────────────────────────────────

async function executeSearch(query) {
  if (state.isSearching) return;
  state.isSearching = true;

  resultsGrid.innerHTML = `
    <div class="loading-container">
      <div class="spinner"></div>
      <p>Running Vector Semantic Retrieval & NLP Pipeline...</p>
    </div>
  `;

  try {
    const payload = {
      query: query || "",
      limit: 18,
      year: state.year !== "all" ? parseInt(state.year) : null,
      category: state.category !== "all" ? state.category : null,
      domain: state.domain !== "all" ? state.domain : null
    };

    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    state.topics = data.topics || [];
    renderResults(state.topics);

    // Show NLP Insight
    if (data.nlp_analysis && query) {
      renderNLPInsight(data.nlp_analysis);
    } else {
      nlpInsightSection.style.display = "none";
    }

    // Show LLM Answer Banner for conversational queries
    if (data.llm_answer && data.llm_answer.answer) {
      renderLlmAnswerBanner(data.llm_answer, data.nlp_analysis);
    } else {
      llmAnswerSection.style.display = "none";
    }

  } catch (err) {
    console.error("Search error:", err);
    resultsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3 class="empty-title">Search Connection Error</h3>
        <p class="empty-desc">Could not connect to the backend server. Please verify the server is running on port 8765.</p>
      </div>
    `;
  } finally {
    state.isSearching = false;
  }
}

// ─── LLM Answer Banner ─────────────────────────────────────────────────────────

function renderLlmAnswerBanner(llmAnswer, nlpAnalysis) {
  llmAnswerSection.style.display = "block";
  llmAnswerBadge.textContent = state.llmStatus.active ? `✨ ${state.llmStatus.provider_label}` : "Rule-Based";
  llmAnswerBadge.className = state.llmStatus.active ? "llm-badge-active" : "badge-cat";

  // Render markdown-like answer (simple bold/bullets)
  llmAnswerContent.innerHTML = markdownToHtml(llmAnswer.answer || "");

  // Suggested searches
  const suggestions = llmAnswer.suggested_searches || [];
  if (suggestions.length > 0) {
    llmSuggestedSearches.style.display = "flex";
    llmSuggestionPills.innerHTML = suggestions.map(s =>
      `<button class="pill" onclick="executeSearchFromSuggestion('${escapeHtml(s)}')">${escapeHtml(s)}</button>`
    ).join("");
  } else {
    llmSuggestedSearches.style.display = "none";
  }
}

function executeSearchFromSuggestion(query) {
  searchInput.value = query;
  state.query = query;
  clearSearchBtn.style.display = "block";
  executeSearch(query);
}

function markdownToHtml(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^<p>|<\/p>$/g, "")
    .replace(/\n/g, "<br>");
}

// ─── Results Rendering ─────────────────────────────────────────────────────────

function renderResults(topics) {
  resultsCount.textContent = topics.length;

  let filterDesc = [];
  if (state.year !== "all") filterDesc.push(`Year: ${state.year}`);
  if (state.category !== "all") filterDesc.push(`Category: ${state.category}`);
  if (state.domain !== "all") filterDesc.push(`Domain: ${state.domain}`);
  activeFilterNote.textContent = filterDesc.length ? `(${filterDesc.join(", ")})` : "";

  if (!topics || topics.length === 0) {
    resultsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3 class="empty-title">No Matching Problem Statements Found</h3>
        <p class="empty-desc">Try using broader keywords or clearing active edition/domain filters.</p>
      </div>
    `;
    return;
  }

  resultsGrid.innerHTML = topics.map(t => {
    const isCompared = state.comparedTopics.some(ct => ct.id === t.id);
    const catClass = t.category.toLowerCase().includes("hard") ? "hardware" : "software";
    const relScore = t.relevance_percentage || 80;

    const tagsHtml = (t.tech_keywords || []).slice(0, 4).map(k => `
      <span class="tech-tag">${escapeHtml(k)}</span>
    `).join("");

    return `
      <div class="topic-card" data-id="${t.id}">
        <div class="card-top">
          <div class="card-badges">
            <div class="badge-group">
              <span class="badge-ps">${escapeHtml(t.id)}</span>
              <span class="badge-year">${t.year}</span>
              <span class="badge-cat ${catClass}">${escapeHtml(t.category)}</span>
            </div>
            <div class="relevance-score-wrap" title="Semantic & Lexical Match Score">
              <span class="rel-pct">${relScore}% Match</span>
            </div>
          </div>

          <h3 class="card-title">${escapeHtml(t.title)}</h3>
          <div class="card-org">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
              <line x1="9" y1="6" x2="15" y2="6"></line><line x1="9" y1="10" x2="15" y2="10"></line>
              <line x1="9" y1="14" x2="15" y2="14"></line>
            </svg>
            <span>${escapeHtml(t.organization)}</span>
          </div>

          <p class="card-desc">${escapeHtml(t.description)}</p>

          ${t.match_reason ? `
            <div class="card-why-matched">
              💡 ${escapeHtml(t.match_reason)}
            </div>
          ` : ""}

          <div class="card-tech-tags">
            ${tagsHtml}
          </div>
        </div>

        <div class="card-actions">
          <button class="btn-card-analyze" onclick="openDetailModal('${t.id}')">
            Strategic Advisory & Pitch Deck ↗
          </button>
          <button class="btn-card-compare ${isCompared ? 'active' : ''}" onclick="toggleCompareById('${t.id}')">
            ${isCompared ? '✓ Added' : '+ Compare'}
          </button>
        </div>
      </div>
    `;
  }).join("");
}

// ─── NLP Insight Bar ──────────────────────────────────────────────────────────

function renderNLPInsight(nlp) {
  nlpInsightSection.style.display = "block";
  nlpSummaryText.textContent = nlp.summary || "Extracted project intent from your prompt.";
  inferredCategoryBadge.textContent = nlp.inferred_category || "Software";
  nlpDomainBadge.textContent = (nlp.suggested_domains && nlp.suggested_domains[0]) || "Smart Innovation";

  nlpEntitiesList.innerHTML = (nlp.entities || []).slice(0, 6).map(e => `
    <span class="chip">${escapeHtml(e)}</span>
  `).join("");

  nlpTechList.innerHTML = (nlp.tech_stack || []).map(t => `
    <span class="chip" style="color: #67e8f9; border-color: rgba(6,182,212,0.3);">${escapeHtml(t)}</span>
  `).join("") || `<span class="chip">General ML/Web</span>`;
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

async function openDetailModal(psId) {
  detailModal.style.display = "flex";
  document.body.style.overflow = "hidden";

  // Reset mentor chat for new topic
  state.mentorHistory = [];
  if (mentorChatWindow) {
    mentorChatWindow.innerHTML = `
      <div class="mentor-msg assistant">
        <div class="mentor-bubble">
          👋 Hi! I'm your SIH AI Mentor. Ask me anything about this problem statement — from technical architecture to jury preparation and 36-hour sprint planning. Use the quick prompts above or type your own question below.
        </div>
      </div>`;
  }

  // Reset tabs to Overview
  document.querySelectorAll(".modal-tabs .m-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
  document.querySelector('.modal-tabs .m-tab[data-tab="tabOverview"]').classList.add("active");
  document.getElementById("tabOverview").classList.add("active");

  // Placeholder state
  modalPsId.textContent = psId;
  modalTitle.textContent = "Loading strategic advisory...";
  modalDesc.textContent = state.llmStatus.active
    ? "Generating LLM-powered advisory with live research papers and Google Patents..."
    : "Querying academic papers and Google Patents prior art...";
  if (modalLlmBadge) modalLlmBadge.style.display = "none";

  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ps_id: psId, prompt: state.query })
    });

    const data = await res.json();
    state.currentModalData = data;
    populateModal(data);
  } catch (err) {
    console.error("Analysis fetch error:", err);
    modalTitle.textContent = "Failed to load detailed analysis.";
  }
}

function populateModal(data) {
  const t = data.topic;
  const adv = data.advisory;
  const papers = data.research_papers || [];
  const patents = data.patents || [];
  const pitch = data.pitch_outline || {};

  modalPsId.textContent = t.id;
  modalYear.textContent = t.year;
  modalCategory.textContent = t.category;
  modalDomain.textContent = t.domain;
  modalTitle.textContent = t.title;
  modalOrg.textContent = t.organization;
  modalDesc.textContent = t.description;

  // LLM Powered badge
  if (modalLlmBadge) {
    if (adv.llm_powered) {
      modalLlmBadge.style.display = "inline-flex";
      modalLlmBadge.textContent = `✨ ${state.llmStatus.provider_label || "LLM"} Powered`;
    } else {
      modalLlmBadge.style.display = "none";
    }
  }

  modalTechTags.innerHTML = (t.tech_keywords || []).map(k => `<span class="chip">${escapeHtml(k)}</span>`).join("");
  modalSourceLink.href = t.source_url || "https://sih.gov.in";

  // Advisory
  advWhyMatched.textContent = adv.why_matched;
  advWinningEdge.textContent = adv.winning_novelty_edge;

  const stack = adv.recommended_tech_stack || {};
  advStackAi.textContent = stack.ai_ml || "—";
  advStackBackend.textContent = stack.backend || "—";
  advStackFrontend.textContent = stack.frontend || "—";
  advStackHardware.textContent = stack.hardware_iot || "—";

  // Roadmap
  advRoadmap.innerHTML = (adv.feasibility_roadmap || []).map(r => `
    <div class="roadmap-step">
      <span class="step-phase">${r.phase}</span>
      <span class="step-desc">${r.milestone}</span>
    </div>
  `).join("");

  // Papers
  papersList.innerHTML = papers.length > 0 ? papers.map(p => {
    const source = p.source || (p.arxiv_url ? "arXiv" : "CrossRef");
    const mainUrl = p.paper_url || p.arxiv_url || p.pdf_url || "";
    const pdfUrl = p.pdf_url || "";
    const doi = p.doi || "";

    return `
    <div class="paper-card">
      <div class="paper-card-top">
        <h4 class="paper-title">${escapeHtml(p.title)}</h4>
        <div style="display:flex;gap:6px;align-items:center;">
          <span class="badge-year">${p.published_date || "N/A"}</span>
          <span class="badge-cat" style="font-size:0.65rem;padding:2px 8px;">${escapeHtml(source)}</span>
        </div>
      </div>
      <p class="paper-authors">Authors: ${escapeHtml((p.authors || []).join(", "))}</p>
      ${doi ? `<p class="paper-doi" style="font-size:0.75rem;color:var(--text-muted);font-family:var(--font-mono);">DOI: ${escapeHtml(doi)}</p>` : ""}
      <p class="paper-abstract">${escapeHtml(p.abstract)}</p>
      <div class="paper-note">
        💡 <strong>SIH Application Takeaway:</strong> ${escapeHtml(p.hackathon_takeaway)}
      </div>
      <div class="paper-links">
        ${mainUrl ? `<a href="${mainUrl}" target="_blank" rel="noopener" class="link-btn">📄 ${source === "arXiv" ? "View on arXiv" : "View Paper"} ↗</a>` : ""}
        ${pdfUrl && pdfUrl !== mainUrl ? `<a href="${pdfUrl}" target="_blank" rel="noopener" class="link-btn">📥 ${source === "arXiv" ? "Download PDF" : "Open via DOI"} ↗</a>` : ""}
      </div>
    </div>
  `}).join("") : `
    <div class="empty-state" style="padding: 2rem;">
      <div class="empty-icon">📚</div>
      <h3 class="empty-title">No Research Papers Found</h3>
      <p class="empty-desc">Academic paper APIs did not return results for this topic. Try a different search term.</p>
    </div>
  `;

  // Patents
  patentsList.innerHTML = patents.length > 0 ? patents.map(pat => `
    <div class="patent-card">
      <div class="patent-card-top">
        <h4 class="patent-title">[${escapeHtml(pat.patent_id)}] ${escapeHtml(pat.title)}</h4>
        <div style="display:flex;gap:6px;align-items:center;">
          <span class="badge-year">${pat.year || "N/A"}</span>
          ${pat.source ? `<span class="badge-cat" style="font-size:0.65rem;padding:2px 8px;">${escapeHtml(pat.source)}</span>` : ""}
        </div>
      </div>
      <p class="patent-assignee">Assignee: ${escapeHtml(pat.assignee)}</p>
      ${pat.inventor ? `<p class="patent-assignee" style="opacity:0.8;">Inventor: ${escapeHtml(pat.inventor)}</p>` : ""}
      <p class="patent-abstract">${escapeHtml(pat.abstract)}</p>
      <div class="patent-novelty">
        🛡️ <strong>IPR Novelty &amp; Workaround Tip:</strong> ${escapeHtml(pat.novelty_advisory)}
      </div>
      <div class="patent-links">
        <a href="${pat.patent_url}" target="_blank" rel="noopener" class="link-btn">🔍 View on Google Patents ↗</a>
        <a href="${pat.google_search_url}" target="_blank" rel="noopener" class="link-btn">🌐 Google Patents Search ↗</a>
      </div>
    </div>
  `).join("") : `
    <div class="empty-state" style="padding: 2rem;">
      <div class="empty-icon">💡</div>
      <h3 class="empty-title">No Patents Retrieved</h3>
      <p class="empty-desc">The Google Patents API did not return results for this query.</p>
    </div>
  `;

  // Pitch Deck Slides
  pitchDeckSlides.innerHTML = Object.keys(pitch).map(k => {
    const s = pitch[k];
    const bullets = (s.bullets || []).map(b => `<li>${escapeHtml(b)}</li>`).join("");
    return `
      <div class="slide-card">
        <h4>${escapeHtml(s.title)}</h4>
        <ul class="slide-bullets">${bullets}</ul>
      </div>
    `;
  }).join("");

  // Update mentor info
  if (mentorLlmInfo) {
    if (state.llmStatus.active) {
      mentorLlmInfo.textContent = `Powered by ${state.llmStatus.provider_label} (${state.llmStatus.model}). Ask anything about this problem statement.`;
    } else {
      mentorLlmInfo.innerHTML = `⚠️ LLM not configured. <button class="btn-text" onclick="openLlmModal()">Set up an API key</button> to enable the AI Mentor.`;
    }
  }

  updateModalCompareButton();
}

function closeModal() {
  detailModal.style.display = "none";
  document.body.style.overflow = "auto";
}

// ─── Copy Pitch Deck ──────────────────────────────────────────────────────────

function copyPitchMarkdown() {
  if (!state.currentModalData || !state.currentModalData.pitch_outline) return;
  const t = state.currentModalData.topic;
  const p = state.currentModalData.pitch_outline;

  let md = `# SIH Presentation Blueprint: ${t.id} - ${t.title}\n\n`;
  for (const k of Object.keys(p)) {
    const s = p[k];
    md += `## ${s.title}\n`;
    for (const b of s.bullets) {
      md += `- ${b}\n`;
    }
    md += `\n`;
  }

  navigator.clipboard.writeText(md).then(() => {
    showToast("📋 Pitch deck outline copied to clipboard!");
  }).catch(() => {
    showToast("Unable to copy to clipboard.");
  });
}

// ─── LLM Settings Modal ────────────────────────────────────────────────────────

function openLlmModal() {
  llmModal.style.display = "flex";
  document.body.style.overflow = "hidden";
  loadLLMStatus().then(() => {
    if (state.llmStatus.provider) {
      selectProvider(state.llmStatus.provider, false);
    }
  });
}

function closeLlmModal() {
  llmModal.style.display = "none";
  document.body.style.overflow = "auto";
  llmTestResult.style.display = "none";
}

function selectProvider(provider, showForm = true) {
  state.selectedProvider = provider;

  // Highlight selected card
  document.querySelectorAll(".llm-provider-card").forEach(c => c.classList.remove("selected"));
  const card = document.getElementById(`provCard-${provider}`);
  if (card) card.classList.add("selected");

  if (!showForm) return;

  const provInfo = (state.llmStatus.all_providers || []).find(p => p.id === provider);
  llmConfigForm.style.display = "block";
  selectedProviderLabel.textContent = provInfo ? provInfo.label : provider;

  // Show/hide API key field
  if (provInfo && !provInfo.needs_key) {
    llmApiKeyRow.style.display = "none";
  } else {
    llmApiKeyRow.style.display = "flex";
    llmApiKeyInput.value = "";
    llmApiKeyInput.placeholder = `Paste your ${provInfo ? provInfo.label : provider} API key...`;
  }

  // Populate model select
  llmModelSelect.innerHTML = "";
  const models = provInfo ? provInfo.models : [];
  models.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    if (m === (provInfo && provInfo.default_model)) opt.selected = true;
    llmModelSelect.appendChild(opt);
  });

  // Pre-select current model if same provider
  if (state.llmStatus.provider === provider && state.llmStatus.model) {
    llmModelSelect.value = state.llmStatus.model;
  }

  llmTestResult.style.display = "none";
}

async function handleLlmTest() {
  if (!state.selectedProvider) return;
  llmTestBtn.disabled = true;
  llmTestBtn.textContent = "Testing...";
  llmTestResult.style.display = "none";

  try {
    const res = await fetch("/api/llm/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: state.selectedProvider,
        api_key: llmApiKeyInput.value.trim(),
        model: llmModelSelect.value
      })
    });
    const data = await res.json();
    llmTestResult.style.display = "block";
    if (data.success) {
      llmTestResult.innerHTML = `✅ <strong>Connected!</strong> Response: "${data.response}" (${data.latency_ms}ms)`;
      llmTestResult.className = "llm-test-result success";
    } else {
      llmTestResult.innerHTML = `❌ <strong>Connection failed:</strong> ${escapeHtml(data.error || "Unknown error")}`;
      llmTestResult.className = "llm-test-result error";
    }
  } catch (err) {
    llmTestResult.style.display = "block";
    llmTestResult.innerHTML = `❌ <strong>Network error:</strong> ${escapeHtml(String(err))}`;
    llmTestResult.className = "llm-test-result error";
  } finally {
    llmTestBtn.disabled = false;
    llmTestBtn.textContent = "🔌 Test Connection";
  }
}

async function handleLlmSave() {
  if (!state.selectedProvider) {
    showToast("Please select a provider first.");
    return;
  }
  llmSaveBtn.disabled = true;
  llmSaveBtn.textContent = "Saving...";

  try {
    const res = await fetch("/api/llm/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: state.selectedProvider,
        api_key: llmApiKeyInput.value.trim(),
        model: llmModelSelect.value
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`✅ LLM configured: ${data.provider} / ${data.model}`);
      await loadLLMStatus();
      closeLlmModal();
    } else {
      showToast(`❌ Config error: ${data.error}`);
    }
  } catch (err) {
    showToast(`❌ Network error: ${err}`);
  } finally {
    llmSaveBtn.disabled = false;
    llmSaveBtn.textContent = "💾 Save & Activate";
  }
}

// ─── AI Mentor Chat ────────────────────────────────────────────────────────────

async function sendMentorMessage() {
  const msg = (mentorInput.value || "").trim();
  if (!msg) return;

  const topic = state.currentModalData && state.currentModalData.topic;
  if (!topic) return;

  // Render user message
  appendMentorMsg("user", msg);
  mentorInput.value = "";

  // Typing indicator
  const typingId = "typing-" + Date.now();
  appendMentorMsg("assistant", "...", typingId, true);

  // Update history
  state.mentorHistory.push({ role: "user", content: msg });

  try {
    const res = await fetch("/api/llm/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ps_id: topic.id,
        message: msg,
        history: state.mentorHistory.slice(-8) // send last 4 turns
      })
    });
    const data = await res.json();

    // Remove typing indicator
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();

    const reply = data.reply || "Sorry, I couldn't generate a response. Please try again.";
    appendMentorMsg("assistant", reply);
    state.mentorHistory.push({ role: "assistant", content: reply });

  } catch (err) {
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();
    appendMentorMsg("assistant", "⚠️ Network error. Check that the server is running.");
  }
}

function appendMentorMsg(role, text, id = null, isTyping = false) {
  const div = document.createElement("div");
  div.className = `mentor-msg ${role}`;
  if (id) div.id = id;

  if (isTyping) {
    div.innerHTML = `<div class="mentor-bubble typing-indicator"><span></span><span></span><span></span></div>`;
  } else {
    div.innerHTML = `<div class="mentor-bubble">${markdownToHtml(escapeHtml(text))}</div>`;
  }

  mentorChatWindow.appendChild(div);
  mentorChatWindow.scrollTop = mentorChatWindow.scrollHeight;
}

// ─── Comparison Logic ──────────────────────────────────────────────────────────

function toggleCompareById(psId) {
  const topic = state.topics.find(t => t.id === psId);
  if (topic) toggleCompare(topic);
}

function toggleCompare(topic) {
  const idx = state.comparedTopics.findIndex(t => t.id === topic.id);
  if (idx >= 0) {
    state.comparedTopics.splice(idx, 1);
  } else {
    if (state.comparedTopics.length >= 3) {
      showToast("You can compare up to 3 problem statements side-by-side.");
      return;
    }
    state.comparedTopics.push(topic);
  }
  updateCompareUI();
}

function updateModalCompareButton() {
  if (!state.currentModalData || !state.currentModalData.topic) return;
  const isCompared = state.comparedTopics.some(ct => ct.id === state.currentModalData.topic.id);
  modalCompareToggleBtn.textContent = isCompared ? "✓ Remove from Comparison" : "+ Add to Comparison";
}

function updateCompareUI() {
  const count = state.comparedTopics.length;
  compareCountBadge.textContent = count;
  drawerCount.textContent = `${count}/3`;

  viewCompareBtn.style.display = count > 0 ? "flex" : "none";
  compareDrawer.style.display = count > 0 ? "block" : "none";

  compareCardsContainer.innerHTML = state.comparedTopics.map(t => `
    <div class="compare-card">
      <button class="compare-remove-btn" onclick="toggleCompareById('${t.id}')">✕</button>
      <h4 class="compare-card-title">${escapeHtml(t.title)}</h4>
      <p class="compare-meta">${t.id} | ${t.year} | ${t.category}</p>
      <p class="compare-meta">Domain: ${escapeHtml(t.domain)}</p>
      <button class="btn-card-analyze" style="width: 100%; margin-top: 8px;" onclick="openDetailModal('${t.id}')">
        Deep Strategy ↗
      </button>
    </div>
  `).join("");

  renderResults(state.topics);
}

// ─── Live SIH Sync ─────────────────────────────────────────────────────────────

async function handleLiveSync() {
  const syncIcon = syncBtn.querySelector(".sync-icon");
  if (syncIcon) syncIcon.style.animation = "spin 1s linear infinite";
  showToast("🔄 Syncing with official SIH portal and repositories...");

  try {
    const res = await fetch("/api/sync", { method: "POST" });
    const data = await res.json();
    showToast(`✅ ${data.message}`);
    loadStats();
    executeSearch(state.query);
  } catch (err) {
    showToast("⚠️ Sync encountered a network timeout.");
  } finally {
    if (syncIcon) syncIcon.style.animation = "none";
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function showToast(msg) {
  const toast = document.getElementById("syncToast");
  const msgElem = document.getElementById("syncToastMsg");
  msgElem.textContent = msg;
  toast.style.display = "flex";
  setTimeout(() => { toast.style.display = "none"; }, 4500);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
