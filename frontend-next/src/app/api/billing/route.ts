import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-05-27.dahlia",
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, subscription_status, stripe_subscription_id, stripe_customer_id")
    .eq("id", session.user.id)
    .single();

  return NextResponse.json({
    tier: profile?.tier || "free",
    status: profile?.subscription_status || "inactive",
    subscriptionId: profile?.stripe_subscription_id,
    customerId: profile?.stripe_customer_id,
  });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_subscription_id")
    .eq("id", session.user.id)
    .single();

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  try {
    await stripe.subscriptions.cancel(profile.stripe_subscription_id);

    await supabase
      .from("profiles")
      .update({
        tier: "free",
        generations_limit: 10,
        subscription_status: "canceled",
        stripe_subscription_id: null,
      })
      .eq("id", session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
