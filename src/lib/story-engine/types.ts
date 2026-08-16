import { z } from "zod";

/**
 * StoryPreferences — the "recipe" a parent configures once during onboarding.
 * This is the single most important object in the product: it is what makes a
 * story feel like it was written for *this* child. Stored as JSON on Child.
 */

export const ReadingLevel = z.enum([
  "pre-reader", // 2–4: read aloud, very simple, repetition
  "early", // 4–6: short sentences, gentle plots
  "confident", // 6–8: richer vocabulary, chapters
  "advanced", // 8–10: longer arcs, more nuance
]);
export type ReadingLevel = z.infer<typeof ReadingLevel>;

export const Tone = z.enum([
  "gentle",
  "adventurous",
  "funny",
  "curious",
  "cosy",
  "magical",
]);
export type Tone = z.infer<typeof Tone>;

export const Theme = z.enum([
  "space",
  "dinosaurs",
  "fairies",
  "pirates",
  "animals",
  "ocean",
  "forest",
  "dragons",
  "vehicles",
  "sports",
  "everyday-adventures",
  "mystery",
  "friendship",
  "seasons",
  "fantasy-kingdoms",
]);
export type Theme = z.infer<typeof Theme>;

export const Value = z.enum([
  "kindness",
  "bravery",
  "sharing",
  "honesty",
  "curiosity",
  "resilience",
  "patience",
  "teamwork",
  "gratitude",
  "self-belief",
]);
export type Value = z.infer<typeof Value>;

/** A person, pet, or toy the child wants to appear in their stories. */
export const Companion = z.object({
  name: z.string().min(1).max(40),
  relationship: z.string().max(40).optional(), // "little brother", "dog", "teddy"
});
export type Companion = z.infer<typeof Companion>;

export const StoryPreferencesSchema = z.object({
  // Length target. 15 minutes read-aloud ≈ ~2,000–2,400 words.
  targetMinutes: z.number().int().min(5).max(20).default(15),

  tone: z.array(Tone).min(1).max(3).default(["gentle"]),
  themes: z.array(Theme).min(1).max(5),
  values: z.array(Value).max(3).default([]),

  companions: z.array(Companion).max(5).default([]),

  // Free-text extras from the parent, kept short and always safety-filtered.
  favouriteThings: z.string().max(300).optional(), // "loves trains and the colour green"
  avoid: z.string().max(300).optional(), // "no witches, nothing scary"

  // Bedtime wind-down: stories get calmer toward the end and close on a
  // soft, sleepy note. Almost always on for a bedtime product.
  windDownEnding: z.boolean().default(true),

  // Recurring cast + connected adventures across nights.
  serialiseAdventures: z.boolean().default(true),
});
export type StoryPreferences = z.infer<typeof StoryPreferencesSchema>;

/** Small, bounded continuity record so nights can connect without bloat. */
export const ContinuitySchema = z.object({
  recurringCharacters: z
    .array(z.object({ name: z.string(), note: z.string().max(140) }))
    .max(6)
    .default([]),
  recentSummaries: z
    .array(z.object({ forDate: z.string(), summary: z.string().max(200) }))
    .max(7)
    .default([]),
});
export type Continuity = z.infer<typeof ContinuitySchema>;

/** Everything the engine needs to generate one night's story. */
export interface StoryRequest {
  child: {
    name: string;
    pronouns: string;
    ageBand: string; // derived, e.g. "4–6"
    readingLevel: ReadingLevel;
  };
  preferences: StoryPreferences;
  continuity?: Continuity;
  forDate: string; // YYYY-MM-DD
  seed: string; // nightly randomness for variety
}

/** Structured result returned by the model, parsed and validated. */
export const GeneratedStorySchema = z.object({
  title: z.string(),
  synopsis: z.string(),
  // Scenes let us attach one illustration per scene and pace narration.
  scenes: z
    .array(
      z.object({
        heading: z.string().optional(),
        text: z.string(),
        illustrationPrompt: z.string().optional(),
      })
    )
    .min(1),
  // A one-line, spoiler-free note about recurring characters to store for
  // tomorrow's continuity.
  continuityNote: z.string().optional(),
});
export type GeneratedStory = z.infer<typeof GeneratedStorySchema>;
