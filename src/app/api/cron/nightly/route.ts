import { NextResponse } from "next/server";
import { runNightly } from "@/lib/nightly";

export const runtime = "nodejs";
// Story generation can take a while across many children.
export const maxDuration = 300;

/**
 * Nightly generation endpoint. Protect it with CRON_SECRET and call it from
 * your scheduler (Vercel Cron, GitHub Actions, etc.). In production you'd
 * ideally shard this by timezone so each family's story is ready before their
 * local bedtime — see docs/ARCHITECTURE.md.
 *
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runNightly({ deliverEmail: true });
  return NextResponse.json(result);
}

// Allow GET for schedulers that only issue GET, still secret-protected.
export async function GET(req: Request) {
  return POST(req);
}
