"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, History, User, ArrowRight, Zap, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, hoverLift, smooth } from "@/lib/animations";

const MotionDiv = motion.div;

interface Quota { used: number; limit: number; tier: string; remaining: number; }

export default function DashboardPage() {
  const { data: session } = useSession();
  const [quota, setQuota] = useState<Quota | null>(null);

  useEffect(() => {
    fetch("/api/quota").then((res) => res.json()).then((data) => setQuota(data)).catch(console.error);
  }, []);

  const usagePercent = quota ? Math.min((quota.used / quota.limit) * 100, 100) : 0;

  return (
    <MotionDiv initial="hidden" animate="visible" variants={staggerContainer} className="p-8 max-w-4xl">
      <MotionDiv variants={fadeInUp} transition={smooth} className="mb-8">
        <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
          Welcome back, {session?.user?.name || session?.user?.email?.split("@")[0]}
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Here&apos;s an overview of your account.</p>
      </MotionDiv>

      {/* Quick Actions */}
      <MotionDiv variants={fadeInUp} transition={smooth} className="grid grid-cols-3 gap-3 mb-8">
        {[
          { href: "/chat", icon: MessageSquare, label: "New Generation", desc: "Create a 3D model", accent: true },
          { href: "/history", icon: History, label: "View History", desc: "Past generations" },
          { href: "/profile", icon: User, label: "Edit Profile", desc: "Account settings" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className={`group p-4 rounded-xl transition-all hover:-translate-y-0.5 ${item.accent ? "glass-card animate-glow-pulse" : "glass-card"}`}
            style={{ borderColor: item.accent ? "var(--accent)" : undefined }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = item.accent ? "var(--shadow-glow-strong)" : "var(--shadow-md)"; e.currentTarget.style.borderColor = item.accent ? "var(--accent)" : "var(--border-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = item.accent ? "var(--shadow-glow)" : "var(--shadow-sm)"; e.currentTarget.style.borderColor = item.accent ? "var(--accent)" : "var(--glass-border)"; }}
          >
            <item.icon size={20} strokeWidth={1.5} style={{ color: item.accent ? "var(--accent)" : "var(--text-secondary)" }} />
            <div className="mt-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.label}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{item.desc}</div>
            <ArrowRight size={14} className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-tertiary)" }} />
          </Link>
        ))}
      </MotionDiv>

      {/* Stats */}
      <MotionDiv variants={fadeInUp} transition={smooth} className="grid grid-cols-2 gap-4">
        <div className="p-5 rounded-xl glass-card">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Usage This Month</span>
          </div>
          {quota ? (
            <>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>{quota.used}</span>
                <span className="text-sm pb-0.5" style={{ color: "var(--text-tertiary)" }}>/ {quota.limit}</span>
              </div>
              <div className="w-full rounded-full h-1.5 mb-2" style={{ background: "var(--bg-hover)" }}>
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${usagePercent}%`, background: usagePercent > 80 ? "var(--warning)" : "var(--accent)" }} />
              </div>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{quota.remaining} remaining</p>
            </>
          ) : (
            <div className="h-16 flex items-center justify-center">
              <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
            </div>
          )}
        </div>

        <div className="p-5 rounded-xl glass-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Your Plan</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl font-semibold capitalize" style={{ color: "var(--text-primary)" }}>{quota?.tier || "free"}</span>
            {quota?.tier === "free" && (
              <Link href="/billing" className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>Upgrade</Link>
            )}
          </div>
          <div className="space-y-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
            <div>{quota?.tier === "free" ? "10" : quota?.tier === "pro" ? "200" : "Unlimited"} generations/month</div>
            <div>AI-powered generation</div>
            <div>Fusion 360 integration</div>
          </div>
        </div>
      </MotionDiv>
    </MotionDiv>
  );
}
