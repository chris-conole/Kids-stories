"use client";

import { useState } from "react";
import type { Plan } from "@prisma/client";

/** Kicks off Stripe Checkout for the chosen plan. */
export function PlanCta({
  plan,
  label,
  className = "",
}: {
  plan: Plan;
  label: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else {
        alert(data.error || "Could not start checkout");
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <button onClick={go} disabled={loading} className={className}>
      {loading ? "Redirecting…" : label}
    </button>
  );
}

/** Opens the Stripe billing portal. */
export function BillingPortalButton({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  async function go() {
    setLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  }
  return (
    <button onClick={go} disabled={loading} className={className}>
      {loading ? "Opening…" : children}
    </button>
  );
}
