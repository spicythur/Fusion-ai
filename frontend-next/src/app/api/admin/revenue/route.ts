import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { supabase } from "@/lib/supabase";
import { logError } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: admin } = await supabase.from("profiles").select("tier").eq("id", session.user.id).single();
    if (admin?.tier !== "business") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { count: freeUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("tier", "free");
    const { count: proUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("tier", "pro");
    const { count: businessUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("tier", "business");

    const mrr = (proUsers || 0) * 9 + (businessUsers || 0) * 29;
    const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    const { count: activeSubscriptions } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("subscription_status", "active");

    return NextResponse.json({
      mrr,
      totalUsers: totalUsers || 0,
      activeSubscriptions: activeSubscriptions || 0,
      tierBreakdown: { free: freeUsers || 0, pro: proUsers || 0, business: businessUsers || 0 },
      conversionRate: totalUsers ? Math.round(((proUsers || 0) + (businessUsers || 0)) / totalUsers * 100) : 0,
    });
  } catch (error) {
    logError("Admin revenue error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
