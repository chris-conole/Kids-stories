import type { Plan } from "@prisma/client";

/**
 * Single source of truth for what each subscription tier includes and which
 * Stripe price backs it. Keep marketing copy and billing in sync here.
 */
export interface PlanConfig {
  id: Plan;
  name: string;
  blurb: string;
  priceLabel: string;
  features: string[];
  withNarration: boolean;
  withIllustrations: boolean;
  stripePriceEnv: string;
}

export const PLANS: Record<Plan, PlanConfig> = {
  STANDARD: {
    id: "STANDARD",
    name: "Standard",
    blurb: "A fresh, personalised story every single night.",
    priceLabel: "£7.99 / month",
    features: [
      "A new ~15-minute bedtime story every night",
      "Starring your child, their friends and their world",
      "Read in the app or delivered to your inbox each evening",
      "Recurring characters and connected adventures",
      "Your growing story library to revisit any time",
    ],
    withNarration: false,
    withIllustrations: false,
    stripePriceEnv: "STRIPE_PRICE_STANDARD",
  },
  PLUS: {
    id: "PLUS",
    name: "Plus",
    blurb: "Everything in Standard, brought to life with pictures and narration.",
    priceLabel: "£12.99 / month",
    features: [
      "Everything in Standard",
      "Soft, storybook illustrations for every scene",
      "Gentle audio narration — press play and listen",
      "Perfect for solo listening or lights-out already",
    ],
    withNarration: true,
    withIllustrations: true,
    stripePriceEnv: "STRIPE_PRICE_PLUS",
  },
};

export function planFor(plan: Plan): PlanConfig {
  return PLANS[plan];
}

export function stripePriceIdFor(plan: Plan): string | undefined {
  return process.env[PLANS[plan].stripePriceEnv];
}

export function planForPriceId(priceId: string | null | undefined): Plan | null {
  if (!priceId) return null;
  for (const cfg of Object.values(PLANS)) {
    if (process.env[cfg.stripePriceEnv] === priceId) return cfg.id;
  }
  return null;
}
