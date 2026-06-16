import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { supabase } from "@/lib/supabase";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("tier").eq("id", session.user.id).single();
  if (profile?.tier !== "business") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const updateData: any = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.provider !== undefined) updateData.provider = body.provider;
  if (body.api_key !== undefined) updateData.api_key_encrypted = body.api_key;
  if (body.base_url !== undefined) updateData.base_url = body.base_url;
  if (body.model !== undefined) updateData.model = body.model;
  if (body.is_active !== undefined) updateData.is_active = body.is_active;
  if (body.priority !== undefined) updateData.priority = body.priority;

  const { data, error } = await supabase.from("ai_providers").update(updateData).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: "Failed to update provider" }, { status: 500 });

  return NextResponse.json({ provider: data });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("tier").eq("id", session.user.id).single();
  if (profile?.tier !== "business") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { error } = await supabase.from("ai_providers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to delete provider" }, { status: 500 });

  return NextResponse.json({ success: true });
}
