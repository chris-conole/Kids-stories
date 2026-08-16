/**
 * Quick way to see the story engine in action without the DB or web app.
 *
 *   ANTHROPIC_API_KEY=... npm run story:sample
 *
 * Prints a full generated story to the console. Great for iterating on the
 * prompt in src/lib/story-engine/prompt.ts.
 */
import "dotenv/config";
import { composeStory, makeNightlySeed } from "../src/lib/story-engine";
import type { StoryRequest } from "../src/lib/story-engine";

async function main() {
  const { seed } = makeNightlySeed();

  const req: StoryRequest = {
    child: {
      name: "Amara",
      pronouns: "she/her",
      ageBand: "4–6",
      readingLevel: "early",
    },
    preferences: {
      targetMinutes: 15,
      tone: ["gentle", "magical"],
      themes: ["space", "animals"],
      values: ["kindness", "curiosity"],
      companions: [{ name: "Pip", relationship: "her puppy" }],
      favouriteThings: "the colour green, counting stars, and red wellies",
      avoid: "nothing scary, no thunderstorms",
      windDownEnding: true,
      serialiseAdventures: true,
    },
    forDate: new Date().toISOString().slice(0, 10),
    seed,
  };

  console.log("Seed:", seed, "\n");
  console.log("Generating…\n");

  const story = await composeStory(req, {
    withNarration: false,
    withIllustrations: false,
  });

  console.log("=".repeat(60));
  console.log(story.bodyMarkdown);
  console.log("=".repeat(60));
  console.log(
    `\n${story.wordCount} words · ~${story.readMinutes} min · model ${story.model}`
  );
  console.log("Synopsis:", story.synopsis);
  if (story.continuityNote) console.log("Continuity:", story.continuityNote);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
