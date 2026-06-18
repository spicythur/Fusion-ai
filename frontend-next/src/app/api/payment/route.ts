import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { Xendit } from "xendit-node";

const xendit = new Xendit({ secretKey: process.env.XENDIT_SECRET_KEY || "" });

const TIER_PRICES = {
  pro: { amount: 9, name: "Fusion AI Pro" },
  business: { amount: 29, name: "Fusion AI Business" },
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tier } = await request.json();

  if (!tier || !TIER_PRICES[tier as keyof typeof TIER_PRICES]) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const price = TIER_PRICES[tier as keyof typeof TIER_PRICES];

  try {
    const invoice = await xendit.Invoice.createInvoice({
      data: {
        externalId: `fusion-${session.user.id}-${Date.now()}`,
        payerEmail: session.user.email,
        description: `${price.name} - Monthly Subscription`,
        amount: price.amount,
        currency: "USD",
        successRedirectUrl: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
        failureRedirectUrl: `${process.env.NEXTAUTH_URL}/dashboard?canceled=true`,
        metadata: {
          userId: session.user.id,
          tier,
        },
      },
    });

    return NextResponse.json({ url: invoice.invoiceUrl });
  } catch (error) {
    console.error("Xendit error:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
