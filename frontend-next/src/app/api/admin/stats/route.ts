import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { supabase } from "@/lib/supabase";
import { logError } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tier")
      .eq("id", session.user.id)
      .single();

    if (profile?.tier !== "business") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: totalGenerations } = await supabase
      .from("generations")
      .select("*", { count: "exact", head: true });

    const { data: recentGenerations } = await supabase
      .from("generations")
      .select("id, user_id, prompt, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalGenerations: totalGenerations || 0,
      activeSubscriptions: 0,
      recentGenerations: recentGenerations || [],
    });
  } catch (error) {
    logError("Admin stats error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
