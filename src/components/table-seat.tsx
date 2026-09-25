"use client";

import { handValue, type Card } from "@/lib/cards";
import { computePayout } from "@/lib/payouts";
import { TURN_SECONDS } from "@/lib/turn-timer";
import CatAvatar from "./cat-avatar";
import { CardFan } from "./playing-card";
import { ChipStack } from "./chip";

export interface SeatPlayer {
  seat: number;
  userId: string;
  username: string;
  bet: number;
  balance: number;
  hand: Card[];
  status: "active" | "stood" | "bust" | "blackjack" | "spectating";
  avatarColor: number;
  avatarEyes: number;
  avatarFace: number;
}

const IN_PLAY_LABEL: Record<SeatPlayer["status"], string> = {
  active: "",
  stood: "stands",
  bust: "bust",
  blackjack: "blackjack",
  spectating: "sitting out",
};

/** Green ring that drains clockwise over the seat's turn. */
function TimerRing({ turnStartedAt, tick }: { turnStartedAt: Date; tick: number }) {
  const elapsed = tick === 0 ? 0 : tick - turnStartedAt.getTime();
  const remaining = Math.max(0, 1 - elapsed / (TURN_SECONDS * 1000));
  const r = 46;
  const circumference = 2 * Math.PI * r;
  const low = remaining < 0.3;

  return (
    <svg viewBox="0 0 100 100" className="pointer-events-none absolute -inset-1 -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(245,238,218,0.15)" strokeWidth={4} />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={low ? "#C93147" : "#4BDC9D"}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - remaining)}
        style={{ transition: "stroke-dashoffset 200ms linear" }}
      />
    </svg>
  );
}

function Outcome({ player, dealerHand }: { player: SeatPlayer; dealerHand: Card[] }) {
  if (player.status === "spectating") {
    return <span className="text-[9px] uppercase tracking-[0.2em] text-cream/40">sat out</span>;
  }
  const payout = computePayout(player.status, player.hand, dealerHand, player.bet);
  const net = payout - player.bet;
  const tone = net > 0 ? "text-jade" : net < 0 ? "text-ruby" : "text-cream-dim";
  const label = net > 0 ? `+${net}` : net < 0 ? `${net}` : "push";

  return (
    <span className={`font-mono text-[11px] font-semibold tabular-nums ${tone}`}>{label}</span>
  );
}

export function EmptySeat({ seat }: { seat: number }) {
  return (
    <div className="flex w-20 flex-col items-center gap-1.5">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-brass/60 bg-black/25 text-sm text-brass/80">
        {seat + 1}
      </div>
      <span className="text-[8px] uppercase tracking-[0.24em] text-cream/50">open</span>
    </div>
  );
}

export default function TableSeat({
  player,
  isSelf,
  isTurn,
  turnStartedAt,
  tick,
  roomStatus,
  dealerHand,
}: {
  player: SeatPlayer;
  isSelf: boolean;
  isTurn: boolean;
  turnStartedAt: Date | null;
  tick: number;
  roomStatus: string;
  dealerHand: Card[];
}) {
  const sittingOut = player.status === "spectating";
  const value = player.hand.length > 0 ? handValue(player.hand) : null;

  return (
    <div className={`flex w-24 flex-col items-center gap-1 ${sittingOut ? "opacity-45 saturate-0" : ""}`}>
      <div className="flex h-[74px] items-end justify-center">
        {player.hand.length > 0 && <CardFan cards={player.hand} size="sm" />}
      </div>

      <div className="flex h-7 items-center">
        {player.bet > 0 ? (
          <ChipStack amount={player.bet} size={24} />
        ) : (
          roomStatus === "betting" &&
          !sittingOut && (
            <span className="h-6 w-6 rounded-full border border-dashed border-brass/45" aria-label="empty betting circle" />
          )
        )}
      </div>

      <div className="relative">
        <div
          className={`relative h-14 w-14 overflow-hidden rounded-full border bg-ink ${
            isTurn ? "animate-turn border-brass-lit" : "border-brass/40"
          }`}
        >
          <CatAvatar color={player.avatarColor} eyes={player.avatarEyes} face={player.avatarFace} size={56} />
        </div>
        {isTurn && turnStartedAt && <TimerRing turnStartedAt={turnStartedAt} tick={tick} />}
        {value && (
          <span className="absolute -right-2 -top-1 rounded-full border border-brass/50 bg-ink px-1.5 font-mono text-[10px] font-semibold tabular-nums text-brass-lit shadow-md">
            {value.isBust ? "!" : value.total}
          </span>
        )}
      </div>

      <span
        className={`max-w-full truncate rounded-full px-2 py-0.5 text-[10px] tracking-[0.06em] ${
          isSelf ? "bg-brass/20 text-brass-lit" : "text-cream-dim"
        }`}
      >
        {player.username}
      </span>

      <div className="flex h-4 items-center">
        {roomStatus === "round_over" && player.hand.length > 0 ? (
          <Outcome player={player} dealerHand={dealerHand} />
        ) : (
          IN_PLAY_LABEL[player.status] && (
            <span
              className={`text-[9px] uppercase tracking-[0.18em] ${
                player.status === "bust"
                  ? "text-ruby"
                  : player.status === "blackjack"
                    ? "text-brass-lit"
                    : "text-cream/45"
              }`}
            >
              {IN_PLAY_LABEL[player.status]}
            </span>
          )
        )}
      </div>
    </div>
  );
}
