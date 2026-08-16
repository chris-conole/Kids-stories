# 🌙 Dreamloom

A subscription that writes a **fresh, personalised bedtime story for your child every single night**. Parents set up a child profile and story preferences once; each evening the engine weaves a new ~15-minute wind-down story starring their child. Includes a landing page, passwordless auth, Stripe billing, a parent dashboard, a story library, and an optional **Plus** tier that adds illustrations and audio narration.

> `Dreamloom` is a working brand name — rename freely via `NEXT_PUBLIC_APP_NAME`.

---

## What's in the box

| Area | Where |
| --- | --- |
| **Story engine** (the core IP) | `src/lib/story-engine/` |
| Nightly generation job | `src/lib/nightly.ts` + `src/app/api/cron/nightly` |
| Landing page | `src/app/page.tsx` |
| Onboarding wizard (preference questions) | `src/app/onboarding/` |
| Parent dashboard (library, reader, profiles, billing) | `src/app/dashboard/` |
| Passwordless auth (email magic links) | `src/lib/auth.ts` |
| Stripe (checkout, webhook, customer portal) | `src/app/api/stripe/` |
| Email (magic links + nightly delivery) | `src/lib/email.ts` |
| Data model | `prisma/schema.prisma` |

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · Prisma + Postgres · Auth.js · Stripe · Resend · Claude (Anthropic).

---

## The story engine

This is the part that makes a story feel written *for this child*.

1. **The recipe** (`types.ts`) — a validated `StoryPreferences` object per child: reading level, tone, themes, values to gently encourage, companions (friends/pets/toys), favourite things, things to avoid, wind-down endings, and whether to serialise adventures.
2. **The prompt** (`prompt.ts`) — a carefully designed system prompt encoding safety rules, reading-level control, **bedtime wind-down pacing**, and continuity, plus a per-night user prompt built from the recipe and a fresh randomness **seed** so no two nights repeat.
3. **Generation** (`generate.ts`) — calls Claude, expects structured JSON (title, scenes, synopsis, continuity note), and validates it with Zod.
4. **Media adapters** (`narrate.ts`, `illustrate.ts`) — provider-agnostic hooks for the Plus tier. Text always ships even if media fails.
5. **Compose + continuity** (`index.ts`) — assembles the night and folds a short summary into the child's rolling "story bible" so recurring characters and past adventures carry over.

**Try it in 30 seconds** (no DB or web app needed):

```bash
cp .env.example .env      # add ANTHROPIC_API_KEY
npm install
npm run story:sample      # prints a full generated story
```

---

## Local setup

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env      # fill in the values (see below)

# 3. Database
npm run db:push           # create tables in your Postgres
npm run db:seed           # optional: a demo parent + child

# 4. Run
npm run dev               # http://localhost:3000
```

### Environment variables

See `.env.example`. The essentials:

- `DATABASE_URL` — any Postgres (Neon / Supabase / local).
- `AUTH_SECRET` — `openssl rand -base64 32`.
- `ANTHROPIC_API_KEY` — powers story generation. `STORY_MODEL` defaults to `claude-opus-4-8`.
- `RESEND_API_KEY` + `EMAIL_FROM` — magic-link sign-in **and** nightly story emails.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STANDARD`, `STRIPE_PRICE_PLUS`.
- `CRON_SECRET` — protects the nightly endpoint.
- Optional: `TTS_PROVIDER` / `IMAGE_PROVIDER` for the Plus tier.

### Stripe setup

1. Create two recurring **Products/Prices** in the Stripe dashboard (Standard, Plus) and put their price IDs in `.env`.
2. Add a webhook endpoint → `https://yourdomain/api/stripe/webhook`, subscribe to `customer.subscription.*`, and copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
3. Local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

---

## Nightly generation

The endpoint `POST /api/cron/nightly` (Bearer `CRON_SECRET`) generates tonight's
story for every active subscriber. It's **idempotent per child per night**, so
it's safe to re-run. `vercel.json` schedules it daily; see
`docs/ARCHITECTURE.md` for timezone-sharded scheduling so each family's story is
ready before their local bedtime.

Run it manually:

```bash
npm run cron:nightly
```

---

## User journey

1. **Landing page** → *Create your child's first story*.
2. **Onboarding wizard** collects the story recipe, then emails a magic link.
3. After sign-in, the first story is generated **free** and shown in the reader.
4. **Subscribe** (Stripe, 7-day trial) to receive a new story every night.
5. **Dashboard**: nightly stories land in the **library**, readable in-app or by email; **Plus** adds illustrations + audio.

See `docs/ARCHITECTURE.md` for the deeper design, safety model, cost notes, and a suggested roadmap.
