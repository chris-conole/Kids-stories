import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OnboardingCompleter } from "@/components/OnboardingCompleter";
import { PlanCta } from "@/components/PlanCta";
import { PLANS } from "@/lib/plans";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { onboard?: string; welcome?: string };
}) {
  // Fresh from onboarding: create the child + first story on the client.
  if (searchParams.onboard === "1") {
    return <OnboardingCompleter />;
  }

  const session = await auth();
  const userId = session!.user.id;

  const [children, subscription] = await Promise.all([
    prisma.child.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: {
        stories: {
          where: { status: { in: ["READY", "DELIVERED"] } },
          orderBy: { forDate: "desc" },
        },
      },
    }),
    prisma.subscription.findUnique({ where: { userId } }),
  ]);

  const subscribed =
    subscription && ["ACTIVE", "TRIALING"].includes(subscription.status);

  return (
    <div>
      {/* Subscribe banner if not yet paying */}
      {!subscribed && (
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-night-800 to-night-600 p-6 text-white">
          <h2 className="font-display text-2xl">Keep the stories coming</h2>
          <p className="mt-1 text-night-100">
            Start your subscription to get a fresh story every night. 7-day free
            trial, cancel anytime.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.values(PLANS).map((plan) => (
              <PlanCta
                key={plan.id}
                plan={plan.id}
                label={`${plan.name} — ${plan.priceLabel}`}
                className={`rounded-full px-5 py-2.5 font-semibold ${
                  plan.id === "PLUS"
                    ? "bg-dawn-400 text-night-900 hover:bg-dawn-300"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl text-night-900">Story library</h1>
        <Link
          href="/dashboard/profile"
          className="rounded-full border border-night-300 px-4 py-2 text-sm font-medium text-night-700 hover:bg-white"
        >
          + Add a child
        </Link>
      </div>

      {children.length === 0 && (
        <p className="text-night-500">No children yet. Add one to get started.</p>
      )}

      {children.map((child) => (
        <section key={child.id} className="mb-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl text-night-800">
              {child.name}&apos;s stories
            </h2>
            <span className="text-sm text-night-400">
              {child.stories.length} {child.stories.length === 1 ? "story" : "stories"}
            </span>
          </div>

          {child.stories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-night-200 p-6 text-center text-night-500">
              Tonight&apos;s story will appear here.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {child.stories.map((story) => (
                <Link
                  key={story.id}
                  href={`/dashboard/story/${story.id}`}
                  className="group rounded-2xl border border-night-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="text-xs uppercase tracking-wide text-night-400">
                    {new Date(story.forDate).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  <h3 className="mt-1 font-display text-lg text-night-900 group-hover:text-night-700">
                    {story.title || "Tonight's story"}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-night-500">
                    {story.synopsis}
                  </p>
                  <div className="mt-3 text-xs text-night-400">
                    {story.readMinutes ?? 15} min read
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
