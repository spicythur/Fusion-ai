"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

interface Generation { id: string; prompt: string; status: string; code_length: number; created_at: string; }

export default function HistoryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);

  useEffect(() => {
    fetch("/api/history").then((res) => res.json()).then((data) => setGenerations(data.generations || [])).catch(console.error);
  }, []);

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Usage History</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Your recent generations</p>
        </div>
        <Link href="/chat" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all" style={{ background: "var(--accent)", color: "#fff" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}>
          New Generation <ArrowRight size={14} />
        </Link>
      </div>

      {generations.length === 0 ? (
        <div className="rounded-xl p-12 text-center glass-card">
          <FileText size={40} strokeWidth={1} className="mx-auto mb-4" style={{ color: "var(--text-tertiary)" }} />
          <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>No generations yet</h3>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Start creating 3D models with AI</p>
          <Link href="/chat" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-all" style={{ background: "var(--accent)", color: "#fff" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}>
            Open Chat <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden glass-card">
          <table className="w-full text-sm">
            <thead><tr className="border-b" style={{ borderColor: "var(--border)" }}>
              {["Prompt", "Status", "Size", "Time"].map(h => <th key={h} className="text-left px-6 py-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {generations.map((gen) => (
                <tr key={gen.id} className="border-b last:border-0 transition-colors" style={{ borderColor: "var(--border)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <td className="px-6 py-3 max-w-[300px] truncate" style={{ color: "var(--text-primary)" }}>{gen.prompt || "—"}</td>
                  <td className="px-6 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: gen.status === "success" ? "var(--success-soft)" : gen.status === "error" ? "var(--error-soft)" : "var(--bg-hover)", color: gen.status === "success" ? "var(--success)" : gen.status === "error" ? "var(--error)" : "var(--text-tertiary)" }}>{gen.status}</span></td>
                  <td className="px-6 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>{gen.code_length ? `${gen.code_length} chars` : "—"}</td>
                  <td className="px-6 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>{new Date(gen.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
