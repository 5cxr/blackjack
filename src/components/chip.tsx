/** Clay chips: the only place in the room that uses saturated colour. */

export const CHIP_DENOMS = [500, 100, 25, 5] as const;

const CHIP_STYLE: Record<number, { body: string; edge: string; text: string }> = {
  5: { body: "#C93147", edge: "#8E1A2B", text: "#FFF4F1" },
  25: { body: "#1F8D5F", edge: "#0E5B3B", text: "#F2FFF8" },
  100: { body: "#1B1F24", edge: "#000000", text: "#F5EEDA" },
  500: { body: "#6B46C9", edge: "#3E2680", text: "#F6F1FF" },
};

function styleFor(value: number) {
  return CHIP_STYLE[value] ?? { body: "#C8A23C", edge: "#8A6C17", text: "#20180A" };
}

export function Chip({ value, size = 34 }: { value: number; size?: number }) {
  const { body, edge, text } = styleFor(value);
  const notches = Array.from({ length: 8 }, (_, i) => i * 45);

  return (
    <svg viewBox="0 0 40 40" width={size} height={size} role="img" aria-label={`${value} chip`}>
      <circle cx={20} cy={20} r={19} fill={body} stroke={edge} strokeWidth={1.6} />
      <g fill="#F5EEDA" opacity={0.92}>
        {notches.map((deg) => (
          <rect key={deg} x={18.4} y={1.6} width={3.2} height={6} rx={1} transform={`rotate(${deg} 20 20)`} />
        ))}
      </g>
      <circle cx={20} cy={20} r={13.4} fill="none" stroke="#F5EEDA" strokeWidth={1.1} opacity={0.65} />
      <circle cx={20} cy={20} r={11} fill={edge} opacity={0.35} />
      <text
        x={20}
        y={20.6}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={value >= 500 ? 11 : 12}
        fontWeight={600}
        fill={text}
        fontFamily="var(--font-jost), sans-serif"
      >
        {value}
      </text>
    </svg>
  );
}

/** Greedy breakdown of an amount into chip denominations, largest first. */
export function chipBreakdown(amount: number): number[] {
  const chips: number[] = [];
  let left = amount;
  for (const denom of CHIP_DENOMS) {
    while (left >= denom) {
      chips.push(denom);
      left -= denom;
    }
  }
  // Anything under the smallest chip still deserves a marker on the felt.
  if (left > 0) chips.push(left);
  return chips;
}

/**
 * A wagered amount rendered as a leaning stack. Long stacks are capped so a
 * 5,000 chip bet doesn't grow past the seat it belongs to.
 */
export function ChipStack({ amount, size = 26 }: { amount: number; size?: number }) {
  if (amount <= 0) return null;
  const chips = chipBreakdown(amount);
  const shown = chips.slice(0, 5);

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative" style={{ width: size + (shown.length - 1) * 5, height: size }}>
        {shown.map((value, i) => (
          <div
            key={i}
            className="animate-chip absolute top-0"
            style={{ left: i * 5, zIndex: i, animationDelay: `${i * 45}ms` }}
          >
            <Chip value={value} size={size} />
          </div>
        ))}
      </div>
      <span className="font-mono text-[11px] tabular-nums text-brass-lit">{amount}</span>
    </div>
  );
}
