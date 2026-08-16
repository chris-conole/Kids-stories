import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { stripePriceIdFor } from "@/lib/plans";
import type { Plan } from "@prisma/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Create a Stripe Checkout session for the signed-in parent. Expects
 * { plan: "STANDARD" | "PLUS" }. Reuses/creates the Stripe customer so billing
 * stays tied to the user.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { plan } = (await req.json()) as { plan: Plan };
  const priceId = stripePriceIdFor(plan);
  if (!priceId) {
    return NextResponse.json(
      { error: `No Stripe price configured for plan ${plan}` },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });

  // Ensure a Stripe customer.
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe().customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkout = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
      metadata: { userId: user.id, plan },
    },
    success_url: `${APP_URL}/dashboard?welcome=1`,
    cancel_url: `${APP_URL}/onboarding?step=plan`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: checkout.url });
}
