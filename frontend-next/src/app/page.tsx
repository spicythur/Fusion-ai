"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTheme } from "@/lib/theme";
import { motion } from "framer-motion";
import {
  fadeInUp, staggerContainer, staggerSlow, hoverLift, viewportOnce,
  spring, smooth, scaleIn,
} from "@/lib/animations";
import {
  ArrowRight, Zap, Shield, Clock, Sun, Moon, Box, Cpu, Code,
  Sparkles, BarChart3, Layers,
} from "lucide-react";

const MotionDiv = motion.div;

export default function LandingPage() {
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen relative" style={{ background: "var(--bg-base)" }}>
      <div className="mesh-bg" />
      <div className="mesh-bg-extra" />

      {/* ─── NAVBAR ─── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed top-0 w-full z-50 glass"
        style={{ borderBottom: "1px solid var(--glass-border)" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between relative z-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: "var(--accent)" }}>F</div>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Fusion AI</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {["Features", "How It Works", "Pricing", "FAQ"].map((t, i) => (
              <motion.a
                key={t}
                href={`#${t.toLowerCase().replace(/ /g, "-")}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
                className="text-xs font-medium transition-colors"
                style={{ color: "var(--text-secondary)" }}
                whileHover={{ color: "var(--text-primary)" }}
              >{t}</motion.a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <motion.button onClick={toggle} className="p-2 rounded-xl glass-card" style={{ color: "var(--text-secondary)" }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </motion.button>
            {session ? (
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/dashboard" className="px-5 py-2.5 rounded-xl text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>
                  Dashboard <ArrowRight size={12} className="inline ml-1" />
                </Link>
              </motion.div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-xs font-medium px-4 py-2" style={{ color: "var(--text-secondary)" }}>Sign in</Link>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link href="/register" className="px-5 py-2.5 rounded-xl text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>Get Started</Link>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </motion.nav>

      {/* ─── HERO ─── */}
      <section className="pt-36 pb-24 text-center relative z-10">
        <MotionDiv variants={staggerSlow} initial="hidden" animate="visible" className="max-w-3xl mx-auto px-6">
          <MotionDiv variants={fadeInUp} transition={smooth}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card mb-8 text-[11px] font-medium" style={{ color: "var(--accent)" }}>
              <Sparkles size={12} /> AI-Powered CAD Automation
            </div>
          </MotionDiv>

          <MotionDiv variants={fadeInUp} transition={smooth}>
            <h1 className="text-5xl md:text-6xl font-bold leading-[1.1] mb-6" style={{ color: "var(--text-primary)" }}>
              Turn Ideas into<br />
              <span style={{ color: "var(--accent)" }}>Fusion 360 Models</span>
            </h1>
          </MotionDiv>

          <MotionDiv variants={fadeInUp} transition={smooth}>
            <p className="text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Describe any 3D model in plain English. Our AI generates production-ready Python scripts and sends them directly to Fusion 360 — no coding required.
            </p>
          </MotionDiv>

          <MotionDiv variants={fadeInUp} transition={smooth} className="flex items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.04, boxShadow: "var(--shadow-glow-strong)" }} whileTap={{ scale: 0.97 }}>
              <Link href={session ? "/chat" : "/register"} className="px-7 py-3.5 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5" style={{ background: "var(--accent)", color: "#fff" }}>
                {session ? "Open Chat" : "Start for Free"} <ArrowRight size={16} />
              </Link>
            </motion.div>
            <motion.a href="#how-it-works" className="px-5 py-2.5 rounded-xl text-sm font-medium glass-card" style={{ color: "var(--text-secondary)" }} whileHover={{ borderColor: "var(--border-hover)", y: -2 }} whileTap={{ scale: 0.97 }}>
              See How It Works
            </motion.a>
          </MotionDiv>

          <MotionDiv variants={fadeInUp} transition={smooth} className="flex items-center justify-center gap-6 mt-10 text-xs" style={{ color: "var(--text-tertiary)" }}>
            <span className="flex items-center gap-1.5"><Shield size={12} /> No credit card</span>
            <span className="flex items-center gap-1.5"><Clock size={12} /> Setup in 30s</span>
            <span className="flex items-center gap-1.5"><Zap size={12} /> 10 free generations</span>
          </MotionDiv>
        </MotionDiv>
      </section>

      {/* ─── TRUSTED BY ─── */}
      <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.6 }} className="pb-20 relative z-10">
        <p className="text-center text-[11px] font-medium mb-6 uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>Trusted by engineers worldwide</p>
        <div className="flex items-center justify-center gap-8 opacity-40">
          {["Autodesk", "Fusion 360", "CAD Engineers", "Makers", "Startups"].map((t, i) => (
            <motion.span key={t} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 + i * 0.1 }} className="text-sm font-semibold" style={{ color: "var(--text-tertiary)" }}>{t}</motion.span>
          ))}
        </div>
      </MotionDiv>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <MotionDiv initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer} className="text-center mb-16">
            <MotionDiv variants={fadeInUp} transition={smooth}>
              <h2 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Everything you need</h2>
            </MotionDiv>
            <MotionDiv variants={fadeInUp} transition={smooth}>
              <p className="text-sm max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>From natural language to production-ready CAD scripts in seconds.</p>
            </MotionDiv>
          </MotionDiv>

          <MotionDiv initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer} className="grid grid-cols-3 gap-5">
            {[
              { icon: Cpu, title: "AI Generation", desc: "Advanced language models understand your intent and generate optimized Fusion 360 Python scripts." },
              { icon: Box, title: "Fusion 360 Integration", desc: "Scripts execute directly in Fusion 360 via our real-time WebSocket connection. No copy-paste needed." },
              { icon: Code, title: "Code Export", desc: "Download generated scripts as .py files. Edit, version control, and share with your team." },
              { icon: Zap, title: "Instant Results", desc: "Get production-ready scripts in under 10 seconds. No waiting, no queue, just results." },
              { icon: Layers, title: "Version History", desc: "Every generation is saved. Browse, compare, and re-use past scripts from your dashboard." },
              { icon: BarChart3, title: "Usage Analytics", desc: "Track your generation history, success rates, and plan usage from a clean dashboard." },
            ].map((f, i) => (
              <MotionDiv key={i} variants={fadeInUp} transition={smooth} {...hoverLift} className="p-6 rounded-2xl glass-card cursor-default">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "var(--accent-soft)" }}>
                  <f.icon size={20} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
                </div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
              </MotionDiv>
            ))}
          </MotionDiv>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-24 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <MotionDiv initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer} className="text-center mb-16">
            <MotionDiv variants={fadeInUp} transition={smooth}>
              <h2 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>How it works</h2>
            </MotionDiv>
            <MotionDiv variants={fadeInUp} transition={smooth}>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Three steps. Under 30 seconds.</p>
            </MotionDiv>
          </MotionDiv>

          <MotionDiv initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerSlow} className="space-y-6">
            {[
              { step: "01", title: "Describe", desc: "Tell AI what 3D model you want in plain English. \"Create a flanged pipe with 5cm diameter\" — that's all you need.", icon: Sparkles },
              { step: "02", title: "Generate", desc: "AI creates a validated Fusion 360 Python script in seconds. Preview the code, adjust if needed.", icon: Cpu },
              { step: "03", title: "Execute", desc: "Send the script directly to Fusion 360. The model appears in your workspace instantly.", icon: Box },
            ].map((s, i) => (
              <MotionDiv key={i} variants={fadeInUp} transition={smooth} {...hoverLift} className="flex items-start gap-6 p-6 rounded-2xl glass-card cursor-default">
                <motion.div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--accent-soft)" }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={spring}
                >
                  <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>{s.step}</span>
                </motion.div>
                <div>
                  <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{s.desc}</p>
                </div>
              </MotionDiv>
            ))}
          </MotionDiv>
        </div>
      </section>

      {/* ─── USE CASES ─── */}
      <section className="py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <MotionDiv initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer} className="text-center mb-16">
            <MotionDiv variants={fadeInUp} transition={smooth}>
              <h2 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>What you can create</h2>
            </MotionDiv>
            <MotionDiv variants={fadeInUp} transition={smooth}>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>From simple parts to complex assemblies.</p>
            </MotionDiv>
          </MotionDiv>

          <MotionDiv initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer} className="grid grid-cols-4 gap-4">
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
              <MotionDiv key={i} variants={fadeInUp} transition={smooth} {...hoverLift} className="p-4 rounded-xl glass-card text-center cursor-default">
                <div className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{u.label}</div>
                <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{u.desc}</div>
              </MotionDiv>
            ))}
          </MotionDiv>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-24 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <MotionDiv initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer} className="text-center mb-16">
            <MotionDiv variants={fadeInUp} transition={smooth}>
              <h2 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Simple, transparent pricing</h2>
            </MotionDiv>
            <MotionDiv variants={fadeInUp} transition={smooth}>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Start free. Upgrade when you need more.</p>
            </MotionDiv>
          </MotionDiv>

          <MotionDiv initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer} className="grid grid-cols-3 gap-5">
            {[
              { name: "Free", price: "$0", period: "/month", quota: "10 generations", features: ["AI script generation", "Fusion 360 integration", "Download .py files", "Generation history"], popular: false, cta: "Get Started" },
              { name: "Pro", price: "$9", period: "/month", quota: "200 generations", features: ["Everything in Free", "Priority generation queue", "Email support", "Advanced models"], popular: true, cta: "Upgrade to Pro" },
              { name: "Business", price: "$29", period: "/month", quota: "Unlimited", features: ["Everything in Pro", "Team collaboration", "API access", "Admin dashboard", "Priority support"], popular: false, cta: "Contact Sales" },
            ].map((plan, i) => (
              <MotionDiv
                key={i}
                variants={fadeInUp}
                transition={smooth}
                whileHover={{ y: -8, boxShadow: plan.popular ? "var(--shadow-glow-strong)" : "var(--shadow-md)" }}
                className={`p-6 rounded-2xl glass-card cursor-default ${plan.popular ? "animate-glow-pulse" : ""}`}
                style={{ borderColor: plan.popular ? "var(--accent)" : undefined }}
              >
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
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link href={session ? "/dashboard" : "/register"} className="block text-center text-xs font-semibold py-2.5 rounded-xl transition-all" style={{ background: plan.popular ? "var(--accent)" : "var(--bg-hover)", color: plan.popular ? "#fff" : "var(--text-primary)" }}>
                    {session ? "Upgrade" : plan.cta}
                  </Link>
                </motion.div>
              </MotionDiv>
            ))}
          </MotionDiv>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-24 relative z-10">
        <div className="max-w-2xl mx-auto px-6">
          <MotionDiv initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer} className="text-center mb-16">
            <MotionDiv variants={fadeInUp} transition={smooth}>
              <h2 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Frequently asked</h2>
            </MotionDiv>
          </MotionDiv>

          <MotionDiv initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer} className="space-y-3">
            {[
              { q: "Do I need to know Python?", a: "No. Describe your model in plain English and AI handles the code." },
              { q: "How does Fusion 360 integration work?", a: "Install our plugin. Scripts are sent via WebSocket and execute automatically in your Fusion 360 workspace." },
              { q: "Can I edit the generated scripts?", a: "Yes. Download the .py file, edit it, and run it manually or send it back through our tool." },
              { q: "What happens when I hit my limit?", a: "You can upgrade anytime. Your existing scripts and history are always accessible." },
              { q: "Is my data secure?", a: "Yes. All data is encrypted in transit and at rest. We never share your scripts or prompts." },
            ].map((faq, i) => (
              <MotionDiv key={i} variants={fadeInUp} transition={smooth} {...hoverLift} className="p-5 rounded-xl glass-card cursor-default">
                <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{faq.q}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{faq.a}</p>
              </MotionDiv>
            ))}
          </MotionDiv>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <MotionDiv initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer} className="py-24 relative z-10">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <MotionDiv variants={scaleIn} transition={smooth} className="p-10 rounded-2xl glass-heavy">
            <h2 className="text-2xl font-bold mb-3 relative z-10" style={{ color: "var(--text-primary)" }}>Ready to build faster?</h2>
            <p className="text-sm mb-6 relative z-10" style={{ color: "var(--text-secondary)" }}>Join engineers using AI to automate their Fusion 360 workflow.</p>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="relative z-10 inline-block">
              <Link href={session ? "/chat" : "/register"} className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl text-sm font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>
                {session ? "Open Chat" : "Start Free"} <ArrowRight size={14} />
              </Link>
            </motion.div>
          </MotionDiv>
        </div>
      </MotionDiv>

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
