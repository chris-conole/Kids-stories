import { NextResponse } from "next/server";
import { runNightly } from "@/lib/nightly";

export const runtime = "nodejs";
// Story generation can take a while across many children.
export const maxDuration = 300;

/**
 * Nightly generation endpoint. Protect it with CRON_SECRET and call it from
 * your scheduler (Vercel Cron, GitHub Actions, etc.).
 *
 * Run this HOURLY. It is timezone-sharded: each run generates only for children
 * whose local time has reached their pre-bedtime window, so every family's
 * story is ready before their own local bedtime (see docs/ARCHITECTURE.md and
 * src/lib/schedule.ts). Generation is idempotent per child per night, so a
 * child is generated once and skipped on later hourly runs.
 *
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Pass ?all=1 to bypass sharding and process every eligible child (e.g. a
 * manual backfill).
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const all = new URL(req.url).searchParams.get("all") === "1";
  const result = await runNightly({ deliverEmail: true, dueOnly: !all });
  return NextResponse.json(result);
}

// Allow GET for schedulers that only issue GET, still secret-protected.
export async function GET(req: Request) {
  return POST(req);
}
