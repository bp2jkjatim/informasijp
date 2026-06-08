import "server-only";

import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { basePath } from "@/lib/paths";

const CAPTCHA_COOKIE_NAME = "informasijp_captcha";
const CAPTCHA_TTL_MS = 5 * 60 * 1000;
const CAPTCHA_LENGTH = 5;
// Exclude visually ambiguous characters (0/O, 1/I/L) to keep it user friendly.
const CAPTCHA_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function getSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("Missing required environment variable: SESSION_SECRET");
  }

  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function randomText() {
  let text = "";

  for (let i = 0; i < CAPTCHA_LENGTH; i += 1) {
    text += CAPTCHA_ALPHABET[randomInt(0, CAPTCHA_ALPHABET.length)];
  }

  return text;
}

function createToken(text: string) {
  const exp = Date.now() + CAPTCHA_TTL_MS;
  const body = Buffer.from(JSON.stringify({ t: text.toLowerCase(), exp })).toString("base64url");
  return `${body}.${sign(body)}`;
}

function readToken(token?: string): { text: string; exp: number } | null {
  if (!token) {
    return null;
  }

  const [body, signature] = token.split(".");

  if (!body || !signature) {
    return null;
  }

  const expected = sign(body);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      t: string;
      exp: number;
    };

    if (!parsed?.t || typeof parsed.exp !== "number") {
      return null;
    }

    return { text: parsed.t, exp: parsed.exp };
  } catch {
    return null;
  }
}

function clearCaptchaCookie() {
  cookies().set(CAPTCHA_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: basePath || "/",
    maxAge: 0,
  });
}

export function issueCaptcha() {
  const text = randomText();

  cookies().set(CAPTCHA_COOKIE_NAME, createToken(text), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: basePath || "/",
    maxAge: Math.floor(CAPTCHA_TTL_MS / 1000),
  });

  return text;
}

export function verifyCaptcha(answer: string | undefined | null) {
  const token = cookies().get(CAPTCHA_COOKIE_NAME)?.value;

  // One-time use: invalidate the challenge regardless of the outcome.
  clearCaptchaCookie();

  const parsed = readToken(token);

  if (!parsed || Date.now() > parsed.exp) {
    return false;
  }

  const provided = (answer || "").trim().toLowerCase();
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(parsed.text);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function renderCaptchaSvg(text: string) {
  const width = 180;
  const height = 60;
  const colors = ["#1e3a8a", "#1d4ed8", "#0f766e", "#7c3aed", "#b91c1c"];

  const characters = text
    .split("")
    .map((char, index) => {
      const x = 24 + index * 30 + randomInt(-3, 4);
      const y = 38 + randomInt(-4, 5);
      const rotate = randomInt(-22, 23);
      const color = colors[randomInt(0, colors.length)];
      const size = randomInt(26, 34);

      return `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="monospace" font-weight="700" transform="rotate(${rotate} ${x} ${y})">${char}</text>`;
    })
    .join("");

  let noise = "";

  for (let i = 0; i < 5; i += 1) {
    const x1 = randomInt(0, width);
    const y1 = randomInt(0, height);
    const x2 = randomInt(0, width);
    const y2 = randomInt(0, height);
    const color = colors[randomInt(0, colors.length)];
    noise += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1" opacity="0.35" />`;
  }

  for (let i = 0; i < 32; i += 1) {
    const cx = randomInt(0, width);
    const cy = randomInt(0, height);
    noise += `<circle cx="${cx}" cy="${cy}" r="1" fill="#94a3b8" opacity="0.5" />`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="captcha"><rect width="100%" height="100%" fill="#f1f5f9" rx="10" />${noise}${characters}</svg>`;
}
