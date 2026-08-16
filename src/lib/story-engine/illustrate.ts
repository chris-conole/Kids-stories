import type { GeneratedStory } from "./types";

/**
 * Illustration adapter (Plus tier).
 *
 * One soft, storybook-style image per scene. Like narration, this is kept
 * provider-agnostic (IMAGE_PROVIDER + IMAGE_API_KEY) so illustrations are a
 * clean paid add-on that never blocks the core text pipeline.
 *
 * A consistent house style keeps a child's story visually coherent — we prefix
 * every scene prompt with the same style guide so all images feel like one book.
 */

export interface Illustration {
  sceneIndex: number;
  url: string;
  prompt: string;
}

const STYLE_GUIDE =
  "Soft, warm children's picture-book illustration. Gentle watercolour and " +
  "colored-pencil texture, rounded shapes, cosy dusk lighting, calm mood. " +
  "No text, letters, or words in the image. No scary or dark imagery.";

export function buildImagePrompt(scenePrompt: string): string {
  return `${STYLE_GUIDE}\nScene: ${scenePrompt}`;
}

export async function illustrateStory(
  story: GeneratedStory
): Promise<Illustration[]> {
  const provider = process.env.IMAGE_PROVIDER || "none";
  if (provider === "none") return [];

  const results: Illustration[] = [];
  for (let i = 0; i < story.scenes.length; i++) {
    const scene = story.scenes[i];
    if (!scene.illustrationPrompt) continue;
    const prompt = buildImagePrompt(scene.illustrationPrompt);

    switch (provider) {
      case "openai":
      case "replicate":
        // Implement the vendor call here, upload the image, push its URL.
        throw new Error(
          `IMAGE_PROVIDER="${provider}" selected but not yet implemented. ` +
            `Add the vendor call in src/lib/story-engine/illustrate.ts.`
        );
      default:
        throw new Error(`Unknown IMAGE_PROVIDER: ${provider}`);
    }
    // (unreachable until a provider is implemented)
    void prompt;
    void results;
  }
  return results;
}
