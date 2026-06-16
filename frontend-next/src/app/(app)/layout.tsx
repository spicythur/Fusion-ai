"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      >
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{
            borderColor: "var(--border)",
            borderTopColor: "var(--accent)",
          }}
        />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="flex h-screen relative" style={{ background: "var(--bg-base)" }}>
      <div className="mesh-bg" />
      <div className="mesh-bg-extra" />
      <Sidebar />
      <div className="flex-1 flex flex-col relative z-10 min-h-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
