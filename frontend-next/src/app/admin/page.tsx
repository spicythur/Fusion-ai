"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  totalGenerations: number;
  activeSubscriptions: number;
  recentGenerations: Array<{
    id: string;
    user_id: string;
    prompt: string;
    status: string;
    created_at: string;
  }>;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/admin/stats")
        .then((res) => res.json())
        .then((data) => setStats(data))
        .catch(console.error);
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Navbar */}
      <nav className="border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">✦</div>
            <span className="text-lg font-bold text-white">Fusion AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors">Dashboard</Link>
            <Link href="/admin/ai" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors">AI Providers</Link>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {(session.user?.name || session.user?.email || "A")[0].toUpperCase()}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-[var(--text-secondary)]">Overview of your Fusion AI platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: "Total Users", value: stats?.totalUsers || 0, icon: "👥", color: "blue" },
            { label: "Total Generations", value: stats?.totalGenerations || 0, icon: "⚡", color: "purple" },
            { label: "Active Subscriptions", value: stats?.activeSubscriptions || 0, icon: "💳", color: "emerald" },
          ].map((stat, i) => (
            <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--border-hover)] transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  stat.color === "blue" ? "bg-blue-500/10" :
                  stat.color === "purple" ? "bg-purple-500/10" :
                  "bg-emerald-500/10"
                }`}>{stat.icon}</div>
                <span className="text-sm text-[var(--text-secondary)]">{stat.label}</span>
              </div>
              <div className="text-4xl font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Recent Generations */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-white">Recent Generations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-6 py-4 text-[var(--text-muted)] font-medium">ID</th>
                  <th className="text-left px-6 py-4 text-[var(--text-muted)] font-medium">User</th>
                  <th className="text-left px-6 py-4 text-[var(--text-muted)] font-medium">Prompt</th>
                  <th className="text-left px-6 py-4 text-[var(--text-muted)] font-medium">Status</th>
                  <th className="text-left px-6 py-4 text-[var(--text-muted)] font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentGenerations.map((gen) => (
                  <tr key={gen.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-elevated)] transition-colors">
                    <td className="px-6 py-4 text-[var(--text-muted)] font-mono text-xs">{gen.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-[var(--text-muted)] font-mono text-xs">{gen.user_id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-white max-w-[200px] truncate">{gen.prompt || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        gen.status === "success" ? "bg-emerald-500/10 text-emerald-400" :
                        gen.status === "error" ? "bg-red-500/10 text-red-400" :
                        "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                      }`}>
                        {gen.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--text-muted)] text-xs">
                      {new Date(gen.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {(!stats?.recentGenerations || stats.recentGenerations.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-muted)]">No generations yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
