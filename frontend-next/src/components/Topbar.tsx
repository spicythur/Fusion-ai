"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function Topbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initial = (session?.user?.name || session?.user?.email || "U")[0].toUpperCase();

  return (
    <header className="h-14 shrink-0 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl flex items-center justify-between px-6">
      <div className="text-sm text-[var(--text-muted)]">
        {session?.user?.name || session?.user?.email || "User"}
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(!open)}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold hover:ring-2 hover:ring-blue-500/30 transition-all"
        >
          {initial}
        </button>

        {open && (
          <div className="absolute right-0 top-12 w-56 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden z-50 animate-[fadeIn_0.15s_ease]">
            <div className="p-3 border-b border-[var(--border)]">
              <div className="text-sm font-medium text-white truncate">{session?.user?.name || "User"}</div>
              <div className="text-xs text-[var(--text-muted)] truncate">{session?.user?.email}</div>
            </div>
            <div className="p-1.5">
              <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] transition-colors">
                <span>👤</span> Profile
              </Link>
              <Link href="/history" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] transition-colors">
                <span>📜</span> History
              </Link>
              <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] transition-colors">
                <span>📊</span> Dashboard
              </Link>
            </div>
            <div className="p-1.5 border-t border-[var(--border)]">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
              >
                <span>🚪</span> Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
