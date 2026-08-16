/**
 * Demo seed for screenshots: a logged-in parent with a Plus subscription, a
 * child, a small library (incl. one evergreen "Cosy classic"), and a fully
 * illustrated + narrated latest story. No API keys required — the story is
 * hand-authored and the media are generated locally.
 */
import "dotenv/config";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { silentWav } from "../src/lib/story-engine/mock-media";

const prisma = new PrismaClient();
const PUB = join(process.cwd(), "public", "generated", "demo");
mkdirSync(PUB, { recursive: true });

function writeSvg(name: string, svg: string): string {
  writeFileSync(join(PUB, name), svg);
  return `/generated/demo/${name}`;
}

// ── Soft storybook illustrations (no external calls) ──
const nightSky = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="640" viewBox="0 0 1024 640">
<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2954"/><stop offset="1" stop-color="#5d5eb2"/></linearGradient></defs>
<rect width="1024" height="640" fill="url(#s)"/>
${Array.from({ length: 60 }, () => `<circle cx="${Math.random() * 1024 | 0}" cy="${Math.random() * 420 | 0}" r="${(Math.random() * 1.8 + 0.4).toFixed(1)}" fill="#fff" opacity="${(Math.random() * 0.7 + 0.3).toFixed(2)}"/>`).join("")}
<circle cx="820" cy="150" r="70" fill="#ffe3d1"/><circle cx="795" cy="135" r="70" fill="#5d5eb2"/>
<path d="M0 520 Q256 430 512 500 T1024 480 V640 H0 Z" fill="#1c1b39"/>
<path d="M0 560 Q300 500 560 560 T1024 545 V640 H0 Z" fill="#100f22"/></svg>`;

const sea = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="640" viewBox="0 0 1024 640">
<defs><linearGradient id="k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d3a79"/><stop offset="0.55" stop-color="#7b7ec6"/><stop offset="1" stop-color="#a3a7da"/></linearGradient></defs>
<rect width="1024" height="640" fill="url(#k)"/>
<circle cx="512" cy="150" r="60" fill="#fff4ec" opacity="0.9"/>
<g opacity="0.5" fill="#fff">${Array.from({ length: 8 }, (_, i) => `<ellipse cx="512" cy="${360 + i * 30}" rx="${40 + i * 30}" ry="6"/>`).join("")}</g>
<path d="M470 430 L554 430 L534 470 L490 470 Z" fill="#ffab7a"/><rect x="508" y="360" width="6" height="72" fill="#3d3a79"/>
<path d="M514 366 L560 420 L514 420 Z" fill="#fff4ec"/></svg>`;

const meadow = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="640" viewBox="0 0 1024 640">
<defs><linearGradient id="m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc9a8"/><stop offset="0.5" stop-color="#c9cceb"/><stop offset="1" stop-color="#a3a7da"/></linearGradient></defs>
<rect width="1024" height="640" fill="url(#m)"/>
<circle cx="200" cy="160" r="50" fill="#fff4ec" opacity="0.85"/>
<path d="M0 470 Q512 400 1024 470 V640 H0 Z" fill="#7b7ec6"/>
${Array.from({ length: 14 }, (_, i) => { const x = 60 + i * 68; return `<g transform="translate(${x} ${500 + (i % 3) * 20})"><rect x="-2" y="0" width="4" height="50" fill="#4a4796"/><circle cx="0" cy="-4" r="10" fill="${["#ff8c4b", "#ffe3d1", "#fff"][i % 3]}"/></g>`; }).join("")}
<g fill="#fff4ec" opacity="0.9">${Array.from({ length: 12 }, () => `<circle cx="${Math.random() * 1024 | 0}" cy="${200 + Math.random() * 200 | 0}" r="2.5"/>`).join("")}</g></svg>`;

const heroUrl = writeSvg("scene-1.svg", nightSky);
const seaUrl = writeSvg("scene-2.svg", sea);
const meadowUrl = writeSvg("scene-3.svg", meadow);

// ── The featured story ──
const STORY_MD = `# Amara and the Lantern Market

## A light at the window

One soft evening, when the sky had turned the colour of blackberries, Amara was curled beneath her blanket counting the first small stars. Her puppy, Pip, was a warm little curl at her feet, snoring the tiniest snores. Just as Amara's eyes began to feel heavy, a gentle light drifted past the window — golden, and slow, like a firefly that had swallowed a candle.

She sat up. Pip's ears went pop, straight into the air. The light bobbed twice, as if it were saying, *this way, this way*, and Amara, being a curious and kind sort of girl, slipped on her red wellies and tiptoed to the door.

## The floating market

Outside, the garden was not quite the garden anymore. Where the vegetable patch had been, there was now a long path of lanterns, floating just above the grass, and at the end of the path was a market — a wonderful, hushed little market that only came out at night. Stalls hung in the air like sleepy balloons. A badger sold moonberries. An owl in a striped scarf poured cups of warm starlight. Everything glowed, soft and green and gold.

"Welcome, welcome," whispered the lanterns, and they drew Amara gently in.

## The lantern who forgot

In the very middle of the market sat one small lantern, all on its own, and it was not glowing at all. It was grey, and quiet, and it looked ever so sad. "That's little Lumen," the badger murmured. "He's forgotten how to shine. And if a lantern can't shine by moonset, it can never light the way home."

Amara knelt down beside Lumen. "It's all right," she said softly. "I'll help you remember." Pip pressed his warm nose to the little lantern, which was exactly the kind thing a puppy would do.

## Remembering the light

"How does a lantern shine?" Amara wondered aloud. The owl leaned close. "A lantern shines," she said, "by remembering something warm." So Amara helped Lumen remember. She told him about Pip's cinnamon-toast smell in the morning. She told him about counting stars until the numbers went soft. She told him about the way her blanket felt, tucked right up under her chin.

And with each warm thing, a little glow came back — first a flicker, then a shimmer, then a steady, happy gold. Lumen was shining. The whole market gave the softest cheer, quiet as falling petals, so as not to wake the night.

## Goodnight

Lumen floated up, bright and sure now, and led all the lanterns in a slow and sleepy dance back along the path — past the badger, past the owl, past the moonberry stall — all the way to Amara's own front door. "Thank you," Lumen glowed, and it was the warmest thank-you Amara had ever felt.

She climbed back into bed. Pip turned three careful circles and settled at her feet. Outside, the little market dimmed itself down, lantern by lantern, the way a house goes quiet room by room at the end of a long, good day. Amara's eyes grew heavy, and warm, and slow. And somewhere out in the dark, one small lantern glowed on, keeping the way home safe and bright. Goodnight, Amara. Goodnight, Pip. Goodnight, little Lumen.`;

async function main() {
  // Clean prior demo rows for idempotency.
  await prisma.user.deleteMany({ where: { email: "demo@dreamloom.test" } });

  const user = await prisma.user.create({
    data: {
      email: "demo@dreamloom.test",
      name: "Sam",
      emailVerified: new Date(),
      subscription: {
        create: {
          plan: "PLUS",
          status: "ACTIVE",
          currentPeriodEnd: new Date(Date.now() + 24 * 864e5),
        },
      },
      sessions: {
        create: {
          sessionToken: "demo-session-token",
          expires: new Date(Date.now() + 30 * 864e5),
        },
      },
    },
  });

  const child = await prisma.child.create({
    data: {
      userId: user.id,
      name: "Amara",
      pronouns: "she/her",
      birthYear: new Date().getFullYear() - 5,
      readingLevel: "early",
      bedtimeLocal: "19:30",
      timezone: "Europe/London",
      preferences: {
        targetMinutes: 15,
        tone: ["gentle", "magical"],
        themes: ["fairies", "animals", "space"],
        values: ["kindness", "curiosity"],
        companions: [{ name: "Pip", relationship: "her puppy" }],
        favouriteThings: "the colour green, red wellies, and counting stars",
        avoid: "nothing scary",
        windDownEnding: true,
        serialiseAdventures: true,
      },
    },
  });

  const day = (n: number) => new Date(Date.now() - n * 864e5);

  // Featured story (latest) — Plus, with audio + 3 illustrations.
  const featured = await prisma.story.create({
    data: {
      childId: child.id,
      forDate: day(0),
      status: "DELIVERED",
      source: "PERSONALISED",
      title: "Amara and the Lantern Market",
      synopsis: "Amara and Pip help a little lantern remember how to shine.",
      bodyMarkdown: STORY_MD,
      wordCount: 560,
      readMinutes: 14,
      model: "claude-opus-4-8",
      themeOfNight: "fairies",
      deliveredAt: day(0),
      assets: {
        create: [
          { type: "AUDIO", url: writeAudio(), meta: { voice: "calm-female" } },
          { type: "IMAGE", url: heroUrl, sceneIndex: 0 },
          { type: "IMAGE", url: seaUrl, sceneIndex: 2 },
          { type: "IMAGE", url: meadowUrl, sceneIndex: 3 },
        ],
      },
    },
  });

  // A few more library entries.
  await prisma.story.createMany({
    data: [
      {
        childId: child.id,
        forDate: day(1),
        status: "DELIVERED",
        source: "PERSONALISED",
        title: "The Very Sleepy Rocket",
        synopsis: "Amara flies a gentle rocket to tuck the planets into bed.",
        bodyMarkdown: "# The Very Sleepy Rocket\n\nStub.",
        wordCount: 540,
        readMinutes: 13,
      },
      {
        childId: child.id,
        forDate: day(2),
        status: "DELIVERED",
        source: "EVERGREEN",
        title: "Amara in the Moon's Quiet Garden",
        synopsis: "Amara tends a garden that only blooms in the light of the moon.",
        bodyMarkdown: "# Amara in the Moon's Quiet Garden\n\nStub.",
        wordCount: 260,
        readMinutes: 5,
      },
      {
        childId: child.id,
        forDate: day(3),
        status: "DELIVERED",
        source: "PERSONALISED",
        title: "Pip and the Whispering Woods",
        synopsis: "Pip leads the way through a forest that hums a lullaby.",
        bodyMarkdown: "# Pip and the Whispering Woods\n\nStub.",
        wordCount: 575,
        readMinutes: 14,
      },
    ],
  });

  console.log("Seeded demo. Featured story id:", featured.id);
  console.log("Session cookie: authjs.session-token=demo-session-token");
}

function writeAudio(): string {
  writeFileSync(join(PUB, "narration.wav"), silentWav(3));
  return "/generated/demo/narration.wav";
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
