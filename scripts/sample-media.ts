/**
 * Exercise the Plus media pipeline (storage → narration → illustrations) with
 * the mock providers — no paid API keys needed.
 *
 *   npm run media:sample
 *
 * Writes a silent audio clip and placeholder illustrations to
 * public/generated/ and prints their URLs. Swap TTS_PROVIDER / IMAGE_PROVIDER
 * to openai/elevenlabs/replicate (with keys) to test the real ones.
 */
import "dotenv/config";
import { narrateStory } from "../src/lib/story-engine/narrate";
import { illustrateStory } from "../src/lib/story-engine/illustrate";
import type { GeneratedStory } from "../src/lib/story-engine";

process.env.TTS_PROVIDER = process.env.TTS_PROVIDER || "mock";
process.env.IMAGE_PROVIDER = process.env.IMAGE_PROVIDER || "mock";

const story: GeneratedStory = {
  title: "Amara and the Lantern Market",
  synopsis: "Amara and Pip help a shy little lantern remember how to glow.",
  scenes: [
    { heading: "A quiet evening", text: "Amara tiptoed to the window...", illustrationPrompt: "A child at a window at dusk with a small puppy" },
    { heading: "The market", text: "Lanterns floated softly above the stalls...", illustrationPrompt: "A gentle floating lantern market at night" },
    { heading: "Goodnight", text: "And with a yawn, Amara drifted to sleep...", illustrationPrompt: "A child asleep under a warm glowing lantern" },
  ],
  continuityNote: "Pip the puppy is a returning companion.",
};

async function main() {
  console.log(`TTS_PROVIDER=${process.env.TTS_PROVIDER}  IMAGE_PROVIDER=${process.env.IMAGE_PROVIDER}\n`);

  const narration = await narrateStory(story);
  console.log("Narration:", narration ?? "(none)");

  const images = await illustrateStory(story);
  console.log(`\nIllustrations (${images.length}):`);
  for (const img of images) console.log(`  scene ${img.sceneIndex}: ${img.url}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
