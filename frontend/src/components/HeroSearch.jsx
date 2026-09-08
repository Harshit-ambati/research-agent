import React from 'react';
import { Search, Sparkles, X, ArrowRight } from 'lucide-react';

export default function HeroSearch({
  query,
  onQueryChange,
  onSearch,
  onClear,
  isLoading,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <section className="relative pt-8 pb-7 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
      {/* Top Badge */}
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/30 text-[11px] font-semibold text-red-200 mb-4">
        <Sparkles className="w-3.5 h-3.5 text-blue-300" />
        <span>SIH research network connected</span>
      </div>

      {/* Main Heading */}
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-normal text-white leading-tight mb-3 max-w-3xl">
        Find the SIH challenge worth building.
      </h1>

      <p className="text-slate-400 text-sm max-w-2xl mb-6 leading-relaxed">
        Search across problem statements, then open an evidence-backed dossier with papers, patents, datasets, and a practical implementation path.
      </p>

      {/* Search Box */}
      <form onSubmit={handleSubmit} className="relative max-w-4xl mb-4">
        <div className="relative flex items-center rounded-lg bg-dark-850 border border-red-950/80 p-2 shadow-lg shadow-black/40 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 transition-all duration-200">
          <div className="pl-3.5 pr-2 text-slate-400">
            <Search className="w-5 h-5 text-blue-300" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Describe a problem, technology, or SIH opportunity..."
            className="w-full bg-transparent text-white placeholder-slate-500 text-sm sm:text-base outline-none pr-3"
            autoComplete="off"
          />

          {query && (
            <button
              type="button"
              onClick={onClear}
              className="p-1.5 mr-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-3 rounded-md bg-red-600 text-white font-bold text-sm shadow-sm shadow-red-950/60 hover:bg-red-500 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            <span>{isLoading ? 'Researching...' : 'Research'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

    </section>
  );
}
