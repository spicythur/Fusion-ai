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

  const { name, email } = await request.json();

  const { data, error } = await supabase
    .from("profiles")
    .update({ name, email, updated_at: new Date().toISOString() })
    .eq("id", session.user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
