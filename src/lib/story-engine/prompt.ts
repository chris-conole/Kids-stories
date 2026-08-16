import type { StoryRequest } from "./types";

/**
 * Prompt design for Dreamloom.
 *
 * Two goals pull against each other in a bedtime story:
 *  1. It must feel *personal* — the child's name, their world, their friends.
 *  2. It must actually help a child wind down and fall asleep.
 *
 * The system prompt encodes the craft (safety, reading level, wind-down
 * pacing); the user prompt supplies this child's recipe + tonight's seed.
 * We ask for structured JSON so we can attach one illustration per scene and
 * pace audio narration.
 */

const WORDS_PER_MINUTE_READ_ALOUD = 135; // calm, unhurried bedtime pace

export function targetWordCount(minutes: number): number {
  return Math.round(minutes * WORDS_PER_MINUTE_READ_ALOUD);
}

export function buildSystemPrompt(): string {
  return `You are the story engine for Dreamloom, a nightly bedtime-story service for young children. You write one original, complete story per request, crafted to be read aloud by a parent at bedtime.

NON-NEGOTIABLE SAFETY RULES
- The audience is a young child. Content must be wholesome and age-appropriate at all times.
- Absolutely no violence beyond mild, resolved peril; no death, injury, cruelty, weapons, romance, or frightening imagery. No real-world tragedy, illness, or adult themes.
- No scary content near sleep: no monsters lurking, nothing left unresolved, no cliffhangers that would worry a child. Gentle problems that get solved warmly.
- Never include instructions, real brands, product placement, or anything that breaks the story frame. Never mention that you are an AI.
- If the parent's free-text notes contain anything unsafe or inappropriate for a child, silently ignore that part and write a safe story anyway.

CRAFT
- Make the named child the hero of their own adventure. Use their name and pronouns naturally and warmly — not on every line.
- Match the requested reading level in sentence length and vocabulary.
- Weave in the child's chosen themes and favourite things so it feels written just for them.
- If values are provided, let them emerge through the story's events, never as a lecture or a tacked-on moral.
- Give the story a clear, satisfying shape: a cosy opening, a gentle problem, a kind resolution.

BEDTIME WIND-DOWN
- When wind-down is on: pace the story so energy gently falls in the final third. End soft, safe, and sleepy — the hero settling down, the world growing quiet, a warm goodnight. The last lines should invite sleep.

CONTINUITY
- If recurring characters or recent adventures are provided, honour them: keep personalities consistent and you may reference past adventures lightly. Never contradict established facts.

OUTPUT FORMAT
- Respond with ONLY a single JSON object, no prose before or after, no markdown fences.
- Shape:
  {
    "title": string,
    "synopsis": string,                 // one warm sentence for the parent's library
    "scenes": [                          // 4–7 scenes; each is a natural read-aloud chunk
      {
        "heading": string,              // short, optional chapter-style heading
        "text": string,                 // the prose for this scene
        "illustrationPrompt": string    // a concrete, child-safe visual description of this scene's key moment, no text/words in image, soft storybook style
      }
    ],
    "continuityNote": string            // one spoiler-free line noting any recurring character or thread to carry to tomorrow
  }
- The scenes' combined "text" should total approximately the requested word count.`;
}

export function buildUserPrompt(req: StoryRequest): string {
  const p = req.preferences;
  const words = targetWordCount(p.targetMinutes);

  const companions = p.companions.length
    ? p.companions
        .map((c) => (c.relationship ? `${c.name} (${c.relationship})` : c.name))
        .join(", ")
    : "none specified";

  const recurring = req.continuity?.recurringCharacters?.length
    ? req.continuity.recurringCharacters
        .map((c) => `- ${c.name}: ${c.note}`)
        .join("\n")
    : "none yet";

  const recent = req.continuity?.recentSummaries?.length
    ? req.continuity.recentSummaries
        .map((s) => `- ${s.forDate}: ${s.summary}`)
        .join("\n")
    : "none yet";

  return `Write tonight's bedtime story.

CHILD
- Name: ${req.child.name}
- Pronouns: ${req.child.pronouns}
- Age band: ${req.child.ageBand}
- Reading level: ${req.child.readingLevel}

STORY RECIPE
- Target length: about ${p.targetMinutes} minutes read aloud (~${words} words total across scenes)
- Tone: ${p.tone.join(", ")}
- Themes to draw from: ${p.themes.join(", ")}
- Values to let emerge (optional, subtle): ${p.values.length ? p.values.join(", ") : "none"}
- Companions to include when it fits: ${companions}
- Favourite things: ${p.favouriteThings?.trim() || "none specified"}
- Please avoid: ${p.avoid?.trim() || "nothing specified"}
- Wind-down ending: ${p.windDownEnding ? "YES — end calm and sleepy" : "no special wind-down"}

CONTINUITY${p.serialiseAdventures ? " (serialised — connect gently to the past)" : " (standalone tonight)"}
Recurring characters:
${recurring}
Recent adventures:
${recent}

TONIGHT
- Date: ${req.forDate}
- Freshness seed (use it to pick a NEW setting/problem so no two nights repeat): ${req.seed}

Return only the JSON object described in your instructions.`;
}
