import React from 'react';
import { Calendar, Tag, Layers } from 'lucide-react';

export default function FilterToolbar({
  filters,
  onFilterChange,
  resultsCount,
  stats,
}) {
  const editions = Object.keys(stats?.years || {}).sort((a, b) => Number(b) - Number(a));
  const categories = Object.keys(stats?.categories || {}).sort();
  const domains = (stats?.top_domains || []).map(([domain]) => domain).filter(Boolean);
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
      <div className="p-4 rounded-lg bg-dark-900 border border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Edition Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Edition:
            </span>
            {['all', ...editions].map((year) => (
              <button
                key={year}
                onClick={() => onFilterChange({ ...filters, year })}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                  filters.year === year
                    ? 'bg-red-600 text-white border border-red-500 shadow-sm'
                    : 'bg-dark-800 text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-600'
                }`}
              >
                {year === 'all' ? 'All editions' : year}
              </button>
            ))}
          </div>

          <div className="hidden sm:block w-px h-6 bg-slate-800"></div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
              <Tag className="w-3.5 h-3.5 text-purple-400" /> Category:
            </span>
            {['all', ...categories].map((category) => (
              <button
                key={category}
                onClick={() => onFilterChange({ ...filters, category })}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                  filters.category === category
                    ? 'bg-red-600 text-white border border-red-500 shadow-sm'
                    : 'bg-dark-800 text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-600'
                }`}
              >
                {category === 'all' ? 'All categories' : category}
              </button>
            ))}
          </div>

          <div className="hidden sm:block w-px h-6 bg-slate-800"></div>

          {/* Domain Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-400" /> Domain:
            </span>
            <select
              value={filters.domain}
              onChange={(e) => onFilterChange({ ...filters, domain: e.target.value })}
              className="bg-dark-800 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-md border border-slate-700 outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="all">All domains</option>
              {domains.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Results Count & Ranking note */}
        <div className="flex items-center justify-between lg:justify-end gap-3 text-xs text-slate-400 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
          <div>
            Showing <strong className="text-white font-semibold">{resultsCount}</strong> statements
          </div>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="text-[11px] text-cyan-400/80">
            Ranked by Semantic Vector %
          </span>
        </div>
      </div>
    </section>
  );
}
