import type { GeneratedStory } from "./types";

/**
 * The minimal input the fallback needs. Deliberately narrower than StoryRequest
 * so it can run even when full preference parsing was the thing that failed.
 * A StoryRequest is structurally assignable to this.
 */
export interface EvergreenRequest {
  child: { name: string; pronouns: string };
  forDate: string;
  seed: string;
}

/**
 * Evergreen fallback stories.
 *
 * When a personalised story can't be produced for a night — blocked by the
 * safety review, or a transient generation error — a child should still have a
 * gentle bedtime story. These are hand-written, pre-vetted, and lightly
 * personalised (the child's name and pronouns), so they bypass the model and
 * the classifier entirely and are always available at zero cost.
 *
 * Template tokens:
 *   {name}                         → child's first name
 *   {subj} {obj} {poss} {reflexive} and capitalised {Subj} {Poss}
 * Sentences after {subj} use past-tense action verbs only ("{subj} tiptoed"),
 * which are grammatical for she/he/they alike — so no verb-agreement bugs.
 */

interface PronounSet {
  subj: string;
  obj: string;
  poss: string;
  reflexive: string;
}

const PRONOUNS: Record<string, PronounSet> = {
  "she/her": { subj: "she", obj: "her", poss: "her", reflexive: "herself" },
  "he/him": { subj: "he", obj: "him", poss: "his", reflexive: "himself" },
  "they/them": { subj: "they", obj: "them", poss: "their", reflexive: "themselves" },
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function fill(text: string, name: string, p: PronounSet): string {
  return text
    .replace(/\{name\}/g, name)
    .replace(/\{Subj\}/g, cap(p.subj))
    .replace(/\{subj\}/g, p.subj)
    .replace(/\{obj\}/g, p.obj)
    .replace(/\{Poss\}/g, cap(p.poss))
    .replace(/\{poss\}/g, p.poss)
    .replace(/\{reflexive\}/g, p.reflexive);
}

interface EvergreenTemplate {
  id: string;
  title: string;
  synopsis: string;
  scenes: { heading: string; text: string }[];
}

const TEMPLATES: EvergreenTemplate[] = [
  {
    id: "sleepy-star",
    title: "{name} and the Sleepy Little Star",
    synopsis: "{name} helps a small, tired star find its way home to bed.",
    scenes: [
      {
        heading: "A light at the window",
        text: "One soft evening, {name} was curled up warm beneath a blanket when a tiny glow drifted past the window. It was a little star, no bigger than a firefly, and it looked ever so tired. {Subj} opened the window just a crack, and the star floated in and settled gently on {poss} pillow, blinking sleepily.",
      },
      {
        heading: "The long way home",
        text: "\"I've wandered too far,\" the little star whispered, \"and now I can't find my way back to the sky.\" {name} smiled kindly. \"Then I'll help you,\" {subj} said. Together they looked out at the night, where the other stars twinkled like a trail of breadcrumbs across the dark, quiet blue.",
      },
      {
        heading: "Following the glow",
        text: "The little star glowed a bit brighter, and {name} traced the path with {poss} finger — up past the sleepy rooftops, over the hushed and dreaming trees, all the way to a cosy gap in the sky where the star belonged. The moon nodded softly, as if to say, this way, this way.",
      },
      {
        heading: "Back where it belongs",
        text: "With a happy little shimmer, the star floated up and up, growing calmer with every drift, until it nestled back into its place among its friends. It gave one last twinkle — a thank you, just for {name}.",
      },
      {
        heading: "Goodnight",
        text: "{name} watched the sky grow still and slow. The blanket felt warmer now, and {poss} eyes felt heavy and soft. Outside, every star was home, and every star was resting. And so, with a small and peaceful sigh, {name} closed {poss} eyes and drifted off to sleep too. Goodnight, {name}. Goodnight, little star.",
      },
    ],
  },
  {
    id: "moon-garden",
    title: "{name} in the Moon's Quiet Garden",
    synopsis: "{name} tends a garden that only blooms in the gentle light of the moon.",
    scenes: [
      {
        heading: "A garden that wakes at night",
        text: "At the very edge of dreaming, there was a garden that only woke when the moon came out. Its flowers stayed folded up all day, waiting, and when the sky turned soft and silver, {name} tiptoed out to visit them. One by one, the petals opened just for {obj}.",
      },
      {
        heading: "Watering the sleepy flowers",
        text: "{name} carried a little watering can that caught the moonlight and made it shine. {Subj} gave each flower a gentle drink — the yawning daisies, the drowsy bluebells, the slow and stretching poppies. \"There you are,\" {subj} whispered. \"Rest well.\" Each flower nodded, heavy with sleep.",
      },
      {
        heading: "The quietest song",
        text: "As {name} worked, the garden began to hum the quietest song, softer than a breeze. The moths danced in slow circles, the grass swayed like a lullaby, and even the little stream seemed to move more gently, as if it too were getting ready to rest.",
      },
      {
        heading: "The last flower",
        text: "At the centre of the garden grew one great silver flower, the sleepiest of all. {name} sat beside it and watched its petals close, slow and calm, like a hand folding shut. The whole garden grew hushed and warm and still.",
      },
      {
        heading: "Goodnight",
        text: "The moon smiled down, pleased with all {name} had done. A warm and drowsy feeling wrapped around {obj} like the softest blanket. {name} gave a long, slow yawn, whispered goodnight to every sleeping flower, and let {poss} own eyes drift closed. Sleep well, {name}. The garden is resting, and so can you.",
      },
    ],
  },
  {
    id: "little-boat",
    title: "{name} and the Boat That Sailed to Sleep",
    synopsis: "{name} sails a gentle little boat across a calm sea of dreams.",
    scenes: [
      {
        heading: "A boat by the shore",
        text: "Down by a still and shining shore, a little wooden boat was waiting, rocking ever so softly on the quiet water. It had a small sail the colour of moonlight. {name} climbed aboard, and the boat set off all on its own, slow and smooth, into the calm.",
      },
      {
        heading: "The gentle sea",
        text: "There were no big waves here — only soft ripples that rocked the boat like a cradle. {name} lay back and watched the sky. The stars drifted by above, and the sea drifted by below, and everything moved slowly, slowly, in no hurry at all.",
      },
      {
        heading: "Friends along the way",
        text: "A sleepy seal popped up to say hello, then yawned and slipped away to rest. A line of little ducks paddled past, growing slower and slower, tucking their heads beneath their wings. {name} waved to each of {obj}, quiet as a whisper, so as not to wake the sea.",
      },
      {
        heading: "The island of rest",
        text: "At last the little boat drifted up to a soft, warm island where the sand was as gentle as a pillow. {name} stepped out and the boat rocked slowly behind {obj}, its work all done. Everything here was hushed and calm and kind.",
      },
      {
        heading: "Goodnight",
        text: "{name} lay down on the warm and quiet shore. The waves shushed softly, over and over, like the world breathing slow. {Poss} eyes grew heavy, {poss} thoughts grew soft, and the gentle sea rocked {obj} all the way down into a deep and happy sleep. Goodnight, {name}. Sail sweetly.",
      },
    ],
  },
];

/**
 * Pick and personalise an evergreen story. Deterministic from the night's seed
 * so a given night is stable on re-run, and it rotates through the pool rather
 * than always serving the same tale.
 */
export function pickEvergreenStory(req: EvergreenRequest): GeneratedStory {
  const p = PRONOUNS[req.child.pronouns] ?? PRONOUNS["they/them"];
  const name = req.child.name;

  // Seed → stable index across the pool.
  const hashSource = `${req.forDate}:${req.seed}`;
  let hash = 0;
  for (let i = 0; i < hashSource.length; i++) {
    hash = (hash * 31 + hashSource.charCodeAt(i)) % 1_000_000;
  }
  const template = TEMPLATES[hash % TEMPLATES.length];

  return {
    title: fill(template.title, name, p),
    synopsis: fill(template.synopsis, name, p),
    scenes: template.scenes.map((s) => ({
      heading: s.heading,
      text: fill(s.text, name, p),
    })),
    continuityNote: undefined,
  };
}
