import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EditChildForm } from "@/components/prefs/EditChildForm";
import { emptyDraft, type PreferenceDraft } from "@/components/prefs/controls";
import { StoryPreferencesSchema } from "@/lib/story-engine";

export default async function EditChildPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const child = await prisma.child.findFirst({
    where: { id: params.id, userId: session!.user.id },
  });
  if (!child) notFound();

  // Map the stored profile + preferences JSON into the editable draft shape.
  const prefs = StoryPreferencesSchema.safeParse(child.preferences);
  const initial: PreferenceDraft = {
    ...emptyDraft,
    name: child.name,
    pronouns: child.pronouns,
    birthYear: child.birthYear ?? undefined,
    readingLevel: child.readingLevel,
    bedtimeLocal: child.bedtimeLocal,
    timezone: child.timezone,
    ...(prefs.success
      ? {
          themes: prefs.data.themes,
          tone: prefs.data.tone,
          values: prefs.data.values,
          companions: prefs.data.companions,
          favouriteThings: prefs.data.favouriteThings ?? "",
          avoid: prefs.data.avoid ?? "",
          windDownEnding: prefs.data.windDownEnding,
          serialiseAdventures: prefs.data.serialiseAdventures,
          targetMinutes: prefs.data.targetMinutes,
        }
      : {}),
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/profile"
        className="text-sm text-night-500 hover:text-night-800"
      >
        ← Profiles
      </Link>
      <h1 className="mt-3 font-display text-3xl text-night-900">
        Edit {child.name}&apos;s story recipe
      </h1>
      <p className="mt-1 text-night-500">
        Changes apply to future nightly stories.
      </p>

      <div className="mt-6">
        <EditChildForm childId={child.id} initial={initial} />
      </div>
    </div>
  );
}
