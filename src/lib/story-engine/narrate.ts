import type { GeneratedStory } from "./types";

/**
 * Audio narration adapter (Plus tier).
 *
 * Deliberately provider-agnostic: narration is a nice-to-have that should not
 * couple the app to any one vendor. Set TTS_PROVIDER + TTS_API_KEY to switch.
 * The default ("none") returns null so the rest of the pipeline keeps working
 * before you've chosen a voice provider.
 *
 * To implement a provider, produce an audio file (mp3), upload it to your
 * object storage / CDN, and return the public URL. The nightly job stores it
 * as a StoryAsset(type=AUDIO).
 */

export interface NarrationResult {
  url: string;
  durationSeconds?: number;
  voice?: string;
}

/** Flatten scenes into a single narration script with gentle pauses. */
export function narrationScript(story: GeneratedStory): string {
  const lines: string[] = [story.title, ""];
  for (const scene of story.scenes) {
    lines.push(scene.text.trim(), "");
  }
  return lines.join("\n").trim();
}

export async function narrateStory(
  story: GeneratedStory
): Promise<NarrationResult | null> {
  const provider = process.env.TTS_PROVIDER || "none";
  if (provider === "none") return null;

  const script = narrationScript(story);
  const voice = process.env.TTS_VOICE || "calm-female";

  switch (provider) {
    case "openai":
    case "elevenlabs":
      // Implement the vendor call here, upload the result, return its URL.
      // Left as an adapter so you can drop in your preferred voice + storage.
      throw new Error(
        `TTS_PROVIDER="${provider}" selected but not yet implemented. ` +
          `Add the vendor call in src/lib/story-engine/narrate.ts. Script length: ${script.length} chars.`
      );
    default:
      throw new Error(`Unknown TTS_PROVIDER: ${provider}`);
  }
}
