import { newKey, putObject } from "../storage";
import { chunkText } from "./chunk";
import { silentWav } from "./mock-media";
import type { GeneratedStory } from "./types";

/**
 * Audio narration adapter (Plus tier). Provider-agnostic via TTS_PROVIDER:
 *   - "none"  → skip narration
 *   - "mock"  → a silent clip, to exercise the pipeline without keys
 *   - "openai"     → OpenAI /v1/audio/speech
 *   - "elevenlabs" → ElevenLabs text-to-speech
 *
 * Long stories exceed a single request's char limit, so the script is chunked
 * and the resulting audio segments concatenated. MP3/WAV frames are
 * self-contained, so a byte concat plays back fine for a bedtime clip.
 */

export interface NarrationResult {
  url: string;
  durationSeconds?: number;
  voice?: string;
}

/** Flatten scenes into a single narration script. */
export function narrationScript(story: GeneratedStory): string {
  const lines: string[] = [story.title, ""];
  for (const scene of story.scenes) lines.push(scene.text.trim(), "");
  return lines.join("\n").trim();
}

export async function narrateStory(
  story: GeneratedStory
): Promise<NarrationResult | null> {
  const provider = process.env.TTS_PROVIDER || "none";
  if (provider === "none") return null;

  const script = narrationScript(story);
  const voice = process.env.TTS_VOICE || "calm-female";

  if (provider === "mock") {
    const stored = await putObject(newKey("audio", "wav"), silentWav(3), "audio/wav");
    return { url: stored.url, voice: "mock", durationSeconds: 3 };
  }

  const chunks = chunkText(script, provider === "elevenlabs" ? 2400 : 3800);
  const segments: Uint8Array[] = [];
  for (const chunk of chunks) {
    segments.push(
      provider === "openai"
        ? await synthOpenAI(chunk, voice)
        : provider === "elevenlabs"
          ? await synthElevenLabs(chunk, voice)
          : (() => {
              throw new Error(`Unknown TTS_PROVIDER: ${provider}`);
            })()
    );
  }

  const audio = concat(segments);
  const stored = await putObject(newKey("audio", "mp3"), audio, "audio/mpeg");
  return { url: stored.url, voice };
}

/** OpenAI voices are named; map our friendly default to a gentle one. */
function openAiVoice(voice: string): string {
  const known = ["alloy", "echo", "fable", "onyx", "nova", "shimmer", "coral", "sage"];
  if (known.includes(voice)) return voice;
  return "shimmer"; // soft, warm — good for bedtime
}

async function synthOpenAI(input: string, voice: string): Promise<Uint8Array> {
  const key = process.env.TTS_API_KEY;
  if (!key) throw new Error("TTS_API_KEY is not set for openai");
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.TTS_MODEL || "gpt-4o-mini-tts",
      voice: openAiVoice(voice),
      input,
      response_format: "mp3",
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI TTS failed (${res.status}): ${await res.text()}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

async function synthElevenLabs(text: string, voiceId: string): Promise<Uint8Array> {
  const key = process.env.TTS_API_KEY;
  if (!key) throw new Error("TTS_API_KEY is not set for elevenlabs");
  const id = voiceId && voiceId !== "calm-female" ? voiceId : "EXAVITQu4vr4xnSDxMaL"; // "Sarah"
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${id}`, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: process.env.TTS_MODEL || "eleven_turbo_v2_5",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!res.ok) {
    throw new Error(`ElevenLabs TTS failed (${res.status}): ${await res.text()}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}
