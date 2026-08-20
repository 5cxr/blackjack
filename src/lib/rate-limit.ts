import { NextRequest, NextResponse } from "next/server";
import { redisPub } from "./redis";

/**
 * Fixed-window rate limit via a plain INCR+EXPIRE — atomic enough for this
 * purpose without needing a Lua script or sliding-window log. `key` should
 * already include the route and identity (IP or userId). Returns a 429
 * response if the caller is over the limit, or null if the request may
 * proceed — lets route handlers do `const limited = await ...; if (limited) return limited;`
 * instead of a try/catch at every call site.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<NextResponse | null> {
  const count = await redisPub.incr(key);
  if (count === 1) {
    await redisPub.expire(key, windowSeconds);
  }
  if (count > limit) {
    return NextResponse.json({ error: "Too many requests, slow down." }, { status: 429 });
  }
  return null;
}

export function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}
