import { coatOf, eyesOf, faceOf, type CatCoat, type CatEyes, type CatFace } from "@/lib/avatar";

const INK = "#15120E";

/** Left-side geometry only; the right side is the same paths mirrored. */
const EAR = "M 21 45 C 16 25 18 11 25 10 C 33 14 42 25 47 35 Z";
const EAR_INNER = "M 25 40 C 22 26 23 16 26 15 C 31 19 37 27 41 34 Z";
const HEAD =
  "M 50 95 C 27 95 13 79 13 58 C 13 36 29 24 50 24 C 71 24 87 36 87 58 C 87 79 73 95 50 95 Z";

/** Rough perceived lightness of a hex colour, 0–1. */
function isLight(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
}

const LEFT_EYE = 37;
const RIGHT_EYE = 63;
const EYE_Y = 55;

function Mirror({ children }: { children: React.ReactNode }) {
  return <g transform="translate(100 0) scale(-1 1)">{children}</g>;
}

/** Coat markings, clipped to the head so nothing spills past the silhouette. */
function Markings({ coat, clipId }: { coat: CatCoat; clipId: string }) {
  const stripes = (
    <g fill={coat.shade}>
      <path d="M 50 24 C 46 30 46 36 50 41 C 54 36 54 30 50 24 Z" />
      <path d="M 36 27 C 31 33 30 39 33 44 C 38 40 39 33 36 27 Z" />
      <path d="M 64 27 C 69 33 70 39 67 44 C 62 40 61 33 64 27 Z" />
      <path d="M 13 52 C 20 53 24 55 26 58 C 22 60 16 60 12 59 Z" />
      <path d="M 87 52 C 80 53 76 55 74 58 C 78 60 84 60 88 59 Z" />
    </g>
  );

  const body = (() => {
    switch (coat.pattern) {
      case "tabby":
        return stripes;
      case "spots":
        return (
          <g fill={coat.shade} opacity={0.75}>
            <circle cx={30} cy={38} r={3.4} />
            <circle cx={44} cy={32} r={2.6} />
            <circle cx={60} cy={33} r={3} />
            <circle cx={72} cy={41} r={3.2} />
            <circle cx={22} cy={52} r={2.4} />
            <circle cx={79} cy={53} r={2.6} />
          </g>
        );
      case "tuxedo":
        return (
          <g fill={coat.belly}>
            {/* white blaze down the forehead, widening into the muzzle bib */}
            <path d="M 50 30 C 44 42 42 54 44 64 C 44 78 56 78 56 64 C 58 54 56 42 50 30 Z" />
            <path d="M 50 62 C 34 62 28 74 32 88 C 40 95 60 95 68 88 C 72 74 66 62 50 62 Z" />
          </g>
        );
      case "points":
        return (
          <g fill={coat.shade}>
            {/* siamese mask: dark around the muzzle, feathering up the brow */}
            <ellipse cx={50} cy={71} rx={20} ry={14} opacity={0.5} />
            <path d="M 34 52 C 40 44 60 44 66 52 C 60 58 40 58 34 52 Z" opacity={0.35} />
          </g>
        );
      case "patch":
        return (
          <g>
            <path
              d="M 13 50 C 20 34 34 24 46 26 C 42 40 34 52 22 62 C 16 60 13 56 13 50 Z"
              fill={coat.accent}
            />
            <path
              d="M 62 24 C 76 27 87 40 86 56 C 78 54 68 46 60 34 Z"
              fill={coat.shade}
            />
            <path d="M 60 78 C 70 76 78 80 80 86 C 72 92 62 92 56 86 Z" fill={coat.accent} opacity={0.85} />
          </g>
        );
      default:
        return null;
    }
  })();

  if (!body) return null;
  return <g clipPath={`url(#${clipId})`}>{body}</g>;
}

function Eyes({ variant, coat }: { variant: CatEyes; coat: CatCoat }) {
  const iris = (cx: number) => (
    <g>
      <ellipse cx={cx} cy={EYE_Y} rx={7.6} ry={8.4} fill={coat.eye} stroke={INK} strokeWidth={1.6} />
      <ellipse cx={cx} cy={EYE_Y} rx={2.4} ry={6.6} fill={INK} />
      <circle cx={cx - 2.6} cy={EYE_Y - 3.4} r={1.7} fill="#fff" opacity={0.92} />
    </g>
  );

  const shut = (cx: number) => (
    <g stroke={INK} strokeWidth={2.4} strokeLinecap="round" fill="none">
      <path d={`M ${cx - 7} ${EYE_Y - 1} Q ${cx} ${EYE_Y + 6} ${cx + 7} ${EYE_Y - 1}`} />
    </g>
  );

  switch (variant) {
    case "sleepy":
      return (
        <g>
          {shut(LEFT_EYE)}
          {shut(RIGHT_EYE)}
        </g>
      );
    case "wink":
      return (
        <g>
          {shut(LEFT_EYE)}
          {iris(RIGHT_EYE)}
        </g>
      );
    case "starry":
      return (
        <g>
          {[LEFT_EYE, RIGHT_EYE].map((cx) => (
            <g key={cx}>
              <ellipse cx={cx} cy={EYE_Y} rx={9} ry={9.6} fill={coat.eye} stroke={INK} strokeWidth={1.6} />
              <circle cx={cx} cy={EYE_Y + 0.6} r={5.2} fill={INK} />
              <circle cx={cx - 2.6} cy={EYE_Y - 3} r={2.4} fill="#fff" />
              <circle cx={cx + 3} cy={EYE_Y + 3.4} r={1.3} fill="#fff" opacity={0.85} />
            </g>
          ))}
          <path
            d="M 74 38 L 75.4 42 L 79 43.4 L 75.4 44.8 L 74 48.6 L 72.6 44.8 L 69 43.4 L 72.6 42 Z"
            fill="#F2DC9B"
          />
        </g>
      );
    case "sly":
      return (
        <g>
          {[LEFT_EYE, RIGHT_EYE].map((cx) => (
            <g key={cx}>
              <path
                d={`M ${cx - 8} ${EYE_Y} Q ${cx} ${EYE_Y - 7} ${cx + 8} ${EYE_Y} Q ${cx} ${EYE_Y + 5} ${cx - 8} ${EYE_Y} Z`}
                fill={coat.eye}
                stroke={INK}
                strokeWidth={1.6}
              />
              <ellipse cx={cx} cy={EYE_Y - 0.5} rx={1.9} ry={3.6} fill={INK} />
            </g>
          ))}
          <g stroke={INK} strokeWidth={2.2} strokeLinecap="round">
            <path d={`M ${LEFT_EYE - 9} ${EYE_Y - 11} L ${LEFT_EYE + 6} ${EYE_Y - 7}`} />
            <path d={`M ${RIGHT_EYE + 9} ${EYE_Y - 11} L ${RIGHT_EYE - 6} ${EYE_Y - 7}`} />
          </g>
        </g>
      );
    case "lucky":
      // House money: dollar signs where the pupils should be.
      return (
        <g>
          {[LEFT_EYE, RIGHT_EYE].map((cx) => (
            <g key={cx}>
              <ellipse cx={cx} cy={EYE_Y} rx={8} ry={8.8} fill="#FBF3DC" stroke={INK} strokeWidth={1.6} />
              <path
                d={`M ${cx + 3.4} ${EYE_Y - 3.6} C ${cx - 3.8} ${EYE_Y - 5.4} ${cx - 4.6} ${EYE_Y - 0.2} ${cx} ${EYE_Y} C ${cx + 4.6} ${EYE_Y + 0.4} ${cx + 3.6} ${EYE_Y + 5} ${cx - 3.4} ${EYE_Y + 3.6}`}
                stroke="#C8A23C"
                strokeWidth={2.2}
                strokeLinecap="round"
                fill="none"
              />
              <path
                d={`M ${cx} ${EYE_Y - 6.4} L ${cx} ${EYE_Y + 6.4}`}
                stroke="#C8A23C"
                strokeWidth={1.6}
                strokeLinecap="round"
              />
            </g>
          ))}
        </g>
      );
    case "round":
    default:
      return (
        <g>
          {iris(LEFT_EYE)}
          {iris(RIGHT_EYE)}
        </g>
      );
  }
}

function Mouth({ variant, coat }: { variant: CatFace; coat: CatCoat }) {
  const stroke = { stroke: INK, strokeWidth: 2.1, strokeLinecap: "round" as const, fill: "none" };
  const nose = (
    <path d="M 45.6 65.4 Q 50 63.4 54.4 65.4 Q 50 70.4 45.6 65.4 Z" fill={coat.nose} stroke={INK} strokeWidth={1.2} />
  );
  /** Classic two-arc cat mouth hanging off the nose. */
  const catMouth = (
    <g {...stroke}>
      <path d="M 50 69 Q 45 76 40 71" />
      <path d="M 50 69 Q 55 76 60 71" />
    </g>
  );

  switch (variant) {
    case "smirk":
      return (
        <g>
          {nose}
          <g {...stroke}>
            <path d="M 50 69 Q 45 75 41 73" />
            <path d="M 50 69 Q 57 75 63 68" />
          </g>
        </g>
      );
    case "oh":
      return (
        <g>
          {nose}
          <ellipse cx={50} cy={75} rx={4.4} ry={5.4} fill="#5C2B31" stroke={INK} strokeWidth={1.4} />
          <ellipse cx={50} cy={77.4} rx={2.6} ry={2.6} fill="#E88C97" />
        </g>
      );
    case "grump":
      return (
        <g>
          {nose}
          <g {...stroke}>
            <path d="M 41 77 Q 50 69 59 77" />
          </g>
        </g>
      );
    case "tongue":
      return (
        <g>
          {nose}
          {catMouth}
          <path d="M 46 73 h 8 a 4 4 0 0 1 -4 8 a 4 4 0 0 1 -4 -8 Z" fill="#E8798A" stroke={INK} strokeWidth={1.2} />
        </g>
      );
    case "fangs":
      return (
        <g>
          {nose}
          <path d="M 40 70 Q 50 79 60 70 Z" fill="#5C2B31" stroke={INK} strokeWidth={1.4} />
          <g fill="#FFFDF6">
            <path d="M 43.5 71 L 46.5 71 L 45 75.5 Z" />
            <path d="M 53.5 71 L 56.5 71 L 55 75.5 Z" />
          </g>
        </g>
      );
    case "smile":
    default:
      return (
        <g>
          {nose}
          {catMouth}
        </g>
      );
  }
}

export default function CatAvatar({
  color,
  eyes,
  face,
  size = 56,
  className = "",
}: {
  color: number;
  eyes: number;
  face: number;
  size?: number;
  className?: string;
}) {
  const coat = coatOf(color);
  const eyesVariant = eyesOf(eyes);
  const faceVariant = faceOf(face);

  // Defs only ever depend on the coat, so two cats in the same coat can share
  // them — which keeps this component usable from server components (no useId).
  const clipId = `cat-head-${color}`;
  const shineId = `cat-shine-${color}`;
  const earFill = coat.pattern === "points" ? coat.shade : coat.base;
  const blush = faceVariant === "oh" || faceVariant === "tongue";
  const whisker = isLight(coat.base) ? "#6B6257" : coat.belly;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`${coat.name} cat with ${eyesVariant} eyes`}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={HEAD} />
        </clipPath>
        <radialGradient id={shineId} cx="50%" cy="28%" r="62%">
          <stop offset="0%" stopColor="#fff" stopOpacity={0.3} />
          <stop offset="60%" stopColor="#fff" stopOpacity={0.04} />
          <stop offset="100%" stopColor="#000" stopOpacity={0.14} />
        </radialGradient>
      </defs>

      <g stroke={INK} strokeWidth={2.2} strokeLinejoin="round">
        <path d={EAR} fill={earFill} />
        <Mirror>
          <path d={EAR} fill={earFill} />
        </Mirror>
      </g>
      <g stroke="none">
        <path d={EAR_INNER} fill={coat.nose} opacity={0.8} />
        <Mirror>
          <path d={EAR_INNER} fill={coat.nose} opacity={0.8} />
        </Mirror>
      </g>

      {/* cheek fur, drawn behind the head so only the tips show */}
      <g fill={coat.base} opacity={0.95}>
        <path d="M 17 56 L 9 61 L 16 65 L 10 70 L 18 72 Z" />
        <Mirror>
          <path d="M 17 56 L 9 61 L 16 65 L 10 70 L 18 72 Z" />
        </Mirror>
      </g>

      <path d={HEAD} fill={coat.base} stroke={INK} strokeWidth={2.4} />
      <Markings coat={coat} clipId={clipId} />

      {/* muzzle pads */}
      <g fill={coat.belly} opacity={coat.pattern === "tuxedo" ? 0 : 0.85}>
        <ellipse cx={43} cy={72} rx={9.5} ry={7.5} />
        <ellipse cx={57} cy={72} rx={9.5} ry={7.5} />
      </g>

      {blush && (
        <g fill="#E8798A" opacity={0.28}>
          <ellipse cx={26} cy={64} rx={7} ry={4.2} />
          <ellipse cx={74} cy={64} rx={7} ry={4.2} />
        </g>
      )}

      <Eyes variant={eyesVariant} coat={coat} />
      <Mouth variant={faceVariant} coat={coat} />

      {/* whiskers: keyed off the belly colour so they read on dark coats too */}
      <g stroke={whisker} strokeWidth={1.6} strokeLinecap="round" opacity={0.75}>
        <path d="M 33 68 L 10 63" />
        <path d="M 33 72 L 9 72" />
        <path d="M 33 76 L 11 81" />
        <path d="M 67 68 L 90 63" />
        <path d="M 67 72 L 91 72" />
        <path d="M 67 76 L 89 81" />
      </g>

      <path d={HEAD} fill={`url(#${shineId})`} />
    </svg>
  );
}
