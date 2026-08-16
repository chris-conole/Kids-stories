import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runNightly } from "@/lib/nightly";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Generate tonight's story for one child on demand — used for the free first
 * story and a manual "generate now" button. Verifies ownership first.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const child = await prisma.child.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!child) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await runNightly({
    childId: child.id,
    force: true,
    deliverEmail: false,
  });

  const story = await prisma.story.findFirst({
    where: { childId: child.id },
    orderBy: { forDate: "desc" },
  });

  return NextResponse.json({ result, storyId: story?.id });
}
