import React, { useState } from 'react';
import { Bot, X, Sparkles, Workflow, ChevronDown, ChevronUp } from 'lucide-react';
import { renderMarkdown } from '../utils/markdown';

export default function LlmAnswerCard({
  answerData,
  onClose,
  onSelectSuggestion,
}) {
  const [showCoT, setShowCoT] = useState(false);

  if (!answerData) return null;

  const answerText = typeof answerData === 'string' ? answerData : answerData.answer;
  const suggestions = answerData.suggested_searches || [];
  const isLlmActive = answerData.llm_active === true;
  const isFallback = answerData.fallback === true;
  const chain_of_thought = answerData.chain_of_thought || [];

  return (
    <div className="max-w-5xl mx-auto my-6 px-4">
      <div className="relative rounded-2xl bg-gradient-to-b from-dark-850 to-dark-900 border border-cyan-500/30 p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
        {/* Card Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{isFallback ? 'Archive Guidance' : 'AI Mentor Answer'}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                  isLlmActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                }`}>
                  {isLlmActive ? 'Live LLM' : 'Archive matches'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isFallback ? 'Evidence-based guidance from the SIH archive' : 'Conversational guidance for your hackathon journey'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Dismiss answer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chain of Thought Toggle (if available) */}
        {chain_of_thought.length > 0 && (
          <div className="mb-4 rounded-xl bg-dark-950/70 border border-cyan-500/20 overflow-hidden">
            <button
              onClick={() => setShowCoT(!showCoT)}
              className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-cyan-300 hover:bg-white/[0.02] cursor-pointer"
            >
              <span className="flex items-center gap-2 font-medium">
                <Workflow className="w-3.5 h-3.5" />
                Chain of Thought Reasoning ({chain_of_thought.length} steps)
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span>{showCoT ? 'Hide' : 'Show'}</span>
                {showCoT ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </div>
            </button>

            {showCoT && (
              <div className="p-3 border-t border-white/5 space-y-2">
                {chain_of_thought.map((step, sIdx) => (
                  <div key={sIdx} className="p-2.5 rounded-lg bg-dark-900/60 border border-white/5 text-xs">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-white">
                        Step {step.step || sIdx + 1}: {step.stage || 'Reasoning'}
                      </span>
                      {step.actor && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          {step.actor}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 leading-relaxed">{step.thought}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Markdown Content */}
        <div className="text-sm sm:text-base leading-relaxed text-slate-200">
          {renderMarkdown(answerText)}
        </div>

        {/* Suggested Searches */}
        {suggestions.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Suggested searches:
            </span>
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSelectSuggestion(item)}
                className="px-3 py-1 rounded-lg bg-dark-800 hover:bg-cyan-500/20 text-xs font-medium text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition-all duration-150 cursor-pointer"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
