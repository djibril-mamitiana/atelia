import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const [users, products, brands, categories, orders, tutorials, reviews] = await Promise.all([
  db.user.count(),
  db.product.count(),
  db.brand.count(),
  db.category.count(),
  db.order.count(),
  db.tutorial.count(),
  db.review.count(),
]);
console.log({ users, products, brands, categories, orders, tutorials, reviews });

const admin = await db.user.findUnique({
  where: { email: "christoftran@gmail.com" },
  select: { email: true, role: true, firstName: true, lastName: true, isActive: true },
});
console.log("admin account:", admin);

await db.$disconnect();
