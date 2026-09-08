import React from 'react';
import { Bot, RefreshCw, ChevronDown, Scale } from 'lucide-react';
import { ShinyText, Magnet } from './reactbits';
import { SpiderEmblem, SpiderTracer } from './SpiderIcons';

export default function Navbar({
  stats,
  llmStatus,
  onOpenLlmModal,
  onSync,
  isSyncing,
  compareCount,
  onOpenCompare,
}) {
  const getProviderDisplay = () => {
    if (!llmStatus || !llmStatus.active) {
      return {
        label: 'Change / Setup LLM',
        color: 'border-amber-500/40 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 shadow-sm shadow-amber-500/10',
        dot: 'bg-amber-400',
      };
    }
    const nameMap = {
      gemini: 'Gemini 1.5',
      groq: 'Groq Llama 3.3',
      openai: 'OpenAI GPT-4o',
      ollama: 'Local Ollama',
    };
    const lastError = String(llmStatus.last_error || '').toLowerCase();
    if (lastError) {
      return {
        label: lastError.includes('429') ? 'LLM: Rate limited' : 'LLM: Unavailable',
        color: 'border-amber-500/40 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20',
        dot: 'bg-amber-400',
      };
    }
    const provName = nameMap[llmStatus.provider] || (llmStatus.provider ? llmStatus.provider.toUpperCase() : 'Active');
    return {
      label: `LLM: ${provName}`,
      color: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20',
      dot: 'bg-emerald-400',
    };
  };

  const pill = getProviderDisplay();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-700 bg-dark-950/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-950/80 ring-1 ring-red-400/50">
            <SpiderEmblem className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-normal text-white">
                SPIDER <ShinyText text="SEARCH" className="text-red-500 font-extrabold tracking-wider" speed={3.5} />
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                Research network
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Problem statements, evidence, and implementation strategy
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* ChromaDB Status Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-dark-850 border border-slate-700 text-xs text-slate-300">
            <SpiderTracer className="w-3.5 h-3.5 text-cyan-400 shrink-0" glow={false} />
            <span>Archive <strong className="text-white">{stats?.total_statements ?? '...'}</strong> statements</span>
          </div>

          {/* LLM Status Pill */}
          <button
            onClick={onOpenLlmModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-200 cursor-pointer ${pill.color}`}
            title="Configure LLM Provider (Gemini, Groq, OpenAI, Ollama)"
          >
            <span className={`w-2 h-2 rounded-full ${pill.dot}`}></span>
            <Bot className="w-3.5 h-3.5" />
            <span>{pill.label}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {/* Live Sync SIH Data with Magnet Web Pull */}
          <Magnet padding={25} magnetStrength={0.2}>
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-dark-800 hover:bg-dark-750 text-slate-200 border border-slate-700 hover:border-lime-300/50 transition-all duration-200 cursor-pointer disabled:opacity-50"
              title="Sync newly proposed problem statements from SIH portal"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync SIH Data'}</span>
            </button>
          </Magnet>

          {/* Compare Button with Magnet Web Pull */}
          {compareCount > 0 && (
            <Magnet padding={25} magnetStrength={0.25}>
              <button
                onClick={onOpenCompare}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-red-600 text-white shadow-sm shadow-red-950/50 hover:bg-red-500 transition-all duration-200 cursor-pointer animate-fade-in"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Compare</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[11px] font-bold">
                  {compareCount}
                </span>
              </button>
            </Magnet>
          )}
        </div>
      </div>
    </header>
  );
}
