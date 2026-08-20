import { cookies } from "next/headers";
import { createHmac, randomUUID, timingSafeEqual } from "crypto";

const COOKIE_NAME = "bj_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

export interface Session {
  userId: string;
  username: string;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET env var is not set");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function encode(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

function decode(token: string): Session | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof session.userId === "string" && typeof session.username === "string") {
      return session;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decode(token);
}

export async function createSession(username: string): Promise<Session> {
  const existing = await getSession();
  const session: Session = { userId: existing?.userId ?? randomUUID(), username };

  const store = await cookies();
  store.set(COOKIE_NAME, encode(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });

  return session;
}
