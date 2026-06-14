"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function LandingPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">✦</div>
            <span className="text-xl font-bold text-white">Fusion AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors">Pricing</a>
            <a href="#how" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors">How it Works</a>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <>
                <Link href="/dashboard" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors px-4 py-2">Dashboard</Link>
                <Link href="/chat" className="text-sm font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-5 py-2.5 rounded-full transition-all hover:shadow-lg hover:shadow-blue-500/25">
                  Open Chat →
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors px-4 py-2">Sign in</Link>
                <Link href="/register" className="text-sm font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-5 py-2.5 rounded-full transition-all hover:shadow-lg hover:shadow-blue-500/25">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent"></div>
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-soft)] border border-blue-500/20 mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse"></span>
            <span className="text-sm text-blue-400">AI-Powered CAD Automation</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            Generate Fusion 360<br/>
            <span className="gradient-text">Scripts with AI</span>
          </h1>
          
          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Describe any 3D model in natural language. Our AI generates production-ready Python scripts and sends them directly to Fusion 360.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <Link href={session ? "/chat" : "/register"} className="group relative px-8 py-4 bg-[var(--accent)] text-white rounded-full text-base font-semibold hover:bg-[var(--accent-hover)] transition-all hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5">
              {session ? "Open Chat →" : "Start Generating"}
              <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">→</span>
            </Link>
            <Link href="#how" className="px-8 py-4 text-[var(--text-secondary)] hover:text-white border border-[var(--border)] hover:border-[var(--border-hover)] rounded-full text-base font-medium transition-all hover:bg-[var(--bg-card)]">
              See how it works
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-12 mt-16 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
            {[
              { value: "37+", label: "CAD Features" },
              { value: "100%", label: "Syntax Valid" },
              { value: "<5s", label: "Generation Time" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-[var(--text-muted)]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how" className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How it Works</h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">Three simple steps from idea to 3D model</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: "💬", title: "Describe", desc: "Tell our AI what 3D model you want in plain English. No Python knowledge required.", gradient: "from-blue-500/20 to-cyan-500/20" },
              { step: "02", icon: "⚡", title: "Generate", desc: "AI creates a production-ready Fusion 360 Python script in seconds, validated for syntax.", gradient: "from-purple-500/20 to-pink-500/20" },
              { step: "03", icon: "🚀", title: "Execute", desc: "Script runs automatically in Fusion 360. Your 3D model appears instantly.", gradient: "from-orange-500/20 to-red-500/20" },
            ].map((item, i) => (
              <div key={i} className="group relative p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all hover:-translate-y-1 hover:shadow-xl">
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                <div className="relative">
                  <div className="text-xs font-mono text-[var(--text-muted)] mb-4">{item.step}</div>
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-[var(--bg-card)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Powerful Features</h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">Everything you need to automate Fusion 360 scripting</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "⚙️", title: "37+ CAD Operations", desc: "Extrude, revolve, sweep, loft, fillet, chamfer, and more" },
              { icon: "🔧", title: "Complex Assemblies", desc: "Gearboxes, pistons, drone frames, pipe networks" },
              { icon: "✅", title: "Auto Validation", desc: "Every script is syntax-checked before execution" },
              { icon: "🔄", title: "Auto-Fix", desc: "AI automatically fixes syntax errors" },
              { icon: "⚡", title: "Instant Execution", desc: "Scripts run directly in Fusion 360 via local addin" },
              { icon: "📝", title: "Prompt History", desc: "Save and revisit your generation history" },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-2xl shrink-0">{feature.icon}</div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple Pricing</h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">Start free, upgrade when you need more</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Free", price: "$0", period: "/month", desc: "Perfect for trying out", quota: "10 generations/month", features: ["Basic generation", "Prompt history", "Community support"], popular: false, cta: "Get Started" },
              { name: "Pro", price: "$9", period: "/month", desc: "For regular users", quota: "200 generations/month", features: ["Priority queue", "Export scripts", "Email support", "Advanced models"], popular: true, cta: "Start Pro" },
              { name: "Business", price: "$29", period: "/month", desc: "For teams and power users", quota: "Unlimited generations", features: ["Team features", "API access", "Priority support", "Custom models", "Admin dashboard"], popular: false, cta: "Contact Sales" },
            ].map((plan, i) => (
              <div key={i} className={`relative p-8 rounded-2xl border transition-all hover:-translate-y-1 ${
                plan.popular ? 'bg-[var(--bg-card)] border-blue-500 shadow-xl shadow-blue-500/10' : 'bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--border-hover)]'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-xs font-semibold text-white">MOST POPULAR</div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                  <p className="text-sm text-[var(--text-muted)]">{plan.desc}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-[var(--text-muted)]">{plan.period}</span>
                  <div className="text-sm text-blue-400 mt-1">{plan.quota}</div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                      <svg className="w-5 h-5 text-[var(--success)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={session ? "/dashboard" : "/register"} className={`block w-full text-center py-3 rounded-full font-semibold transition-all ${
                  plan.popular ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] hover:shadow-lg hover:shadow-blue-500/25' : 'bg-[var(--bg-elevated)] text-white hover:bg-[var(--border-hover)]'
                }`}>
                  {session ? "Upgrade" : plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent"></div>
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to automate your CAD workflow?</h2>
          <p className="text-[var(--text-secondary)] mb-10">Join thousands of engineers saving hours with AI-powered script generation</p>
          <Link href={session ? "/chat" : "/register"} className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--accent)] text-white rounded-full text-base font-semibold hover:bg-[var(--accent-hover)] transition-all hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5">
            {session ? "Open Chat →" : "Try Fusion AI Free →"}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">✦</div>
              <span className="font-semibold text-white">Fusion AI</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#features" className="text-sm text-[var(--text-muted)] hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-[var(--text-muted)] hover:text-white transition-colors">Pricing</a>
              {session ? (
                <Link href="/dashboard" className="text-sm text-[var(--text-muted)] hover:text-white transition-colors">Dashboard</Link>
              ) : (
                <Link href="/login" className="text-sm text-[var(--text-muted)] hover:text-white transition-colors">Sign in</Link>
              )}
            </div>
            <div className="text-sm text-[var(--text-muted)]">© 2026 Fusion AI. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
