import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: generations, error } = await supabase
    .from("generations")
    .select("id, prompt, status, code_length, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }

  return NextResponse.json({ generations: generations || [] });
}
