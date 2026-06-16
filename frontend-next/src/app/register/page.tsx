"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (signUpError) { setError(signUpError.message); setLoading(false); }
    else { router.push("/login?registered=true"); }
  };

  const inputClass = "w-full px-3.5 py-2.5 rounded-lg text-sm outline-none glass-input";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: "var(--bg-base)" }}>
      <div className="mesh-bg" />
      <div className="mesh-bg-extra" />
      <div className="w-full max-w-[380px] relative z-10">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm mx-auto mb-4" style={{ background: "var(--accent)" }}>F</div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Create account</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Start generating scripts with AI</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-lg text-sm" style={{ background: "var(--error-soft)", color: "var(--error)" }}>{error}</div>}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Name</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className={inputClass} style={{ color: "var(--text-primary)" }} />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={inputClass} style={{ color: "var(--text-primary)" }} />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className={inputClass} style={{ color: "var(--text-primary)" }} />
            <p className="text-[11px] mt-1" style={{ color: "var(--text-tertiary)" }}>Minimum 8 characters</p>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#fff" }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "var(--accent-hover)"; e.currentTarget.style.boxShadow = "var(--shadow-glow)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link href="/login" className="font-medium" style={{ color: "var(--accent)" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
