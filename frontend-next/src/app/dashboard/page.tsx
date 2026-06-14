"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Quota {
  used: number;
  limit: number;
  tier: string;
  remaining: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quota, setQuota] = useState<Quota | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/quota")
        .then((res) => res.json())
        .then((data) => setQuota(data))
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

  const handleUpgrade = async (tier: string) => {
    const res = await fetch("/api/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };

  const usagePercent = quota ? Math.min((quota.used / quota.limit) * 100, 100) : 0;

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
            <Link href="/chat" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors">Chat</Link>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {(session.user?.name || session.user?.email || "U")[0].toUpperCase()}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-[var(--text-secondary)]">Welcome back, {session.user?.name || session.user?.email}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Usage Card */}
          <div className="md:col-span-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Usage This Month</h2>
              <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-full capitalize">{quota?.tier || "free"}</span>
            </div>
            {quota ? (
              <>
                <div className="flex items-end gap-3 mb-6">
                  <span className="text-5xl font-bold text-white">{quota.used}</span>
                  <span className="text-[var(--text-muted)] pb-2">/ {quota.limit} generations</span>
                </div>
                <div className="w-full bg-[var(--bg-elevated)] rounded-full h-3 mb-3">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${usagePercent}%`,
                      background: usagePercent > 80 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #3b82f6, #8b5cf6)'
                    }}
                  ></div>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">{quota.remaining} generations remaining</p>
              </>
            ) : (
              <div className="h-24 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/profile" className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition-colors mb-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <span className="text-sm font-medium">Profile</span>
              </Link>
              <Link href="/history" className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors mb-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-sm font-medium">History</span>
              </Link>
              <Link href="/chat" className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                <span className="text-sm font-medium">Open Chat</span>
              </Link>
              <Link href="/admin" className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="text-sm font-medium">Admin Panel</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Upgrade Section */}
        {quota?.tier === "free" && (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Upgrade Your Plan</h2>
              <p className="text-[var(--text-secondary)]">Get more generations and premium features</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {/* Pro */}
              <div className="relative p-6 rounded-2xl border border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50 transition-all">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-xs font-semibold text-white">POPULAR</div>
                <h3 className="text-xl font-bold text-white mb-1">Pro</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">$9</span>
                  <span className="text-[var(--text-muted)]">/month</span>
                </div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    200 generations/month
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Priority queue
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Export scripts
                  </li>
                </ul>
                <button
                  onClick={() => handleUpgrade("pro")}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/25"
                >
                  Upgrade to Pro
                </button>
              </div>

              {/* Business */}
              <div className="p-6 rounded-2xl border border-[var(--border)] hover:border-[var(--border-hover)] transition-all">
                <h3 className="text-xl font-bold text-white mb-1">Business</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">$29</span>
                  <span className="text-[var(--text-muted)]">/month</span>
                </div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Unlimited generations
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Team features
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    API access
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Admin dashboard
                  </li>
                </ul>
                <button
                  onClick={() => handleUpgrade("business")}
                  className="w-full py-3 bg-[var(--bg-elevated)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--border-hover)] transition-all"
                >
                  Upgrade to Business
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
