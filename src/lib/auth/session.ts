import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

export type SessionPayload = {
  userId: string;
  email: string;
  role: Role;
  firstName: string;
};

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days — "session persistante"

function getSecretKey(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "NEXTAUTH_SECRET is not set. Add it to .env (see .env.example) — it signs session cookies."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.userId === "string" &&
      typeof payload.email === "string" &&
      typeof payload.role === "string" &&
      typeof payload.firstName === "string"
    ) {
      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role as Role,
        firstName: payload.firstName,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/** Read and verify the current session, if any. Safe to call anywhere on the server. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Require an authenticated user, redirecting to /connexion (with a return path) otherwise. */
export async function requireUser(nextPath?: string): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    const suffix = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/connexion${suffix}`);
  }
  return session;
}

/** Require one of the given roles, otherwise redirect (customers) or 404 (unknown). */
export async function requireRole(roles: Role[], nextPath?: string): Promise<SessionPayload> {
  const session = await requireUser(nextPath);
  if (!roles.includes(session.role)) {
    redirect("/");
  }
  return session;
}
