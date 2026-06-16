"use client";

import { useEffect, useState } from "react";

interface Profile {
  id: string;
  name: string;
  email: string;
  tier: string;
  generations_used: number;
  generations_limit: number;
  created_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setProfile(data.profile);
        setName(data.profile?.name || "");
        setEmail(data.profile?.email || "");
      })
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (res.ok) {
        setMessage("Profile updated successfully");
        const data = await res.json();
        setProfile(data.profile);
      } else {
        setMessage("Failed to update profile");
      }
    } catch {
      setMessage("Error updating profile");
    }
    setSaving(false);
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
      <p className="text-[var(--text-secondary)] mb-8">Manage your account settings</p>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8">
        {message && (
          <div className={`p-3 rounded-xl mb-6 text-sm ${message.includes("success") ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
            {message}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">Plan</label>
            <div className="px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-secondary)] capitalize">
              {profile?.tier || "free"} — {((profile?.generations_limit || 0) - (profile?.generations_used || 0))} generations remaining
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">Member since</label>
            <div className="px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-secondary)]">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 transition-all">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
