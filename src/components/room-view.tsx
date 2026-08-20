"use client";

import { useEffect, useState } from "react";

interface Player {
  seat: number;
  userId: string;
  username: string;
}

export default function RoomView({
  code,
  players: initialPlayers,
  maxSeats,
  selfUserId,
}: {
  code: string;
  players: Player[];
  maxSeats: number;
  selfUserId: string;
}) {
  const [players, setPlayers] = useState(initialPlayers);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/rooms/${code}`);
      if (!res.ok) return;
      const data = await res.json();
      setPlayers(data.players);
    }, 2000);
    return () => clearInterval(interval);
  }, [code]);

  const seats = Array.from({ length: maxSeats }, (_, seat) =>
    players.find((p) => p.seat === seat)
  );

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Table {code}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Share this code so others can join.</p>
      </div>

      <div className="grid w-full max-w-lg grid-cols-3 gap-3">
        {seats.map((player, seat) => (
          <div
            key={seat}
            className={`flex h-20 flex-col items-center justify-center rounded-lg border text-sm ${
              player
                ? "border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-900"
                : "border-dashed border-black/[.08] text-zinc-400 dark:border-white/[.145]"
            }`}
          >
            {player ? (
              <span className="font-medium text-black dark:text-zinc-50">
                {player.username}
                {player.userId === selfUserId ? " (you)" : ""}
              </span>
            ) : (
              "Empty seat"
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
