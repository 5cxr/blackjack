import { rankOf, suitOf, SUIT_SYMBOLS, type Card, type Rank, type Suit } from "@/lib/cards";

/** Card sizes in px width; height follows the 5:7 ratio of a real card. */
const WIDTHS = { xs: 30, sm: 42, md: 56, lg: 74 } as const;

export type CardSize = keyof typeof WIDTHS;

const VB_W = 60;
const VB_H = 84;

const FACE = "#FAF4E6";
const INK = "#1B1A16";
const RUBY = "#B32438";
const BRASS = "#C8A23C";

/** Pip grid: classic positions, mirrored top-to-bottom like a real deck. */
const COL = { l: 19, c: 30, r: 41 };
const PIP_LAYOUT: Partial<Record<Rank, [number, number][]>> = {
  "2": [[COL.c, 22], [COL.c, 62]],
  "3": [[COL.c, 22], [COL.c, 42], [COL.c, 62]],
  "4": [[COL.l, 22], [COL.r, 22], [COL.l, 62], [COL.r, 62]],
  "5": [[COL.l, 22], [COL.r, 22], [COL.c, 42], [COL.l, 62], [COL.r, 62]],
  "6": [[COL.l, 22], [COL.r, 22], [COL.l, 42], [COL.r, 42], [COL.l, 62], [COL.r, 62]],
  "7": [[COL.l, 22], [COL.r, 22], [COL.c, 32], [COL.l, 42], [COL.r, 42], [COL.l, 62], [COL.r, 62]],
  "8": [
    [COL.l, 22], [COL.r, 22], [COL.c, 32], [COL.l, 42], [COL.r, 42], [COL.c, 52],
    [COL.l, 62], [COL.r, 62],
  ],
  "9": [
    [COL.l, 20], [COL.r, 20], [COL.l, 35], [COL.r, 35], [COL.c, 42],
    [COL.l, 49], [COL.r, 49], [COL.l, 64], [COL.r, 64],
  ],
  "10": [
    [COL.l, 20], [COL.r, 20], [COL.c, 28], [COL.l, 35], [COL.r, 35],
    [COL.l, 49], [COL.r, 49], [COL.c, 56], [COL.l, 64], [COL.r, 64],
  ],
};

const COURT_FLOURISH: Record<string, string> = {
  J: "Jack",
  Q: "Queen",
  K: "King",
};

export function PlayingCard({
  card,
  size = "sm",
  /** Staggered entrance; index in the hand. */
  dealIndex,
  className = "",
}: {
  card: Card;
  size?: CardSize;
  dealIndex?: number;
  className?: string;
}) {
  const rank = rankOf(card);
  const suit = suitOf(card);
  const width = WIDTHS[size];
  const ink = suit === "H" || suit === "D" ? RUBY : INK;
  const glyph = SUIT_SYMBOLS[suit];
  const pips = PIP_LAYOUT[rank];
  const court = COURT_FLOURISH[rank];

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width={width}
      height={(width * VB_H) / VB_W}
      className={`shrink-0 drop-shadow-[0_3px_6px_rgba(0,0,0,0.45)] ${dealIndex !== undefined ? "animate-deal" : ""} ${className}`}
      style={dealIndex !== undefined ? { animationDelay: `${dealIndex * 110}ms` } : undefined}
      role="img"
      aria-label={`${rank} of ${{ S: "spades", H: "hearts", D: "diamonds", C: "clubs" }[suit as Suit]}`}
    >
      <rect x={0.75} y={0.75} width={VB_W - 1.5} height={VB_H - 1.5} rx={5} fill={FACE} stroke="rgba(27,26,22,0.35)" strokeWidth={1.5} />
      <rect x={3.5} y={3.5} width={VB_W - 7} height={VB_H - 7} rx={3.5} fill="none" stroke={BRASS} strokeWidth={0.6} opacity={0.45} />

      {/* corner indices, second one rotated like a real card */}
      {[false, true].map((flipped) => (
        <g key={String(flipped)} transform={flipped ? `rotate(180 ${VB_W / 2} ${VB_H / 2})` : undefined} fill={ink}>
          <text x={9} y={16} fontSize={13} fontWeight={600} textAnchor="middle" fontFamily="var(--font-jost), sans-serif">
            {rank}
          </text>
          <text x={9} y={26} fontSize={10} textAnchor="middle">
            {glyph}
          </text>
        </g>
      ))}

      {pips ? (
        <g fill={ink}>
          {pips.map(([x, y], i) => (
            <text
              key={i}
              x={x}
              y={y}
              fontSize={13}
              textAnchor="middle"
              dominantBaseline="middle"
              transform={y > VB_H / 2 ? `rotate(180 ${x} ${y})` : undefined}
            >
              {glyph}
            </text>
          ))}
        </g>
      ) : court ? (
        <g>
          <rect x={14} y={20} width={32} height={44} rx={3} fill="none" stroke={BRASS} strokeWidth={0.8} opacity={0.7} />
          <text
            x={30}
            y={45}
            fontSize={26}
            fontWeight={500}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={ink}
            fontFamily="var(--font-limelight), serif"
          >
            {rank}
          </text>
          <text x={30} y={58} fontSize={11} textAnchor="middle" fill={ink}>
            {glyph}
          </text>
          <text x={30} y={29} fontSize={11} textAnchor="middle" fill={ink}>
            {glyph}
          </text>
        </g>
      ) : (
        <g>
          <text x={30} y={44} fontSize={30} textAnchor="middle" dominantBaseline="middle" fill={ink}>
            {glyph}
          </text>
          <circle cx={30} cy={44} r={20} fill="none" stroke={BRASS} strokeWidth={0.7} opacity={0.6} />
        </g>
      )}
    </svg>
  );
}

/** Face-down card: house pattern, brass lattice on bottle green, paw medallion. */
export function CardBack({
  size = "sm",
  dealIndex,
  className = "",
}: {
  size?: CardSize;
  dealIndex?: number;
  className?: string;
}) {
  const width = WIDTHS[size];
  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width={width}
      height={(width * VB_H) / VB_W}
      className={`shrink-0 drop-shadow-[0_3px_6px_rgba(0,0,0,0.45)] ${dealIndex !== undefined ? "animate-deal" : ""} ${className}`}
      style={dealIndex !== undefined ? { animationDelay: `${dealIndex * 110}ms` } : undefined}
      role="img"
      aria-label="face-down card"
    >
      <defs>
        <pattern id="card-lattice" width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M 0 0 V 6" stroke={BRASS} strokeWidth={0.5} opacity={0.5} />
          <path d="M 0 0 H 6" stroke={BRASS} strokeWidth={0.5} opacity={0.3} />
        </pattern>
      </defs>
      <rect x={0.75} y={0.75} width={VB_W - 1.5} height={VB_H - 1.5} rx={5} fill="#0C3A28" stroke="rgba(27,26,22,0.5)" strokeWidth={1.5} />
      <rect x={4} y={4} width={VB_W - 8} height={VB_H - 8} rx={3} fill="url(#card-lattice)" />
      <rect x={4} y={4} width={VB_W - 8} height={VB_H - 8} rx={3} fill="none" stroke={BRASS} strokeWidth={0.8} opacity={0.75} />
      <g fill={BRASS} opacity={0.9}>
        <ellipse cx={30} cy={46} rx={7} ry={6} />
        <circle cx={22.5} cy={36.5} r={2.6} />
        <circle cx={27.5} cy={33.5} r={2.8} />
        <circle cx={33} cy={33.5} r={2.8} />
        <circle cx={38} cy={36.5} r={2.6} />
      </g>
    </svg>
  );
}

/** A fanned hand; cards overlap and tilt slightly like they were dealt by hand. */
export function CardFan({
  cards,
  size = "sm",
  hiddenCount = 0,
  animate = true,
}: {
  cards: Card[];
  size?: CardSize;
  /** Face-down cards appended after the visible ones (the dealer's hole card). */
  hiddenCount?: number;
  animate?: boolean;
}) {
  const total = cards.length + hiddenCount;
  const overlap = { xs: -12, sm: -17, md: -22, lg: -30 }[size];

  return (
    <div className="flex items-end">
      {cards.map((card, i) => (
        <div
          key={`${card}-${i}`}
          style={{
            marginLeft: i === 0 ? 0 : overlap,
            transform: `rotate(${(i - (total - 1) / 2) * 4}deg)`,
            zIndex: i,
          }}
        >
          <PlayingCard card={card} size={size} dealIndex={animate ? i : undefined} />
        </div>
      ))}
      {Array.from({ length: hiddenCount }, (_, i) => {
        const idx = cards.length + i;
        return (
          <div
            key={`back-${i}`}
            style={{
              marginLeft: idx === 0 ? 0 : overlap,
              transform: `rotate(${(idx - (total - 1) / 2) * 4}deg)`,
              zIndex: idx,
            }}
          >
            <CardBack size={size} dealIndex={animate ? idx : undefined} />
          </div>
        );
      })}
    </div>
  );
}
