import React from 'react';
import { ExternalLink, Tag, FileText, Info } from 'lucide-react';

export default function OverviewTab({ topic }) {
  const {
    description,
    tech_tags = [],
  } = topic;

  return (
    <div className="space-y-6">
      {/* Description Section */}
      <div className="bg-dark-900/60 p-5 rounded-2xl border border-slate-800">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          Detailed Problem Statement Description
        </h4>
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
          {description || 'No detailed description available.'}
        </p>
      </div>

      {/* Tech Keywords Section */}
      <div className="bg-dark-900/60 p-5 rounded-2xl border border-slate-800">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Tag className="w-4 h-4 text-purple-400" />
          Technology Keywords & Tags
        </h4>
        <div className="flex flex-wrap gap-2">
          {tech_tags && tech_tags.length > 0 ? (
            tech_tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-dark-800 text-cyan-300 border border-slate-700/80"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500">No technology tags specified.</span>
          )}
        </div>
      </div>

      {/* Reference Portal */}
      <div className="bg-dark-900/60 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>Official Smart India Hackathon Submission Archive:</span>
        </div>
        <a
          href="https://sih.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors w-fit"
        >
          <span>sih.gov.in Portal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
