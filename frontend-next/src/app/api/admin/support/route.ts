import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { supabase } from "@/lib/supabase";
import { logError } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: admin } = await supabase.from("profiles").select("tier").eq("id", session.user.id).single();
    if (admin?.tier !== "business") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email parameter required" }, { status: 400 });
    }

    // Find user by email
    const { data: user, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's recent generations
    const { data: generations } = await supabase
      .from("generations")
      .select("id, prompt, status, code_length, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({ user, generations: generations || [] });
  } catch (error) {
    logError("Admin support error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
