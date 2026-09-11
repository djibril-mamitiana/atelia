import { describe, expect, it } from "vitest";
import { canAccessAdmin, canManageUsers, isAdmin, isStaffOrAdmin } from "@/lib/auth/roles";

describe("permissions — admin dashboard access", () => {
  it("lets ADMIN and STAFF reach the back-office", () => {
    expect(canAccessAdmin("ADMIN")).toBe(true);
    expect(canAccessAdmin("STAFF")).toBe(true);
  });

  it("never lets a CUSTOMER reach the back-office", () => {
    expect(canAccessAdmin("CUSTOMER")).toBe(false);
  });

  it("treats a missing/invalid role as unauthenticated → denied", () => {
    expect(canAccessAdmin(undefined)).toBe(false);
    expect(canAccessAdmin(null)).toBe(false);
    expect(canAccessAdmin("")).toBe(false);
    expect(canAccessAdmin("SOMETHING_ELSE")).toBe(false);
  });

  it("isStaffOrAdmin mirrors canAccessAdmin", () => {
    expect(isStaffOrAdmin("ADMIN")).toBe(true);
    expect(isStaffOrAdmin("STAFF")).toBe(true);
    expect(isStaffOrAdmin("CUSTOMER")).toBe(false);
  });

  it("only ADMIN can manage users, not STAFF", () => {
    expect(isAdmin("ADMIN")).toBe(true);
    expect(canManageUsers("ADMIN")).toBe(true);
    expect(canManageUsers("STAFF")).toBe(false);
    expect(canManageUsers("CUSTOMER")).toBe(false);
  });
});
