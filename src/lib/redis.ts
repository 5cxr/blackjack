import Redis from "ioredis";

// Lazy: Next.js evaluates route modules at build time to collect page data,
// so constructing these eagerly at module scope would crash the build if
// REDIS_URL isn't injected into the build step (it wouldn't be needed there
// at all -- only at request time).
let _pub: Redis | null = null;
let _sub: Redis | null = null;

function client(): Redis {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL env var is not set");
  return new Redis(url);
}

// ioredis pins a connection into subscriber-only mode once anything
// subscribes on it, so publishing needs a separate connection.
export function getRedisPub(): Redis {
  if (!_pub) _pub = client();
  return _pub;
}

export function getRedisSub(): Redis {
  if (!_sub) _sub = client();
  return _sub;
}
