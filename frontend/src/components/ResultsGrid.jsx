import React from 'react';
import TopicCard from './TopicCard';
import { Loader2, SearchX } from 'lucide-react';

export default function ResultsGrid({
  topics,
  isLoading,
  onOpenDetail,
  onToggleCompare,
  compareList,
}) {
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-flex flex-col items-center justify-center p-8 rounded-3xl bg-dark-900/60 border border-slate-800 backdrop-blur-xl">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
          <h3 className="text-base font-bold text-white mb-1">Querying Persistent Vector Database</h3>
          <p className="text-xs text-slate-400">Computing neural semantic embeddings across problem statements...</p>
        </div>
      </div>
    );
  }

  if (!topics || topics.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-flex flex-col items-center justify-center p-10 rounded-3xl bg-dark-900/60 border border-slate-800 backdrop-blur-xl max-w-md">
          <SearchX className="w-12 h-12 text-slate-500 mb-3" />
          <h3 className="text-base font-bold text-white mb-2">No matching problem statements</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Try adjusting your query, removing filters, or selecting one of the suggested prompts above.
          </p>
        </div>
      </div>
    );
  }

  const compareIds = new Set(compareList.map((t) => t.id));

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {topics.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            onOpenDetail={onOpenDetail}
            onToggleCompare={onToggleCompare}
            isCompared={compareIds.has(topic.id)}
          />
        ))}
      </div>
    </section>
  );
}
