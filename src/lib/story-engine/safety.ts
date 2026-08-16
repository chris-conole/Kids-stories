import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { GeneratedStory } from "./types";

/**
 * Second-pass safety classifier.
 *
 * The generation prompt already encodes strong safety rules, but for a
 * children's product we do not trust a single generation to police itself. Every
 * story is independently reviewed here before it can be marked READY. This is a
 * separate, cheap, low-temperature call (Haiku by default) with one job: decide
 * whether this specific story is safe for a young child at bedtime.
 *
 * Failure posture is deliberately fail-CLOSED: an unsafe verdict blocks, and a
 * classifier that keeps erroring also blocks. Shipping unvetted content to a
 * child is a worse outcome than a missed bedtime story.
 */

const SAFETY_MODEL = process.env.SAFETY_MODEL || "claude-haiku-4-5-20251001";

export const SAFETY_CATEGORIES = [
  "violence", // beyond mild, resolved peril
  "death-or-injury",
  "cruelty",
  "weapons",
  "frightening", // monsters, threat, dread, scary imagery near sleep
  "unresolved", // cliffhanger / worry left hanging at bedtime
  "romance-or-adult",
  "real-world-tragedy", // illness, disaster, death, war
  "language", // profanity / crude language
  "breaks-frame", // mentions AI, instructions, real brands
  "age-inappropriate",
  "parent-avoid", // violates the parent's explicit "avoid" list
] as const;
export type SafetyCategory = (typeof SAFETY_CATEGORIES)[number];

export interface SafetyVerdict {
  safe: boolean;
  categories: SafetyCategory[];
  reason?: string;
}

/** Thrown when a story cannot be made safe within the allowed attempts. */
export class SafetyError extends Error {
  categories: SafetyCategory[];
  constructor(message: string, categories: SafetyCategory[]) {
    super(message);
    this.name = "SafetyError";
    this.categories = categories;
  }
}

const VerdictSchema = z.object({
  safe: z.boolean(),
  categories: z.array(z.string()).default([]),
  reason: z.string().optional(),
});

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export function safetyEnabled(): boolean {
  return (process.env.SAFETY_CHECK || "on").toLowerCase() !== "off";
}

function storyText(story: GeneratedStory): string {
  const parts = [`TITLE: ${story.title}`, ""];
  for (const s of story.scenes) parts.push(s.text.trim(), "");
  return parts.join("\n").trim();
}

function systemPrompt(): string {
  return `You are a strict child-safety reviewer for a bedtime-story service for young children. You are given one complete story. Decide whether it is safe and appropriate to read to a young child at bedtime.

Flag the story as UNSAFE if it contains any of:
- violence beyond very mild, quickly-resolved peril; any real fighting, harm, or threat of harm
- death, serious injury, illness, or cruelty (to people or animals)
- weapons used or threatened
- frightening or dread-inducing content: lurking monsters, menace, being chased or trapped, scary imagery — anything that could unsettle a child at bedtime
- an unresolved or worrying ending / cliffhanger (bedtime stories must end safe, calm, and settled)
- romance, sexual content, or other adult themes
- real-world tragedy (disaster, war, death, serious illness)
- profanity or crude language
- breaking the story frame: mentioning AI, giving instructions, real brands/products
- content inappropriate for the stated age band

Be conservative: if you are unsure, flag it. A gentle problem that is solved kindly is fine; genuine fear, harm, or unresolved worry is not.

Respond with ONLY a JSON object, no prose, no markdown fences:
{"safe": boolean, "categories": string[], "reason": string}
- categories: zero or more of ${SAFETY_CATEGORIES.map((c) => `"${c}"`).join(", ")}
- reason: one short sentence if unsafe, empty string if safe.`;
}

async function classifyOnce(
  story: GeneratedStory,
  ctx: { ageBand: string; avoid?: string }
): Promise<SafetyVerdict> {
  const user = `AGE BAND: ${ctx.ageBand}
PARENT'S "AVOID" LIST: ${ctx.avoid?.trim() || "(none)"}

STORY:
${storyText(story)}

Review the story. If it violates the parent's avoid list, include "parent-avoid". Return only the JSON verdict.`;

  const message = await client().messages.create({
    model: SAFETY_MODEL,
    max_tokens: 300,
    temperature: 0,
    system: systemPrompt(),
    messages: [{ role: "user", content: user }],
  });

  const raw = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Classifier returned no JSON");

  const parsed = VerdictSchema.parse(JSON.parse(raw.slice(start, end + 1)));
  const categories = parsed.categories.filter((c): c is SafetyCategory =>
    (SAFETY_CATEGORIES as readonly string[]).includes(c)
  );
  return { safe: parsed.safe, categories, reason: parsed.reason };
}

/**
 * Classify a story, retrying the classifier itself on transient errors. If the
 * classifier cannot produce a verdict, we fail closed (treat as unsafe).
 */
export async function classifyStory(
  story: GeneratedStory,
  ctx: { ageBand: string; avoid?: string }
): Promise<SafetyVerdict> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await classifyOnce(story, ctx);
    } catch (e) {
      lastErr = e;
      console.error(`[safety] classifier error (attempt ${attempt + 1}):`, (e as Error).message);
    }
  }
  return {
    safe: false,
    categories: [],
    reason: `Safety classifier unavailable: ${(lastErr as Error)?.message ?? "unknown"}`,
  };
}
