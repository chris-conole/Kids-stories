import { newKey, putObject } from "../storage";
import { placeholderSvg } from "./mock-media";
import type { GeneratedStory } from "./types";

/**
 * Illustration adapter (Plus tier). One soft, storybook image per scene.
 * Provider-agnostic via IMAGE_PROVIDER:
 *   - "none"      → skip
 *   - "mock"      → placeholder SVG cards, to exercise the pipeline
 *   - "openai"    → OpenAI Images (gpt-image-1)
 *   - "replicate" → any Replicate image model
 *
 * A shared house style is prefixed to every scene so a child's story looks like
 * one coherent book. IMAGE_MAX caps how many scenes get illustrated (cost).
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

  const max = Number(process.env.IMAGE_MAX) || 6;
  const scenes = story.scenes
    .map((s, i) => ({ i, prompt: s.illustrationPrompt }))
    .filter((s): s is { i: number; prompt: string } => Boolean(s.prompt))
    .slice(0, max);

  const results: Illustration[] = [];
  for (const scene of scenes) {
    const prompt = buildImagePrompt(scene.prompt);
    try {
      const { bytes, contentType, ext } =
        provider === "mock"
          ? { bytes: placeholderSvg(scene.prompt, scene.i), contentType: "image/svg+xml", ext: "svg" }
          : provider === "openai"
            ? await genOpenAI(prompt)
            : provider === "replicate"
              ? await genReplicate(prompt)
              : (() => {
                  throw new Error(`Unknown IMAGE_PROVIDER: ${provider}`);
                })();

      const stored = await putObject(newKey("images", ext), bytes, contentType);
      results.push({ sceneIndex: scene.i, url: stored.url, prompt: scene.prompt });
    } catch (e) {
      // One failed image shouldn't lose the others (or the story text).
      console.error(`[illustrate] scene ${scene.i} failed:`, (e as Error).message);
    }
  }
  return results;
}

interface RawImage {
  bytes: Uint8Array;
  contentType: string;
  ext: string;
}

async function genOpenAI(prompt: string): Promise<RawImage> {
  const key = process.env.IMAGE_API_KEY;
  if (!key) throw new Error("IMAGE_API_KEY is not set for openai");
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.IMAGE_MODEL || "gpt-image-1",
      prompt,
      size: "1024x1024",
      n: 1,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI image failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI image returned no data");
  return { bytes: Uint8Array.from(Buffer.from(b64, "base64")), contentType: "image/png", ext: "png" };
}

async function genReplicate(prompt: string): Promise<RawImage> {
  const key = process.env.IMAGE_API_KEY;
  if (!key) throw new Error("IMAGE_API_KEY is not set for replicate");
  const model = process.env.IMAGE_MODEL || "black-forest-labs/flux-schnell";

  // Create the prediction.
  const create = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "wait", // ask Replicate to hold the connection until done
    },
    body: JSON.stringify({ input: { prompt, aspect_ratio: "1:1" } }),
  });
  if (!create.ok) throw new Error(`Replicate create failed (${create.status}): ${await create.text()}`);
  let prediction = await create.json();

  // Poll if it isn't finished yet.
  const started = Date.now();
  while (
    prediction.status !== "succeeded" &&
    prediction.status !== "failed" &&
    prediction.status !== "canceled"
  ) {
    if (Date.now() - started > 90_000) throw new Error("Replicate timed out");
    await new Promise((r) => setTimeout(r, 1500));
    const poll = await fetch(prediction.urls.get, {
      headers: { Authorization: `Bearer ${key}` },
    });
    prediction = await poll.json();
  }
  if (prediction.status !== "succeeded") {
    throw new Error(`Replicate prediction ${prediction.status}: ${prediction.error ?? ""}`);
  }

  const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  if (!output) throw new Error("Replicate returned no output");
  // Download the produced image and re-host it in our storage for a stable URL.
  const img = await fetch(output);
  if (!img.ok) throw new Error(`Fetching Replicate output failed (${img.status})`);
  return {
    bytes: new Uint8Array(await img.arrayBuffer()),
    contentType: "image/webp",
    ext: "webp",
  };
}
