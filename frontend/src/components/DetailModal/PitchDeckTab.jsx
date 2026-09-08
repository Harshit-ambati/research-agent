import React, { useState } from 'react';
import { Copy, Check, Presentation } from 'lucide-react';

export default function PitchDeckTab({ pitchDeck, topic }) {
  const [copied, setCopied] = useState(false);

  const slides = Array.isArray(pitchDeck)
    ? pitchDeck
    : (pitchDeck && typeof pitchDeck === 'object')
      ? Object.values(pitchDeck)
      : [];

  if (!slides || slides.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400">
        <Presentation className="w-10 h-10 text-slate-600 mx-auto mb-2" />
        <p>No pitch deck template generated for this topic.</p>
      </div>
    );
  }

  const handleCopy = () => {
    let md = `# SIH Hackathon 4-Slide Pitch Deck: ${topic?.title || 'Topic'}\n`;
    md += `**Problem Statement ID:** ${topic?.id || '—'} | **Year:** ${topic?.year || '—'}\n\n`;

    slides.forEach((slide, idx) => {
      md += `## Slide ${idx + 1}: ${slide.title || 'Slide'}\n`;
      const pts = slide.points || slide.bullets;
      if (pts && Array.isArray(pts)) {
        pts.forEach((p) => {
          md += `- ${p}\n`;
        });
      }
      md += `\n`;
    });

    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-dark-900/60 border border-slate-800">
        <p className="text-xs text-slate-300">
          Smart India Hackathon Evaluation standard 4-slide presentation structure:
        </p>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-dark-800 hover:bg-dark-750 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer w-fit"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied to Clipboard!' : 'Copy Markdown Pitch'}</span>
        </button>
      </div>

      {/* Slide cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {slides.map((slide, idx) => {
          const pts = slide.points || slide.bullets;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-dark-900/60 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    SLIDE {idx + 1}
                  </span>
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">
                    3-Min Pitch
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mb-3">
                  {slide.title}
                </h4>

                <ul className="space-y-2 text-xs text-slate-300">
                  {pts && Array.isArray(pts) ? (
                    pts.map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span className="leading-relaxed">{pt}</span>
                      </li>
                    ))
                  ) : (
                    <li>{slide.content || 'Content not specified'}</li>
                  )}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
