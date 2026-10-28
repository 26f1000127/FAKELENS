import React, { useState } from 'react';
import { Server, Info, X } from 'lucide-react';
import { isBackendConnected } from '../../services/apiContract';

export const BackendStatusBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || isBackendConnected) {
    return null;
  }

  return (
    <div className="bg-indigo-950/40 border-b border-indigo-500/20 px-4 py-2 text-xs flex items-center justify-between text-indigo-200">
      <div className="flex items-center gap-2 max-w-5xl">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <Server className="w-3.5 h-3.5 text-indigo-300 flex-shrink-0" />
        <span className="font-semibold text-white">Frontend Integration Mode:</span>
        <span className="text-slate-300">
          Showing reference UI and design system specs. Live AI validation and cloud sync are held ready for backend integration via <code className="text-indigo-300 bg-indigo-950/60 px-1 py-0.5 rounded">apiContract.ts</code>.
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-indigo-300 bg-indigo-900/40 px-2 py-0.5 rounded-full border border-indigo-500/20">
          <Info className="w-3 h-3" /> No Fake Live Data
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white transition-colors p-1"
          title="Dismiss notification"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

