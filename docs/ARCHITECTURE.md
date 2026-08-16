# Dreamloom — Architecture & Design Notes

## System at a glance

```
Parent ──▶ Landing ──▶ Onboarding wizard ──▶ magic-link sign-in
                                              │
                                              ▼
                              Child profile + StoryPreferences (JSON)
                                              │
                       Stripe Checkout ◀──────┤
                       (7-day trial)          │
                                              ▼
        ┌─────────────── Nightly cron (per timezone) ───────────────┐
        │  for each active child:                                    │
        │    build StoryRequest (recipe + continuity + seed)         │
        │    Claude → structured JSON → validate                     │
        │    [Plus] narrate() + illustrate()                         │
        │    persist Story + StoryAsset, update continuity           │
        │    email "your story is ready"                             │
        └────────────────────────────────────────────────────────────┘
                                              │
                                              ▼
                       Dashboard library ─▶ Reader (text / audio / images)
```

## Key design decisions

**Preferences as validated JSON.** `StoryPreferences` lives as a JSON column on
`Child`, validated by Zod (`story-engine/types.ts`). The preference set can grow
without a migration, while generation code stays strongly typed.

**Structured story output.** The model returns JSON with discrete `scenes`, not
a wall of prose. That gives us: one illustration per scene, natural narration
chunks, and a clean synopsis + continuity note — all in one call.

**Media never blocks text.** Narration and illustrations are best-effort
adapters. A picture failing must never cost a child their bedtime story, so the
compose step catches media errors and still ships the text.

**Idempotent nightly job.** Stories are unique per `(childId, forDate)`. The job
skips children who already have a non-failed story, so it's safe to re-run and
safe to shard.

**Continuity without bloat.** We keep a small rolling "story bible" per child
(recent 7 summaries + up to 6 recurring characters) rather than resending whole
past stories. Cheap, and enough for characters and threads to persist.

## Safety model (non-negotiable for a kids' product)

- The system prompt hard-codes age-appropriate constraints: no violence beyond
  mild resolved peril, nothing scary near sleep, no unresolved cliffhangers, no
  adult themes.
- The parent's free-text `favouriteThings` / `avoid` fields are passed as
  *content to honour or ignore*, and the prompt instructs the model to silently
  drop anything unsafe.
- Structured JSON + Zod validation means a malformed or off-format generation
  fails loudly rather than shipping garbage.
- Future hardening: a second-pass safety classifier before a story is marked
  `READY`, and a parent "report this story" action that quarantines + regenerates.

## Scheduling for real bedtimes

The MVP cron runs once daily (`vercel.json`). For production, **shard by
timezone** so a story is ready an hour or two before each family's local
bedtime:

- Run the job hourly.
- Each run selects children whose `timezone` + `bedtimeLocal` fall in the next
  window and who don't yet have tonight's story.
- `runNightly()` already computes the night's date per child timezone, so this
  is a `where` filter change, not a rewrite.

For scale, move generation to a queue (one job per child) with retries, rather
than a single long request.

## Cost model (rough, per story)

- **Text:** one long-form Claude call (~2k-word output). This dominates the
  Standard tier's marginal cost and is comfortably below the subscription price.
- **Plus — illustrations:** N images/night (one per scene). The biggest add-on
  cost; price the Plus tier to cover it, or cap scenes illustrated.
- **Plus — narration:** ~2k words of TTS/night.
- **Email:** negligible via Resend.

Keep an eye on the Plus media costs — they scale per night per child, so the
Plus price must clear image + audio spend with margin.

## Data model highlights (`prisma/schema.prisma`)

- `User` ⟶ Auth.js standard + `stripeCustomerId`, one `Subscription`, many `Child`.
- `Subscription` — `plan` (STANDARD/PLUS) + Stripe status mirror, synced by the webhook.
- `Child` — profile + `preferences` (JSON) + `continuity` (JSON) + bedtime/timezone.
- `Story` — one per child per night; `bodyMarkdown`, scenes-derived metadata,
  `status` lifecycle (PENDING→GENERATING→READY→DELIVERED / FAILED).
- `StoryAsset` — AUDIO / IMAGE / PDF attached to a story.
- `StoryFeedback` — favourite / rating (wired in schema; UI is a natural next step).

## Suggested roadmap (beyond the MVP)

1. **Plus media providers.** Implement `narrate.ts` (ElevenLabs/OpenAI TTS) and
   `illustrate.ts` (an image model), with object-storage upload + a CDN.
2. **Timezone-sharded scheduling** + per-child job queue with retries.
3. **Safety second-pass** classifier and a parent report/regenerate flow.
4. **Gift subscriptions** (grandparents are a huge segment).
5. **Weekly printable keepsake PDF** of the family's favourite story.
6. **Series mode** — multi-night arcs ("Amara and the Lantern Market, night 3").
7. **Preference editing UI** — reuse the onboarding wizard to edit an existing
   child (the `/api/children` route already supports update-by-id).
8. **Multi-child polish** — the schema and billing already support it.
9. **Feedback loop** — use favourites/ratings to nudge future themes.
```
