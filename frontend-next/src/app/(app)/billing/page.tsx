"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface BillingInfo {
  tier: string;
  status: string;
  subscriptionId: string | null;
  customerId: string | null;
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/billing")
      .then((res) => res.json())
      .then((data) => setBilling(data))
      .catch(console.error);
  }, []);

  const handleUpgrade = async (tier: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;
    setLoading(true);
    try {
      await fetch("/api/billing", { method: "DELETE" });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-white mb-2">Billing</h1>
      <p className="text-[var(--text-secondary)] mb-8">Manage your subscription</p>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Current Plan</h2>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-2xl font-bold text-white capitalize">{billing?.tier || "free"}</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            billing?.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
          }`}>{billing?.status || "inactive"}</span>
        </div>

        {billing?.tier === "free" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 border border-blue-500/30 rounded-xl bg-blue-500/5">
              <h3 className="font-semibold text-white mb-1">Pro — $9/month</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-3">200 generations/month</p>
              <button onClick={() => handleUpgrade("pro")} disabled={loading} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 transition-all">
                Upgrade to Pro
              </button>
            </div>
            <div className="p-4 border border-[var(--border)] rounded-xl">
              <h3 className="font-semibold text-white mb-1">Business — $29/month</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-3">Unlimited generations</p>
              <button onClick={() => handleUpgrade("business")} disabled={loading} className="w-full py-2.5 bg-[var(--bg-elevated)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--border-hover)] disabled:opacity-50 transition-all">
                Upgrade to Business
              </button>
            </div>
          </div>
        )}

        {billing?.tier !== "free" && billing?.subscriptionId && (
          <button onClick={handleCancel} disabled={loading} className="mt-4 px-4 py-2 text-sm text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl hover:bg-red-500/5 disabled:opacity-50 transition-all">
            Cancel Subscription
          </button>
        )}
      </div>
    </div>
  );
}
