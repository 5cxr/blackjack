"use client";

import { useEffect, useRef, useState } from "react";
import { handValue, type Card } from "@/lib/cards";
import { computePayout } from "@/lib/payouts";
import { TURN_SECONDS } from "@/lib/turn-timer";
import type { AvatarConfig } from "@/lib/avatar";
import CatAvatar from "./cat-avatar";
import AvatarPicker from "./avatar-picker";
import { PlayingCard, CardBack } from "./playing-card";

interface Player {
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

const STATUS_LABEL: Record<Player["status"], string> = {
  active: "",
  stood: "stood",
  bust: "bust",
  blackjack: "blackjack!",
  spectating: "sitting out",
};

// Fixed arc positions around the oval felt, indexed by seat number so a
// player always sits in the same spot relative to everyone else.
const SEAT_LAYOUT: { left: string; top: string }[] = [
  { left: "6%", top: "68%" },
  { left: "23%", top: "90%" },
  { left: "42%", top: "98%" },
  { left: "58%", top: "98%" },
  { left: "77%", top: "90%" },
  { left: "94%", top: "68%" },
];

function outcomeLabel(player: Player, dealerHand: Card[]): string {
  if (player.status === "spectating") return "sitting out";
  const payout = computePayout(player.status, player.hand, dealerHand, player.bet);
  if (payout === 0) return "lost";
  if (payout === player.bet) return "push";
  return "won";
}

function Hand({ cards }: { cards: Card[] }) {
  if (cards.length === 0) return null;
  const value = handValue(cards);
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex">
        {cards.map((card, i) => (
          <div key={i} className={i > 0 ? "-ml-3" : ""}>
            <PlayingCard card={card} />
          </div>
        ))}
      </div>
      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
        {value.isBust ? "bust" : value.total}
      </span>
    </div>
  );
}

/** Countdown ring: full green circle at turn start, draining clockwise to nothing at TURN_SECONDS. */
function TimerRing({ turnStartedAt, tick }: { turnStartedAt: Date; tick: number }) {
  const elapsedMs = tick - turnStartedAt.getTime();
  const remaining = Math.max(0, 1 - elapsedMs / (TURN_SECONDS * 1000));
  const r = 46;
  const circumference = 2 * Math.PI * r;

  return (
    <svg
      viewBox="0 0 100 100"
      className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
    >
      <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth={4} className="text-black/10 dark:text-white/10" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="#22c55e"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - remaining)}
        style={{ transition: "stroke-dashoffset 200ms linear" }}
      />
    </svg>
  );
}

function SeatCard({
  player,
  isSelf,
  isTurn,
  turnStartedAt,
  tick,
  status,
  dealerHand,
}: {
  player: Player;
  isSelf: boolean;
  isTurn: boolean;
  turnStartedAt: Date | null;
  tick: number;
  status: string;
  dealerHand: Card[];
}) {
  return (
    <div
      className={`flex w-24 flex-col items-center gap-1 rounded-xl border p-1.5 text-center transition-colors sm:w-28 ${
        isTurn
          ? "border-green-500/60 bg-white shadow-md dark:bg-zinc-900"
          : "border-black/[.08] bg-white/90 dark:border-white/[.145] dark:bg-zinc-900/90"
      }`}
    >
      <div className="relative h-14 w-14">
        {isTurn && turnStartedAt && <TimerRing turnStartedAt={turnStartedAt} tick={tick} />}
        <div className="absolute inset-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <CatAvatar color={player.avatarColor} eyes={player.avatarEyes} face={player.avatarFace} size={44} />
        </div>
      </div>

      <span className="w-full truncate text-xs font-medium text-black dark:text-zinc-50">
        {player.username}
        {isSelf ? " (you)" : ""}
      </span>

      {player.bet > 0 && (
        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Bet {player.bet}</span>
      )}

      <Hand cards={player.hand} />

      {status === "round_over" ? (
        <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
          {outcomeLabel(player, dealerHand)}
        </span>
      ) : (
        STATUS_LABEL[player.status] && (
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{STATUS_LABEL[player.status]}</span>
        )
      )}
    </div>
  );
}

export default function RoomView({
  code,
  status: initialStatus,
  dealerHand: initialDealerHand,
  currentTurnSeat: initialCurrentTurnSeat,
  turnStartedAt: initialTurnStartedAt,
  players: initialPlayers,
  maxSeats,
  selfUserId,
}: {
  code: string;
  status: string;
  dealerHand: Card[];
  currentTurnSeat: number | null;
  turnStartedAt: Date | string | null;
  players: Player[];
  maxSeats: number;
  selfUserId: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [dealerHand, setDealerHand] = useState(initialDealerHand);
  const [currentTurnSeat, setCurrentTurnSeat] = useState(initialCurrentTurnSeat);
  const [turnStartedAt, setTurnStartedAt] = useState<Date | null>(
    initialTurnStartedAt ? new Date(initialTurnStartedAt) : null
  );
  const [players, setPlayers] = useState(initialPlayers);
  const [betInput, setBetInput] = useState("25");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [tick, setTick] = useState(() => Date.now());

  async function refresh() {
    const res = await fetch(`/api/rooms/${code}`);
    if (!res.ok) return;
    const data = await res.json();
    setStatus(data.room.status);
    setDealerHand(data.room.dealerHand);
    setCurrentTurnSeat(data.room.currentTurnSeat);
    setTurnStartedAt(data.room.turnStartedAt ? new Date(data.room.turnStartedAt) : null);
    setPlayers(data.players);
  }

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectDelay = 1000;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    function connect() {
      if (stopped) return;
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(`${wsProtocol}//${window.location.host}/api/ws?code=${code}`);
      socket.addEventListener("open", () => {
        reconnectDelay = 1000;
      });
      socket.addEventListener("message", () => {
        refresh();
      });
      socket.addEventListener("close", () => {
        if (stopped) return;
        reconnectTimer = setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      });
    }
    connect();

    // Safety net: covers a WS that's unavailable or drops without a clean
    // 'close' event, so the table never goes fully stale even then.
    const fallback = setInterval(refresh, 15000);

    return () => {
      stopped = true;
      socket?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      clearInterval(fallback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Ticks the countdown ring and, once the acting seat's clock expires, nudges
  // the server to auto-stand it. Any seated client can send this nudge (the
  // acting player's own tab may be gone) — the server re-checks elapsed time
  // itself, so an early or duplicate call from several tabs is harmless.
  const timeoutFiredForRef = useRef<number | null>(null);
  useEffect(() => {
    if (status !== "playing" || currentTurnSeat === null || !turnStartedAt) return;
    timeoutFiredForRef.current = null;

    const interval = setInterval(() => {
      const now = Date.now();
      setTick(now);
      const elapsed = now - turnStartedAt.getTime();
      if (elapsed >= TURN_SECONDS * 1000 && timeoutFiredForRef.current !== currentTurnSeat) {
        timeoutFiredForRef.current = currentTurnSeat;
        fetch(`/api/rooms/${code}/timeout`, { method: "POST" }).then(refresh).catch(() => {});
      }
    }, 200);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, currentTurnSeat, turnStartedAt, code]);

  const self = players.find((p) => p.userId === selfUserId);

  async function handleStartRound() {
    setError(null);
    setBusy(true);
    const res = await fetch(`/api/rooms/${code}/start-round`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not start round.");
      return;
    }
    await refresh();
  }

  async function handleBet(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amount = Number(betInput);
    setBusy(true);
    const res = await fetch(`/api/rooms/${code}/bet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not place bet.");
      return;
    }
    await refresh();
  }

  async function handleRebuy() {
    setError(null);
    setBusy(true);
    const res = await fetch(`/api/rooms/${code}/rebuy`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not claim free chips.");
      return;
    }
    await refresh();
  }

  async function handleAction(action: "hit" | "stand" | "double") {
    setError(null);
    setBusy(true);
    const res = await fetch(`/api/rooms/${code}/${action}`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Action failed.");
      return;
    }
    await refresh();
  }

  async function handleAvatarChange(next: AvatarConfig) {
    if (self) {
      setPlayers((prev) =>
        prev.map((p) =>
          p.userId === selfUserId
            ? { ...p, avatarColor: next.color, avatarEyes: next.eyes, avatarFace: next.face }
            : p
        )
      );
    }
    await fetch("/api/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarColor: next.color, avatarEyes: next.eyes, avatarFace: next.face }),
    });
  }

  const isMyTurn = status === "playing" && self?.seat === currentTurnSeat;
  const canEditAvatar = status === "waiting" && !!self;

  const seats = Array.from({ length: maxSeats }, (_, seat) =>
    players.find((p) => p.seat === seat)
  );

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Table {code}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Share this code so others can join. Status: {status}
        </p>
        {self && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Balance: <span className="font-medium text-black dark:text-zinc-50">{self.balance}</span>
          </p>
        )}
        <div className="flex gap-2">
          {self && self.balance === 0 && self.bet === 0 && (
            <button
              onClick={handleRebuy}
              disabled={busy}
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
            >
              Get free chips
            </button>
          )}
          {canEditAvatar && (
            <button
              onClick={() => setEditingAvatar((v) => !v)}
              className="rounded-lg border border-black/[.08] px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
            >
              {editingAvatar ? "Done" : "Edit avatar"}
            </button>
          )}
        </div>
        {editingAvatar && self && (
          <AvatarPicker
            value={{ color: self.avatarColor, eyes: self.avatarEyes, face: self.avatarFace }}
            onChange={handleAvatarChange}
          />
        )}
      </div>

      <div
        className="relative mb-14 w-full max-w-3xl border-4 border-emerald-900/40 bg-[radial-gradient(ellipse_at_center,_#0f6b45,_#0a4a30)] shadow-inner"
        style={{ aspectRatio: "2 / 1.3", borderRadius: "50%" }}
      >
        <div className="absolute left-1/2 top-[14%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-100/70">Dealer</span>
          {dealerHand.length > 0 ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex">
                {dealerHand.map((card, i) => (
                  <div key={i} className={i > 0 ? "-ml-4" : ""}>
                    <PlayingCard card={card} size="md" />
                  </div>
                ))}
                {status === "playing" && dealerHand.length === 1 && (
                  <div className="-ml-4">
                    <CardBack size="md" />
                  </div>
                )}
              </div>
              {dealerHand.length > 1 && (
                <span className="text-xs text-emerald-100/80">{handValue(dealerHand).total}</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-emerald-100/50">waiting to deal</span>
          )}
        </div>

        {seats.map((player, seat) => {
          const pos = SEAT_LAYOUT[seat];
          return (
            <div
              key={seat}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: pos.left, top: pos.top }}
            >
              {player ? (
                <SeatCard
                  player={player}
                  isSelf={player.userId === selfUserId}
                  isTurn={seat === currentTurnSeat}
                  turnStartedAt={turnStartedAt}
                  tick={tick}
                  status={status}
                  dealerHand={dealerHand}
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-white/20 text-xs text-white/40 sm:h-16 sm:w-16">
                  {seat + 1}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(status === "waiting" || status === "round_over") && self && (
        <button
          onClick={handleStartRound}
          disabled={busy}
          className="h-12 w-full max-w-xs rounded-lg bg-foreground font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          Start round
        </button>
      )}

      {(status === "waiting" || status === "round_over") && self && self.balance === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Out of chips — claim free chips before starting a round.
        </p>
      )}

      {status === "betting" && self && self.balance === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Sitting out this round — you&apos;re out of chips.
        </p>
      )}

      {status === "betting" && self && self.bet === 0 && self.balance > 0 && (
        <form onSubmit={handleBet} className="flex w-full max-w-xs gap-2">
          <input
            type="number"
            min={1}
            max={self.balance}
            value={betInput}
            onChange={(e) => setBetInput(e.target.value)}
            className="h-12 flex-1 rounded-lg border border-black/[.08] bg-white px-4 text-base outline-none focus:border-black/30 dark:border-white/[.145] dark:bg-zinc-900 dark:focus:border-white/40"
          />
          <button
            type="submit"
            disabled={busy}
            className="h-12 rounded-lg bg-foreground px-5 font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            Bet
          </button>
        </form>
      )}

      {status === "betting" && self && self.bet > 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Bet placed, waiting on other players...
        </p>
      )}

      {status === "playing" && isMyTurn && self && (
        <div className="flex w-full max-w-xs gap-2">
          <button
            onClick={() => handleAction("hit")}
            disabled={busy}
            className="h-12 flex-1 rounded-lg bg-foreground font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            Hit
          </button>
          <button
            onClick={() => handleAction("stand")}
            disabled={busy}
            className="h-12 flex-1 rounded-lg border border-black/[.08] font-medium transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            Stand
          </button>
          {self.hand.length === 2 && self.balance >= self.bet && (
            <button
              onClick={() => handleAction("double")}
              disabled={busy}
              className="h-12 flex-1 rounded-lg border border-black/[.08] font-medium transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
            >
              Double
            </button>
          )}
        </div>
      )}

      {status === "playing" && !isMyTurn && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Waiting for other players...</p>
      )}

      {status === "round_over" && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Round over. Dealer {handValue(dealerHand).isBust ? "busts" : `has ${handValue(dealerHand).total}`}.
          Balances updated — start another round when ready.
        </p>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
