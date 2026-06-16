"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Generation {
  id: string;
  prompt: string;
  status: string;
  code_length: number;
  created_at: string;
}

export default function HistoryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);

  useEffect(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => setGenerations(data.generations || []))
      .catch(console.error);
  }, []);

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Usage History</h1>
          <p className="text-[var(--text-secondary)]">Your recent generations</p>
        </div>
        <Link href="/chat" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-all">
          New Generation →
        </Link>
      </div>

      {generations.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-12 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-white mb-2">No generations yet</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Start creating 3D models with AI</p>
          <Link href="/chat" className="inline-flex px-6 py-3 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-500 transition-all">
            Open Chat →
          </Link>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left px-6 py-4 text-[var(--text-muted)] font-medium">Prompt</th>
                <th className="text-left px-6 py-4 text-[var(--text-muted)] font-medium">Status</th>
                <th className="text-left px-6 py-4 text-[var(--text-muted)] font-medium">Size</th>
                <th className="text-left px-6 py-4 text-[var(--text-muted)] font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {generations.map((gen) => (
                <tr key={gen.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-elevated)] transition-colors">
                  <td className="px-6 py-4 text-white max-w-[300px] truncate">{gen.prompt || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      gen.status === "success" ? "bg-emerald-500/10 text-emerald-400" :
                      gen.status === "error" ? "bg-red-500/10 text-red-400" :
                      "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                    }`}>{gen.status}</span>
                  </td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">{gen.code_length ? `${gen.code_length} chars` : "—"}</td>
                  <td className="px-6 py-4 text-[var(--text-muted)] text-xs">{new Date(gen.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
