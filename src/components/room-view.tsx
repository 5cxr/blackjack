"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { handValue, type Card } from "@/lib/cards";
import { computePayout } from "@/lib/payouts";
import { TURN_SECONDS } from "@/lib/turn-timer";
import type { AvatarConfig } from "@/lib/avatar";
import CatAvatar from "./cat-avatar";
import AvatarPicker from "./avatar-picker";
import BetRack from "./bet-rack";
import TableSeat, { EmptySeat, type SeatPlayer } from "./table-seat";
import { CardBack, CardFan } from "./playing-card";
import { BrassButton, Eyebrow, GhostButton, Panel } from "./ui";

/**
 * Seats ride the lower arc of the ellipse at 88% of its radius: points are
 * (50 + 44·cos θ, 50 + 44·sin θ) for θ fanning from 152° round to 28°, which
 * keeps every hand on felt instead of out over the rail.
 */
const SEAT_LAYOUT = [
  { left: "11%", top: "71%" },
  { left: "23%", top: "85%" },
  { left: "40.5%", top: "93%" },
  { left: "59.5%", top: "93%" },
  { left: "77%", top: "85%" },
  { left: "89%", top: "71%" },
];

type Toast = { message: string; tone: "error" | "info" } | null;

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
  players: SeatPlayer[];
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
  const [toast, setToast] = useState<Toast>(null);
  const [busy, setBusy] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [showRules, setShowRules] = useState(false);
  // Starts at 0 rather than Date.now() so the server and client agree on the
  // first paint of the countdown ring; the interval below takes over instantly.
  const [tick, setTick] = useState(0);

  const self = players.find((p) => p.userId === selfUserId);
  const isMyTurn = status === "playing" && self?.seat === currentTurnSeat;
  const canEditAvatar = status === "waiting" && !!self;
  const canDouble = !!self && self.hand.length === 2 && self.balance >= self.bet;
  const turnPlayer = players.find((p) => p.seat === currentTurnSeat);

  function say(message: string, tone: "error" | "info" = "error") {
    setToast({ message, tone });
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(t);
  }, [toast]);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/rooms/${code}`);
    if (!res.ok) return;
    const data = await res.json();
    setStatus(data.room.status);
    setDealerHand(data.room.dealerHand);
    setCurrentTurnSeat(data.room.currentTurnSeat);
    setTurnStartedAt(data.room.turnStartedAt ? new Date(data.room.turnStartedAt) : null);
    setPlayers(data.players);
  }, [code]);

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
  }, [code, refresh]);

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
  }, [status, currentTurnSeat, turnStartedAt, code, refresh]);

  const post = useCallback(
    async (path: string, body?: unknown, fallbackMessage = "That didn't work.") => {
      setBusy(true);
      const res = await fetch(`/api/rooms/${code}${path}`, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      setBusy(false);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        say(data?.error ?? fallbackMessage);
        return false;
      }
      await refresh();
      return true;
    },
    [code, refresh]
  );

  const act = useCallback(
    (action: "hit" | "stand" | "double") => post(`/${action}`, undefined, "Action failed."),
    [post]
  );

  // Table shortcuts: the same three keys a dealer would watch your hands for.
  useEffect(() => {
    if (!isMyTurn || busy) return;
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      const key = e.key.toLowerCase();
      if (key === "h") act("hit");
      else if (key === "s") act("stand");
      else if (key === "d" && canDouble) act("double");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMyTurn, busy, canDouble, act]);

  async function handleAvatarChange(next: AvatarConfig) {
    setPlayers((prev) =>
      prev.map((p) =>
        p.userId === selfUserId
          ? { ...p, avatarColor: next.color, avatarEyes: next.eyes, avatarFace: next.face }
          : p
      )
    );
    await fetch("/api/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarColor: next.color, avatarEyes: next.eyes, avatarFace: next.face }),
    });
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      say("Table code copied", "info");
    } catch {
      say("Couldn't copy — the code is " + code, "info");
    }
  }

  const seats = Array.from({ length: maxSeats }, (_, seat) => players.find((p) => p.seat === seat));
  const dealerValue = dealerHand.length > 1 ? handValue(dealerHand) : null;
  const secondsLeft =
    tick > 0 && turnStartedAt && status === "playing"
      ? Math.min(TURN_SECONDS, Math.max(0, Math.ceil(TURN_SECONDS - (tick - turnStartedAt.getTime()) / 1000)))
      : null;

  const settled =
    status === "round_over" && self && self.hand.length > 0 && self.status !== "spectating"
      ? computePayout(self.status, self.hand, dealerHand, self.bet) - self.bet
      : null;

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="rays pointer-events-none absolute inset-x-0 top-0 h-[55vh] opacity-70" aria-hidden />
      <div className="vignette pointer-events-none absolute inset-0" aria-hidden />

      <header className="relative z-20 flex items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-3">
        <Link
          href="/"
          className="hidden font-display text-xs tracking-[0.18em] text-brass-lit/80 transition-colors hover:text-brass-lit sm:block sm:text-sm"
        >
          Whisker Jack
        </Link>

        <button
          type="button"
          onClick={copyCode}
          title="Copy table code"
          className="flex items-center gap-2 rounded-full border border-brass/40 bg-ink/70 px-3 py-1.5 transition-colors hover:border-brass sm:px-4"
        >
          <Eyebrow>table</Eyebrow>
          <span className="font-display text-sm tracking-[0.16em] text-cream sm:tracking-[0.28em]">{code}</span>
          <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2} className="text-brass/70">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M 5 15 V 5 a 2 2 0 0 1 2 -2 h 10" />
          </svg>
        </button>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowRules((v) => !v)}
            aria-label="House rules"
            className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs transition-colors ${
              showRules ? "border-brass-lit text-brass-lit" : "border-cream/20 text-cream-dim hover:border-brass/60"
            }`}
          >
            ?
          </button>
          <div className="text-right">
            <Eyebrow>chips</Eyebrow>
            <p className="font-mono text-sm font-semibold tabular-nums leading-tight text-brass-lit">
              {self?.balance ?? 0}
            </p>
          </div>
          {canEditAvatar && self && (
            <button
              type="button"
              onClick={() => setEditingAvatar((v) => !v)}
              aria-label="Change your cat"
              className={`h-11 w-11 shrink-0 overflow-hidden rounded-full border bg-ink transition-colors ${
                editingAvatar ? "border-brass-lit" : "border-brass/40 hover:border-brass"
              }`}
            >
              <CatAvatar color={self.avatarColor} eyes={self.avatarEyes} face={self.avatarFace} size={44} />
            </button>
          )}
        </div>
      </header>

      {editingAvatar && self && (
        <div className="absolute right-4 top-16 z-30 w-72 animate-banner sm:right-6">
          <Panel className="p-3">
            <AvatarPicker
              value={{ color: self.avatarColor, eyes: self.avatarEyes, face: self.avatarFace }}
              onChange={handleAvatarChange}
            />
          </Panel>
        </div>
      )}

      {showRules && (
        <div className="absolute left-1/2 top-16 z-30 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 animate-banner">
          <Panel className="p-5 text-left">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-sm tracking-[0.18em] text-brass-lit">House rules</h2>
              <button
                type="button"
                onClick={() => setShowRules(false)}
                className="text-xs text-cream-dim hover:text-cream"
                aria-label="Close house rules"
              >
                ✕
              </button>
            </div>
            <ul className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-cream-dim">
              <li>Beat the dealer&apos;s hand without going over 21.</li>
              <li>Blackjack pays 3 to 2. A win pays even money, a tie returns your bet.</li>
              <li>Dealer draws to 16 and stands on all 17s. Six decks, shuffled every hand.</li>
              <li>Double doubles your bet for exactly one more card, then your hand is done.</li>
              <li>
                You get {TURN_SECONDS} seconds to act — run out and the house stands for you.
              </li>
              <li>Out of chips? Sit out the round and claim free chips between hands.</li>
            </ul>
            <p className="mt-3 text-[10px] uppercase tracking-[0.22em] text-cream/40">
              Keys · H hit · S stand · D double
            </p>
          </Panel>
        </div>
      )}

      <main className="relative z-10 flex flex-1 items-center justify-center overflow-hidden px-2">
        {/* pb leaves room for the seat cards that hang below the felt's rim */}
        <div className="table-zoom w-[1000px] shrink-0 pb-16">
          <div className="rounded-[50%] bg-gradient-to-b from-[#e7cd8a] via-[#9a7a1c] to-[#3f3009] p-[7px] shadow-[0_50px_90px_-40px_rgba(0,0,0,0.95)]">
            <div
              className="felt-surface relative rounded-[50%] border border-black/50 shadow-[inset_0_2px_30px_rgba(0,0,0,0.55)]"
              style={{ aspectRatio: "2 / 1.16" }}
            >
              <div className="absolute inset-[14px] rounded-[50%] border border-brass/20" aria-hidden />

              {/* dealer */}
              <div className="absolute left-1/2 top-[17%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
                <Eyebrow className="text-brass/70">Dealer</Eyebrow>
                <div className="flex min-h-[104px] items-end gap-2">
                  {dealerHand.length > 0 ? (
                    <CardFan
                      cards={dealerHand}
                      size="lg"
                      hiddenCount={status === "playing" && dealerHand.length === 1 ? 1 : 0}
                    />
                  ) : (
                    <span className="pb-6 text-[11px] uppercase tracking-[0.3em] text-cream/25">
                      {status === "betting" ? "taking bets" : "no hand yet"}
                    </span>
                  )}
                  {dealerValue && (
                    <span className="mb-2 rounded-full border border-brass/40 bg-ink/80 px-2 py-0.5 font-mono text-xs tabular-nums text-brass-lit">
                      {dealerValue.isBust ? "bust" : dealerValue.total}
                    </span>
                  )}
                </div>
              </div>

              <div className="pointer-events-none absolute right-[21%] top-[26%] rotate-[9deg] opacity-90">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="absolute" style={{ left: i * 3, top: i * -3 }}>
                    <CardBack size="md" />
                  </div>
                ))}
              </div>

              {/* house rules, painted on the felt */}
              <div className="pointer-events-none absolute left-1/2 top-[52%] w-full -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="font-display text-[15px] tracking-[0.3em] text-brass/30">
                  BLACKJACK PAYS 3 TO 2
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.26em] text-cream/15">
                  dealer must draw to 16 · stand on all 17s
                </p>
              </div>

              {settled !== null && (
                <div className="pointer-events-none absolute left-1/2 top-[40%] z-20 -translate-x-1/2 -translate-y-1/2 animate-banner">
                  <div className="rounded-full border border-brass/30 bg-ink/70 px-6 py-2 text-center backdrop-blur-sm">
                    <p
                      className={`font-mono text-2xl font-semibold tabular-nums ${
                        settled > 0 ? "text-jade" : settled < 0 ? "text-ruby" : "text-cream"
                      }`}
                    >
                      {settled > 0 ? `+${settled}` : settled < 0 ? settled : "push"}
                    </p>
                    <p className="text-[9px] uppercase tracking-[0.3em] text-cream-dim">
                      {settled > 0 ? "paid out" : settled < 0 ? "to the house" : "stand-off"}
                    </p>
                  </div>
                </div>
              )}

              {seats.map((player, seat) => (
                <div
                  key={seat}
                  className="absolute -translate-x-1/2 -translate-y-[62%]"
                  style={{ left: SEAT_LAYOUT[seat].left, top: SEAT_LAYOUT[seat].top }}
                >
                  {player ? (
                    <TableSeat
                      player={player}
                      isSelf={player.userId === selfUserId}
                      isTurn={seat === currentTurnSeat}
                      turnStartedAt={turnStartedAt}
                      tick={tick}
                      roomStatus={status}
                      dealerHand={dealerHand}
                    />
                  ) : (
                    <EmptySeat seat={seat} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-20 flex min-h-[132px] flex-col items-center justify-center gap-3 border-t border-brass/15 bg-ink/85 px-4 py-4 backdrop-blur-sm sm:min-h-[148px] sm:py-5">
        {!self && (
          <p className="text-sm text-cream-dim">You&apos;re watching this table from the rail.</p>
        )}

        {self && self.balance === 0 && self.bet === 0 && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-cream-dim">Cleaned out</p>
            <GhostButton onClick={() => post("/rebuy", undefined, "Could not claim free chips.")} disabled={busy}>
              Ask the house for chips
            </GhostButton>
          </div>
        )}

        {self && (status === "waiting" || status === "round_over") && (
          <>
            <BrassButton
              onClick={() => post("/start-round", undefined, "Could not start the round.")}
              disabled={busy}
              className="w-full max-w-xs"
            >
              {status === "round_over" ? "Next hand" : "Deal me in"}
            </BrassButton>
            <p className="text-[11px] tracking-[0.1em] text-cream-dim">
              {players.length < 2
                ? "Share the table code and others can sit in before the deal."
                : `${players.length} cats at the table.`}
            </p>
          </>
        )}

        {self && status === "betting" && self.bet === 0 && self.balance > 0 && (
          <BetRack
            balance={self.balance}
            busy={busy}
            onBet={(amount) => post("/bet", { amount }, "Could not place that bet.")}
          />
        )}

        {self && status === "betting" && self.bet === 0 && self.balance === 0 && (
          <p className="text-xs uppercase tracking-[0.2em] text-cream-dim">
            Sitting this one out — no chips
          </p>
        )}

        {self && status === "betting" && self.bet > 0 && (
          <p className="text-sm text-cream-dim">
            <span className="font-mono text-brass-lit">{self.bet}</span> in the circle — waiting on the rest of the table…
          </p>
        )}

        {self && status === "playing" && isMyTurn && (
          <div className="flex w-full max-w-md flex-col items-center gap-2">
            <div className="flex w-full gap-2">
              <BrassButton onClick={() => act("hit")} disabled={busy} className="flex-1">
                Hit <span className="opacity-50">H</span>
              </BrassButton>
              <GhostButton onClick={() => act("stand")} disabled={busy} className="flex-1">
                Stand <span className="opacity-50">S</span>
              </GhostButton>
              {canDouble && (
                <GhostButton onClick={() => act("double")} disabled={busy} className="flex-1">
                  Double <span className="opacity-50">D</span>
                </GhostButton>
              )}
            </div>
            {secondsLeft !== null && (
              <p className={`font-mono text-xs tabular-nums ${secondsLeft <= 5 ? "text-ruby" : "text-cream-dim"}`}>
                {secondsLeft}s to act
              </p>
            )}
          </div>
        )}

        {self && status === "playing" && !isMyTurn && (
          <p className="text-sm text-cream-dim">
            {turnPlayer ? (
              <>
                Waiting on <span className="text-brass-lit">{turnPlayer.username}</span>
                {secondsLeft !== null && <span className="font-mono"> · {secondsLeft}s</span>}
              </>
            ) : (
              "Dealer is working…"
            )}
          </p>
        )}
      </footer>

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-banner">
          <div
            className={`rounded-full border px-5 py-2 text-xs uppercase tracking-[0.18em] backdrop-blur ${
              toast.tone === "error"
                ? "border-ruby/50 bg-ruby/15 text-[#ffb7c0]"
                : "border-brass/50 bg-brass/10 text-brass-lit"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
