import React from 'react';
import { Clock3, RotateCcw, Trash2 } from 'lucide-react';

export default function RecentSearches({ searches, onSelect, onClear }) {
  if (!searches.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          <Clock3 className="w-3.5 h-3.5" /> Recent in this session
        </span>
        {searches.map((search) => (
          <button
            key={search}
            type="button"
            onClick={() => onSelect(search)}
            className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-slate-700 bg-dark-850 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-red-500/60 hover:text-red-200"
            title={`Run search: ${search}`}
          >
            <RotateCcw className="h-3 w-3 shrink-0" />
            <span className="truncate">{search}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={onClear}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-slate-500 transition-colors hover:text-red-300"
          title="Clear recent searches"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>
    </section>
  );
}
