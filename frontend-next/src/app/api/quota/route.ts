import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("generations_used, generations_limit, tier")
    .eq("id", session.user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to fetch quota" }, { status: 500 });
  }

  return NextResponse.json({
    used: profile.generations_used,
    limit: profile.generations_limit,
    tier: profile.tier,
    remaining: profile.generations_limit - profile.generations_used,
  });
}
