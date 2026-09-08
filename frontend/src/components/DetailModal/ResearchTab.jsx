import React from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';

export default function ResearchTab({ papers = [] }) {
  if (!papers || papers.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400">
        <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
        <p>No research papers found for this topic.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200">
        Peer-reviewed academic publications from <strong>CrossRef</strong> (DOI-indexed journals) and <strong>arXiv</strong> relevant to this problem statement:
      </div>

      <div className="grid grid-cols-1 gap-4">
        {papers.map((paper, idx) => {
          const title = paper.title;
          const authors = paper.authors || [];
          const journal = paper.journal || paper.category;
          const year = paper.year || paper.published_date;
          const doi = paper.doi;
          const url = paper.url || paper.paper_url || paper.pdf_url || paper.arxiv_url;
          const abstract = paper.abstract;
          const source = paper.source;

          const authorsStr = Array.isArray(authors) ? authors.join(', ') : (authors || 'Academic Researchers');

          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-dark-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      {source || 'CrossRef / arXiv'}
                    </span>
                    {year && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-dark-800 text-slate-300 border border-slate-700">
                        {year}
                      </span>
                    )}
                  </div>
                  {journal && (
                    <span className="text-[11px] text-slate-400 italic truncate max-w-xs">
                      {journal}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-white mb-2 leading-snug">
                  {title}
                </h4>

                <p className="text-xs text-cyan-400/80 mb-2 truncate">
                  By {authorsStr}
                </p>

                {abstract && (
                  <p className="text-xs text-slate-300 line-clamp-3 mb-4 leading-relaxed">
                    {abstract}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                {doi && (
                  <span className="text-[11px] font-mono text-slate-500 truncate">
                    DOI: {doi}
                  </span>
                )}
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 ml-auto"
                  >
                    <span>View Academic Publication</span>
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
