import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLANS, planFor } from "@/lib/plans";
import { BillingPortalButton, PlanCta } from "@/components/PlanCta";

export default async function BillingPage() {
  const session = await auth();
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session!.user.id },
  });

  const active =
    subscription && ["ACTIVE", "TRIALING"].includes(subscription.status);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl text-night-900">Billing</h1>

      {active ? (
        <div className="mt-6 rounded-2xl border border-night-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-night-500">Current plan</p>
              <p className="font-display text-2xl text-night-900">
                {planFor(subscription!.plan).name}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                subscription!.status === "TRIALING"
                  ? "bg-dawn-100 text-dawn-500"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {subscription!.status === "TRIALING" ? "Free trial" : "Active"}
            </span>
          </div>
          {subscription!.currentPeriodEnd && (
            <p className="mt-3 text-sm text-night-500">
              {subscription!.cancelAtPeriodEnd ? "Ends" : "Renews"} on{" "}
              {new Date(subscription!.currentPeriodEnd).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
          <BillingPortalButton className="mt-6 rounded-full bg-night-800 px-5 py-2.5 font-semibold text-white hover:bg-night-700">
            Manage subscription
          </BillingPortalButton>
        </div>
      ) : (
        <>
          <p className="mt-2 text-night-600">
            Choose a plan to start receiving nightly stories.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {Object.values(PLANS).map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl border bg-white p-6 ${
                  plan.id === "PLUS"
                    ? "border-dawn-400 ring-1 ring-dawn-300"
                    : "border-night-200"
                }`}
              >
                <h3 className="font-display text-xl text-night-900">{plan.name}</h3>
                <p className="mt-1 font-display text-2xl">{plan.priceLabel}</p>
                <ul className="mt-4 space-y-1.5 text-sm text-night-600">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-dawn-500">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <PlanCta
                  plan={plan.id}
                  label="Start 7-day free trial"
                  className="mt-6 w-full rounded-full bg-night-800 px-5 py-2.5 font-semibold text-white hover:bg-night-700"
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
