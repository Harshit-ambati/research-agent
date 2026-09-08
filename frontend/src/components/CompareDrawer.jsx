import React from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, Scale, ExternalLink } from 'lucide-react';

export default function CompareDrawer({
  isOpen,
  onClose,
  compareList,
  onRemove,
  onClearAll,
  onOpenDetail,
}) {
  if (!isOpen || compareList.length === 0) return null;

  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-[80] p-4 sm:p-6 pointer-events-none animate-slide-up">
      <div className="max-w-7xl mx-auto rounded-3xl bg-dark-900/95 border border-cyan-500/30 shadow-2xl backdrop-blur-2xl p-6 pointer-events-auto overflow-hidden">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Side-by-Side Topic Comparison</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {compareList.length} / 3 Selected
                </span>
              </h3>
              <p className="text-xs text-slate-400">Evaluate strategic fit, novelty, and architecture side by side</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Side-by-Side Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-1">
          {compareList.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-2xl bg-dark-950/70 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-dark-900 text-cyan-400 border border-cyan-500/30">
                    {t.id}
                  </span>
                  <button
                    onClick={() => onRemove(t.id)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    title="Remove from comparison"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h4
                  onClick={() => onOpenDetail(t)}
                  className="text-sm font-bold text-white hover:text-cyan-300 cursor-pointer line-clamp-2 mb-1.5"
                >
                  {t.title}
                </h4>
                <p className="text-xs text-slate-400 mb-3 truncate">{t.organization}</p>

                <div className="space-y-2 text-xs border-t border-white/5 pt-3 mb-3">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Domain</span>
                    <span className="text-slate-200 font-medium">{t.domain_bucket || t.domain || 'General'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Category</span>
                    <span className="text-slate-200 font-medium">{t.category || 'Software'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Key Tech</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(t.tech_tags || t.tech_keywords || []).slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] bg-dark-800 text-slate-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOpenDetail(t)}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>View Full Strategy</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
