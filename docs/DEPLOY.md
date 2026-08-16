# Deploying Dreamloom to a live URL

This gets Dreamloom onto a public `https://…vercel.app` link using **Vercel**
(hosting) + **Neon** (Postgres). Both have free tiers. You can do the whole
thing from a browser.

There are two milestones:
- **Milestone 1 — it's online and clickable** (landing, onboarding, dashboard).
- **Milestone 2 — it's fully live** (real AI stories, payments, nightly emails).

---

## Milestone 1 — get it online (~15 min)

### 1. Create the database (Neon)
1. Sign up at [neon.tech](https://neon.tech) and create a project.
2. Copy the **connection string** (looks like
   `postgresql://user:pass@ep-xxx.eu-west-2.aws.neon.tech/neondb?sslmode=require`).
   Use the plain/direct connection string, not a "pooled" one, to start.

### 2. Import the repo into Vercel
1. Sign up at [vercel.com](https://vercel.com) with your GitHub account.
2. **Add New → Project**, and import `chris-conole/Kids-stories`.
3. When it asks for the branch, choose `claude/bedtime-story-subscription-a6cjgw`
   (or merge that branch to `main` first and deploy `main`).
4. Framework preset should auto-detect **Next.js**. Leave the build settings as
   they are — the project already defines a `vercel-build` step that runs the
   database migration and builds the app.

### 3. Set the environment variables
In the Vercel import screen (or **Project → Settings → Environment Variables**),
add these four to start:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | your Neon connection string from step 1 |
| `AUTH_SECRET` | a long random string — generate one at [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32) |
| `NEXT_PUBLIC_APP_URL` | your site URL, e.g. `https://your-project.vercel.app` (you can update this after the first deploy once you know the exact URL) |
| `NEXT_PUBLIC_APP_NAME` | `Dreamloom` (or your chosen brand) |

### 4. Deploy
Click **Deploy**. On build, the app automatically creates all the database
tables (via `prisma migrate deploy`). When it finishes, open the URL — the
landing page and onboarding are live.

> To sign in without email set up yet: after deploying, you can't magic-link in
> until Milestone 2. To preview the dashboard now, run `npm run db:demo` against
> your Neon database locally (set `DATABASE_URL` to the Neon string, then
> `npx prisma migrate deploy && npm run db:demo`) — that seeds a demo family and
> a session you can use.

---

## Milestone 2 — make it fully live

Add the remaining services and their environment variables in Vercel, then
redeploy.

### AI story generation (Anthropic)
| Name | Value |
| --- | --- |
| `ANTHROPIC_API_KEY` | from [console.anthropic.com](https://console.anthropic.com) |
| `STORY_MODEL` | `claude-opus-4-8` (or your preferred model) |
| `SAFETY_CHECK` | `on` |
| `SAFETY_MODEL` | `claude-haiku-4-5-20251001` |

### Email — sign-in links + nightly delivery (Resend)
1. Create an account at [resend.com](https://resend.com) and verify your sending
   domain (or use their test domain to start).

| Name | Value |
| --- | --- |
| `RESEND_API_KEY` | from Resend |
| `EMAIL_FROM` | e.g. `Dreamloom <stories@yourdomain.com>` |

Once these are set, the **email magic-link login** works — that's how real
parents sign in.

### Payments (Stripe)
1. In the [Stripe dashboard](https://dashboard.stripe.com), create two
   **recurring Prices** (Standard and Plus) and copy their price IDs.
2. Add a **webhook endpoint** pointing to
   `https://your-project.vercel.app/api/stripe/webhook`, subscribe to
   `customer.subscription.*` events, and copy its signing secret.

| Name | Value |
| --- | --- |
| `STRIPE_SECRET_KEY` | from Stripe |
| `STRIPE_WEBHOOK_SECRET` | the `whsec_…` from the webhook |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_…` from Stripe |
| `STRIPE_PRICE_STANDARD` | the Standard price ID |
| `STRIPE_PRICE_PLUS` | the Plus price ID |

### Nightly generation (Vercel Cron)
`vercel.json` already schedules `/api/cron/nightly` hourly. Just add:

| Name | Value |
| --- | --- |
| `CRON_SECRET` | a long random string |

Vercel automatically sends this secret with each cron call, and the endpoint
rejects anything else. (The job is timezone-sharded, so each family's story is
generated before their local bedtime.)

### Plus media storage (illustrations + audio)
Serverless can't store files locally, so point media at an S3-compatible bucket
(AWS S3 or Cloudflare R2):

| Name | Value |
| --- | --- |
| `STORAGE_PROVIDER` | `s3` |
| `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` | from your bucket |
| `TTS_PROVIDER` + `TTS_API_KEY` | `openai` or `elevenlabs` |
| `IMAGE_PROVIDER` + `IMAGE_API_KEY` | `openai` or `replicate` |

---

## Updating the site later
Every push to the deployed branch triggers a new Vercel deploy, and the build
runs any new database migrations automatically. To change something, edit,
commit, push — Vercel does the rest.

## Notes
- **Migrations** live in `prisma/migrations/`. New schema changes need a new
  migration (`npx prisma migrate dev --name <change>` locally), which the Vercel
  build then applies in production via `prisma migrate deploy`.
- **Custom domain**: add it under Vercel → Project → Settings → Domains, then
  update `NEXT_PUBLIC_APP_URL` and your Stripe webhook URL to match.
- For higher traffic later, switch `DATABASE_URL` to Neon's pooled connection
  string and keep a direct URL for migrations.
