import React from 'react';
import { ArrowUpRight, Scale, Check, Building2 } from 'lucide-react';

export default function TopicCard({
  topic,
  onOpenDetail,
  onToggleCompare,
  isCompared,
}) {
  const {
    id,
    title,
    organization,
    category,
    domain_bucket,
    year,
    description = '',
    similarity,
  } = topic;

  const domain = domain_bucket || topic.domain;
  const techTags = topic.tech_tags || topic.tech_keywords || [];
  const matchPct = topic.relevance_percentage ?? (similarity != null ? Math.round(similarity * 100) : null);

  return (
    <div className="glass-panel glass-panel-hover rounded-lg p-5 flex flex-col justify-between relative group">
      {/* Top Meta Bar */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-dark-950 text-cyan-400 border border-cyan-500/30">
              {id}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {year || '2024'}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
              category?.toLowerCase() === 'hardware'
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
            }`}>
              {category || 'Software'}
            </span>
          </div>

          {/* Relevance Bar */}
          {matchPct != null && (
            <div className="flex items-center gap-2" title={`Vector Cosine Match: ${matchPct}%`}>
              <div className="w-16 h-1.5 rounded-full bg-dark-950 overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(10, matchPct))}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-cyan-300 font-mono">
                {matchPct}%
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3
          onClick={() => onOpenDetail(topic)}
          className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors cursor-pointer line-clamp-2 mb-2 leading-snug"
        >
          {title}
        </h3>

        {/* Ministry / Organization */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{organization || 'Government of India'}</span>
        </div>

        {/* Domain Badge */}
        {domain && (
          <div className="mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-dark-950/70 text-slate-300 border border-white/5">
              {domain}
            </span>
          </div>
        )}

        {/* Description Excerpt */}
        <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
          {description}
        </p>

        {/* Tech tags */}
        {techTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {techTags.slice(0, 4).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-[10px] font-medium bg-dark-950 text-slate-300 border border-slate-800"
              >
                {tag}
              </span>
            ))}
            {techTags.length > 4 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-500">
                +{techTags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onToggleCompare(topic)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
            isCompared
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-dark-800/80 hover:bg-dark-750 text-slate-400 hover:text-slate-200 border border-slate-700/60'
          }`}
          title={isCompared ? 'Remove from comparison' : 'Add to side-by-side comparison'}
        >
          {isCompared ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Scale className="w-3.5 h-3.5" />}
          <span>{isCompared ? 'Compared' : 'Compare'}</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenDetail(topic)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-red-600 text-white hover:bg-red-500 transition-all duration-150 cursor-pointer"
        >
          <span>Explore & Advisory</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
