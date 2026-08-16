import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Remove a child profile (and, by cascade, their stories). Owner-only. */
export async function DELETE(
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

  await prisma.child.delete({ where: { id: child.id } });
  return NextResponse.json({ ok: true });
}
