import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { db } from "./db";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dar-local-dev-secret-change-in-prod"
);

const COOKIE = "dar_session";

function sessionCookieSecure() {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "";
  if (siteUrl.startsWith("https://")) return true;
  return false;
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar: string | null;
  city: string;
  district: string | null;
  lat: number | null;
  lng: number | null;
  verified: boolean;
  reputation: number;
  role: "USER" | "ADMIN";
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

const SESSION_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  username: true,
  avatar: true,
  city: true,
  district: true,
  lat: true,
  lng: true,
  verified: true,
  reputation: true,
  role: true,
} as const;

export async function signAccessToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(SECRET);
}

async function findSessionUser(userId: string): Promise<SessionUser | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: SESSION_USER_SELECT,
  });
  return user;
}

export async function createSession(userId: string) {
  const token = await signAccessToken(userId);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: sessionCookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const userId = payload.sub;
    if (!userId) return null;

    return findSessionUser(userId);
  } catch {
    // Нельзя менять cookies в RSC — только в Server Action / Route Handler
    return null;
  }
});

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function getSessionFromRequest(
  request: Request
): Promise<SessionUser | null> {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    if (!token) return null;
    try {
      const { payload } = await jwtVerify(token, SECRET);
      const userId = payload.sub;
      if (!userId || typeof userId !== "string") return null;
      return findSessionUser(userId);
    } catch {
      return null;
    }
  }

  return getSession();
}

export async function requireSessionFromRequest(request: Request): Promise<SessionUser> {
  const session = await getSessionFromRequest(request);
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export function isAdmin(user: SessionUser | null | undefined) {
  return user?.role === "ADMIN";
}

export async function requireAdmin() {
  const session = await requireSession();
  if (!isAdmin(session)) throw new Error("FORBIDDEN");
  return session;
}
