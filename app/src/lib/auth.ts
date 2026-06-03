import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "informasijp_session";
const SESSION_MAX_AGE = 60 * 60 * 8;

type SessionPayload = {
  userId: number;
};

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("Missing required environment variable: SESSION_SECRET");
  }

  return secret;
}

function encodeBase64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function decodeBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signValue(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function serializeSession(payload: SessionPayload) {
  const body = encodeBase64Url(JSON.stringify(payload));
  const signature = signValue(body);
  return `${body}.${signature}`;
}

function parseSession(cookieValue?: string): SessionPayload | null {
  if (!cookieValue) {
    return null;
  }

  const [body, signature] = cookieValue.split(".");

  if (!body || !signature) {
    return null;
  }

  const expectedSignature = signValue(body);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(body)) as SessionPayload;

    if (!parsed?.userId || typeof parsed.userId !== "number") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function createUserSession(userId: number) {
  const cookieStore = cookies();
  const value = serializeSession({ userId });

  cookieStore.set(SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearUserSession() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const session = parseSession(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      employee: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return user;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdminUser() {
  const user = await requireCurrentUser();

  if (user.role !== "admin") {
    redirect("/pegawai");
  }

  return user;
}

export function getUserHomePath(role: string) {
  return role === "admin" ? "/admin" : "/pegawai";
}
