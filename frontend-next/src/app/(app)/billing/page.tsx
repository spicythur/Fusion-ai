"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface BillingInfo { tier: string; status: string; subscriptionId: string | null; customerId: string | null; }

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/billing").then((res) => res.json()).then((data) => setBilling(data)).catch(console.error);
  }, []);

  const handleUpgrade = async (tier: string) => {
    setLoading(true);
    try { const res = await fetch("/api/payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tier }) }); const data = await res.json(); if (data.url) window.location.href = data.url; } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;
    setLoading(true);
    try { await fetch("/api/billing", { method: "DELETE" }); window.location.reload(); } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Billing</h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Manage your subscription</p>
      </div>

      <div className="rounded-xl p-6 mb-6 glass-card">
        <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Current Plan</h2>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl font-semibold capitalize" style={{ color: "var(--text-primary)" }}>{billing?.tier || "free"}</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: billing?.status === "active" ? "var(--success-soft)" : "var(--bg-hover)", color: billing?.status === "active" ? "var(--success)" : "var(--text-tertiary)" }}>{billing?.status || "inactive"}</span>
        </div>

        {billing?.tier === "free" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-xl border" style={{ background: "var(--accent-soft)", borderColor: "var(--accent)" }}>
              <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Pro &mdash; $9/month</h3>
              <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>200 generations/month</p>
              <button onClick={() => handleUpgrade("pro")} disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50" style={{ background: "var(--accent)", color: "#fff" }} onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "var(--accent-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}>
                {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Upgrade to Pro"}
              </button>
            </div>
            <div className="p-4 rounded-xl border" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
              <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Business &mdash; $29/month</h3>
              <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>Unlimited generations</p>
              <button onClick={() => handleUpgrade("business")} disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50" style={{ background: "var(--bg-hover)", color: "var(--text-primary)" }} onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "var(--bg-active)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}>
                {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Upgrade to Business"}
              </button>
            </div>
          </div>
        )}

        {billing?.tier !== "free" && billing?.subscriptionId && (
          <button onClick={handleCancel} disabled={loading} className="mt-4 px-4 py-2 text-sm rounded-lg border transition-all disabled:opacity-50" style={{ color: "var(--error)", borderColor: "var(--error)", background: "var(--error-soft)" }}>
            Cancel Subscription
          </button>
        )}
      </div>
    </div>
  );
}
