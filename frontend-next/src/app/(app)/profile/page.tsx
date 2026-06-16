"use client";

import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";

interface Profile { id: string; name: string; email: string; tier: string; generations_used: number; generations_limit: number; created_at: string; }

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/profile").then((res) => res.json()).then((data) => { setProfile(data.profile); setName(data.profile?.name || ""); setEmail(data.profile?.email || ""); }).catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true); setMessage("");
    try {
      const res = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email }) });
      if (res.ok) { setMessage("Profile updated successfully"); const data = await res.json(); setProfile(data.profile); }
      else { setMessage("Failed to update profile"); }
    } catch { setMessage("Error updating profile"); }
    setSaving(false);
  };

  const inputClass = "w-full px-3.5 py-2.5 rounded-lg text-sm outline-none glass-input";

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Profile</h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Manage your account settings</p>
      </div>

      <div className="rounded-xl p-6 glass-card">
        {message && <div className="p-3 rounded-lg mb-6 text-sm" style={{ background: message.includes("success") ? "var(--success-soft)" : "var(--error-soft)", color: message.includes("success") ? "var(--success)" : "var(--error)" }}>{message}</div>}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} style={{ color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} style={{ color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Plan</label>
            <div className="px-3.5 py-2.5 rounded-lg border text-sm capitalize" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              {profile?.tier || "free"} &mdash; {((profile?.generations_limit || 0) - (profile?.generations_used || 0))} generations remaining
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Member since</label>
            <div className="px-3.5 py-2.5 rounded-lg border text-sm" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="mt-6 flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50" style={{ background: "var(--accent)", color: "#fff" }} onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "var(--accent-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
