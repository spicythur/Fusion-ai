"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AIProvider {
  id: string;
  name: string;
  provider: string;
  base_url: string;
  model: string;
  is_active: boolean;
  priority: number;
}

export default function AIProvidersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", provider: "mimo", api_key: "", base_url: "", model: "", priority: 0 });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/ai")
        .then((res) => res.json())
        .then((data) => setProviders(data.providers || []))
        .catch(console.error);
    }
  }, [status]);

  const handleAdd = async () => {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.provider) {
      setProviders([...providers, data.provider]);
      setShowForm(false);
      setForm({ name: "", provider: "mimo", api_key: "", base_url: "", model: "", priority: 0 });
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-subtle)]">
      <div className="max-w-[800px] mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[var(--text)]">AI Providers</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded-full text-sm font-semibold hover:bg-[var(--accent-hover)] transition-all"
          >
            {showForm ? "Cancel" : "+ Add Provider"}
          </button>
        </div>

        {showForm && (
          <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Add New Provider</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg text-sm"
                  placeholder="My MiMo Key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">Provider</label>
                <select
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg text-sm"
                >
                  <option value="mimo">MiMo</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">API Key</label>
                <input
                  type="password"
                  value={form.api_key}
                  onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg text-sm"
                  placeholder="sk-..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">Base URL</label>
                <input
                  type="text"
                  value={form.base_url}
                  onChange={(e) => setForm({ ...form, base_url: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg text-sm"
                  placeholder="https://api.example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">Model</label>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg text-sm"
                  placeholder="mimo-v2.5-pro"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">Priority</label>
                <input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleAdd}
              className="mt-4 px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--accent-hover)] transition-all"
            >
              Save Provider
            </button>
          </div>
        )}

        {/* Providers List */}
        <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Active Providers</h2>
          {providers.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No providers configured yet.</p>
          ) : (
            <div className="space-y-4">
              {providers.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-[var(--bg-subtle)] rounded-lg">
                  <div>
                    <div className="font-medium text-[var(--text)]">{p.name}</div>
                    <div className="text-sm text-[var(--text-muted)]">{p.provider} — {p.model}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.is_active ? "bg-[var(--success-soft)] text-[#059669]" : "bg-[var(--bg-muted)] text-[var(--text-muted)]"
                    }`}>
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">Priority: {p.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
