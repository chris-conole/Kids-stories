/**
 * Seed a demo parent + child so you can click through the dashboard without
 * going through Stripe. Run with: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@dreamloom.test" },
    update: {},
    create: {
      email: "demo@dreamloom.test",
      name: "Demo Parent",
      subscription: {
        create: {
          plan: "STANDARD",
          status: "TRIALING",
          currentPeriodEnd: new Date(Date.now() + 7 * 864e5),
        },
      },
    },
  });

  await prisma.child.upsert({
    where: { id: "seed-child" },
    update: {},
    create: {
      id: "seed-child",
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
        themes: ["space", "animals"],
        values: ["kindness", "curiosity"],
        companions: [{ name: "Pip", relationship: "her puppy" }],
        favouriteThings: "the colour green and counting stars",
        avoid: "nothing scary",
        windDownEnding: true,
        serialiseAdventures: true,
      },
    },
  });

  console.log("Seeded demo@dreamloom.test with child Amara.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
