"use client";

import { useEffect, useState } from "react";

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

  if (error && !success) return <div className="p-8"><div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div></div>;

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1><p className="text-[var(--text-secondary)]">Manage your Fusion AI platform</p></div>
        <div className="flex gap-2">
          {(["overview", "users", "ai", "support"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? "bg-blue-600 text-white" : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)]"}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {success && <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400">{success}</div>}

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[{ label: "Total Users", value: stats?.totalUsers || 0, icon: "👥" }, { label: "MRR", value: `$${revenue?.mrr || 0}`, icon: "💰" }, { label: "Today", value: health?.todayGenerations || 0, icon: "⚡" }, { label: "WAU", value: health?.weeklyActiveUsers || 0, icon: "📈" }].map((s, i) => (
              <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5"><div className="flex items-center gap-2 mb-2"><span className="text-xl">{s.icon}</span><span className="text-xs text-[var(--text-muted)]">{s.label}</span></div><div className="text-2xl font-bold text-white">{s.value}</div></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Revenue</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">MRR</span><span className="text-white font-bold">${revenue?.mrr || 0}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Free</span><span className="text-white">{revenue?.tierBreakdown?.free || 0}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Pro</span><span className="text-white">{revenue?.tierBreakdown?.pro || 0}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Business</span><span className="text-white">{revenue?.tierBreakdown?.business || 0}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Conversion</span><span className="text-emerald-400 font-bold">{revenue?.conversionRate || 0}%</span></div>
              </div>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Health</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Total</span><span className="text-white">{health?.totalGenerations || 0}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Success Rate</span><span className="text-emerald-400">{health?.totalGenerations ? Math.round((health.successGenerations / health.totalGenerations) * 100) : 100}%</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Error Rate</span><span className={`${(health?.errorRate || 0) > 10 ? "text-red-400" : "text-emerald-400"}`}>{health?.errorRate || 0}%</span></div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* USERS TAB */}
      {activeTab === "users" && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)]"><h2 className="text-lg font-semibold text-white">User Management</h2></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[var(--border)]"><th className="text-left px-6 py-3 text-[var(--text-muted)] font-medium">Email</th><th className="text-left px-6 py-3 text-[var(--text-muted)] font-medium">Name</th><th className="text-left px-6 py-3 text-[var(--text-muted)] font-medium">Tier</th><th className="text-left px-6 py-3 text-[var(--text-muted)] font-medium">Usage</th><th className="text-left px-6 py-3 text-[var(--text-muted)] font-medium">Status</th><th className="text-left px-6 py-3 text-[var(--text-muted)] font-medium">Actions</th></tr></thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-elevated)]">
                  <td className="px-6 py-3 text-white">{user.email}</td>
                  <td className="px-6 py-3 text-[var(--text-secondary)]">{user.name || "—"}</td>
                  <td className="px-6 py-3"><select value={user.tier} onChange={(e) => handleUpdateUser(user.id, { tier: e.target.value })} className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs text-white"><option value="free">Free</option><option value="pro">Pro</option><option value="business">Business</option></select></td>
                  <td className="px-6 py-3 text-[var(--text-secondary)]">{user.generations_used}/{user.generations_limit}</td>
                  <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.subscription_status === "banned" ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>{user.subscription_status || "active"}</span></td>
                  <td className="px-6 py-3"><div className="flex gap-1"><button onClick={() => handleUpdateUser(user.id, { generations_used: 0 })} className="px-2 py-1 text-xs bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white rounded-lg transition-all">Reset</button><button onClick={() => handleUpdateUser(user.id, { banned: user.subscription_status !== "banned" })} className={`px-2 py-1 text-xs rounded-lg transition-all ${user.subscription_status === "banned" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{user.subscription_status === "banned" ? "Unban" : "Ban"}</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* AI TAB */}
      {activeTab === "ai" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">AI Providers</h2>
            <button onClick={() => { setShowProviderForm(!showProviderForm); setEditingId(null); setProviderForm({ name: "", provider: "mimo", api_key: "", base_url: "", model: "", priority: 0 }); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-all">
              {showProviderForm ? "Cancel" : "+ Add Provider"}
            </button>
          </div>

          {showProviderForm && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-md font-semibold text-white mb-4">{editingId ? "Edit Provider" : "Add New Provider"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-[var(--text)] mb-1">Name</label><input type="text" value={providerForm.name} onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })} className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white" placeholder="My MiMo Key" /></div>
                <div><label className="block text-sm font-medium text-[var(--text)] mb-1">Provider</label><select value={providerForm.provider} onChange={(e) => setProviderForm({ ...providerForm, provider: e.target.value })} className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white"><option value="mimo">MiMo</option><option value="anthropic">Anthropic</option><option value="openai">OpenAI</option></select></div>
                <div><label className="block text-sm font-medium text-[var(--text)] mb-1">API Key</label><input type="password" value={providerForm.api_key} onChange={(e) => setProviderForm({ ...providerForm, api_key: e.target.value })} className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white" placeholder="sk-..." /></div>
                <div><label className="block text-sm font-medium text-[var(--text)] mb-1">Base URL</label><input type="text" value={providerForm.base_url} onChange={(e) => setProviderForm({ ...providerForm, base_url: e.target.value })} className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white" placeholder="https://api.example.com" /></div>
                <div><label className="block text-sm font-medium text-[var(--text)] mb-1">Model</label><input type="text" value={providerForm.model} onChange={(e) => setProviderForm({ ...providerForm, model: e.target.value })} className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white" placeholder="mimo-v2.5-pro" /></div>
                <div><label className="block text-sm font-medium text-[var(--text)] mb-1">Priority</label><input type="number" value={providerForm.priority} onChange={(e) => setProviderForm({ ...providerForm, priority: parseInt(e.target.value) })} className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white" /></div>
              </div>
              <button onClick={handleSaveProvider} className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-all">{editingId ? "Update" : "Save"}</button>
            </div>
          )}

          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
            {providers.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-muted)]">No providers configured. Add one to start generating scripts.</div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[var(--border)]"><th className="text-left px-6 py-3 text-[var(--text-muted)] font-medium">Name</th><th className="text-left px-6 py-3 text-[var(--text-muted)] font-medium">Provider</th><th className="text-left px-6 py-3 text-[var(--text-muted)] font-medium">Model</th><th className="text-left px-6 py-3 text-[var(--text-muted)] font-medium">Priority</th><th className="text-left px-6 py-3 text-[var(--text-muted)] font-medium">Status</th><th className="text-left px-6 py-3 text-[var(--text-muted)] font-medium">Actions</th></tr></thead>
                <tbody>
                  {providers.map((p) => (
                    <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-elevated)]">
                      <td className="px-6 py-3 text-white font-medium">{p.name}</td>
                      <td className="px-6 py-3 text-[var(--text-secondary)] capitalize">{p.provider}</td>
                      <td className="px-6 py-3 text-[var(--text-secondary)] font-mono text-xs">{p.model}</td>
                      <td className="px-6 py-3 text-[var(--text-secondary)]">{p.priority}</td>
                      <td className="px-6 py-3"><button onClick={() => handleToggleProvider(p.id, p.is_active)} className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer ${p.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"}`}>{p.is_active ? "Active" : "Inactive"}</button></td>
                      <td className="px-6 py-3"><div className="flex gap-1"><button onClick={() => handleEditProvider(p)} className="px-2.5 py-1 text-xs bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white rounded-lg transition-all">Edit</button><button onClick={() => handleDeleteProvider(p.id)} className="px-2.5 py-1 text-xs bg-red-500/10 text-red-400 hover:text-red-300 rounded-lg transition-all">Delete</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* SUPPORT TAB */}
      {activeTab === "support" && (
        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">User Lookup</h2>
            <div className="flex gap-3"><input type="email" value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} placeholder="Enter user email..." className="flex-1 px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all" onKeyDown={(e) => e.key === "Enter" && handleSearch()} /><button onClick={handleSearch} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-all">Search</button></div>
          </div>
          {searchResult && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">User Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div><span className="text-xs text-[var(--text-muted)]">Email</span><div className="text-sm text-white">{searchResult.user.email}</div></div>
                <div><span className="text-xs text-[var(--text-muted)]">Name</span><div className="text-sm text-white">{searchResult.user.name || "—"}</div></div>
                <div><span className="text-xs text-[var(--text-muted)]">Tier</span><div className="text-sm text-white capitalize">{searchResult.user.tier}</div></div>
                <div><span className="text-xs text-[var(--text-muted)]">Usage</span><div className="text-sm text-white">{searchResult.user.generations_used}/{searchResult.user.generations_limit}</div></div>
              </div>
              <h4 className="text-sm font-semibold text-white mb-3">Recent Generations</h4>
              <div className="space-y-2">
                {searchResult.generations.map((gen: any) => (
                  <div key={gen.id} className="flex items-center justify-between p-3 bg-[var(--bg)] rounded-lg"><span className="text-sm text-[var(--text-secondary)] truncate max-w-[300px]">{gen.prompt || "—"}</span><div className="flex items-center gap-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${gen.status === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{gen.status}</span><span className="text-xs text-[var(--text-muted)]">{new Date(gen.created_at).toLocaleDateString()}</span></div></div>
                ))}
                {searchResult.generations.length === 0 && <p className="text-sm text-[var(--text-muted)]">No generations found</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
