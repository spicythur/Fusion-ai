import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
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
    return NextResponse.json({
      totalUsers: 0,
      totalGenerations: 0,
      activeSubscriptions: 0,
      recentGenerations: [],
    });
  }
}
