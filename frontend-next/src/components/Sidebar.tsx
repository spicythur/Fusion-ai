"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/chat", label: "Chat", icon: "💬" },
  { href: "/history", label: "History", icon: "📜" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/quota")
        .then((res) => res.json())
        .then((data) => setIsAdmin(data.tier === "business"))
        .catch(() => setIsAdmin(false));
    }
  }, [session]);

  return (
    <aside className="w-60 shrink-0 bg-[var(--bg-card)] border-r border-[var(--border)] flex flex-col h-full">
      <div className="p-5 border-b border-[var(--border)]">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">✦</div>
          <div>
            <div className="text-sm font-bold text-white">Fusion AI</div>
            <div className="text-[10px] text-[var(--text-muted)]">Script Generator</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-500/10 text-blue-400"
                  : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)]"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[var(--border)] space-y-1">
        {isAdmin && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              pathname === "/admin" || pathname.startsWith("/admin/")
                ? "bg-blue-500/10 text-blue-400"
                : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)]"
            }`}
          >
            <span className="text-lg">⚙️</span>
            Admin
          </Link>
        )}
      </div>
    </aside>
  );
}
