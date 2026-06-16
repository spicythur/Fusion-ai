"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTheme } from "@/lib/theme";
import {
  ArrowRight, Zap, Shield, Clock, Sun, Moon, Box, Cpu, Code,
  ChevronRight, Sparkles, Globe, Lock, BarChart3, Layers,
} from "lucide-react";

export default function LandingPage() {
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();

  const glassBtn = (accent = false) =>
    `px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${accent ? "" : "glass-card"}`;

  return (
    <div className="min-h-screen relative" style={{ background: "var(--bg-base)" }}>
      <div className="mesh-bg" />
      <div className="mesh-bg-extra" />

      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 w-full z-50 glass" style={{ borderBottom: "1px solid var(--glass-border)" }}>
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between relative z-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: "var(--accent)" }}>F</div>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Fusion AI</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {["Features", "How It Works", "Pricing", "FAQ"].map((t) => (
              <a key={t} href={`#${t.toLowerCase().replace(/ /g, "-")}`} className="text-xs font-medium transition-colors" style={{ color: "var(--text-secondary)" }} onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; }}>{t}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="p-2 rounded-xl glass-card" style={{ color: "var(--text-secondary)" }} aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            {session ? (
              <Link href="/dashboard" className={glassBtn(true)} style={{ background: "var(--accent)", color: "#fff" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}>
                Dashboard <ArrowRight size={12} className="inline ml-1" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-xs font-medium px-4 py-2" style={{ color: "var(--text-secondary)" }}>Sign in</Link>
                <Link href="/register" className={glassBtn(true)} style={{ background: "var(--accent)", color: "#fff" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}>Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="pt-36 pb-24 text-center relative z-10">
        <div className="max-w-3xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card mb-8 text-[11px] font-medium" style={{ color: "var(--accent)" }}>
            <Sparkles size={12} /> AI-Powered CAD Automation
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-[1.1] mb-6" style={{ color: "var(--text-primary)" }}>
            Turn Ideas into<br />
            <span style={{ color: "var(--accent)" }}>Fusion 360 Models</span>
          </h1>
          <p className="text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Describe any 3D model in plain English. Our AI generates production-ready Python scripts and sends them directly to Fusion 360 — no coding required.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href={session ? "/chat" : "/register"} className={glassBtn(true)} style={{ background: "var(--accent)", color: "#fff", padding: "14px 28px", fontSize: "15px" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; e.currentTarget.style.boxShadow = "var(--shadow-glow-strong)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.boxShadow = "none"; }}>
              {session ? "Open Chat" : "Start for Free"} <ArrowRight size={16} className="inline ml-1.5" />
            </Link>
            <a href="#how-it-works" className={glassBtn()} style={{ color: "var(--text-secondary)" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--glass-border)"; }}>
              See How It Works
            </a>
          </div>
          <div className="flex items-center justify-center gap-6 mt-10 text-xs" style={{ color: "var(--text-tertiary)" }}>
            <span className="flex items-center gap-1.5"><Shield size={12} /> No credit card</span>
            <span className="flex items-center gap-1.5"><Clock size={12} /> Setup in 30s</span>
            <span className="flex items-center gap-1.5"><Zap size={12} /> 10 free generations</span>
          </div>
        </div>
      </section>

      {/* ─── TRUSTED BY ─── */}
      <section className="pb-20 relative z-10">
        <p className="text-center text-[11px] font-medium mb-6 uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>Trusted by engineers worldwide</p>
        <div className="flex items-center justify-center gap-8 opacity-40">
          {["Autodesk", "Fusion 360", "CAD Engineers", "Makers", "Startups"].map((t) => (
            <span key={t} className="text-sm font-semibold" style={{ color: "var(--text-tertiary)" }}>{t}</span>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Everything you need</h2>
            <p className="text-sm max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>From natural language to production-ready CAD scripts in seconds.</p>
          </div>
          <div className="grid grid-cols-3 gap-5">
            {[
              { icon: Cpu, title: "AI Generation", desc: "Advanced language models understand your intent and generate optimized Fusion 360 Python scripts." },
              { icon: Box, title: "Fusion 360 Integration", desc: "Scripts execute directly in Fusion 360 via our real-time WebSocket connection. No copy-paste needed." },
              { icon: Code, title: "Code Export", desc: "Download generated scripts as .py files. Edit, version control, and share with your team." },
              { icon: Zap, title: "Instant Results", desc: "Get production-ready scripts in under 10 seconds. No waiting, no queue, just results." },
              { icon: Layers, title: "Version History", desc: "Every generation is saved. Browse, compare, and re-use past scripts from your dashboard." },
              { icon: BarChart3, title: "Usage Analytics", desc: "Track your generation history, success rates, and plan usage from a clean dashboard." },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-2xl glass-card transition-all" onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.borderColor = "var(--border-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.borderColor = "var(--glass-border)"; }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "var(--accent-soft)" }}>
                  <f.icon size={20} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
                </div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-24 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>How it works</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Three steps. Under 30 seconds.</p>
          </div>
          <div className="space-y-6">
            {[
              { step: "01", title: "Describe", desc: "Tell AI what 3D model you want in plain English. \"Create a flanged pipe with 5cm diameter\" — that's all you need.", icon: Sparkles },
              { step: "02", title: "Generate", desc: "AI creates a validated Fusion 360 Python script in seconds. Preview the code, adjust if needed.", icon: Cpu },
              { step: "03", title: "Execute", desc: "Send the script directly to Fusion 360. The model appears in your workspace instantly.", icon: Box },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-6 p-6 rounded-2xl glass-card">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-soft)" }}>
                  <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>{s.step}</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── USE CASES ─── */}
      <section className="py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>What you can create</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>From simple parts to complex assemblies.</p>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Mechanical Parts", desc: "Gears, bolts, brackets, shafts" },
              { label: "Enclosures", desc: "Custom cases, mounts, housings" },
              { label: "Pipes & Fittings", desc: "Flanges, elbows, reducers" },
              { label: "Structural", desc: "Frames, supports, platforms" },
              { label: "Jigs & Fixtures", desc: "Assembly jigs, drill guides" },
              { label: "Prototypes", desc: "Rapid concept models" },
              { label: "Custom Tools", desc: "Specialized hand tools" },
              { label: "Architectural", desc: "Brackets, facades, panels" },
            ].map((u, i) => (
              <div key={i} className="p-4 rounded-xl glass-card text-center transition-all" onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--glass-border)"; }}>
                <div className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{u.label}</div>
                <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{u.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-24 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Simple, transparent pricing</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Start free. Upgrade when you need more.</p>
          </div>
          <div className="grid grid-cols-3 gap-5">
            {[
              { name: "Free", price: "$0", period: "/month", quota: "10 generations", features: ["AI script generation", "Fusion 360 integration", "Download .py files", "Generation history"], popular: false, cta: "Get Started" },
              { name: "Pro", price: "$9", period: "/month", quota: "200 generations", features: ["Everything in Free", "Priority generation queue", "Email support", "Advanced models"], popular: true, cta: "Upgrade to Pro" },
              { name: "Business", price: "$29", period: "/month", quota: "Unlimited", features: ["Everything in Pro", "Team collaboration", "API access", "Admin dashboard", "Priority support"], popular: false, cta: "Contact Sales" },
            ].map((plan, i) => (
              <div key={i} className={`p-6 rounded-2xl glass-card transition-all ${plan.popular ? "animate-glow-pulse" : ""}`} style={{ borderColor: plan.popular ? "var(--accent)" : undefined }}>
                {plan.popular && <div className="text-[10px] font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--accent)" }}>Most Popular</div>}
                <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{plan.name}</h3>
                <div className="mt-3 mb-1">
                  <span className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{plan.price}</span>
                  <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>{plan.period}</span>
                </div>
                <div className="text-xs font-medium mb-5" style={{ color: "var(--accent)" }}>{plan.quota}</div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="text-xs flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                      <Shield size={11} style={{ color: "var(--success)" }} /> {f}
                    </li>
                  ))}
                </ul>
                <Link href={session ? "/dashboard" : "/register"} className="block text-center text-xs font-semibold py-2.5 rounded-xl transition-all" style={{ background: plan.popular ? "var(--accent)" : "var(--bg-hover)", color: plan.popular ? "#fff" : "var(--text-primary)" }} onMouseEnter={(e) => { e.currentTarget.style.background = plan.popular ? "var(--accent-hover)" : "var(--bg-active)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = plan.popular ? "var(--accent)" : "var(--bg-hover)"; }}>
                  {session ? "Upgrade" : plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-24 relative z-10">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Frequently asked</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "Do I need to know Python?", a: "No. Describe your model in plain English and AI handles the code." },
              { q: "How does Fusion 360 integration work?", a: "Install our plugin. Scripts are sent via WebSocket and execute automatically in your Fusion 360 workspace." },
              { q: "Can I edit the generated scripts?", a: "Yes. Download the .py file, edit it, and run it manually or send it back through our tool." },
              { q: "What happens when I hit my limit?", a: "You can upgrade anytime. Your existing scripts and history are always accessible." },
              { q: "Is my data secure?", a: "Yes. All data is encrypted in transit and at rest. We never share your scripts or prompts." },
            ].map((faq, i) => (
              <div key={i} className="p-5 rounded-xl glass-card">
                <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{faq.q}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 relative z-10">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="p-10 rounded-2xl glass-heavy">
            <h2 className="text-2xl font-bold mb-3 relative z-10" style={{ color: "var(--text-primary)" }}>Ready to build faster?</h2>
            <p className="text-sm mb-6 relative z-10" style={{ color: "var(--text-secondary)" }}>Join engineers using AI to automate their Fusion 360 workflow.</p>
            <Link href={session ? "/chat" : "/register"} className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all relative z-10" style={{ background: "var(--accent)", color: "#fff" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; e.currentTarget.style.boxShadow = "var(--shadow-glow-strong)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.boxShadow = "none"; }}>
              {session ? "Open Chat" : "Start Free"} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t py-12 relative z-10" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: "var(--accent)" }}>F</div>
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Fusion AI</span>
            </div>
            <div className="flex items-center gap-6">
              {["Features", "Pricing", "FAQ"].map((t) => (
                <a key={t} href={`#${t.toLowerCase()}`} className="text-xs" style={{ color: "var(--text-tertiary)" }}>{t}</a>
              ))}
            </div>
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>&copy; 2026 Fusion AI</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
