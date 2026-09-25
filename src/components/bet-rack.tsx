"use client";

import { useState } from "react";
import { Chip, CHIP_DENOMS } from "./chip";
import { BrassButton, Eyebrow } from "./ui";

/** Chip rack: tap chips to build a wager, like pushing them into the circle. */
export default function BetRack({
  balance,
  busy,
  onBet,
}: {
  balance: number;
  busy: boolean;
  onBet: (amount: number) => void;
}) {
  const [pending, setPending] = useState(0);
  const denoms = [...CHIP_DENOMS].reverse();

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-3">
      <div className="flex items-baseline gap-3">
        <Eyebrow>Wager</Eyebrow>
        <span className="font-mono text-2xl font-semibold tabular-nums text-brass-lit">{pending}</span>
        <span className="font-mono text-[11px] tabular-nums text-cream-dim">of {balance}</span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {denoms.map((denom) => {
          const affordable = pending + denom <= balance;
          return (
            <button
              key={denom}
              type="button"
              disabled={!affordable}
              onClick={() => setPending((p) => p + denom)}
              aria-label={`Add ${denom}`}
              className="transition-transform enabled:hover:-translate-y-1 enabled:active:translate-y-0 disabled:opacity-25"
            >
              <Chip value={denom} size={38} />
            </button>
          );
        })}
      </div>

      <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setPending(0)}
          disabled={pending === 0}
          className="h-10 rounded-full border border-cream/15 px-4 text-[10px] uppercase tracking-[0.22em] text-cream-dim transition-colors hover:border-brass/50 hover:text-brass-lit disabled:opacity-30"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => setPending(balance)}
          className="h-10 rounded-full border border-cream/15 px-4 text-[10px] uppercase tracking-[0.22em] text-cream-dim transition-colors hover:border-brass/50 hover:text-brass-lit"
        >
          All in
        </button>
        </div>
        <BrassButton
          onClick={() => onBet(pending)}
          disabled={busy || pending < 1 || pending > balance}
          className="flex-1"
        >
          Place bet
        </BrassButton>
      </div>
    </div>
  );
}
