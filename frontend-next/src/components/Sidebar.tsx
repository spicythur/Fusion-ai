"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  History,
  User,
  Settings,
  CreditCard,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/lib/theme";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/quota")
        .then((res) => res.json())
        .then((data) => setIsAdmin(data.is_admin || data.tier === "business"))
        .catch(() => setIsAdmin(false));
    }
  }, [session]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className="w-[220px] shrink-0 flex flex-col h-full glass-heavy relative z-20"
      style={{ borderRight: "1px solid var(--glass-border-strong)" }}
    >
      {/* Logo */}
      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
            style={{ background: "var(--accent)" }}
          >
            F
          </div>
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Fusion AI
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
              style={{
                color: active ? "var(--text-primary)" : "var(--text-secondary)",
                background: active ? "var(--bg-hover)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "var(--bg-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              <Icon size={16} strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-2 border-t" style={{ borderColor: "var(--border)" }} />
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
              style={{
                color: isActive("/admin") ? "var(--text-primary)" : "var(--text-secondary)",
                background: isActive("/admin") ? "var(--bg-hover)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive("/admin")) {
                  e.currentTarget.style.background = "var(--bg-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive("/admin")) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              <Settings size={16} strokeWidth={1.5} />
              Admin
            </Link>
            <Link
              href="/billing"
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
              style={{
                color: pathname === "/billing" ? "var(--text-primary)" : "var(--text-secondary)",
                background: pathname === "/billing" ? "var(--bg-hover)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (pathname !== "/billing") {
                  e.currentTarget.style.background = "var(--bg-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (pathname !== "/billing") {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              <CreditCard size={16} strokeWidth={1.5} />
              Billing
            </Link>
          </>
        )}
      </nav>

      {/* Theme toggle */}
      <div className="p-2 border-t" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={toggle}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium w-full transition-all duration-150"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </aside>
  );
}
