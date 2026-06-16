import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Try to get profile
  let { data: profile, error } = await supabase
    .from("profiles")
    .select("generations_used, generations_limit, tier, is_admin")
    .eq("id", session.user.id)
    .single();

  // If profile doesn't exist, create it
  if (error || !profile) {
    const { data: newProfile } = await supabase
      .from("profiles")
      .insert({
        id: session.user.id,
        name: session.user.name || "",
        email: session.user.email || "",
        tier: "free",
        generations_used: 0,
        generations_limit: 10,
      })
      .select("generations_used, generations_limit, tier, is_admin")
      .single();

    profile = newProfile || { generations_used: 0, generations_limit: 10, tier: "free", is_admin: false };
  }

  return NextResponse.json({
    used: profile.generations_used || 0,
    limit: profile.generations_limit || 10,
    tier: profile.tier || "free",
    remaining: (profile.generations_limit || 10) - (profile.generations_used || 0),
    is_admin: profile.is_admin || false,
  });
}
