import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { planForPriceId } from "@/lib/plans";
import type { SubscriptionStatus } from "@prisma/client";

// Stripe needs the raw body for signature verification.
export const runtime = "nodejs";

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  trialing: "TRIALING",
  active: "ACTIVE",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  unpaid: "PAST_DUE",
  incomplete: "INCOMPLETE",
  incomplete_expired: "CANCELED",
};

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "No webhook secret" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, sig!, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature failed: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        // Ignore unrelated events.
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler error:", (err as Error).message);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function syncSubscription(sub: Stripe.Subscription) {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });
  if (!user) {
    console.warn("[stripe webhook] no user for customer", customerId);
    return;
  }

  const priceId = sub.items.data[0]?.price.id;
  const plan = planForPriceId(priceId) ?? "STANDARD";
  const status = STATUS_MAP[sub.status] ?? "INCOMPLETE";

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      plan,
      status,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
    update: {
      plan,
      status,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });
}
