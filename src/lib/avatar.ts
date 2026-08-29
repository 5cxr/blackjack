/** Fixed option lists for the skribbl.io-style cat avatar builder. No db import — safe in client components. */

export const CAT_COLORS = [
  "#F5A25D", // orange tabby
  "#8B8D96", // gray
  "#2E2A26", // black
  "#F3E9DC", // cream
  "#8A5A3B", // brown
  "#E8C4A0", // tan
  "#5C5652", // charcoal
  "#D97B66", // ginger
] as const;

export const CAT_EYES = ["normal", "sleepy", "wink", "wide", "angry", "heart"] as const;

export const CAT_FACES = ["smile", "smirk", "surprised", "grumpy", "tongue", "whiskers"] as const;

export type CatEyes = (typeof CAT_EYES)[number];
export type CatFace = (typeof CAT_FACES)[number];

export interface AvatarConfig {
  color: number;
  eyes: number;
  face: number;
}

export const DEFAULT_AVATAR: AvatarConfig = { color: 0, eyes: 0, face: 0 };

function clampIndex(value: unknown, length: number): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n >= length) return 0;
  return n;
}

/** Clamps arbitrary input (e.g. request body) into a valid avatar config. */
export function normalizeAvatar(input: unknown): AvatarConfig {
  const obj = (input ?? {}) as Record<string, unknown>;
  return {
    color: clampIndex(obj.avatarColor, CAT_COLORS.length),
    eyes: clampIndex(obj.avatarEyes, CAT_EYES.length),
    face: clampIndex(obj.avatarFace, CAT_FACES.length),
  };
}

export function cycle(current: number, length: number, delta: 1 | -1): number {
  return (current + delta + length) % length;
}
