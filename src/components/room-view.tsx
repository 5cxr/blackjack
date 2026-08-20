"use client";

import { useEffect, useState } from "react";
import { formatCard, handValue, type Card } from "@/lib/cards";

interface Player {
  seat: number;
  userId: string;
  username: string;
  bet: number;
  balance: number;
  hand: Card[];
}

function Hand({ cards, label }: { cards: Card[]; label?: string }) {
  if (cards.length === 0) return null;
  const value = handValue(cards);
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="font-mono tracking-wide text-black dark:text-zinc-50">
        {cards.map(formatCard).join(" ")}
      </span>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        ({value.isBust ? "bust" : value.total}){label}
      </span>
    </div>
  );
}

export default function RoomView({
  code,
  status: initialStatus,
  dealerHand: initialDealerHand,
  players: initialPlayers,
  maxSeats,
  selfUserId,
}: {
  code: string;
  status: string;
  dealerHand: Card[];
  players: Player[];
  maxSeats: number;
  selfUserId: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [dealerHand, setDealerHand] = useState(initialDealerHand);
  const [players, setPlayers] = useState(initialPlayers);
  const [betInput, setBetInput] = useState("25");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch(`/api/rooms/${code}`);
    if (!res.ok) return;
    const data = await res.json();
    setStatus(data.room.status);
    setDealerHand(data.room.dealerHand);
    setPlayers(data.players);
  }

  useEffect(() => {
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

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

  const seats = Array.from({ length: maxSeats }, (_, seat) =>
    players.find((p) => p.seat === seat)
  );

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 px-6 py-16 dark:bg-black">
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
      </div>

      {(status === "playing" || dealerHand.length > 0) && (
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Dealer</span>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-mono tracking-wide text-black dark:text-zinc-50">
              {dealerHand.map(formatCard).join(" ")}
              {status === "playing" && dealerHand.length === 1 ? " 🂠" : ""}
            </span>
          </div>
        </div>
      )}

      <div className="grid w-full max-w-lg grid-cols-3 gap-3">
        {seats.map((player, seat) => (
          <div
            key={seat}
            className={`flex h-24 flex-col items-center justify-center gap-1 rounded-lg border p-2 text-sm ${
              player
                ? "border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-900"
                : "border-dashed border-black/[.08] text-zinc-400 dark:border-white/[.145]"
            }`}
          >
            {player ? (
              <>
                <span className="font-medium text-black dark:text-zinc-50">
                  {player.username}
                  {player.userId === selfUserId ? " (you)" : ""}
                </span>
                {player.bet > 0 && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Bet: {player.bet}</span>
                )}
                <Hand cards={player.hand} />
              </>
            ) : (
              "Empty seat"
            )}
          </div>
        ))}
      </div>

      {status === "waiting" && self && (
        <button
          onClick={handleStartRound}
          disabled={busy}
          className="h-12 w-full max-w-xs rounded-lg bg-foreground font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          Start round
        </button>
      )}

      {status === "betting" && self && self.bet === 0 && (
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

      {status === "playing" && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Cards are dealt. Player actions (hit/stand) are coming next.
        </p>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
