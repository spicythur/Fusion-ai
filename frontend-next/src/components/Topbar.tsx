"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, History, LayoutDashboard, LogOut, ChevronDown } from "lucide-react";

export default function Topbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initial = (
    session?.user?.name ||
    session?.user?.email ||
    "U"
  )[0].toUpperCase();

  return (
    <header
      className="h-12 shrink-0 flex items-center justify-between px-4 relative z-20"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "blur(20px) saturate(1.5)",
        WebkitBackdropFilter: "blur(20px) saturate(1.5)",
        borderBottom: "1px solid var(--glass-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
        {session?.user?.name || session?.user?.email || "User"}
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-all duration-150"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
          aria-expanded={open}
          aria-haspopup="true"
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
            style={{ background: "var(--accent)" }}
          >
            {initial}
          </div>
          <ChevronDown size={12} />
        </button>

        {open && (
          <div
            className="absolute right-0 top-10 w-48 rounded-xl z-50 animate-scale-in"
            style={{
              background: "var(--glass-bg-heavy)",
              backdropFilter: "blur(28px) saturate(1.6)",
              WebkitBackdropFilter: "blur(28px) saturate(1.6)",
              border: "1px solid var(--glass-border-strong)",
              boxShadow: "var(--shadow-lg)",
              overflow: "hidden",
            }}
            role="menu"
          >
            <div className="p-2.5 border-b" style={{ borderColor: "var(--glass-border)" }}>
              <div
                className="text-xs font-medium px-2"
                style={{ color: "var(--text-primary)" }}
              >
                {session?.user?.name || "User"}
              </div>
              <div
                className="text-[11px] px-2 mt-0.5 truncate"
                style={{ color: "var(--text-tertiary)" }}
              >
                {session?.user?.email}
              </div>
            </div>
            <div className="p-1">
              {[
                { href: "/profile", icon: User, label: "Profile" },
                { href: "/history", icon: History, label: "History" },
                { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all duration-150"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-hover)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                  role="menuitem"
                >
                  <item.icon size={14} strokeWidth={1.5} />
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="p-1 border-t" style={{ borderColor: "var(--glass-border)" }}>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs w-full transition-all duration-150"
                style={{ color: "var(--error)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--error-soft)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
                role="menuitem"
              >
                <LogOut size={14} strokeWidth={1.5} />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
