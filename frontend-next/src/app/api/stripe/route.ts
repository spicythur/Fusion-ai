import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-05-27.dahlia",
});

const PRICES = {
  pro: process.env.STRIPE_PRO_PRICE_ID || "price_pro_placeholder",
  business: process.env.STRIPE_BUSINESS_PRICE_ID || "price_business_placeholder",
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tier } = await request.json();

  if (!tier || !PRICES[tier as keyof typeof PRICES]) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: session.user.email,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: PRICES[tier as keyof typeof PRICES],
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?canceled=true`,
      metadata: {
        userId: session.user.id,
        tier,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
