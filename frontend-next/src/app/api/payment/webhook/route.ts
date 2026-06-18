import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const TIER_LIMITS = {
  free: 10,
  pro: 200,
  business: 999999,
};

export async function POST(request: Request) {
  const body = await request.text();
  const callbackToken = request.headers.get("x-callback-token");

  // Verify webhook token
  if (callbackToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Handle invoice events
  if (event.status === "PAID") {
    const { metadata } = event;
    const userId = metadata?.userId;
    const tier = metadata?.tier as keyof typeof TIER_LIMITS;

    if (userId && tier) {
      await supabase
        .from("profiles")
        .update({
          tier,
          generations_limit: TIER_LIMITS[tier],
          subscription_status: "active",
        })
        .eq("id", userId);
    }
  }

  // Handle expiry
  if (event.status === "EXPIRED") {
    const { metadata } = event;
    const userId = metadata?.userId;

    if (userId) {
      await supabase
        .from("profiles")
        .update({
          tier: "free",
          generations_limit: TIER_LIMITS.free,
          subscription_status: "expired",
        })
        .eq("id", userId);
    }
  }

  return NextResponse.json({ received: true });
}
