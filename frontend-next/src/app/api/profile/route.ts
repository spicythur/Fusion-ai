import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, email } = body;

  // Input validation
  if (name && (typeof name !== "string" || name.length > 100)) {
    return NextResponse.json({ error: "Invalid name (max 100 characters)" }, { status: 400 });
  }
  if (email && (typeof email !== "string" || !email.includes("@") || email.length > 255)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  const updateData: Record<string, string> = {};
  if (name) updateData.name = name.trim();
  if (email) updateData.email = email.trim().toLowerCase();
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", session.user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
