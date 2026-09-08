import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Lightbulb, BookOpen, Search, Presentation, Bot, Scale, Check } from 'lucide-react';
import OverviewTab from './OverviewTab';
import AdvisoryTab from './AdvisoryTab';
import ResearchTab from './ResearchTab';
import PatentsTab from './PatentsTab';
import PitchDeckTab from './PitchDeckTab';
import MentorChatTab from './MentorChatTab';
import { fetchTopicDetail } from '../../utils/api';

const TABS = [
  { id: 'overview', label: 'Statement Overview', icon: FileText },
  { id: 'advisory', label: 'AI Strategy & Advisory', icon: Lightbulb },
  { id: 'research', label: 'Research Papers', icon: BookOpen },
  { id: 'patents', label: 'Google Patents', icon: Search },
  { id: 'pitch', label: '4-Slide Pitch Deck', icon: Presentation },
  { id: 'mentor', label: 'AI Mentor Chat', icon: Bot },
];

export default function DetailModal({
  topic,
  onClose,
  onToggleCompare,
  isCompared,
  llmStatus,
  onOpenLlmModal,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [fullDetail, setFullDetail] = useState(null);

  useEffect(() => {
    if (!topic?.id) return;
    let isMounted = true;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    fetchTopicDetail(topic.id)
      .then((data) => {
        if (isMounted) {
          setFullDetail(data);
        }
      })
      .catch((err) => {
        console.error('Error fetching detail:', err);
      });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isMounted = false;
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [topic?.id]);

  if (!topic) return null;

  const currentData = fullDetail ? { ...topic, ...fullDetail, ...(fullDetail.topic || {}) } : topic;
  const isLoadingDetail = Boolean(topic?.id && (!fullDetail || fullDetail.id !== topic.id));
  const isLlmPowered = currentData?.advisory?.is_llm_powered ?? currentData?.advisory?.llm_powered ?? false;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-dark-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-white/10 bg-dark-850/70">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-dark-950 text-cyan-400 border border-cyan-500/30">
                  {currentData.id}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  {currentData.year || '2024'}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  {currentData.category || 'Software'}
                </span>
                {currentData.domain_bucket && (
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-dark-800 text-slate-300 border border-slate-700">
                    {currentData.domain_bucket}
                  </span>
                )}
                {isLlmPowered && (
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    ✨ LLM Powered
                  </span>
                )}
                {isLoadingDetail && (
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 animate-pulse">
                    Fetching Deep Insights...
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-black text-white leading-snug mb-1">
                {currentData.title}
              </h2>
              <p className="text-xs sm:text-sm text-cyan-400/90 font-medium">
                {currentData.organization || 'Government of India'}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Tab Navigation */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-5 border-t border-white/5 mt-4 -mb-4 scrollbar-none">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-dark-950/40">
          {activeTab === 'overview' && <OverviewTab topic={currentData} />}
          {activeTab === 'advisory' && (
            <AdvisoryTab
              advisory={currentData.advisory}
              isLlmPowered={isLlmPowered}
            />
          )}
          {activeTab === 'research' && (
            <ResearchTab papers={currentData.research_papers || currentData.papers || []} />
          )}
          {activeTab === 'patents' && (
            <PatentsTab patents={currentData.patents || []} />
          )}
          {activeTab === 'pitch' && (
            <PitchDeckTab
              pitchDeck={currentData.advisory?.pitch_deck || currentData.pitch_deck || currentData.pitch_outline || []}
              topic={currentData}
            />
          )}
          {activeTab === 'mentor' && (
            <MentorChatTab topic={currentData} llmStatus={llmStatus} onOpenLlmModal={onOpenLlmModal} />
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-white/10 bg-dark-850/80 flex items-center justify-between">
          <button
            onClick={() => onToggleCompare(currentData)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              isCompared
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-dark-800 text-slate-300 hover:bg-dark-750 border border-slate-700'
            }`}
          >
            {isCompared ? <Check className="w-4 h-4 text-cyan-400" /> : <Scale className="w-4 h-4" />}
            <span>{isCompared ? 'Added to Comparison' : '+ Add to Comparison'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
