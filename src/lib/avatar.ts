/**
 * Fixed option lists for the cat avatar builder: coat, eyes, mouth. Three
 * independent indices, stored on `users`. No db import — safe in client
 * components.
 */

export interface CatCoat {
  name: string;
  /** Main fur. */
  base: string;
  /** Darker fur: stripes, spots, points, shading. */
  shade: string;
  /** Muzzle, chin and inner-ear lightening. */
  belly: string;
  /** Third colour, only used by patched coats. */
  accent: string;
  /** Iris. */
  eye: string;
  nose: string;
  pattern: "solid" | "tabby" | "tuxedo" | "patch" | "points" | "spots";
}

export const CAT_COATS: CatCoat[] = [
  {
    name: "marmalade",
    base: "#E8913C",
    shade: "#C1681F",
    belly: "#FBE3C4",
    accent: "#C1681F",
    eye: "#67C48C",
    nose: "#E08A8A",
    pattern: "tabby",
  },
  {
    name: "smoke",
    base: "#98A0AA",
    shade: "#6D7580",
    belly: "#E6EAEE",
    accent: "#6D7580",
    eye: "#D8A33C",
    nose: "#D79A9A",
    pattern: "tabby",
  },
  {
    name: "tuxedo",
    base: "#2B2824",
    shade: "#171512",
    belly: "#F6F1E7",
    accent: "#F6F1E7",
    eye: "#8FD17A",
    nose: "#C98F92",
    pattern: "tuxedo",
  },
  {
    name: "cream",
    base: "#F1E1C7",
    shade: "#D5BE9C",
    belly: "#FFF9EE",
    accent: "#D5BE9C",
    eye: "#5FA9D6",
    nose: "#E7A0A6",
    pattern: "solid",
  },
  {
    name: "cocoa",
    base: "#7C5238",
    shade: "#553424",
    belly: "#E8CDB3",
    accent: "#553424",
    eye: "#E0B24A",
    nose: "#C98A86",
    pattern: "solid",
  },
  {
    name: "calico",
    base: "#F7EEDF",
    shade: "#3A322C",
    belly: "#FFFAF0",
    accent: "#E2913C",
    eye: "#D8A33C",
    nose: "#E7A0A6",
    pattern: "patch",
  },
  {
    name: "siamese",
    base: "#EADCC2",
    shade: "#4B3A33",
    belly: "#FBF4E6",
    accent: "#4B3A33",
    eye: "#4FA8D8",
    nose: "#B98C86",
    pattern: "points",
  },
  {
    name: "midnight",
    base: "#33405A",
    shade: "#1D2537",
    belly: "#9BAAC4",
    accent: "#1D2537",
    eye: "#7BE0C0",
    nose: "#9E8AA8",
    pattern: "spots",
  },
];

export const CAT_EYES = ["round", "sleepy", "wink", "starry", "sly", "lucky"] as const;

export const CAT_FACES = ["smile", "smirk", "oh", "grump", "tongue", "fangs"] as const;

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
    color: clampIndex(obj.avatarColor, CAT_COATS.length),
    eyes: clampIndex(obj.avatarEyes, CAT_EYES.length),
    face: clampIndex(obj.avatarFace, CAT_FACES.length),
  };
}

export function cycle(current: number, length: number, delta: 1 | -1): number {
  return (current + delta + length) % length;
}

export function randomAvatar(): AvatarConfig {
  return {
    color: Math.floor(Math.random() * CAT_COATS.length),
    eyes: Math.floor(Math.random() * CAT_EYES.length),
    face: Math.floor(Math.random() * CAT_FACES.length),
  };
}

export function coatOf(index: number): CatCoat {
  return CAT_COATS[index] ?? CAT_COATS[0];
}

export function eyesOf(index: number): CatEyes {
  return CAT_EYES[index] ?? CAT_EYES[0];
}

export function faceOf(index: number): CatFace {
  return CAT_FACES[index] ?? CAT_FACES[0];
}
