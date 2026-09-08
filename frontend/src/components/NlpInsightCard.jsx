import React, { useState } from 'react';
import { Brain, Cpu, Tag, Globe, Layers, Bot, ChevronDown, ChevronUp, CheckCircle2, Workflow } from 'lucide-react';

export default function NlpInsightCard({ nlpData, chainOfThought = [] }) {
  const [showCoT, setShowCoT] = useState(false);

  if (!nlpData && (!chainOfThought || chainOfThought.length === 0)) return null;

  const {
    inferred_domain,
    inferred_category,
    extracted_entities = [],
    detected_tech = [],
    summary,
  } = nlpData || {};

  const hasNlpData = inferred_domain || extracted_entities.length > 0 || detected_tech.length > 0;
  const hasCoT = Array.isArray(chainOfThought) && chainOfThought.length > 0;

  if (!hasNlpData && !hasCoT) {
    return null;
  }

  const getActorMeta = (actor = '') => {
    const a = actor.toLowerCase();
    if (a.includes('nlp') || a.includes('spacy') || a.includes('lexical')) {
      return {
        icon: <Brain className="w-3.5 h-3.5 text-purple-400" />,
        badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        dotColor: 'bg-purple-400'
      };
    }
    if (a.includes('taxonomy')) {
      return {
        icon: <Globe className="w-3.5 h-3.5 text-cyan-400" />,
        badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        dotColor: 'bg-cyan-400'
      };
    }
    if (a.includes('chroma') || a.includes('embed') || a.includes('vector')) {
      return {
        icon: <Layers className="w-3.5 h-3.5 text-blue-400" />,
        badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        dotColor: 'bg-blue-400'
      };
    }
    return {
      icon: <Bot className="w-3.5 h-3.5 text-emerald-400" />,
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      dotColor: 'bg-emerald-400'
    };
  };

  return (
    <div className="max-w-5xl mx-auto mb-6 px-4 space-y-3">
      {/* 1. NLP Understanding Card */}
      {hasNlpData && (
        <div className="rounded-2xl bg-dark-850/70 border border-slate-700/60 p-5 backdrop-blur-lg shadow-xl shadow-purple-500/5">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-sm shadow-purple-500/20">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                  NLP Linguistic Decomposition
                  <span className="text-[10px] font-normal text-purple-400/80 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                    Linguistic Layer
                  </span>
                </h4>
              </div>
            </div>

            {inferred_category && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                {inferred_category}
              </span>
            )}
          </div>

          {/* Intent Summary */}
          {summary && (
            <p className="text-xs text-slate-300 mb-4 italic leading-relaxed bg-dark-900/40 p-2.5 rounded-xl border border-white/5">
              "{summary}"
            </p>
          )}

          {/* Meta row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Domain */}
            <div className="bg-dark-900/60 p-2.5 rounded-xl border border-white/5">
              <span className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                <Globe className="w-3 h-3 text-cyan-400" /> Inferred Domain
              </span>
              <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {inferred_domain || 'General Technology'}
              </span>
            </div>

            {/* Entities */}
            <div className="bg-dark-900/60 p-2.5 rounded-xl border border-white/5">
              <span className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3 text-emerald-400" /> Extracted Entities
              </span>
              <div className="flex flex-wrap gap-1.5">
                {extracted_entities.length > 0 ? (
                  extracted_entities.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[11px] bg-dark-800 text-slate-300 border border-slate-700/60"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">None extracted</span>
                )}
              </div>
            </div>

            {/* Detected Tech */}
            <div className="bg-dark-900/60 p-2.5 rounded-xl border border-white/5">
              <span className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-blue-400" /> Detected Tech
              </span>
              <div className="flex flex-wrap gap-1.5">
                {detected_tech.length > 0 ? (
                  detected_tech.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[11px] bg-blue-500/10 text-blue-300 border border-blue-500/30"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">Auto-inferred</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Collaborative NLP + LLM Chain of Thought Accordion */}
      {hasCoT && (
        <div className="rounded-2xl bg-gradient-to-r from-dark-850 via-dark-900 to-dark-850 border border-cyan-500/30 backdrop-blur-xl shadow-xl shadow-cyan-500/5 overflow-hidden transition-all duration-300">
          {/* Accordion Toggle Header */}
          <button
            onClick={() => setShowCoT(!showCoT)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                <Workflow className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                    Retrieval analysis
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {chainOfThought.length} Reasoning Steps
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Inspect the domain, retrieval, and feasibility signals used for this search
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 bg-dark-800/80 px-2.5 py-1 rounded-lg border border-cyan-500/20">
              <span>{showCoT ? 'Collapse' : 'Inspect Reasoning'}</span>
              {showCoT ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {/* Stepper Content */}
          {showCoT && (
            <div className="px-5 pb-5 pt-2 border-t border-white/5 space-y-3">
              <div className="grid grid-cols-1 gap-3 relative before:absolute before:top-4 before:bottom-4 before:left-[19px] before:w-[2px] before:bg-gradient-to-b before:from-purple-500/40 before:via-cyan-500/40 before:to-emerald-500/40 before:hidden sm:before:block">
                {chainOfThought.map((stepItem, idx) => {
                  const meta = getActorMeta(stepItem.actor);
                  return (
                    <div
                      key={idx}
                      className="relative sm:pl-10 group"
                    >
                      {/* Step Indicator Dot (desktop) */}
                      <div className="hidden sm:flex absolute left-0 top-3 w-10 justify-center">
                        <div className={`w-3.5 h-3.5 rounded-full ${meta.dotColor} border-2 border-dark-900 shadow-md shadow-cyan-500/20 z-10`} />
                      </div>

                      {/* Step Box */}
                      <div className="p-3.5 rounded-xl bg-dark-950/70 border border-slate-800/80 hover:border-cyan-500/30 transition-all duration-200">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 text-slate-300 border border-white/10">
                              Step {stepItem.step || idx + 1}
                            </span>
                            <h5 className="text-xs sm:text-sm font-semibold text-white">
                              {stepItem.stage || `Stage ${idx + 1}`}
                            </h5>
                          </div>

                          {stepItem.actor && (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${meta.badgeClass}`}>
                              {meta.icon}
                              {stepItem.actor}
                            </span>
                          )}
                        </div>

                        {/* Thought content */}
                        <p className="text-xs text-slate-300 leading-relaxed font-normal mb-2">
                          {stepItem.thought}
                        </p>

                        {/* Step Tags */}
                        {stepItem.tags && Array.isArray(stepItem.tags) && stepItem.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/5">
                            {stepItem.tags.map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-2 py-0.5 rounded text-[10px] font-medium bg-dark-800 text-slate-400 border border-slate-700/40"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Collaborative summary footer */}
              <div className="mt-3 p-2.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-between text-[11px] text-cyan-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  NLP linguistic extraction & LLM semantic reasoning verified
                </span>
                <span className="font-mono text-slate-400 text-[10px]">
                  Engine: Dual-Core Synergy
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
