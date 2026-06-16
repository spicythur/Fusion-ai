import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { supabase } from "@/lib/supabase";

export async function GET() {
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

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, name, email, tier, generations_used, generations_limit, subscription_status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  return NextResponse.json({ users });
}
