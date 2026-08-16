import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StoryPreferencesSchema } from "@/lib/story-engine";

const BodySchema = z.object({
  id: z.string().optional(), // present when editing
  name: z.string().min(1).max(40),
  pronouns: z.string().min(1).max(24).default("they/them"),
  birthYear: z.number().int().min(2010).max(new Date().getFullYear()).optional(),
  readingLevel: z
    .enum(["pre-reader", "early", "confident", "advanced"])
    .default("early"),
  bedtimeLocal: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .default("19:30"),
  timezone: z.string().default("Europe/London"),
  preferences: StoryPreferencesSchema,
});

/** Create or update a child profile (used by onboarding + profile editor). */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  if (data.id) {
    // Ensure the child belongs to this user before updating.
    const existing = await prisma.child.findFirst({
      where: { id: data.id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const child = await prisma.child.update({
      where: { id: data.id },
      data: {
        name: data.name,
        pronouns: data.pronouns,
        birthYear: data.birthYear,
        readingLevel: data.readingLevel,
        bedtimeLocal: data.bedtimeLocal,
        timezone: data.timezone,
        preferences: data.preferences,
      },
    });
    return NextResponse.json({ child });
  }

  const child = await prisma.child.create({
    data: {
      userId: session.user.id,
      name: data.name,
      pronouns: data.pronouns,
      birthYear: data.birthYear,
      readingLevel: data.readingLevel,
      bedtimeLocal: data.bedtimeLocal,
      timezone: data.timezone,
      preferences: data.preferences,
    },
  });

  return NextResponse.json({ child });
}
