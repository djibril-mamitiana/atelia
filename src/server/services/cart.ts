import "server-only";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession, clearSessionCookie } from "@/lib/auth/session";
import { CART_COOKIE_NAME } from "@/lib/constants";
import { randomUUID } from "crypto";

const CART_INCLUDE = {
  items: {
    include: {
      product: {
        include: {
          images: { orderBy: { position: "asc" as const }, take: 1 },
          brand: { select: { name: true } },
        },
      },
      variant: true,
    },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

export type CartWithItems = NonNullable<Awaited<ReturnType<typeof getCurrentCart>>>;

/** Read-only lookup — used to render the cart / header count. Never creates a cart. */
export async function getCurrentCart() {
  const session = await getSession();
  if (session) {
    return db.cart.findFirst({
      where: { userId: session.userId },
      include: CART_INCLUDE,
    });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(CART_COOKIE_NAME)?.value;
  if (!token) return null;

  return db.cart.findUnique({
    where: { sessionToken: token },
    include: CART_INCLUDE,
  });
}

/** Get-or-create — used by mutating actions (add to cart, etc). May set a cookie. */
export async function getOrCreateCart() {
  const session = await getSession();

  if (session) {
    const existing = await db.cart.findFirst({ where: { userId: session.userId } });
    if (existing) return existing;
    try {
      return await db.cart.create({ data: { userId: session.userId } });
    } catch (err) {
      // P2003 = foreign key violation. The only FK this insert can violate
      // is userId, since it's the only field we set.
      const isStaleUser = err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003";
      if (!isStaleUser) throw err;
      // The session JWT is validly signed and unexpired, but its userId no
      // longer exists (e.g. the database was reset/reseeded while the
      // cookie was still around). Drop the stale session and fall through
      // to a guest cart instead of crashing the add-to-cart action.
      await clearSessionCookie();
    }
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(CART_COOKIE_NAME)?.value;
  if (token) {
    const existing = await db.cart.findUnique({ where: { sessionToken: token } });
    if (existing) return existing;
  }

  const newToken = randomUUID();
  const cart = await db.cart.create({ data: { sessionToken: newToken } });
  cookieStore.set(CART_COOKIE_NAME, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return cart;
}

/** Called right after login — folds a guest cart into the now-known user's cart. */
export async function mergeGuestCartIntoUser(userId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(CART_COOKIE_NAME)?.value;
  if (!token) return;

  const guestCart = await db.cart.findUnique({ where: { sessionToken: token }, include: { items: true } });
  if (!guestCart) return;

  const userCart = await db.cart.findFirst({ where: { userId } });

  if (!userCart) {
    await db.cart.update({ where: { id: guestCart.id }, data: { userId, sessionToken: null } });
  } else {
    await db.$transaction(async (tx) => {
      for (const item of guestCart.items) {
        const existing = await tx.cartItem.findFirst({
          where: { cartId: userCart.id, productId: item.productId, variantId: item.variantId },
        });
        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + item.quantity },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: userCart.id,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
            },
          });
        }
      }
      await tx.cart.delete({ where: { id: guestCart.id } });
    });
  }

  cookieStore.delete(CART_COOKIE_NAME);
}

export function cartItemCount(cart: { items: { quantity: number }[] } | null): number {
  if (!cart) return 0;
  return cart.items.reduce((sum, i) => sum + i.quantity, 0);
}
