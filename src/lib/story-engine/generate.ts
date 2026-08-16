import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import { GeneratedStorySchema, type GeneratedStory, type StoryRequest } from "./types";

const MODEL = process.env.STORY_MODEL || "claude-opus-4-8";

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

/** Pull the first balanced JSON object out of a model response. */
function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in model output");
  }
  return text.slice(start, end + 1);
}

/**
 * Generate one night's story with Claude. Long-form creative writing with a
 * generous token budget; we parse and validate the structured result.
 */
export async function generateStory(req: StoryRequest): Promise<GeneratedStory> {
  const system = buildSystemPrompt();
  const user = buildUserPrompt(req);

  const message = await client().messages.create({
    model: MODEL,
    max_tokens: 8000,
    // A little warmth for creativity, but not so much it drifts off-brief.
    temperature: 0.9,
    system,
    messages: [{ role: "user", content: user }],
  });

  const raw = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch (e) {
    throw new Error(
      `Failed to parse story JSON: ${(e as Error).message}\n---\n${raw.slice(0, 500)}`
    );
  }

  const result = GeneratedStorySchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Story failed schema validation: ${result.error.message}`);
  }
  return result.data;
}

export { MODEL as STORY_MODEL };
