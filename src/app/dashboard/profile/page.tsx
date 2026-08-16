import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GenerateNowButton } from "@/components/GenerateNowButton";
import { StoryPreferencesSchema } from "@/lib/story-engine";
import { ageBandFromBirthYear } from "@/lib/age";

export default async function ProfilePage() {
  const session = await auth();
  const children = await prisma.child.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-night-900">Profiles</h1>
        <Link
          href="/onboarding"
          className="rounded-full bg-night-800 px-4 py-2 text-sm font-semibold text-white hover:bg-night-700"
        >
          + Add a child
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {children.map((child) => {
          const prefs = StoryPreferencesSchema.safeParse(child.preferences);
          return (
            <div
              key={child.id}
              className="rounded-2xl border border-night-100 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-xl text-night-900">
                    {child.name}
                  </h2>
                  <p className="text-sm text-night-500">
                    {child.pronouns} · {ageBandFromBirthYear(child.birthYear)} ·{" "}
                    {child.readingLevel} reader
                  </p>
                </div>
                <span className="text-xs text-night-400">
                  bedtime {child.bedtimeLocal}
                </span>
              </div>

              {prefs.success && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {prefs.data.themes.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-night-100 px-2.5 py-1 text-xs text-night-600"
                    >
                      {t}
                    </span>
                  ))}
                  {prefs.data.tone.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-dawn-100 px-2.5 py-1 text-xs text-dawn-500"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <GenerateNowButton childId={child.id} />
                <Link
                  href={`/dashboard/profile/${child.id}/edit`}
                  className="rounded-full border border-night-300 px-4 py-2 text-sm font-medium text-night-700 hover:bg-night-50"
                >
                  Edit preferences
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
