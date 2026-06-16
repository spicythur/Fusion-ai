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

    // Get generation stats
    const { count: totalGenerations } = await supabase.from("generations").select("*", { count: "exact", head: true });
    const { count: successGenerations } = await supabase.from("generations").select("*", { count: "exact", head: true }).eq("status", "success");
    const { count: errorGenerations } = await supabase.from("generations").select("*", { count: "exact", head: true }).eq("status", "error");

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayGenerations } = await supabase.from("generations").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString());

    // Get active users (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: activeUsers } = await supabase.from("generations").select("user_id").gte("created_at", weekAgo.toISOString());
    const uniqueActiveUsers = new Set(activeUsers?.map(g => g.user_id) || []).size;

    const errorRate = totalGenerations ? Math.round((errorGenerations || 0) / totalGenerations * 100) : 0;

    return NextResponse.json({
      totalGenerations: totalGenerations || 0,
      successGenerations: successGenerations || 0,
      errorGenerations: errorGenerations || 0,
      errorRate,
      todayGenerations: todayGenerations || 0,
      weeklyActiveUsers: uniqueActiveUsers,
    });
  } catch (error) {
    logError("Admin health error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
