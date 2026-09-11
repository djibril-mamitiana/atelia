import { beforeEach, describe, expect, it, vi } from "vitest";

// `db` is mocked so pricing logic is tested in isolation from Postgres —
// this is the "server computes the price" path from the checkout, so it's
// worth pinning down precisely.
vi.mock("@/lib/db", () => ({
  db: {
    product: { findMany: vi.fn() },
    coupon: { findUnique: vi.fn() },
    couponUsage: { count: vi.fn() },
  },
}));

import { db } from "@/lib/db";
import { computeOrderPricing, PricingError } from "@/server/services/pricing";
import { computeShippingCost } from "@/lib/shipping";

type MockProduct = {
  id: string;
  name: string;
  sku: string;
  price: number;
  taxRate: number;
  stock: number;
  isActive: boolean;
  variants: { id: string; sku: string; priceDelta: number; stock: number; isActive: boolean }[];
};

function mockProduct(overrides: Partial<MockProduct> = {}): MockProduct {
  return {
    id: "prod_1",
    name: "Perceuse-visseuse 18V",
    sku: "KRA-1000",
    price: 99.9,
    taxRate: 20,
    stock: 10,
    isActive: true,
    variants: [],
    ...overrides,
  };
}

const findManyMock = db.product.findMany as unknown as ReturnType<typeof vi.fn>;
const couponFindUniqueMock = db.coupon.findUnique as unknown as ReturnType<typeof vi.fn>;
const couponUsageCountMock = db.couponUsage.count as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  findManyMock.mockReset();
  couponFindUniqueMock.mockReset();
  couponUsageCountMock.mockReset();
});

describe("computeShippingCost", () => {
  it("is free above the free-shipping threshold for STANDARD delivery", () => {
    expect(computeShippingCost("STANDARD", 60)).toBe(0);
  });
  it("charges the standard fee below the threshold", () => {
    expect(computeShippingCost("STANDARD", 20)).toBeGreaterThan(0);
  });
  it("PICKUP is always free", () => {
    expect(computeShippingCost("PICKUP", 5)).toBe(0);
  });
  it("EXPRESS has a fixed cost regardless of subtotal", () => {
    expect(computeShippingCost("EXPRESS", 500)).toBe(9.9);
  });
});

describe("computeOrderPricing", () => {
  it("throws EMPTY_CART for an empty line list", async () => {
    await expect(computeOrderPricing([], { shippingMethod: "STANDARD" })).rejects.toMatchObject({
      code: "EMPTY_CART",
    });
  });

  it("computes subtotal/total from DB prices, ignoring anything the client might send", async () => {
    findManyMock.mockResolvedValue([mockProduct({ price: 100 })]);

    const result = await computeOrderPricing(
      [{ productId: "prod_1", quantity: 2 }],
      { shippingMethod: "STANDARD" }
    );

    expect(result.subtotal).toBe(200);
    // Below the free-shipping threshold is impossible here (200 > 49), so shipping is free.
    expect(result.shippingCost).toBe(0);
    expect(result.total).toBe(200);
  });

  it("rejects a quantity that exceeds available stock", async () => {
    findManyMock.mockResolvedValue([mockProduct({ stock: 1 })]);

    await expect(
      computeOrderPricing([{ productId: "prod_1", quantity: 5 }], { shippingMethod: "STANDARD" })
    ).rejects.toMatchObject({ code: "OUT_OF_STOCK" });
  });

  it("rejects an inactive product", async () => {
    findManyMock.mockResolvedValue([mockProduct({ isActive: false })]);

    await expect(
      computeOrderPricing([{ productId: "prod_1", quantity: 1 }], { shippingMethod: "STANDARD" })
    ).rejects.toMatchObject({ code: "PRODUCT_UNAVAILABLE" });
  });

  it("applies a percentage coupon on top of the DB-computed subtotal", async () => {
    findManyMock.mockResolvedValue([mockProduct({ price: 100 })]);
    couponFindUniqueMock.mockResolvedValue({
      id: "coupon_1",
      code: "WELCOME10",
      type: "PERCENT",
      value: 10,
      minPurchase: null,
      startsAt: new Date(Date.now() - 86400000),
      endsAt: new Date(Date.now() + 86400000),
      usageLimit: null,
      usageLimitPerUser: 1,
      usageCount: 0,
      isActive: true,
      categoryId: null,
      productId: null,
    });
    couponUsageCountMock.mockResolvedValue(0);

    const result = await computeOrderPricing(
      [{ productId: "prod_1", quantity: 1 }],
      { shippingMethod: "STANDARD", couponCode: "welcome10", userId: "user_1" }
    );

    expect(result.subtotal).toBe(100);
    expect(result.discount).toBe(10);
    expect(result.total).toBe(90); // subtotal(100) - discount(10) + shipping(0, above threshold)
  });

  it("rejects an expired or unknown coupon code", async () => {
    findManyMock.mockResolvedValue([mockProduct({ price: 100 })]);
    couponFindUniqueMock.mockResolvedValue(null);

    await expect(
      computeOrderPricing(
        [{ productId: "prod_1", quantity: 1 }],
        { shippingMethod: "STANDARD", couponCode: "DOESNOTEXIST" }
      )
    ).rejects.toMatchObject({ code: "INVALID_COUPON" });
  });

  it("never lets the discount exceed the subtotal for a FIXED coupon", async () => {
    findManyMock.mockResolvedValue([mockProduct({ price: 10 })]);
    couponFindUniqueMock.mockResolvedValue({
      id: "coupon_2",
      code: "BIGFIXED",
      type: "FIXED",
      value: 50, // larger than the 10 € subtotal
      minPurchase: null,
      startsAt: new Date(Date.now() - 86400000),
      endsAt: new Date(Date.now() + 86400000),
      usageLimit: null,
      usageLimitPerUser: null,
      usageCount: 0,
      isActive: true,
      categoryId: null,
      productId: null,
    });

    const result = await computeOrderPricing(
      [{ productId: "prod_1", quantity: 1 }],
      { shippingMethod: "STANDARD", couponCode: "BIGFIXED" }
    );

    expect(result.discount).toBe(10);
    expect(result.total).toBeGreaterThanOrEqual(0);
  });
});

describe("PricingError", () => {
  it("carries a stable machine-readable code alongside the human message", () => {
    const err = new PricingError("OUT_OF_STOCK", "Stock insuffisant.");
    expect(err.code).toBe("OUT_OF_STOCK");
    expect(err.message).toBe("Stock insuffisant.");
  });
});
