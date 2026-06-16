"use client";

import { useEffect, useState } from "react";

interface AIProvider {
  id: string;
  name: string;
  provider: string;
  base_url: string;
  model: string;
  is_active: boolean;
  priority: number;
  api_key_encrypted?: string;
}

export default function AIProvidersPage() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ name: "", provider: "mimo", api_key: "", base_url: "", model: "", priority: 0 });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = () => {
    fetch("/api/ai")
      .then((res) => res.json())
      .then((data) => setProviders(data.providers || []))
      .catch(console.error);
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!form.name || !form.api_key || !form.model) {
      setError("Name, API key, and model are required");
      return;
    }

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/ai/${editingId}` : "/api/ai";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setSuccess(editingId ? "Provider updated" : "Provider added");
      setShowForm(false);
      setEditingId(null);
      setForm({ name: "", provider: "mimo", api_key: "", base_url: "", model: "", priority: 0 });
      fetchProviders();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to save provider");
    }
  };

  const handleEdit = (p: AIProvider) => {
    setForm({
      name: p.name,
      provider: p.provider,
      api_key: p.api_key_encrypted || "",
      base_url: p.base_url || "",
      model: p.model,
      priority: p.priority,
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this provider?")) return;
    await fetch(`/api/ai/${id}`, { method: "DELETE" });
    fetchProviders();
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await fetch(`/api/ai/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !isActive }),
    });
    fetchProviders();
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Providers</h1>
          <p className="text-[var(--text-secondary)]">Manage API keys for AI generation</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: "", provider: "mimo", api_key: "", base_url: "", model: "", priority: 0 }); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-all">
          {showForm ? "Cancel" : "+ Add Provider"}
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{error}</div>}
      {success && <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400">{success}</div>}

      {showForm && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">{editingId ? "Edit Provider" : "Add New Provider"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white" placeholder="My MiMo Key" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">Provider</label>
              <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white">
                <option value="mimo">MiMo</option>
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">API Key</label>
              <input type="password" value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white" placeholder="sk-..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">Base URL</label>
              <input type="text" value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })} className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white" placeholder="https://api.example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">Model</label>
              <input type="text" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white" placeholder="mimo-v2.5-pro" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">Priority</label>
              <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })} className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white" />
            </div>
          </div>
          <button onClick={handleSave} className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-all">
            {editingId ? "Update Provider" : "Save Provider"}
          </button>
        </div>
      )}

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)]"><h2 className="text-lg font-semibold text-white">Active Providers</h2></div>
        {providers.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)]">No providers configured. Add one to start generating scripts.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left px-6 py-3 text-[var(--text-muted)] font-medium">Name</th>
                <th className="text-left px-6 py-3 text-[var(--text-muted)] font-medium">Provider</th>
                <th className="text-left px-6 py-3 text-[var(--text-muted)] font-medium">Model</th>
                <th className="text-left px-6 py-3 text-[var(--text-muted)] font-medium">Priority</th>
                <th className="text-left px-6 py-3 text-[var(--text-muted)] font-medium">Status</th>
                <th className="text-left px-6 py-3 text-[var(--text-muted)] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-elevated)]">
                  <td className="px-6 py-3 text-white font-medium">{p.name}</td>
                  <td className="px-6 py-3 text-[var(--text-secondary)] capitalize">{p.provider}</td>
                  <td className="px-6 py-3 text-[var(--text-secondary)] font-mono text-xs">{p.model}</td>
                  <td className="px-6 py-3 text-[var(--text-secondary)]">{p.priority}</td>
                  <td className="px-6 py-3">
                    <button onClick={() => handleToggle(p.id, p.is_active)} className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer ${p.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"}`}>
                      {p.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(p)} className="px-2.5 py-1 text-xs bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white rounded-lg transition-all">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="px-2.5 py-1 text-xs bg-red-500/10 text-red-400 hover:text-red-300 rounded-lg transition-all">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
