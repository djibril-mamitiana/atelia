// Fills the per-locale title/description/content columns added by the
// add_tutorial_translations migration, for the (small, hand-curated) set of
// tutorials — matched by their French `title` against
// prisma/data/tutorial-translations.json. Purely additive; never touches
// title/description/content (the French source columns). Safe to re-run.
//
// Run with: node scripts/backfill-tutorial-translations.mjs
import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const translations = JSON.parse(readFileSync("prisma/data/tutorial-translations.json", "utf8"));

// The seed's fixed French intro heading, prepended to 5 random filler
// sentences — stripped off so each locale gets its own translated heading
// in front of the same (language-agnostic placeholder) body.
const FR_INTRO = "## Ce qu'il vous faut\n\nRetrouvez ci-dessous le matériel recommandé et les étapes à suivre.\n\n";

async function main() {
  const tutorials = await db.tutorial.findMany({ select: { id: true, title: true, content: true } });
  let updated = 0;
  let skipped = 0;

  for (const tutorial of tutorials) {
    const entry = translations[tutorial.title];
    if (!entry) {
      console.log(`  no translation entry for: ${tutorial.title}`);
      skipped++;
      continue;
    }

    const body = tutorial.content.startsWith(FR_INTRO) ? tutorial.content.slice(FR_INTRO.length) : tutorial.content;

    await db.tutorial.update({
      where: { id: tutorial.id },
      data: {
        titleDe: entry.de.title,
        titleEn: entry.en.title,
        titleIt: entry.it.title,
        descriptionDe: entry.de.description,
        descriptionEn: entry.en.description,
        descriptionIt: entry.it.description,
        contentDe: `${entry.de.contentIntro}${body}`,
        contentEn: `${entry.en.contentIntro}${body}`,
        contentIt: `${entry.it.contentIntro}${body}`,
      },
    });
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, skipped (no dictionary entry): ${skipped}`);
  await db.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await db.$disconnect();
  process.exit(1);
});
