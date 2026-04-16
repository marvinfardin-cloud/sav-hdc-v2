import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production-32chars"
);

const ADMIN_COOKIE = "admin_session_token";
const CLIENT_COOKIE = "client_session_token";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export type SessionPayload = {
  sessionId: string;
  role: "ADMIN" | "TECHNICIEN" | "CLIENT";
};

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createAdminSession(userId: string, role: "ADMIN" | "TECHNICIEN") {
  const expiresAt = new Date(Date.now() + COOKIE_MAX_AGE * 1000);

  const session = await prisma.session.create({
    data: {
      userId,
      token: crypto.randomUUID(),
      expiresAt,
    },
  });

  const jwt = await signToken({ sessionId: session.id, role });
  return { jwt, expiresAt };
}

export async function createClientSession(clientId: string) {
  const expiresAt = new Date(Date.now() + COOKIE_MAX_AGE * 1000);

  const session = await prisma.session.create({
    data: {
      clientId,
      token: crypto.randomUUID(),
      expiresAt,
    },
  });

  const jwt = await signToken({ sessionId: session.id, role: "CLIENT" });
  return { jwt, expiresAt };
}

export async function createMagicLinkToken(clientId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  const session = await prisma.session.create({
    data: {
      clientId,
      token: crypto.randomUUID(),
      expiresAt,
    },
  });

  // Sign a JWT that wraps the session token for the magic link
  const jwt = await signToken({ sessionId: session.token, role: "CLIENT" });
  return jwt;
}

export async function getAdminSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    include: { user: true },
  });

  if (!session || !session.user || session.expiresAt < new Date()) return null;
  return session;
}

export async function getClientSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(CLIENT_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    include: { client: true },
  });

  if (!session || !session.client || session.expiresAt < new Date()) return null;
  return session;
}

export function setAdminCookie(response: Response, jwt: string, expiresAt: Date) {
  response.headers.set(
    "Set-Cookie",
    `${ADMIN_COOKIE}=${jwt}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}`
  );
}

export function setClientCookie(response: Response, jwt: string, expiresAt: Date) {
  response.headers.set(
    "Set-Cookie",
    `${CLIENT_COOKIE}=${jwt}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}`
  );
}

export function clearAdminCookie(): string {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function clearClientCookie(): string {
  return `${CLIENT_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export const ADMIN_COOKIE_NAME = ADMIN_COOKIE;
export const CLIENT_COOKIE_NAME = CLIENT_COOKIE;
