import { randomBytes } from "crypto";
import { GeneratedStory } from "./types";

/**
 * A short, human-readable nightly seed. Fed to the model to nudge it toward a
 * new setting/problem each night so stories never feel repetitive.
 */
const SETTINGS = [
  "a floating lantern market",
  "a sleepy seaside town",
  "the branches of the tallest tree",
  "a snow-hushed valley",
  "a garden that only wakes at dusk",
  "an island shaped like a whale",
  "a library of soft, glowing books",
  "a meadow full of humming bees",
  "a station where night trains rest",
  "a hill above the clouds",
];

const SPARKS = [
  "a lost button that hums a tune",
  "a door that only opens with a kind word",
  "a star that fell into a teacup",
  "a map drawn in dandelion seeds",
  "a very shy little cloud",
  "a bridge that needs one more brick",
  "a lantern that has forgotten how to glow",
  "a small creature who cannot find its way home",
  "a song that everyone half-remembers",
  "a puzzle box that giggles when you shake it",
];

function pick<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)];
}

/** Deterministic-ish PRNG from a hex seed so seeds are reproducible if needed. */
function rngFromHex(hex: string): () => number {
  let s = parseInt(hex.slice(0, 8), 16) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function makeNightlySeed(): { seed: string; hint: string } {
  const hex = randomBytes(6).toString("hex");
  const rnd = rngFromHex(hex);
  const hint = `Setting spark: ${pick(SETTINGS, rnd)}. Story spark: ${pick(SPARKS, rnd)}.`;
  return { seed: `${hex} — ${hint}`, hint };
}

/** Assemble the full markdown body from validated scenes. */
export function scenesToMarkdown(story: GeneratedStory): string {
  const parts: string[] = [`# ${story.title}`, ""];
  for (const scene of story.scenes) {
    if (scene.heading) parts.push(`## ${scene.heading}`, "");
    parts.push(scene.text.trim(), "");
  }
  return parts.join("\n").trim();
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
