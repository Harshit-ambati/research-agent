import React from 'react';
import { ExternalLink, ShieldCheck, FileCheck } from 'lucide-react';

export default function PatentsTab({ patents = [] }) {
  if (!patents || patents.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400">
        <FileCheck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
        <p>No patent prior-art records found for this topic.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
        Existing patents indexed on <strong>Google Patents</strong>, prior-art analysis, and unencumbered novelty strategies:
      </div>

      <div className="grid grid-cols-1 gap-4">
        {patents.map((patent, idx) => {
          const patent_number = patent.patent_number || patent.patent_id;
          const title = patent.title;
          const assignee = patent.assignee || patent.inventor;
          const year = patent.year;
          const abstract = patent.abstract || patent.snippet;
          const novelty_angle = patent.novelty_angle || patent.novelty_advisory;
          const url = patent.url || patent.patent_url || patent.google_search_url;

          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-dark-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {patent_number || 'PATENT PRIOR ART'}
                    </span>
                    {year && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-dark-800 text-slate-300 border border-slate-700">
                        {year}
                      </span>
                    )}
                  </div>
                  {assignee && (
                    <span className="text-[11px] text-slate-400 truncate max-w-xs font-medium">
                      Assignee: {assignee}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-white mb-2 leading-snug">
                  {title}
                </h4>

                {abstract && (
                  <p className="text-xs text-slate-300 line-clamp-3 mb-3 leading-relaxed">
                    {abstract}
                  </p>
                )}

                {/* Novelty Strategy Tip */}
                {novelty_angle && (
                  <div className="p-3 rounded-xl bg-dark-950 border border-emerald-500/30 mb-3 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider mb-0.5">
                        Novelty / Differentiation Opportunity
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {novelty_angle}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-end">
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300"
                  >
                    <span>Inspect on Google Patents</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
