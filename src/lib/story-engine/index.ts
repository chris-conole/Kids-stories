import { generateStory, STORY_MODEL } from "./generate";
import { pickEvergreenStory, type EvergreenRequest } from "./evergreen";
import { illustrateStory, type Illustration } from "./illustrate";
import { narrateStory, type NarrationResult } from "./narrate";
import {
  SafetyError,
  classifyStory,
  safetyEnabled,
  type SafetyVerdict,
} from "./safety";
import { countWords, scenesToMarkdown } from "./seeds";
import {
  ContinuitySchema,
  type Continuity,
  type GeneratedStory,
  type StoryRequest,
} from "./types";

export * from "./types";
export { makeNightlySeed } from "./seeds";
export { targetWordCount } from "./prompt";
export { SafetyError, classifyStory, safetyEnabled } from "./safety";
export type { SafetyVerdict, SafetyCategory } from "./safety";
export { pickEvergreenStory } from "./evergreen";
export type { EvergreenRequest } from "./evergreen";

export interface ComposedStory {
  model: string;
  title: string;
  synopsis: string;
  bodyMarkdown: string;
  wordCount: number;
  readMinutes: number;
  continuityNote?: string;
  raw: GeneratedStory;
  narration: NarrationResult | null;
  illustrations: Illustration[];
  safety: SafetyVerdict;
  attempts: number;
}

export interface ComposeOptions {
  withNarration: boolean; // Plus tier
  withIllustrations: boolean; // Plus tier
  // How many times to (re)generate if the safety classifier blocks a draft.
  maxSafetyAttempts?: number;
}

/**
 * Generate a story that passes the second-pass safety classifier. Each attempt
 * uses a fresh seed so a reroll actually differs. Throws SafetyError if no draft
 * clears review within the allowed attempts, so the caller can block (not ship)
 * the story. When safety is disabled (SAFETY_CHECK=off) a single draft is used.
 */
async function generateSafeStory(
  req: StoryRequest,
  maxAttempts: number
): Promise<{ story: GeneratedStory; safety: SafetyVerdict; attempts: number }> {
  const ctx = { ageBand: req.child.ageBand, avoid: req.preferences.avoid };

  if (!safetyEnabled()) {
    const story = await generateStory(req);
    return { story, safety: { safe: true, categories: [] }, attempts: 1 };
  }

  let lastVerdict: SafetyVerdict = { safe: false, categories: [] };
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Vary the seed on rerolls so we don't re-draw the same blocked story.
    const attemptReq =
      attempt === 1 ? req : { ...req, seed: `${req.seed} · reroll-${attempt}` };
    const story = await generateStory(attemptReq);
    const safety = await classifyStory(story, ctx);
    if (safety.safe) return { story, safety, attempts: attempt };

    lastVerdict = safety;
    console.warn(
      `[story-engine] draft blocked (attempt ${attempt}/${maxAttempts}): ` +
        `${safety.categories.join(", ") || "unspecified"} — ${safety.reason ?? ""}`
    );
  }

  throw new SafetyError(
    `Story blocked by safety review after ${maxAttempts} attempt(s): ${lastVerdict.reason ?? "unsafe"}`,
    lastVerdict.categories
  );
}

/**
 * Compose one complete night for a child: a safety-reviewed story (text always),
 * plus optional audio and illustrations for the Plus tier. Media is generated
 * best-effort — if a media provider fails, the story text still ships (a bedtime
 * story with no picture beats no bedtime story). If the story cannot pass safety
 * review, composeStory throws SafetyError and nothing is shipped.
 */
export async function composeStory(
  req: StoryRequest,
  opts: ComposeOptions
): Promise<ComposedStory> {
  const envAttempts = Number(process.env.SAFETY_MAX_ATTEMPTS);
  const maxAttempts =
    opts.maxSafetyAttempts ??
    (Number.isFinite(envAttempts) && envAttempts >= 1 ? envAttempts : 2);
  const { story, safety, attempts } = await generateSafeStory(req, maxAttempts);
  const bodyMarkdown = scenesToMarkdown(story);
  const wordCount = countWords(bodyMarkdown);
  const readMinutes = Math.max(1, Math.round(wordCount / 135));

  let narration: NarrationResult | null = null;
  let illustrations: Illustration[] = [];

  if (opts.withNarration) {
    try {
      narration = await narrateStory(story);
    } catch (e) {
      console.error("[story-engine] narration failed:", (e as Error).message);
    }
  }

  if (opts.withIllustrations) {
    try {
      illustrations = await illustrateStory(story);
    } catch (e) {
      console.error("[story-engine] illustration failed:", (e as Error).message);
    }
  }

  return {
    model: STORY_MODEL,
    title: story.title,
    synopsis: story.synopsis,
    bodyMarkdown,
    wordCount,
    readMinutes,
    continuityNote: story.continuityNote,
    raw: story,
    narration,
    illustrations,
    safety,
    attempts,
  };
}

/**
 * Assemble a pre-vetted evergreen story as a ComposedStory. Text-only and no
 * model/classifier call — this is the reliable fallback for a night when the
 * personalised story can't be produced, so it must not depend on any provider.
 */
export function composeEvergreen(req: EvergreenRequest): ComposedStory {
  const story = pickEvergreenStory(req);
  const bodyMarkdown = scenesToMarkdown(story);
  const wordCount = countWords(bodyMarkdown);
  const readMinutes = Math.max(1, Math.round(wordCount / 135));

  return {
    model: "evergreen",
    title: story.title,
    synopsis: story.synopsis,
    bodyMarkdown,
    wordCount,
    readMinutes,
    continuityNote: undefined,
    raw: story,
    narration: null,
    illustrations: [],
    safety: { safe: true, categories: [] }, // pre-vetted
    attempts: 0,
  };
}

/**
 * Fold tonight's result into the child's rolling continuity record, keeping it
 * small (recent 7 nights + up to 6 recurring characters).
 */
export function updateContinuity(
  prev: unknown,
  forDate: string,
  composed: ComposedStory
): Continuity {
  const base = ContinuitySchema.safeParse(prev);
  const current: Continuity = base.success
    ? base.data
    : { recurringCharacters: [], recentSummaries: [] };

  const recentSummaries = [
    { forDate, summary: composed.synopsis.slice(0, 200) },
    ...current.recentSummaries,
  ].slice(0, 7);

  return {
    recurringCharacters: current.recurringCharacters,
    recentSummaries,
  };
}
