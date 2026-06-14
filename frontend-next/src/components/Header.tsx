"use client";

import Link from "next/link";

interface HeaderProps {
  wsConnected: boolean;
  fusionConnected: boolean;
  hasMessages: boolean;
  onClear: () => void;
}

export default function Header({ wsConnected, fusionConnected, hasMessages, onClear }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl shrink-0 z-10">
      <Link href="/" className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">✦</div>
        <div>
          <div className="text-[15px] font-bold text-white tracking-tight">Fusion AI</div>
          <div className="text-[10px] text-[var(--text-muted)] -mt-0.5">Script Generator</div>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        {/* Navigation links */}
        <Link href="/history" className="px-3 py-1.5 rounded-full text-xs font-medium text-[var(--text-secondary)] hover:text-white bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all">
          History
        </Link>
        <Link href="/profile" className="px-3 py-1.5 rounded-full text-xs font-medium text-[var(--text-secondary)] hover:text-white bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all">
          Profile
        </Link>

        {hasMessages && (
          <button onClick={onClear} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[var(--text-secondary)] hover:text-white bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all">
            <span>↺</span> New
          </button>
        )}

        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all ${
          wsConnected ? "bg-emerald-500/10 text-emerald-400" : "bg-[var(--bg-card)] text-[var(--text-muted)]"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? "bg-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-[var(--text-muted)]"}`}></span>
          <span>Server</span>
        </div>

        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all ${
          fusionConnected ? "bg-emerald-500/10 text-emerald-400" : "bg-[var(--bg-card)] text-[var(--text-muted)]"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${fusionConnected ? "bg-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-[var(--text-muted)]"}`}></span>
          <span>Fusion 360</span>
        </div>
      </div>
    </header>
  );
}
