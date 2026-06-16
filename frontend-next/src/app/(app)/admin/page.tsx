"use client";

import { useEffect, useState } from "react";
import { Users, DollarSign, Zap, TrendingUp, Search, Plus, Edit3, Trash2 } from "lucide-react";

interface Stats { totalUsers: number; totalGenerations: number; activeSubscriptions: number; recentGenerations: Array<{ id: string; user_id: string; prompt: string; status: string; created_at: string }>; }
interface Revenue { mrr: number; tierBreakdown: { free: number; pro: number; business: number }; conversionRate: number; }
interface Health { totalGenerations: number; successGenerations: number; errorRate: number; todayGenerations: number; weeklyActiveUsers: number; }
interface UserProfile { id: string; name: string; email: string; tier: string; generations_used: number; generations_limit: number; subscription_status: string; created_at: string; }
interface AIProvider { id: string; name: string; provider: string; base_url: string; model: string; is_active: boolean; priority: number; api_key_encrypted?: string; }

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<{ user: UserProfile; generations: any[] } | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "ai" | "support">("overview");
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [providerForm, setProviderForm] = useState({ name: "", provider: "mimo", api_key: "", base_url: "", model: "", priority: 0 });

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then(r => r.json()),
      fetch("/api/admin/revenue").then(r => r.json()),
      fetch("/api/admin/health").then(r => r.json()),
      fetch("/api/admin/users").then(r => r.json()),
      fetch("/api/ai").then(r => r.json()),
    ]).then(([s, r, h, u, p]) => {
      setStats(s); setRevenue(r); setHealth(h); setUsers(u.users || []); setProviders(p.providers || []);
    }).catch(err => setError(err.message));
  }, []);

  const handleUpdateUser = async (userId: string, data: any) => {
    const res = await fetch(`/api/admin/users/${userId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) { const updated = await res.json(); setUsers(users.map(u => u.id === userId ? { ...u, ...updated.user } : u)); }
  };

  const handleSearch = async () => {
    if (!searchEmail) return;
    const res = await fetch(`/api/admin/support?email=${encodeURIComponent(searchEmail)}`);
    const data = await res.json();
    if (data.error) { setError(data.error); setSearchResult(null); } else { setSearchResult(data); setError(""); }
  };

  const fetchProviders = () => fetch("/api/ai").then(r => r.json()).then(d => setProviders(d.providers || [])).catch(console.error);

  const handleSaveProvider = async () => {
    setError(""); setSuccess("");
    if (!providerForm.name || !providerForm.api_key || !providerForm.model) { setError("Name, API key, and model are required"); return; }
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/ai/${editingId}` : "/api/ai";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(providerForm) });
    if (res.ok) { setSuccess(editingId ? "Provider updated" : "Provider added"); setShowProviderForm(false); setEditingId(null); setProviderForm({ name: "", provider: "mimo", api_key: "", base_url: "", model: "", priority: 0 }); fetchProviders(); }
    else { const d = await res.json(); setError(d.error || "Failed to save provider"); }
  };

  const handleEditProvider = (p: AIProvider) => { setProviderForm({ name: p.name, provider: p.provider, api_key: p.api_key_encrypted || "", base_url: p.base_url || "", model: p.model, priority: p.priority }); setEditingId(p.id); setShowProviderForm(true); };
  const handleDeleteProvider = async (id: string) => { if (!confirm("Delete this provider?")) return; await fetch(`/api/ai/${id}`, { method: "DELETE" }); fetchProviders(); };
  const handleToggleProvider = async (id: string, isActive: boolean) => { await fetch(`/api/ai/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: !isActive }) }); fetchProviders(); };

  const tabs = ["overview", "users", "ai", "support"] as const;
  const statIcons = [Users, DollarSign, Zap, TrendingUp];

  if (error && !success) return (
    <div className="p-8"><div className="rounded-xl border p-4 text-sm" style={{ background: "var(--error-soft)", borderColor: "var(--error)", color: "var(--error)" }}>{error}</div></div>
  );

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Admin Dashboard</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Manage your Fusion AI platform</p>
        </div>
        <div className="flex gap-1.5">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: activeTab === tab ? "var(--accent)" : "var(--bg-surface)", color: activeTab === tab ? "#fff" : "var(--text-secondary)", border: `1px solid ${activeTab === tab ? "var(--accent)" : "var(--border)"}` }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {success && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--success-soft)", color: "var(--success)" }}>{success}</div>}

      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Users", value: stats?.totalUsers || 0, icon: Users },
              { label: "MRR", value: `$${revenue?.mrr || 0}`, icon: DollarSign },
              { label: "Today", value: health?.todayGenerations || 0, icon: Zap },
              { label: "WAU", value: health?.weeklyActiveUsers || 0, icon: TrendingUp },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-5 glass-card">
                <div className="flex items-center gap-2 mb-2"><s.icon size={16} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} /><span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{s.label}</span></div>
                <div className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl p-6 glass-card">
              <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Revenue</h2>
              <div className="space-y-3 text-sm">
                {[
                  { l: "MRR", v: `$${revenue?.mrr || 0}`, c: "var(--text-primary)", b: true },
                  { l: "Free", v: String(revenue?.tierBreakdown?.free || 0), c: "var(--text-secondary)" },
                  { l: "Pro", v: String(revenue?.tierBreakdown?.pro || 0), c: "var(--text-secondary)" },
                  { l: "Business", v: String(revenue?.tierBreakdown?.business || 0), c: "var(--text-secondary)" },
                  { l: "Conversion", v: `${revenue?.conversionRate || 0}%`, c: "var(--success)", b: true },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between"><span style={{ color: "var(--text-secondary)" }}>{r.l}</span><span style={{ color: r.c, fontWeight: r.b ? 600 : 400 }}>{r.v}</span></div>
                ))}
              </div>
            </div>
            <div className="rounded-xl p-6 glass-card">
              <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Health</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span style={{ color: "var(--text-secondary)" }}>Total</span><span style={{ color: "var(--text-primary)" }}>{health?.totalGenerations || 0}</span></div>
                <div className="flex justify-between"><span style={{ color: "var(--text-secondary)" }}>Success Rate</span><span style={{ color: "var(--success)" }}>{health?.totalGenerations ? Math.round((health.successGenerations / health.totalGenerations) * 100) : 100}%</span></div>
                <div className="flex justify-between"><span style={{ color: "var(--text-secondary)" }}>Error Rate</span><span style={{ color: (health?.errorRate || 0) > 10 ? "var(--error)" : "var(--success)" }}>{health?.errorRate || 0}%</span></div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "users" && (
        <div className="rounded-xl overflow-hidden glass-card">
          <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}><h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>User Management</h2></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b" style={{ borderColor: "var(--border)" }}>{["Email", "Name", "Tier", "Usage", "Status", "Actions"].map(h => <th key={h} className="text-left px-6 py-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{h}</th>)}</tr></thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b last:border-0 transition-colors" style={{ borderColor: "var(--border)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <td className="px-6 py-3" style={{ color: "var(--text-primary)" }}>{user.email}</td>
                  <td className="px-6 py-3" style={{ color: "var(--text-secondary)" }}>{user.name || "—"}</td>
                  <td className="px-6 py-3"><select value={user.tier} onChange={(e) => handleUpdateUser(user.id, { tier: e.target.value })} className="rounded-md px-2 py-1 text-xs border outline-none" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}><option value="free">Free</option><option value="pro">Pro</option><option value="business">Business</option></select></td>
                  <td className="px-6 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>{user.generations_used}/{user.generations_limit}</td>
                  <td className="px-6 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: user.subscription_status === "banned" ? "var(--error-soft)" : "var(--success-soft)", color: user.subscription_status === "banned" ? "var(--error)" : "var(--success)" }}>{user.subscription_status || "active"}</span></td>
                  <td className="px-6 py-3"><div className="flex gap-1"><button onClick={() => handleUpdateUser(user.id, { generations_used: 0 })} className="px-2 py-1 text-xs rounded-md" style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}>Reset</button><button onClick={() => handleUpdateUser(user.id, { banned: user.subscription_status !== "banned" })} className="px-2 py-1 text-xs rounded-md" style={{ background: user.subscription_status === "banned" ? "var(--success-soft)" : "var(--error-soft)", color: user.subscription_status === "banned" ? "var(--success)" : "var(--error)" }}>{user.subscription_status === "banned" ? "Unban" : "Ban"}</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "ai" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>AI Providers</h2>
            <button onClick={() => { setShowProviderForm(!showProviderForm); setEditingId(null); setProviderForm({ name: "", provider: "mimo", api_key: "", base_url: "", model: "", priority: 0 }); }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all" style={{ background: "var(--accent)", color: "#fff" }}>
              {showProviderForm ? "Cancel" : <><Plus size={14} /> Add Provider</>}
            </button>
          </div>

          {showProviderForm && (
            <div className="rounded-xl p-6 glass-card">
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{editingId ? "Edit Provider" : "Add New Provider"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Name", key: "name", type: "text", ph: "My MiMo Key" },
                  { label: "API Key", key: "api_key", type: "password", ph: "sk-..." },
                  { label: "Base URL", key: "base_url", type: "text", ph: "https://api.example.com" },
                  { label: "Model", key: "model", type: "text", ph: "mimo-v2.5-pro" },
                  { label: "Priority", key: "priority", type: "number", ph: "" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>{f.label}</label>
                    <input type={f.type} value={(providerForm as any)[f.key]} placeholder={f.ph} onChange={(e) => setProviderForm({ ...providerForm, [f.key]: f.type === "number" ? parseInt(e.target.value) : e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm outline-none glass-input" style={{ color: "var(--text-primary)" }} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Provider</label>
                  <select value={providerForm.provider} onChange={(e) => setProviderForm({ ...providerForm, provider: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm outline-none glass-input" style={{ color: "var(--text-primary)" }}><option value="mimo">MiMo</option><option value="anthropic">Anthropic</option><option value="openai">OpenAI</option></select>
                </div>
              </div>
              <button onClick={handleSaveProvider} className="mt-4 px-5 py-2 rounded-lg text-sm font-medium transition-all" style={{ background: "var(--accent)", color: "#fff" }}>{editingId ? "Update" : "Save"}</button>
            </div>
          )}

          <div className="rounded-xl overflow-hidden glass-card">
            {providers.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>No providers configured. Add one to start generating scripts.</div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b" style={{ borderColor: "var(--border)" }}>{["Name", "Provider", "Model", "Priority", "Status", "Actions"].map(h => <th key={h} className="text-left px-6 py-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {providers.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 transition-colors" style={{ borderColor: "var(--border)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                      <td className="px-6 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{p.name}</td>
                      <td className="px-6 py-3 capitalize" style={{ color: "var(--text-secondary)" }}>{p.provider}</td>
                      <td className="px-6 py-3 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{p.model}</td>
                      <td className="px-6 py-3" style={{ color: "var(--text-secondary)" }}>{p.priority}</td>
                      <td className="px-6 py-3"><button onClick={() => handleToggleProvider(p.id, p.is_active)} className="px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer" style={{ background: p.is_active ? "var(--success-soft)" : "var(--bg-hover)", color: p.is_active ? "var(--success)" : "var(--text-tertiary)" }}>{p.is_active ? "Active" : "Inactive"}</button></td>
                      <td className="px-6 py-3"><div className="flex gap-1"><button onClick={() => handleEditProvider(p)} className="p-1.5 rounded-md transition-colors" style={{ color: "var(--text-tertiary)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}><Edit3 size={13} /></button><button onClick={() => handleDeleteProvider(p.id)} className="p-1.5 rounded-md transition-colors" style={{ color: "var(--error)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--error-soft)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}><Trash2 size={13} /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === "support" && (
        <div className="space-y-6">
          <div className="rounded-xl p-6 glass-card">
            <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>User Lookup</h2>
            <div className="flex gap-3">
              <input type="email" value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} placeholder="Enter user email..." className="flex-1 px-3.5 py-2.5 rounded-lg text-sm outline-none glass-input" style={{ color: "var(--text-primary)" }} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
              <button onClick={handleSearch} className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-all" style={{ background: "var(--accent)", color: "#fff" }}><Search size={14} /> Search</button>
            </div>
          </div>
          {searchResult && (
            <div className="rounded-xl p-6 glass-card">
              <h3 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>User Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[{ l: "Email", v: searchResult.user.email }, { l: "Name", v: searchResult.user.name || "—" }, { l: "Tier", v: searchResult.user.tier }, { l: "Usage", v: `${searchResult.user.generations_used}/${searchResult.user.generations_limit}` }].map((f, i) => (
                  <div key={i}><span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{f.l}</span><div className="text-sm capitalize" style={{ color: "var(--text-primary)" }}>{f.v}</div></div>
                ))}
              </div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Recent Generations</h4>
              <div className="space-y-2">
                {searchResult.generations.map((gen: any) => (
                  <div key={gen.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
                    <span className="text-sm truncate max-w-[300px]" style={{ color: "var(--text-secondary)" }}>{gen.prompt || "—"}</span>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: gen.status === "success" ? "var(--success-soft)" : "var(--error-soft)", color: gen.status === "success" ? "var(--success)" : "var(--error)" }}>{gen.status}</span>
                      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{new Date(gen.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {searchResult.generations.length === 0 && <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No generations found</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
