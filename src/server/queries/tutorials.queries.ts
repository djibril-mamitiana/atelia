import "server-only";
import { db } from "@/lib/db";

export async function getPublishedTutorials(limit?: number) {
  return db.tutorial.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      thumbnailUrl: true,
      durationMinutes: true,
      level: true,
      tags: true,
    },
  });
}

export async function getTutorialBySlug(slug: string) {
  return db.tutorial.findUnique({
    where: { slug },
    include: {
      category: true,
      products: {
        orderBy: { position: "asc" },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              compareAtPrice: true,
              stock: true,
              images: { take: 1, orderBy: { position: "asc" } },
              brand: { select: { name: true } },
            },
          },
        },
      },
    },
  });
}

export async function getTutorialsForProduct(productId: string) {
  return db.tutorialProduct.findMany({
    where: { productId },
    include: { tutorial: true },
    orderBy: { position: "asc" },
  });
}
