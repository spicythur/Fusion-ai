"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Quota {
  used: number;
  limit: number;
  tier: string;
  remaining: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [quota, setQuota] = useState<Quota | null>(null);

  useEffect(() => {
    fetch("/api/quota")
      .then((res) => res.json())
      .then((data) => setQuota(data))
      .catch(console.error);
  }, []);

  const usagePercent = quota ? Math.min((quota.used / quota.limit) * 100, 100) : 0;

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-[var(--text-secondary)]">Welcome back, {session?.user?.name || session?.user?.email}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/chat" className="group p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl hover:border-blue-500/40 transition-all hover:-translate-y-0.5">
          <div className="text-3xl mb-3">💬</div>
          <h3 className="text-lg font-semibold text-white mb-1">New Generation</h3>
          <p className="text-sm text-[var(--text-secondary)]">Describe a 3D model and generate script</p>
          <div className="mt-4 text-sm font-medium text-blue-400 group-hover:text-blue-300 transition-colors">Open Chat →</div>
        </Link>

        <Link href="/history" className="group p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl hover:border-[var(--border-hover)] transition-all hover:-translate-y-0.5">
          <div className="text-3xl mb-3">📜</div>
          <h3 className="text-lg font-semibold text-white mb-1">View History</h3>
          <p className="text-sm text-[var(--text-secondary)]">See all your past generations</p>
          <div className="mt-4 text-sm font-medium text-[var(--text-muted)] group-hover:text-white transition-colors">View History →</div>
        </Link>

        <Link href="/profile" className="group p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl hover:border-[var(--border-hover)] transition-all hover:-translate-y-0.5">
          <div className="text-3xl mb-3">👤</div>
          <h3 className="text-lg font-semibold text-white mb-1">Edit Profile</h3>
          <p className="text-sm text-[var(--text-secondary)]">Update your account settings</p>
          <div className="mt-4 text-sm font-medium text-[var(--text-muted)] group-hover:text-white transition-colors">Edit Profile →</div>
        </Link>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Usage This Month</h2>
          {quota ? (
            <>
              <div className="flex items-end gap-3 mb-4">
                <span className="text-4xl font-bold text-white">{quota.used}</span>
                <span className="text-[var(--text-muted)] pb-1">/ {quota.limit}</span>
              </div>
              <div className="w-full bg-[var(--bg-elevated)] rounded-full h-2.5 mb-2">
                <div
                  className="h-2.5 rounded-full transition-all"
                  style={{
                    width: `${usagePercent}%`,
                    background: usagePercent > 80 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #3b82f6, #8b5cf6)'
                  }}
                ></div>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">{quota.remaining} generations remaining</p>
            </>
          ) : (
            <div className="h-20 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Your Plan</h2>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl font-bold text-white capitalize">{quota?.tier || "free"}</span>
            {quota?.tier === "free" && (
              <Link href="/billing" className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-full hover:bg-blue-500/20 transition-colors">
                Upgrade
              </Link>
            )}
          </div>
          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {quota?.tier === "free" ? "10 generations/month" : quota?.tier === "pro" ? "200 generations/month" : "Unlimited generations"}
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              AI-powered script generation
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Fusion 360 integration
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
