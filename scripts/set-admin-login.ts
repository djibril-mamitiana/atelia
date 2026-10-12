// Changes the sign-in email and password of the admin account. Both come from
// environment variables so they never end up in the repository:
//
//   NEW_ADMIN_EMAIL=… NEW_ADMIN_PASSWORD=… npx tsx scripts/set-admin-login.ts           → dry run
//   NEW_ADMIN_EMAIL=… NEW_ADMIN_PASSWORD=… npx tsx scripts/set-admin-login.ts --apply   → writes
//
// With several admin accounts, name the one to change with ADMIN_CURRENT_EMAIL.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/lib/auth/password";

const apply = process.argv.includes("--apply");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL! }) });

async function main() {
  // Same normalisation as the login form.
  const email = process.env.NEW_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.NEW_ADMIN_PASSWORD;
  const current = process.env.ADMIN_CURRENT_EMAIL?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("NEW_ADMIN_EMAIL manquant ou invalide");
  if (!password || password.length < 8) throw new Error("NEW_ADMIN_PASSWORD manquant ou trop court (8 caractères minimum)");

  console.log(apply ? "APPLIQUÉ" : "SIMULATION (rien n'est écrit — relancer avec --apply)");

  const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true, email: true }, orderBy: { createdAt: "asc" } });
  console.log(`  comptes admin : ${admins.map((a) => a.email).join(", ") || "aucun"}`);
  const target = current ? admins.find((a) => a.email === current) : admins.length === 1 ? admins[0] : undefined;
  if (!target) {
    console.log(current ? `  aucun admin ${current}, rien n'est changé` : "  plusieurs comptes admin : préciser ADMIN_CURRENT_EMAIL, rien n'est changé");
    return;
  }

  const taken = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (taken && taken.id !== target.id) {
    console.log(`  ${email} est déjà utilisé par un autre compte, rien n'est changé`);
    return;
  }

  console.log(`  ${target.email} → ${email} (nouveau mot de passe)`);
  if (apply) {
    await db.user.update({ where: { id: target.id }, data: { email, passwordHash: await hashPassword(password) } });
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
