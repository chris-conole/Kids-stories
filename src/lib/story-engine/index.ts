import { generateStory, STORY_MODEL } from "./generate";
import { illustrateStory, type Illustration } from "./illustrate";
import { narrateStory, type NarrationResult } from "./narrate";
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
}

export interface ComposeOptions {
  withNarration: boolean; // Plus tier
  withIllustrations: boolean; // Plus tier
}

/**
 * Compose one complete night for a child: text always, plus optional audio and
 * illustrations for the Plus tier. Media is generated best-effort — if a media
 * provider fails, the story text still ships (a bedtime story with no picture
 * beats no bedtime story).
 */
export async function composeStory(
  req: StoryRequest,
  opts: ComposeOptions
): Promise<ComposedStory> {
  const story = await generateStory(req);
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
