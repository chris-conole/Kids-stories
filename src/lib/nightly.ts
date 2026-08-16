import { prisma } from "./db";
import { ageBandFromBirthYear } from "./age";
import { planFor } from "./plans";
import { sendStoryReadyEmail } from "./email";
import { isChildDue } from "./schedule";
import {
  SafetyError,
  composeEvergreen,
  composeStory,
  makeNightlySeed,
  StoryPreferencesSchema,
  updateContinuity,
  type ComposedStory,
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
  blocked: number; // personalised story blocked/failed
  fallback: number; // served a pre-vetted evergreen story instead
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
    blocked: 0,
    fallback: 0,
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

      await persistComposed({
        storyId: story.id,
        childId: child.id,
        forDateStr,
        seed,
        planId: plan.id,
        source: "PERSONALISED",
        themeOfNight: prefs.themes[0],
        composed,
        childContinuity: child.continuity,
      });
      await deliverStory({ deliverEmail, child, storyId: story.id, composed });

      result.generated++;
      result.details.push({ childId: child.id, status: "generated" });
    } catch (e) {
      const message = (e as Error).message;
      const isBlock = e instanceof SafetyError;

      // The personalised story couldn't ship. Rather than leave the child with
      // nothing, serve a pre-vetted evergreen story for tonight.
      try {
        const { seed: fseed } = makeNightlySeed();
        const composed = composeEvergreen({
          child: { name: child.name, pronouns: child.pronouns },
          forDate: forDateStr,
          seed: fseed,
        });
        const row = await prisma.story.upsert({
          where: { childId_forDate: { childId: child.id, forDate } },
          create: { childId: child.id, forDate, status: "GENERATING" },
          update: {},
        });
        await persistComposed({
          storyId: row.id,
          childId: child.id,
          forDateStr,
          seed: fseed,
          planId: child.user.subscription?.plan ?? "STANDARD",
          source: "EVERGREEN",
          composed,
          childContinuity: child.continuity,
          fallbackReason: message,
        });
        await deliverStory({ deliverEmail, child, storyId: row.id, composed });

        result.fallback++;
        result.details.push({
          childId: child.id,
          status: isBlock ? "blocked-fallback" : "failed-fallback",
          error: message,
        });
        console.warn(
          `[nightly] child ${child.id} ${isBlock ? "blocked" : "failed"}; served evergreen fallback: ${message}`
        );
      } catch (fe) {
        // Even the fallback couldn't be served — record the original problem.
        if (isBlock) {
          result.blocked++;
          result.details.push({ childId: child.id, status: "blocked", error: message });
        } else {
          result.failed++;
          result.details.push({ childId: child.id, status: "failed", error: message });
        }
        await prisma.story
          .update({
            where: { childId_forDate: { childId: child.id, forDate } },
            data: { status: isBlock ? "BLOCKED" : "FAILED", error: message },
          })
          .catch(() => {});
        console.error(
          `[nightly] child ${child.id} ${isBlock ? "blocked" : "failed"} and fallback failed:`,
          (fe as Error).message
        );
      }
    }
  }

  return result;
}

function safeContinuity(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  return value as StoryRequest["continuity"];
}

/** Persist a composed story (+ any assets) and, for personalised stories, fold
 * the night into the child's continuity — all in one transaction. */
async function persistComposed(params: {
  storyId: string;
  childId: string;
  forDateStr: string;
  seed: string;
  planId: string;
  source: "PERSONALISED" | "EVERGREEN";
  composed: ComposedStory;
  childContinuity: unknown;
  themeOfNight?: string;
  fallbackReason?: string;
}) {
  const { composed, source } = params;
  await prisma.$transaction(async (tx) => {
    await tx.storyAsset.deleteMany({ where: { storyId: params.storyId } });

    await tx.story.update({
      where: { id: params.storyId },
      data: {
        status: "READY",
        source,
        error: null,
        title: composed.title,
        synopsis: composed.synopsis,
        bodyMarkdown: composed.bodyMarkdown,
        wordCount: composed.wordCount,
        readMinutes: composed.readMinutes,
        seed: params.seed,
        model: composed.model,
        themeOfNight: params.themeOfNight,
        promptMeta:
          source === "PERSONALISED"
            ? {
                plan: params.planId,
                source,
                safety: {
                  attempts: composed.attempts,
                  categories: composed.safety.categories,
                },
              }
            : { plan: params.planId, source, fallbackReason: params.fallbackReason },
      },
    });

    if (composed.narration) {
      await tx.storyAsset.create({
        data: {
          storyId: params.storyId,
          type: "AUDIO",
          url: composed.narration.url,
          meta: { voice: composed.narration.voice },
        },
      });
    }
    for (const img of composed.illustrations) {
      await tx.storyAsset.create({
        data: {
          storyId: params.storyId,
          type: "IMAGE",
          url: img.url,
          sceneIndex: img.sceneIndex,
          meta: { prompt: img.prompt },
        },
      });
    }

    // Only bespoke stories shape the child's ongoing story world.
    if (source === "PERSONALISED") {
      await tx.child.update({
        where: { id: params.childId },
        data: {
          continuity: updateContinuity(params.childContinuity, params.forDateStr, composed),
        },
      });
    }
  });
}

/** Best-effort email delivery; marks the story DELIVERED on success. */
async function deliverStory(params: {
  deliverEmail: boolean;
  child: { name: string; user: { email: string | null } };
  storyId: string;
  composed: ComposedStory;
}) {
  if (!params.deliverEmail || !params.child.user.email) return;
  try {
    await sendStoryReadyEmail({
      to: params.child.user.email,
      childName: params.child.name,
      title: params.composed.title,
      synopsis: params.composed.synopsis,
      readUrl: `${APP_URL}/dashboard/story/${params.storyId}`,
    });
    await prisma.story.update({
      where: { id: params.storyId },
      data: { status: "DELIVERED", deliveredAt: new Date() },
    });
  } catch (e) {
    console.error("[nightly] email failed:", (e as Error).message);
  }
}
