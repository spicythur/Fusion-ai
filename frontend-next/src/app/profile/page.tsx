"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          setProfile(data.profile);
          setName(data.profile?.name || "");
          setEmail(data.profile?.email || "");
        })
        .catch(console.error);
    }
  }, [status]);

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

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div></div>;
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <nav className="border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">✦</div>
            <span className="text-lg font-bold text-white">Fusion AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors">Dashboard</Link>
            <Link href="/chat" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors">Chat</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
        <p className="text-[var(--text-secondary)] mb-10">Manage your account settings</p>

        {/* Profile Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 mb-6">
          <h2 className="text-lg font-semibold text-white mb-6">Account Information</h2>
          
          {message && (
            <div className={`p-3 rounded-xl mb-6 text-sm ${message.includes("success") ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
              {message}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
              />
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

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 transition-all"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/history" className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl hover:border-[var(--border-hover)] transition-all">
            <div className="text-lg mb-2">📜</div>
            <div className="text-sm font-semibold text-white">Usage History</div>
            <div className="text-xs text-[var(--text-muted)]">View all generations</div>
          </Link>
          <Link href="/dashboard" className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl hover:border-[var(--border-hover)] transition-all">
            <div className="text-lg mb-2">📊</div>
            <div className="text-sm font-semibold text-white">Dashboard</div>
            <div className="text-xs text-[var(--text-muted)]">Usage & billing</div>
          </Link>
          <Link href="/chat" className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl hover:border-[var(--border-hover)] transition-all">
            <div className="text-lg mb-2">💬</div>
            <div className="text-sm font-semibold text-white">Chat</div>
            <div className="text-xs text-[var(--text-muted)]">Generate scripts</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
