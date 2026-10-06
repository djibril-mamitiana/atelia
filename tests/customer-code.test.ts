import { describe, expect, it } from "vitest";
import { customerCodeMatches, generateCustomerCode, normalizeCustomerCode } from "@/lib/auth/customer-code";
import { adminCustomerSchema } from "@/validations/auth.schema";

describe("customer code — B2B sign-in", () => {
  it("generates XXXXX-XXXXX codes without ambiguous characters", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateCustomerCode();
      expect(code).toMatch(/^[A-HJKMNP-Z2-9]{5}-[A-HJKMNP-Z2-9]{5}$/);
    }
  });

  it("generates distinct codes", () => {
    const codes = new Set(Array.from({ length: 500 }, generateCustomerCode));
    expect(codes.size).toBe(500);
  });

  it("matches regardless of case and surrounding spaces", () => {
    expect(customerCodeMatches("  k7mpq-3xwza ", "K7MPQ-3XWZA")).toBe(true);
    expect(normalizeCustomerCode(" ab c-12 ")).toBe("ABC-12");
  });

  it("rejects a wrong code, a prefix, or an account without a code", () => {
    expect(customerCodeMatches("K7MPQ-3XWZB", "K7MPQ-3XWZA")).toBe(false);
    expect(customerCodeMatches("K7MPQ", "K7MPQ-3XWZA")).toBe(false);
    expect(customerCodeMatches("", "K7MPQ-3XWZA")).toBe(false);
    expect(customerCodeMatches("ANYTHING", null)).toBe(false);
  });

  it("validates admin-entered codes", () => {
    const base = { firstName: "A", lastName: "B", email: "a@b.fr", isActive: true };
    expect(adminCustomerSchema.safeParse({ ...base, customerCode: "cli-0042" }).data?.customerCode).toBe("CLI-0042");
    expect(adminCustomerSchema.safeParse({ ...base, customerCode: "abc" }).success).toBe(false);
    expect(adminCustomerSchema.safeParse({ ...base, customerCode: "ab cd ef" }).success).toBe(false);
  });
});
