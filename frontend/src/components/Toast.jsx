import React from 'react';
import { createPortal } from 'react-dom';
import { Info, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function Toast({ toast }) {
  if (!toast) return null;

  const { message, type = 'info' } = toast;

  return createPortal(
    <div className="fixed bottom-6 right-6 z-[120] animate-fade-in pointer-events-none">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-dark-900/95 border border-cyan-500/40 text-slate-100 shadow-2xl backdrop-blur-xl pointer-events-auto">
        {type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        ) : type === 'warning' ? (
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
        ) : (
          <Info className="w-5 h-5 text-cyan-400 shrink-0" />
        )}
        <span className="text-xs sm:text-sm font-medium">{message}</span>
      </div>
    </div>,
    document.body
  );
}
