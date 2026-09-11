import "dotenv/config";
import {
  PrismaClient,
  type CouponType,
  type OrderStatus,
  type ShipmentStatus,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { fakerFR as faker } from "@faker-js/faker";
import slugify from "slugify";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!,
});
const db = new PrismaClient({ adapter });

faker.seed(42);

// ─────────────────────────────────────────────────────────────
// Placeholder media
// ─────────────────────────────────────────────────────────────
// Deterministic placeholder photography (picsum.photos) — swap for real
// product photography before going to production. Real, reachable CC0
// sample videos from MDN stand in for tutorial/product video content.
const IMAGES = Array.from({ length: 30 }, (_, i) => `https://picsum.photos/seed/atelia-${i + 1}/1000/1000`);
const VIDEOS = [
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/coffee.mp4",
];
function pickImages(n: number) {
  return faker.helpers.arrayElements(IMAGES, n);
}
function pickVideo() {
  return faker.helpers.arrayElement(VIDEOS);
}

function uniqueSlug(base: string, used: Set<string>) {
  let slug = slugify(base, { lower: true, strict: true, locale: "fr" });
  let i = 2;
  while (used.has(slug)) {
    slug = `${slugify(base, { lower: true, strict: true, locale: "fr" })}-${i++}`;
  }
  used.add(slug);
  return slug;
}

// ─────────────────────────────────────────────────────────────
// 1. Clear existing data (dev-friendly re-seed; FK-safe order)
// ─────────────────────────────────────────────────────────────
async function clearDatabase() {
  await db.auditLog.deleteMany();
  await db.notification.deleteMany();
  await db.inventoryMovement.deleteMany();
  await db.couponUsage.deleteMany();
  await db.review.deleteMany();
  await db.favorite.deleteMany();
  await db.tutorialProduct.deleteMany();
  await db.tutorial.deleteMany();
  await db.payment.deleteMany();
  await db.shipment.deleteMany();
  await db.orderStatusHistory.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.cartItem.deleteMany();
  await db.cart.deleteMany();
  await db.productRelation.deleteMany();
  await db.productAttributeValue.deleteMany();
  await db.productAttribute.deleteMany();
  await db.productVariant.deleteMany();
  await db.productVideo.deleteMany();
  await db.productImage.deleteMany();
  await db.product.deleteMany();
  await db.coupon.deleteMany();
  await db.brand.deleteMany();
  await db.category.deleteMany();
  await db.passwordResetToken.deleteMany();
  await db.address.deleteMany();
  await db.user.deleteMany();
}

// ─────────────────────────────────────────────────────────────
// 2/3. Categories, brand & products — real supplier catalog only.
//
// Hualing Lu GmbH (diamond cutting/drilling/grinding tools), extracted
// from "Katalog 2026_Optimized.html" (a pdf2html export of the supplier's
// actual DE/EN price list): real SKUs ("Artikel-Nr."), real EUR prices,
// real category structure — 1 parent category ("Outils diamant") + 9
// sub-categories, 1 brand, ~1417 products.
//
// The previous faker-generated placeholder catalogue (7 generic
// categories, 10 invented brands, 50 templated products) has been removed
// — this is the only catalogue seeded now.
//
// Product photography is not available (the source PDF only has full-page
// raster backgrounds, not per-product cutouts) — images stay Picsum
// placeholders pending real photography. Stock levels are not in the
// source catalogue either and are randomised.
//
// A minority of rows (~7%, see `lowConfidence`) come from pages where the
// PDF's layout made the product family caption unrecoverable; those get a
// generic "{category} — {sku}" name instead of a real description and are
// worth a manual pass before this goes to production.
// ─────────────────────────────────────────────────────────────
type HualingProduct = {
  sku: string;
  name: string;
  descriptionDe: string;
  descriptionEn: string;
  typeModel: string;
  price: number;
  categorySlug: string;
  categoryName: string;
  specs: string[];
  specLabels: string[] | null;
  lowConfidence: boolean;
};

const HUALING_CATEGORIES: { slug: string; name: string }[] = JSON.parse(
  readFileSync(path.join(__dirname, "data/hualing-categories.json"), "utf8"),
);

async function seedCategories() {
  const bySlug = new Map<string, { id: string; slug: string }>();
  const parent = await db.category.create({
    data: {
      name: "Outils diamant",
      slug: "outils-diamant",
      description: "Disques, forets et meules diamant pour la découpe et le perçage du béton, de l'asphalte et de la pierre naturelle.",
      imageUrl: pickImages(1)[0],
      order: 0,
      isActive: true,
    },
  });
  bySlug.set(parent.slug, parent);

  let order = 0;
  for (const { slug, name } of HUALING_CATEGORIES) {
    const child = await db.category.create({
      data: {
        name,
        slug,
        description: `${name} — gamme professionnelle Hualing Lu.`,
        imageUrl: pickImages(1)[0],
        parentId: parent.id,
        order: order++,
        isActive: true,
      },
    });
    bySlug.set(slug, child);
  }
  return bySlug;
}

async function seedBrands() {
  return db.brand.create({
    data: {
      name: "Hualing Lu",
      slug: "hualing-lu",
      logoUrl: pickImages(1)[0],
      description: "Fabricant d'outils diamant professionnels (disques, forets, meules) pour le béton, l'asphalte et la pierre naturelle.",
      website: "https://www.hualing.de",
      isActive: true,
    },
  });
}

async function seedProducts(
  categories: Map<string, { id: string; slug: string }>,
  brand: { id: string; slug: string; name: string }
) {
  const catalog: HualingProduct[] = JSON.parse(readFileSync(path.join(__dirname, "data/hualing-catalog.json"), "utf8"));

  const used = new Set<string>();
  const products: { id: string; name: string; slug: string; categorySlug: string }[] = [];

  for (const item of catalog) {
    const category = categories.get(item.categorySlug);
    if (!category) continue;

    const slug = uniqueSlug(item.name, used);
    const specLines =
      item.specLabels && item.specLabels.length === item.specs.length
        ? item.specLabels.map((label, i) => `${label}: ${item.specs[i]}`).join(", ")
        : item.specs.join(", ");

    const descriptionParts = [item.descriptionDe, item.descriptionEn].filter(Boolean);
    if (specLines) descriptionParts.push(`Caractéristiques : ${specLines}`);
    if (item.typeModel) descriptionParts.push(`Type : ${item.typeModel}`);
    const description = descriptionParts.join("\n") || item.name;

    const product = await db.product.create({
      data: {
        name: item.name,
        slug,
        sku: item.sku,
        description,
        shortDescription: (item.descriptionDe || item.descriptionEn || item.name).slice(0, 200),
        price: item.price,
        taxRate: 20,
        stock: faker.number.int({ min: 0, max: 120 }),
        lowStockThreshold: 5,
        categoryId: category.id,
        brandId: brand.id,
        isActive: true,
        isFeatured: false,
        isNew: false,
        isBestSeller: false,
        seoTitle: `${item.name} | ${brand.name}`,
        seoDescription: description.slice(0, 150),
        images: { create: pickImages(2).map((url, i) => ({ url, alt: item.name, position: i })) },
      },
    });

    products.push({ id: product.id, name: product.name, slug: product.slug, categorySlug: category.slug });
  }

  return products;
}

async function seedProductRelations(products: { id: string; categorySlug: string }[]) {
  const byCategory = new Map<string, string[]>();
  for (const p of products) {
    byCategory.set(p.categorySlug, [...(byCategory.get(p.categorySlug) ?? []), p.id]);
  }

  for (const p of products) {
    const siblings = (byCategory.get(p.categorySlug) ?? []).filter((id) => id !== p.id);
    if (siblings.length === 0) continue;

    const complementary = faker.helpers.arrayElements(siblings, Math.min(2, siblings.length));
    for (const [i, relatedId] of complementary.entries()) {
      await db.productRelation.create({
        data: { baseProductId: p.id, relatedProductId: relatedId, kind: "COMPLEMENTARY", position: i },
      }).catch(() => {});
    }

    const similar = faker.helpers.arrayElements(siblings, Math.min(3, siblings.length));
    for (const [i, relatedId] of similar.entries()) {
      await db.productRelation.create({
        data: { baseProductId: p.id, relatedProductId: relatedId, kind: "SIMILAR", position: i },
      }).catch(() => {});
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 5. Tutorials — 9, one per diamond-tool category, linked to real products
// ─────────────────────────────────────────────────────────────
const TUTORIALS: { title: string; categorySlug: string; level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"; minutes: number }[] = [
  { title: "Comment choisir son disque diamant pour meuleuse d'angle ?", categorySlug: "disques-diamant-115-230", level: "BEGINNER", minutes: 6 },
  { title: "Tronçonner du béton armé avec une découpeuse thermique", categorySlug: "disques-diamant-250-1000", level: "INTERMEDIATE", minutes: 10 },
  { title: "Couper l'asphalte et l'enrobé : bien choisir son disque", categorySlug: "disques-diamant-asphalte", level: "INTERMEDIATE", minutes: 8 },
  { title: "Percer du béton avec une couronne diamant", categorySlug: "forets-diamant", level: "INTERMEDIATE", minutes: 12 },
  { title: "Bien poncer une chape béton avec une meule diamant", categorySlug: "meules-diamant", level: "BEGINNER", minutes: 7 },
  { title: "Découper du marbre et de la pierre naturelle sans éclats", categorySlug: "disques-diamant-pierre-naturelle", level: "ADVANCED", minutes: 15 },
  { title: "Disques galvanisés : quand les préférer aux disques frittés ?", categorySlug: "autres-disques-diamant", level: "INTERMEDIATE", minutes: 9 },
  { title: "Bien entretenir et refroidir ses outils diamant", categorySlug: "accessoires-diamant", level: "BEGINNER", minutes: 5 },
  { title: "Interflex : disques abrasifs pour métal et inox", categorySlug: "interflex", level: "BEGINNER", minutes: 6 },
];

async function seedTutorials(
  categories: Map<string, { id: string; slug: string }>,
  products: { id: string; name: string; slug: string; categorySlug: string }[]
) {
  const used = new Set<string>();
  for (const t of TUTORIALS) {
    const category = categories.get(t.categorySlug);
    const matched = products.filter((p) => p.categorySlug === t.categorySlug);
    const linked = matched.length > 0 ? matched : faker.helpers.arrayElements(products, 3);

    const slug = uniqueSlug(t.title, used);
    await db.tutorial.create({
      data: {
        title: t.title,
        slug,
        description: `${t.title} — conseils pas à pas et matériel recommandé pour réussir votre projet.`,
        content:
          `## Ce qu'il vous faut\n\nRetrouvez ci-dessous le matériel recommandé et les étapes à suivre.\n\n` +
          Array.from({ length: 5 }, (_, i) => `${i + 1}. ${faker.lorem.sentence({ min: 8, max: 16 })}`).join("\n"),
        thumbnailUrl: pickImages(1)[0],
        videoUrl: pickVideo(),
        durationMinutes: t.minutes,
        level: t.level,
        categoryId: category?.id,
        tags: faker.helpers.arrayElements(["bricolage", "diy", "guide", "débutant", "extérieur", "intérieur", "sécurité"], 3),
        isPublished: true,
        products: {
          create: linked.slice(0, 4).map((p, i) => ({ productId: p.id, position: i })),
        },
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────
// 6. Users — 1 admin + 1 staff + 18 customers = 20
// ─────────────────────────────────────────────────────────────
async function seedUsers() {
  const passwordHash = await bcrypt.hash("Client1234!", 12);
  const adminHash = await bcrypt.hash("Admin1234!", 12);
  const staffHash = await bcrypt.hash("Staff1234!", 12);

  const admin = await db.user.create({
    data: {
      email: "christoftran@gmail.com",
      passwordHash: adminHash,
      firstName: "Christof",
      lastName: "Tran",
      role: "ADMIN",
      emailVerified: new Date(),
      isActive: true,
    },
  });

  const staff = await db.user.create({
    data: {
      email: "staff@atelia.test",
      passwordHash: staffHash,
      firstName: "Morgane",
      lastName: "Lefèvre",
      role: "STAFF",
      emailVerified: new Date(),
      isActive: true,
    },
  });

  const customers = [];
  for (let i = 0; i < 18; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const customer = await db.user.create({
      data: {
        email: faker.internet.email({ firstName, lastName, provider: "example-mail.test" }).toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        phone: faker.phone.number({ style: "national" }),
        role: "CUSTOMER",
        emailVerified: faker.datatype.boolean({ probability: 0.8 }) ? faker.date.past({ years: 1 }) : null,
        isActive: true,
      },
    });
    customers.push(customer);
  }

  return { admin, staff, customers };
}

async function seedAddresses(users: { id: string; firstName: string; lastName: string }[]) {
  const addresses: Record<string, { id: string }[]> = {};
  for (const user of users) {
    const count = faker.number.int({ min: 1, max: 2 });
    const list = [];
    for (let i = 0; i < count; i++) {
      const address = await db.address.create({
        data: {
          userId: user.id,
          label: i === 0 ? "Domicile" : "Bureau",
          firstName: user.firstName,
          lastName: user.lastName,
          line1: faker.location.streetAddress(),
          line2: faker.datatype.boolean({ probability: 0.2 }) ? faker.location.secondaryAddress() : null,
          city: faker.location.city(),
          postalCode: faker.location.zipCode("#####"),
          country: "FR",
          phone: faker.phone.number({ style: "national" }),
          isDefaultShipping: i === 0,
          isDefaultBilling: i === 0,
        },
      });
      list.push(address);
    }
    addresses[user.id] = list;
  }
  return addresses;
}

// ─────────────────────────────────────────────────────────────
// 7. Coupons
// ─────────────────────────────────────────────────────────────
async function seedCoupons(categories: Map<string, { id: string; slug: string }>) {
  const now = new Date();
  const outilsDiamant = categories.get("outils-diamant");

  const welcome = await db.coupon.create({
    data: {
      code: "WELCOME10",
      type: "PERCENT" as CouponType,
      value: 10,
      minPurchase: 30,
      startsAt: new Date(now.getTime() - 30 * 86400000),
      endsAt: new Date(now.getTime() + 90 * 86400000),
      usageLimitPerUser: 1,
      isActive: true,
    },
  });

  const soldes = await db.coupon.create({
    data: {
      code: "SOLDES20",
      type: "FIXED" as CouponType,
      value: 20,
      minPurchase: 100,
      startsAt: new Date(now.getTime() - 10 * 86400000),
      endsAt: new Date(now.getTime() + 30 * 86400000),
      usageLimitPerUser: 1,
      isActive: true,
    },
  });

  const diamant = outilsDiamant
    ? await db.coupon.create({
        data: {
          code: "DIAMANT15",
          type: "PERCENT" as CouponType,
          value: 15,
          categoryId: outilsDiamant.id,
          startsAt: new Date(now.getTime() - 5 * 86400000),
          endsAt: new Date(now.getTime() + 60 * 86400000),
          usageLimitPerUser: 2,
          isActive: true,
        },
      })
    : null;

  await db.coupon.create({
    data: {
      code: "EXPIRED5",
      type: "FIXED" as CouponType,
      value: 5,
      startsAt: new Date(now.getTime() - 60 * 86400000),
      endsAt: new Date(now.getTime() - 5 * 86400000), // already expired — for testing invalid-coupon handling
      isActive: true,
    },
  });

  return [welcome, soldes, ...(diamant ? [diamant] : [])];
}

// ─────────────────────────────────────────────────────────────
// 8. Orders — 50, spread across every status
// ─────────────────────────────────────────────────────────────
const STATUS_CYCLE: OrderStatus[] = [
  "DELIVERED",
  "DELIVERED",
  "DELIVERED",
  "SHIPPED",
  "PROCESSING",
  "CONFIRMED",
  "PENDING",
  "CANCELLED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "REFUNDED",
  "PROCESSING",
];

const CARRIERS = ["Colissimo", "Chronopost", "DPD", "Mondial Relay"];

function statusHistoryFor(status: OrderStatus) {
  const steps: { status: OrderStatus; comment: string; offsetHours: number }[] = [
    { status: "PENDING", comment: "Commande créée, en attente de paiement.", offsetHours: 0 },
  ];
  if (status === "CANCELLED") {
    steps.push({ status: "CANCELLED", comment: "Paiement échoué ou expiré — commande annulée.", offsetHours: 1 });
    return steps;
  }
  steps.push({ status: "CONFIRMED", comment: "Paiement confirmé.", offsetHours: 1 });
  if (status === "CONFIRMED") return steps;
  steps.push({ status: "PROCESSING", comment: "Commande en cours de préparation.", offsetHours: 12 });
  if (status === "PROCESSING") return steps;
  steps.push({ status: "SHIPPED", comment: "Colis remis au transporteur.", offsetHours: 36 });
  if (status === "SHIPPED") return steps;
  steps.push({ status: "OUT_FOR_DELIVERY", comment: "Colis en cours de livraison.", offsetHours: 60 });
  if (status === "OUT_FOR_DELIVERY") return steps;
  steps.push({ status: "DELIVERED", comment: "Colis livré.", offsetHours: 72 });
  if (status === "DELIVERED") return steps;
  steps.push({ status: "REFUNDED", comment: "Commande remboursée.", offsetHours: 96 });
  return steps;
}

async function seedOrders(
  customers: { id: string; email: string }[],
  addressesByUser: Record<string, { id: string }[]>,
  products: { id: string; name: string; slug: string }[],
  coupons: { id: string; code: string; type: CouponType; value: unknown; minPurchase: unknown }[]
) {
  const productPrices = new Map<string, number>();
  const fullProducts = await db.product.findMany({ select: { id: true, name: true, sku: true, price: true } });
  for (const p of fullProducts) productPrices.set(p.id, Number(p.price));

  const createdOrders: { id: string; userId: string; status: OrderStatus; items: { productId: string; userId: string }[] }[] = [];

  for (let i = 0; i < 50; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const addresses = addressesByUser[customer.id];
    const address = faker.helpers.arrayElement(addresses);
    const status = STATUS_CYCLE[i % STATUS_CYCLE.length];
    const createdAt = faker.date.recent({ days: 180 });

    const lineProducts = faker.helpers.arrayElements(fullProducts, faker.number.int({ min: 1, max: 4 }));
    const lines = lineProducts.map((p) => {
      const quantity = faker.number.int({ min: 1, max: 3 });
      const unitPrice = Number(p.price);
      return { productId: p.id, productName: p.name, sku: p.sku, unitPrice, quantity, total: Math.round(unitPrice * quantity * 100) / 100 };
    });
    const subtotal = Math.round(lines.reduce((s, l) => s + l.total, 0) * 100) / 100;

    const applyCoupon = faker.datatype.boolean({ probability: 0.2 });
    const coupon = applyCoupon
      ? coupons.find((c) => (!c.minPurchase || subtotal >= Number(c.minPurchase)))
      : undefined;
    const discount = coupon
      ? Math.round((coupon.type === "PERCENT" ? subtotal * (Number(coupon.value) / 100) : Number(coupon.value)) * 100) / 100
      : 0;

    const shippingCost = faker.helpers.arrayElement([0, 5.9, 9.9]);
    const tax = Math.round(subtotal * (20 / 120) * 100) / 100;
    const total = Math.round((subtotal - discount + shippingCost) * 100) / 100;

    const orderNumber = `CMD-${createdAt.getFullYear()}-${String(i + 1).padStart(6, "0")}`;

    const order = await db.order.create({
      data: {
        orderNumber,
        userId: customer.id,
        status,
        subtotal,
        discount,
        shippingCost,
        tax,
        total,
        couponId: coupon?.id,
        shippingAddressId: address.id,
        billingAddressId: address.id,
        customerNote: faker.datatype.boolean({ probability: 0.15 }) ? faker.lorem.sentence() : null,
        createdAt,
        items: { create: lines },
      },
    });

    const history = statusHistoryFor(status);
    for (const step of history) {
      await db.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: step.status,
          comment: step.comment,
          createdAt: new Date(createdAt.getTime() + step.offsetHours * 3600000),
        },
      });
    }

    const paymentStatus = status === "PENDING" ? "PENDING" : status === "CANCELLED" ? "FAILED" : status === "REFUNDED" ? "REFUNDED" : "PAID";
    await db.payment.create({
      data: {
        orderId: order.id,
        provider: "BANK_TRANSFER",
        status: paymentStatus,
        amount: total,
        currency: "EUR",
        adminNote: paymentStatus === "PAID" ? "Virement reçu (donnée de démonstration)" : null,
        paidAt: paymentStatus === "PAID" || paymentStatus === "REFUNDED" ? createdAt : null,
      },
    });

    if (["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "REFUNDED"].includes(status)) {
      const shipmentStatus: ShipmentStatus =
        status === "SHIPPED" ? "SHIPPED" : status === "OUT_FOR_DELIVERY" ? "OUT_FOR_DELIVERY" : status === "DELIVERED" ? "DELIVERED" : "DELIVERED";
      await db.shipment.create({
        data: {
          orderId: order.id,
          carrier: faker.helpers.arrayElement(CARRIERS),
          trackingNumber: faker.string.alphanumeric({ length: 12, casing: "upper" }),
          status: shipmentStatus,
          shippedAt: new Date(createdAt.getTime() + 36 * 3600000),
          deliveredAt: ["DELIVERED", "REFUNDED"].includes(status) ? new Date(createdAt.getTime() + 72 * 3600000) : null,
          estimatedDelivery: new Date(createdAt.getTime() + 96 * 3600000),
        },
      });
    }

    if (coupon) {
      await db.coupon.update({ where: { id: coupon.id }, data: { usageCount: { increment: 1 } } });
      await db.couponUsage.create({ data: { couponId: coupon.id, userId: customer.id, orderId: order.id } });
    }

    createdOrders.push({
      id: order.id,
      userId: customer.id,
      status,
      items: lines.map((l) => ({ productId: l.productId, userId: customer.id })),
    });
  }

  return createdOrders;
}

// ─────────────────────────────────────────────────────────────
// 9. Reviews — 100, weighted toward positive ratings
// ─────────────────────────────────────────────────────────────
const RATING_POOL = [5, 5, 5, 4, 4, 4, 3, 3, 2, 1];

async function seedReviews(
  orders: { id: string; userId: string; status: OrderStatus; items: { productId: string; userId: string }[] }[],
  products: { id: string; name: string }[]
) {
  const eligible = orders
    .filter((o) => o.status === "DELIVERED")
    .flatMap((o) => o.items.map((it) => ({ orderId: o.id, userId: it.userId, productId: it.productId })));

  const pool = [...eligible];
  while (pool.length < 100) {
    pool.push({
      orderId: undefined as unknown as string,
      userId: faker.helpers.arrayElement(orders).userId,
      productId: faker.helpers.arrayElement(products).id,
    });
  }

  const used = new Set<string>();
  let created = 0;
  for (const entry of pool) {
    if (created >= 100) break;
    const key = `${entry.userId}:${entry.productId}:${entry.orderId ?? "none"}`;
    if (used.has(key)) continue;
    used.add(key);

    const statusRoll = faker.number.int({ min: 1, max: 100 });
    const status = statusRoll <= 85 ? "APPROVED" : statusRoll <= 95 ? "PENDING" : "REJECTED";

    await db.review.create({
      data: {
        productId: entry.productId,
        userId: entry.userId,
        orderId: entry.orderId ?? null,
        rating: faker.helpers.arrayElement(RATING_POOL),
        title: faker.datatype.boolean({ probability: 0.6 }) ? faker.lorem.words({ min: 2, max: 5 }) : null,
        comment: faker.lorem.sentences({ min: 1, max: 3 }),
        status,
        createdAt: faker.date.recent({ days: 150 }),
      },
    });
    created++;
  }

  // Recompute denormalized rating aggregates from approved reviews.
  const grouped = await db.review.groupBy({
    by: ["productId"],
    where: { status: "APPROVED" },
    _avg: { rating: true },
    _count: { rating: true },
  });
  for (const g of grouped) {
    await db.product.update({
      where: { id: g.productId },
      data: { avgRating: Math.round((g._avg.rating ?? 0) * 100) / 100, reviewCount: g._count.rating },
    });
  }
}

async function seedFavorites(customers: { id: string }[], products: { id: string }[]) {
  for (const customer of customers) {
    const picks = faker.helpers.arrayElements(products, faker.number.int({ min: 0, max: 6 }));
    for (const p of picks) {
      await db.favorite.create({ data: { userId: customer.id, productId: p.id } }).catch(() => {});
    }
  }
}

async function seedNotifications(orders: { id: string; userId: string; status: OrderStatus }[]) {
  const byUser = new Map<string, { id: string; status: OrderStatus }[]>();
  for (const o of orders) byUser.set(o.userId, [...(byUser.get(o.userId) ?? []), o]);

  for (const [userId, userOrders] of byUser) {
    for (const o of userOrders.slice(0, 3)) {
      await db.notification.create({
        data: {
          userId,
          type: "ORDER_STATUS",
          title: "Mise à jour de votre commande",
          message: `Votre commande est maintenant au statut : ${o.status}.`,
          isRead: faker.datatype.boolean({ probability: 0.5 }),
        },
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding Atelia database…");

  await clearDatabase();
  console.log("  ✓ cleared existing data");

  const categories = await seedCategories();
  console.log(`  ✓ ${categories.size} categories (Outils diamant + 9 sub-categories)`);

  const brand = await seedBrands();
  console.log("  ✓ 1 brand (Hualing Lu)");

  const products = await seedProducts(categories, brand);
  console.log(`  ✓ ${products.length} real catalog products (Katalog 2026)`);

  await seedProductRelations(products);
  console.log("  ✓ product relations (complementary/similar)");

  await seedTutorials(categories, products);
  console.log(`  ✓ ${TUTORIALS.length} tutorials`);

  const { admin, staff, customers } = await seedUsers();
  console.log(`  ✓ ${2 + customers.length} users (1 admin, 1 staff, ${customers.length} customers)`);

  const addressesByUser = await seedAddresses([admin, staff, ...customers]);
  console.log("  ✓ addresses");

  const coupons = await seedCoupons(categories);
  console.log(`  ✓ ${coupons.length} coupons`);

  const orders = await seedOrders(customers, addressesByUser, products, coupons);
  console.log(`  ✓ ${orders.length} orders`);

  await seedReviews(orders, products);
  console.log("  ✓ 100 reviews");

  await seedFavorites(customers, products);
  console.log("  ✓ favorites");

  await seedNotifications(orders);
  console.log("  ✓ notifications");

  console.log("\n✅ Done. Test accounts (see README for details):");
  console.log("   Admin:    christoftran@gmail.com / Admin1234!");
  console.log("   Staff:    staff@atelia.test / Staff1234!");
  console.log("   Customer: <any seeded customer email> / Client1234!");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
