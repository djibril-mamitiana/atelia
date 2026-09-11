import type { Role } from "@prisma/client";

/** Pure permission predicates — no I/O, so they're trivially unit-testable
 *  and can be shared between proxy.ts (Edge/Node), Server Components and
 *  Server Actions without pulling in the database client. */

export function isStaffOrAdmin(role: Role | string | undefined | null): boolean {
  return role === "ADMIN" || role === "STAFF";
}

export function isAdmin(role: Role | string | undefined | null): boolean {
  return role === "ADMIN";
}

/** A CUSTOMER must never reach /admin — everything else with a valid
 *  session (STAFF, ADMIN) may. */
export function canAccessAdmin(role: Role | string | undefined | null): boolean {
  return isStaffOrAdmin(role);
}

/** Only ADMIN can manage other admins / destructive settings; STAFF gets
 *  the operational parts of the back-office (orders, stock, catalog). */
export function canManageUsers(role: Role | string | undefined | null): boolean {
  return isAdmin(role);
}
