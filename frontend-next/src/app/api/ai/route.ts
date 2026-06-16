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

  const { data: providers, error } = await supabase
    .from("ai_providers")
    .select("id, name, provider, base_url, model, is_active, priority")
    .order("priority", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
  }

  return NextResponse.json({ providers });
}

export async function POST(request: Request) {
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

  const { name, provider, api_key, base_url, model, priority } = await request.json();

  const { data, error } = await supabase
    .from("ai_providers")
    .insert({
      name,
      provider,
      api_key_encrypted: api_key,
      base_url,
      model,
      priority: priority || 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to add provider" }, { status: 500 });
  }

  return NextResponse.json({ provider: data });
}
