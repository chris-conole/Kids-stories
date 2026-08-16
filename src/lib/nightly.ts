import { prisma } from "./db";
import { ageBandFromBirthYear } from "./age";
import { planFor } from "./plans";
import { sendStoryReadyEmail } from "./email";
import { isChildDue } from "./schedule";
import {
  composeStory,
  makeNightlySeed,
  StoryPreferencesSchema,
  updateContinuity,
  type StoryRequest,
} from "./story-engine";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/** YYYY-MM-DD for "tonight" in a given timezone. */
export function nightDateString(timezone: string, when = new Date()): string {
  // en-CA formats as YYYY-MM-DD; timezone shifts to the child's local day.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(when);
}

export interface NightlyRunResult {
  attempted: number;
  generated: number;
  skipped: number;
  failed: number;
  details: Array<{ childId: string; status: string; error?: string }>;
}

/**
 * Generate tonight's story for every eligible child. Idempotent per
 * (child, night): a child who already has a READY/DELIVERED story is skipped,
 * so the job is safe to re-run.
 */
export async function runNightly(opts?: {
  childId?: string; // limit to one child (manual "generate now")
  force?: boolean; // regenerate even if one exists
  deliverEmail?: boolean;
  // When true, only generate for children whose local time has reached their
  // pre-bedtime window (the hourly, timezone-sharded cron). When false/omitted,
  // process every eligible child (a manual "generate all" / single-child run).
  dueOnly?: boolean;
  now?: Date;
}): Promise<NightlyRunResult> {
  const deliverEmail = opts?.deliverEmail ?? true;
  const now = opts?.now ?? new Date();

  const all = await prisma.child.findMany({
    where: {
      active: true,
      ...(opts?.childId ? { id: opts.childId } : {}),
      user: {
        subscription: {
          status: { in: ["ACTIVE", "TRIALING"] },
        },
      },
    },
    include: { user: { include: { subscription: true } } },
  });

  // Timezone shard: keep only children currently in their generation window.
  const children = opts?.dueOnly ? all.filter((c) => isChildDue(c, now)) : all;

  const result: NightlyRunResult = {
    attempted: 0,
    generated: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  for (const child of children) {
    result.attempted++;
    const forDateStr = nightDateString(child.timezone, now);
    const forDate = new Date(`${forDateStr}T00:00:00.000Z`);

    try {
      const existing = await prisma.story.findUnique({
        where: { childId_forDate: { childId: child.id, forDate } },
      });
      if (existing && !opts?.force && existing.status !== "FAILED") {
        result.skipped++;
        result.details.push({ childId: child.id, status: "skipped-exists" });
        continue;
      }

      const plan = planFor(child.user.subscription?.plan ?? "STANDARD");

      // Mark as generating (upsert so re-runs are clean).
      const story = await prisma.story.upsert({
        where: { childId_forDate: { childId: child.id, forDate } },
        create: { childId: child.id, forDate, status: "GENERATING" },
        update: { status: "GENERATING", error: null },
      });

      const prefs = StoryPreferencesSchema.parse(child.preferences);
      const { seed } = makeNightlySeed();

      const req: StoryRequest = {
        child: {
          name: child.name,
          pronouns: child.pronouns,
          ageBand: ageBandFromBirthYear(child.birthYear),
          readingLevel: child.readingLevel as StoryRequest["child"]["readingLevel"],
        },
        preferences: prefs,
        continuity: safeContinuity(child.continuity),
        forDate: forDateStr,
        seed,
      };

      const composed = await composeStory(req, {
        withNarration: plan.withNarration,
        withIllustrations: plan.withIllustrations,
      });

      // Persist story + assets + continuity in one go.
      await prisma.$transaction(async (tx) => {
        await tx.storyAsset.deleteMany({ where: { storyId: story.id } });

        await tx.story.update({
          where: { id: story.id },
          data: {
            status: "READY",
            title: composed.title,
            synopsis: composed.synopsis,
            bodyMarkdown: composed.bodyMarkdown,
            wordCount: composed.wordCount,
            readMinutes: composed.readMinutes,
            seed,
            model: composed.model,
            themeOfNight: prefs.themes[0],
            promptMeta: { plan: plan.id },
          },
        });

        if (composed.narration) {
          await tx.storyAsset.create({
            data: {
              storyId: story.id,
              type: "AUDIO",
              url: composed.narration.url,
              meta: { voice: composed.narration.voice },
            },
          });
        }
        for (const img of composed.illustrations) {
          await tx.storyAsset.create({
            data: {
              storyId: story.id,
              type: "IMAGE",
              url: img.url,
              sceneIndex: img.sceneIndex,
              meta: { prompt: img.prompt },
            },
          });
        }

        await tx.child.update({
          where: { id: child.id },
          data: {
            continuity: updateContinuity(child.continuity, forDateStr, composed),
          },
        });
      });

      // Deliver by email (best-effort).
      if (deliverEmail && child.user.email) {
        try {
          await sendStoryReadyEmail({
            to: child.user.email,
            childName: child.name,
            title: composed.title,
            synopsis: composed.synopsis,
            readUrl: `${APP_URL}/dashboard/story/${story.id}`,
          });
          await prisma.story.update({
            where: { id: story.id },
            data: { status: "DELIVERED", deliveredAt: new Date() },
          });
        } catch (e) {
          console.error("[nightly] email failed:", (e as Error).message);
        }
      }

      result.generated++;
      result.details.push({ childId: child.id, status: "generated" });
    } catch (e) {
      result.failed++;
      const message = (e as Error).message;
      result.details.push({ childId: child.id, status: "failed", error: message });
      await prisma.story
        .update({
          where: { childId_forDate: { childId: child.id, forDate } },
          data: { status: "FAILED", error: message },
        })
        .catch(() => {});
      console.error(`[nightly] child ${child.id} failed:`, message);
    }
  }

  return result;
}

function safeContinuity(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  return value as StoryRequest["continuity"];
}
