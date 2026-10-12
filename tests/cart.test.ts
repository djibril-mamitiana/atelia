import { describe, expect, it, vi } from "vitest";

// cartItemIssue is pure; its module's DB / cookie / session imports are stubbed.
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn(), clearSessionCookie: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

import { cartItemIssue, type CartWithItems } from "@/server/services/cart";

type Line = CartWithItems["items"][number];

function line({
  quantity = 1,
  product = {},
  variant = null,
}: {
  quantity?: number;
  product?: { isActive?: boolean; stock?: number };
  variant?: { isActive?: boolean; stock?: number } | null;
}): Line {
  return {
    quantity,
    product: { isActive: true, stock: 10, ...product },
    variant: variant && { isActive: true, stock: 10, ...variant },
  } as unknown as Line;
}

describe("cartItemIssue — lines a customer can't order as they are", () => {
  it("accepts an active product within stock", () => {
    expect(cartItemIssue(line({ quantity: 10 }))).toBeNull();
  });

  it("flags a product deactivated after it was added", () => {
    expect(cartItemIssue(line({ product: { isActive: false } }))).toBe("unavailable");
    expect(cartItemIssue(line({ variant: { isActive: false } }))).toBe("unavailable");
  });

  it("flags a sold-out product, and a quantity above the stock left", () => {
    expect(cartItemIssue(line({ product: { stock: 0 } }))).toBe("outOfStock");
    expect(cartItemIssue(line({ quantity: 3, product: { stock: 2 } }))).toBe("stockLimited");
  });

  it("uses the variant's stock when the line has one", () => {
    expect(cartItemIssue(line({ quantity: 3, product: { stock: 0 }, variant: { stock: 5 } }))).toBeNull();
    expect(cartItemIssue(line({ quantity: 3, variant: { stock: 0 } }))).toBe("outOfStock");
  });
});
