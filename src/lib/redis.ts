import Redis from "ioredis";

function requireUrl(): string {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL env var is not set");
  return url;
}

// ioredis pins a connection into subscriber-only mode once anything
// subscribes on it, so publishing needs a separate connection.
export const redisPub = new Redis(requireUrl());
export const redisSub = new Redis(requireUrl());
