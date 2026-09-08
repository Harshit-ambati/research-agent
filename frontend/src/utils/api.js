/**
 * API client for SIH Topic Discovery & Advisory Agent
 */

const BASE_URL = '';

export async function fetchStats() {
  const res = await fetch(`${BASE_URL}/api/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchLLMStatus() {
  const res = await fetch(`${BASE_URL}/api/llm/status`);
  if (!res.ok) throw new Error('Failed to fetch LLM status');
  return res.json();
}

export async function configureLLM(payload) {
  const res = await fetch(`${BASE_URL}/api/llm/configure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to configure LLM' }));
    throw new Error(err.detail || 'Configuration failed');
  }
  return res.json();
}

export async function testLLM(payload) {
  const res = await fetch(`${BASE_URL}/api/llm/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'LLM test failed' }));
    throw new Error(err.detail || 'Test failed');
  }
  return res.json();
}

export async function searchTopics(query, limit = 20, filters = {}) {
  const res = await fetch(`${BASE_URL}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: query || '',
      limit,
      year: filters.year && filters.year !== 'all' ? filters.year : null,
      category: filters.category && filters.category !== 'all' ? filters.category : null,
      domain: filters.domain && filters.domain !== 'all' ? filters.domain : null,
    }),
  });
  if (!res.ok) throw new Error('Search request failed');
  return res.json();
}

export async function fetchTopicDetail(psId) {
  const res = await fetch(`${BASE_URL}/api/topic/${encodeURIComponent(psId)}`);
  if (!res.ok) throw new Error('Failed to fetch topic details');
  return res.json();
}

export async function chatMentor(psId, message, history = []) {
  const res = await fetch(`${BASE_URL}/api/llm/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ps_id: psId,
      message,
      history,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Chat mentor failed' }));
    throw new Error(err.detail || 'Mentor chat request failed');
  }
  return res.json();
}

export async function triggerSync() {
  const res = await fetch(`${BASE_URL}/api/sync`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger SIH sync');
  return res.json();
}

export async function runDeepResearch(query, maxPapers = 6, maxPatents = 5, maxDatasets = 5) {
  const res = await fetch(`${BASE_URL}/api/research/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: query || '',
      max_papers: maxPapers,
      max_patents: maxPatents,
      max_datasets: maxDatasets,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Research run failed' }));
    throw new Error(err.detail || 'Deep research query failed');
  }
  return res.json();
}

export async function fetchWeather(payload = {}) {
  const res = await fetch(`${BASE_URL}/api/weather`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Weather lookup failed' }));
    throw new Error(err.detail || 'Weather lookup failed');
  }
  return res.json();
}

export async function chatResearchAgent(researchContext, message, history = []) {
  const res = await fetch(`${BASE_URL}/api/research/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      research_context: researchContext,
      history,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Chat research agent failed' }));
    throw new Error(err.detail || 'Research chat failed');
  }
  return res.json();
}

export async function exportResearchReport(researchData) {
  const res = await fetch(`${BASE_URL}/api/research/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(researchData),
  });
  if (!res.ok) throw new Error('Failed to export research report');
  return res.json();
}
