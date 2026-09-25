import { rankOf, suitOf, SUIT_SYMBOLS, type Card } from "@/lib/cards";

/** "sm" is the size used in seats, "md" for the dealer's hand. */
type CardSize = "sm" | "md";

const FRAME: Record<CardSize, string> = {
  sm: "h-11 w-8 rounded-[3px]",
  md: "h-16 w-11 rounded",
};

const RANK_TEXT: Record<CardSize, string> = {
  sm: "text-[8px]",
  md: "text-[11px]",
};

const PIP_TEXT: Record<CardSize, string> = {
  sm: "text-sm",
  md: "text-2xl",
};

export function PlayingCard({ card, size = "sm" }: { card: Card; size?: CardSize }) {
  const rank = rankOf(card);
  const suit = suitOf(card);
  const ink = suit === "H" || suit === "D" ? "text-red-600" : "text-zinc-900";

  return (
    <div
      className={`relative shrink-0 border border-black/20 bg-white shadow-sm ${FRAME[size]} ${ink}`}
    >
      <span className={`absolute left-[2px] top-0 font-semibold leading-tight ${RANK_TEXT[size]}`}>
        {rank}
      </span>
      <span
        className={`absolute inset-0 flex items-center justify-center leading-none ${PIP_TEXT[size]}`}
      >
        {SUIT_SYMBOLS[suit]}
      </span>
      <span
        className={`absolute bottom-0 right-[2px] rotate-180 font-semibold leading-tight ${RANK_TEXT[size]}`}
      >
        {rank}
      </span>
    </div>
  );
}

/** Face-down card — the dealer's hole card while a round is still playing. */
export function CardBack({ size = "sm" }: { size?: CardSize }) {
  return (
    <div
      className={`shrink-0 border border-black/20 bg-indigo-800 p-[3px] shadow-sm ${FRAME[size]}`}
    >
      <div className="h-full w-full rounded-[2px] border border-white/40 bg-[repeating-linear-gradient(45deg,#4338ca_0_3px,#3730a3_3px_6px)]" />
    </div>
  );
}
