import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HeroSearch from './components/HeroSearch';
import ResearchDossierView from './components/ResearchDossierView';
import LlmAnswerCard from './components/LlmAnswerCard';
import NlpInsightCard from './components/NlpInsightCard';
import FilterToolbar from './components/FilterToolbar';
import ResultsGrid from './components/ResultsGrid';
import DetailModal from './components/DetailModal/DetailModal';
import LlmSettingsModal from './components/LlmSettingsModal';
import CompareDrawer from './components/CompareDrawer';
import Toast from './components/Toast';
import RecentSearches from './components/RecentSearches';
import WeatherCard from './components/WeatherCard';
import { ClickSpark } from './components/reactbits';
import { SpiderSense, SpiderTracer, SpiderWeb } from './components/SpiderIcons';
import {
  fetchStats,
  fetchLLMStatus,
  searchTopics,
  triggerSync,
  runDeepResearch,
  fetchWeather,
} from './utils/api';

const SEARCH_HISTORY_KEY = 'sih-recent-searches';
const SEARCH_HISTORY_LIMIT = 8;
const WEATHER_QUERY_PATTERN = /\b(weather|forecast|temperature|rain|humidity|wind)\b/i;
const CONVERSATIONAL_QUERY_PATTERN = /\b(how|what|why|when|where|suggest|idea|ideas|recommend|capstone|project)\b/i;

function getStoredSearches() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter((item) => typeof item === 'string').slice(0, SEARCH_HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

export default function App() {
  // Global State
  const [query, setQuery] = useState('');
  const [researchData, setResearchData] = useState(null);
  const [viewMode, setViewMode] = useState('browse'); // 'research' | 'browse'
  const [results, setResults] = useState([]);
  const [nlpAnalysis, setNlpAnalysis] = useState(null);
  const [chainOfThought, setChainOfThought] = useState([]);
  const [llmAnswer, setLlmAnswer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [llmStatus, setLlmStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filters State for problem statements browse
  const [filters, setFilters] = useState({
    year: 'all',
    category: 'all',
    domain: 'all',
  });

  // Modals & Drawers
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isLlmModalOpen, setIsLlmModalOpen] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [isCompareDrawerOpen, setIsCompareDrawerOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [recentSearches, setRecentSearches] = useState(getStoredSearches);
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    sessionStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(recentSearches));
  }, [recentSearches]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Deep Research execution
  const performResearch = useCallback(
    async (searchQuery, currentFilters = filters) => {
      const q = searchQuery.trim();
      setIsLoading(true);
      try {
        if (q) {
          const shouldRunDossier = !CONVERSATIONAL_QUERY_PATTERN.test(q);
          const topicsPromise = searchTopics(q, 24, currentFilters).catch(() => ({ results: [] }));
          const researchPromise = shouldRunDossier
            ? runDeepResearch(q).catch((err) => {
              console.warn('Deep research run issue:', err);
              return null;
            })
            : Promise.resolve(null);
          const [resData, topicsData] = await Promise.all([researchPromise, topicsPromise]);

          if (resData) {
            setResearchData(resData);
            setViewMode('research');
            setChainOfThought(resData.chain_of_thought || []);
            setNlpAnalysis(resData.nlp_analysis || null);
          } else {
            setResearchData(null);
            setViewMode('browse');
            setChainOfThought(topicsData.chain_of_thought || []);
            setNlpAnalysis(topicsData.nlp_analysis || null);
          }

          setResults(topicsData.results || topicsData.topics || []);
          setLlmAnswer(topicsData.llm_answer || null);
        } else {
          // Empty query: load browse statements
          const topicsData = await searchTopics('', 24, currentFilters);
          setResults(topicsData.results || topicsData.topics || []);
          setResearchData(null);
          setViewMode('browse');
        }
      } catch (err) {
        console.error('Research error:', err);
        showToast('Research query error: ' + err.message, 'warning');
      } finally {
        setIsLoading(false);
      }
    },
    [filters]
  );

  // Initial Load: Stats, LLM Status, Initial Topics
  useEffect(() => {
    let isMounted = true;

    fetchStats()
      .then((data) => {
        if (isMounted) setStats(data);
      })
      .catch((err) => console.error('Stats error:', err));

    fetchLLMStatus()
      .then((data) => {
        if (isMounted) setLlmStatus(data);
      })
      .catch((err) => console.error('LLM status error:', err));

    searchTopics('', 24, {})
      .then((data) => {
        if (isMounted) {
          setResults(data.results || data.topics || []);
        }
      })
      .catch((err) => console.error('Initial search error:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = (searchQuery) => {
    const normalizedQuery = searchQuery.trim();
    if (normalizedQuery) {
      setRecentSearches((previous) => [
        normalizedQuery,
        ...previous.filter((item) => item.toLowerCase() !== normalizedQuery.toLowerCase()),
      ].slice(0, SEARCH_HISTORY_LIMIT));
    }
    setWeatherData(null);
    if (WEATHER_QUERY_PATTERN.test(normalizedQuery)) {
      setResearchData(null);
      setViewMode('browse');
      setResults([]);
      setLlmAnswer(null);
      setWeatherData({ needs_location: true });
      return;
    }
    performResearch(normalizedQuery, filters);
  };

  const requestWeather = async (payload) => {
    setIsLoading(true);
    try {
      setWeatherData(await fetchWeather(payload));
    } catch (err) {
      showToast(`Weather lookup error: ${err.message}`, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('This browser does not provide location access. Search by city instead.', 'warning');
      return;
    }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => requestWeather({ latitude: coords.latitude, longitude: coords.longitude }),
      () => {
        setIsLoading(false);
        showToast('Location access was not granted. Search by city instead.', 'warning');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleClear = () => {
    setQuery('');
    setLlmAnswer(null);
    setNlpAnalysis(null);
    setChainOfThought([]);
    setResearchData(null);
    setWeatherData(null);
    setViewMode('browse');
    performResearch('', filters);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    performResearch(query, newFilters);
  };

  const handleSelectSuggestion = (suggestedQuery) => {
    setQuery(suggestedQuery);
    performResearch(suggestedQuery, filters);
  };

  // Live Sync
  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    showToast('Syncing latest problem statements from SIH portal...', 'info');
    try {
      const res = await triggerSync();
      showToast(`Sync complete! Added ${res.new_added ?? 0} new statements.`, 'success');
      fetchStats().then(setStats).catch(console.error);
      performResearch(query, filters);
    } catch (err) {
      showToast('Sync failed: ' + err.message, 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  // Compare toggles
  const handleToggleCompare = (topic) => {
    setCompareList((prev) => {
      const exists = prev.some((t) => t.id === topic.id);
      if (exists) {
        return prev.filter((t) => t.id !== topic.id);
      }
      if (prev.length >= 3) {
        showToast('Maximum 3 problem statements can be compared simultaneously.', 'warning');
        return prev;
      }
      showToast(`Added "${topic.id}" to comparison.`, 'success');
      return [...prev, topic];
    });
  };

  const handleRemoveCompare = (id) => {
    setCompareList((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClearCompareAll = () => {
    setCompareList([]);
    setIsCompareDrawerOpen(false);
  };

  return (
    <div className="spider-shell relative min-h-screen text-slate-100 flex flex-col selection:bg-red-500 selection:text-white">
      {/* Electro-Web Click Sparks (React Bits) */}
      <ClickSpark sparkColors={['#00f2fe', '#ef4444', '#38bdf8', '#ff3366', '#ffffff']}>
        {/* Navigation Bar */}
        <Navbar
          stats={stats}
          llmStatus={llmStatus}
          onOpenLlmModal={() => setIsLlmModalOpen(true)}
          onSync={handleSync}
          isSyncing={isSyncing}
          compareCount={compareList.length}
          onOpenCompare={() => setIsCompareDrawerOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 relative z-10">
          {/* Hero Search Section */}
          <HeroSearch
            query={query}
            onQueryChange={setQuery}
            onSearch={handleSearch}
            onClear={handleClear}
            isLoading={isLoading}
          />
          <RecentSearches
            searches={recentSearches}
            onSelect={(search) => {
              setQuery(search);
              handleSearch(search);
            }}
            onClear={() => setRecentSearches([])}
          />

          {weatherData && (
            <WeatherCard
              weather={weatherData}
              isLoading={isLoading}
              onSearchCity={(location) => requestWeather({ location })}
              onUseLocation={handleUseCurrentLocation}
              onClose={() => setWeatherData(null)}
            />
          )}

          {/* Conversational AI Answer Card (if any out-of-domain conversational query) */}
          {llmAnswer && (
            <div className="max-w-4xl mx-auto px-4 mb-4">
              <LlmAnswerCard
                answerData={llmAnswer}
                onClose={() => setLlmAnswer(null)}
                onSelectSuggestion={handleSelectSuggestion}
              />
            </div>
          )}

          {/* View Mode Segmented Controls */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 mb-6">
            <div className="flex items-center justify-between border-b border-red-950/80 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('research')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${viewMode === 'research'
                      ? 'bg-red-600 text-white shadow-sm shadow-red-950/50 border border-red-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-dark-850 border border-transparent'
                    }`}
                >
                  <SpiderSense className="w-4 h-4 text-cyan-300" />
                  <span>360° Deep Research Dossier</span>
                  {researchData && (
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold font-mono">
                      {researchData.total_sources || 0} sources
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setViewMode('browse')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${viewMode === 'browse'
                      ? 'bg-red-600 text-white shadow-sm shadow-red-950/50 border border-red-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-dark-850 border border-transparent'
                    }`}
                >
                  <SpiderTracer className="w-4 h-4 text-cyan-300" />
                  <span>Browse Applied Problems & SIH</span>
                  <span className="px-2 py-0.5 rounded-full bg-dark-950 text-slate-300 text-xs font-bold border border-white/10 font-mono">
                    {results.length}
                  </span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                <SpiderWeb className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Web-linked intelligence active</span>
              </div>
            </div>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="max-w-md mx-auto my-12 p-6 rounded-xl glass-panel border border-red-950/80 text-center space-y-3 backdrop-blur-xl shadow-2xl">
              <div className="w-10 h-10 rounded-full border-2 border-red-500 border-t-transparent animate-spin mx-auto" />
              <h3 className="text-white font-semibold text-sm">Conducting Deep Autonomous Research...</h3>
              <p className="text-xs text-slate-400">
                Querying Wikipedia, CrossRef DOIs, arXiv preprints, Google Patents, Hugging Face datasets & GitHub repositories.
              </p>
            </div>
          )}

          {/* View Mode 1: Full 360° Research Dossier */}
          {!isLoading && viewMode === 'research' && researchData && (
            <ResearchDossierView
              researchData={researchData}
              onOpenProblemStatement={(ps) => setSelectedTopic(ps)}
              onToast={showToast}
            />
          )}

          {/* View Mode 2: Applied Problem Statements Grid */}
          {!isLoading && (viewMode === 'browse' || !researchData) && (
            <>
              {/* Live NLP Prompt Intent Extraction Card & Chain of Thought */}
              {(nlpAnalysis || (chainOfThought && chainOfThought.length > 0)) && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
                  <NlpInsightCard nlpData={nlpAnalysis} chainOfThought={chainOfThought} />
                </div>
              )}

              {/* Filters Toolbar */}
              <FilterToolbar
                filters={filters}
                onFilterChange={handleFilterChange}
                resultsCount={results.length}
                stats={stats}
              />

              {/* Results Grid */}
              <ResultsGrid
                topics={results}
                isLoading={isLoading}
                onOpenDetail={(topic) => setSelectedTopic(topic)}
                onToggleCompare={handleToggleCompare}
                compareList={compareList}
              />
            </>
          )}
        </main>

        {/* Detail Advisory Modal (for Hackathon Problem Statements) */}
        {selectedTopic && (
          <DetailModal
            topic={selectedTopic}
            onClose={() => setSelectedTopic(null)}
            onToggleCompare={handleToggleCompare}
            isCompared={compareList.some((t) => t.id === selectedTopic.id)}
            llmStatus={llmStatus}
            onOpenLlmModal={() => setIsLlmModalOpen(true)}
          />
        )}

        {/* LLM Provider Configuration Modal */}
        <LlmSettingsModal
          isOpen={isLlmModalOpen}
          onClose={() => setIsLlmModalOpen(false)}
          llmStatus={llmStatus}
          onStatusUpdated={(newStatus) => {
            setLlmStatus(newStatus);
            showToast(`LLM updated: ${newStatus.provider || 'Ready'}!`, 'success');
          }}
        />

        {/* Side-by-Side Comparison Drawer */}
        <CompareDrawer
          isOpen={isCompareDrawerOpen}
          onClose={() => setIsCompareDrawerOpen(false)}
          compareList={compareList}
          onRemove={handleRemoveCompare}
          onClearAll={handleClearCompareAll}
          onOpenDetail={(topic) => {
            setIsCompareDrawerOpen(false);
            setSelectedTopic(topic);
          }}
        />

        {/* Toast Notification */}
        <Toast toast={toast} />
      </ClickSpark>
    </div>
  );
}
