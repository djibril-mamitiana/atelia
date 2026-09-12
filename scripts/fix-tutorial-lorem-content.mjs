// Replaces the faker.lorem (Latin filler) step list in every tutorial's
// content — French included — with real, generic per-locale sentences.
// Matched by French `title` against prisma/data/tutorial-translations.json
// for the DE/EN/IT heading; the step sentences themselves are inlined here
// (same list as prisma/seed.ts's TUTORIAL_STEPS, kept in sync manually —
// only 9 tutorials, run once).
//
// Run with: node scripts/fix-tutorial-lorem-content.mjs
import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const translations = JSON.parse(readFileSync("prisma/data/tutorial-translations.json", "utf8"));

const STEPS = {
  fr: [
    "Vérifiez la compatibilité de l'outil avec votre machine avant de commencer.",
    "Installez l'accessoire en suivant les recommandations du fabricant.",
    "Portez toujours les équipements de protection individuelle nécessaires.",
    "Travaillez à vitesse modérée pour préserver la durée de vie de l'outil.",
    "Nettoyez et rangez votre matériel après chaque utilisation.",
  ],
  de: [
    "Prüfen Sie vor Beginn die Kompatibilität des Werkzeugs mit Ihrer Maschine.",
    "Montieren Sie das Zubehör gemäß den Empfehlungen des Herstellers.",
    "Tragen Sie stets die erforderliche persönliche Schutzausrüstung.",
    "Arbeiten Sie mit moderater Geschwindigkeit, um die Lebensdauer des Werkzeugs zu schonen.",
    "Reinigen und verstauen Sie Ihr Material nach jedem Gebrauch.",
  ],
  en: [
    "Check that the tool is compatible with your machine before you start.",
    "Fit the accessory following the manufacturer's recommendations.",
    "Always wear the necessary personal protective equipment.",
    "Work at a moderate speed to preserve the tool's lifespan.",
    "Clean and store your equipment after each use.",
  ],
  it: [
    "Verifica la compatibilità dell'utensile con la tua macchina prima di iniziare.",
    "Monta l'accessorio seguendo le raccomandazioni del produttore.",
    "Indossa sempre i dispositivi di protezione individuale necessari.",
    "Lavora a velocità moderata per preservare la durata dell'utensile.",
    "Pulisci e riponi il materiale dopo ogni utilizzo.",
  ],
};

function stepList(lang) {
  return STEPS[lang].map((line, i) => `${i + 1}. ${line}`).join("\n");
}

const FR_HEADING = "## Ce qu'il vous faut\n\nRetrouvez ci-dessous le matériel recommandé et les étapes à suivre.\n\n";

async function main() {
  const tutorials = await db.tutorial.findMany({ select: { id: true, title: true } });
  let updated = 0;

  for (const tutorial of tutorials) {
    const t = translations[tutorial.title];
    if (!t) {
      console.log(`  no translation entry for: ${tutorial.title}`);
      continue;
    }
    await db.tutorial.update({
      where: { id: tutorial.id },
      data: {
        content: `${FR_HEADING}${stepList("fr")}`,
        contentDe: `${t.de.contentIntro}${stepList("de")}`,
        contentEn: `${t.en.contentIntro}${stepList("en")}`,
        contentIt: `${t.it.contentIntro}${stepList("it")}`,
      },
    });
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}`);
  await db.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await db.$disconnect();
  process.exit(1);
});
