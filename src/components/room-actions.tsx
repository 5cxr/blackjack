"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RoomActions() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    setError(null);
    setBusy(true);
    const res = await fetch("/api/rooms", { method: "POST" });
    setBusy(false);

    if (!res.ok) {
      setError("Could not create room.");
      return;
    }
    const { room } = await res.json();
    router.push(`/room/${room.code}`);
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const code = joinCode.trim().toUpperCase();
    const res = await fetch(`/api/rooms/${code}/join`, { method: "POST" });
    setBusy(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not join room.");
      return;
    }
    router.push(`/room/${code}`);
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <button
        onClick={handleCreate}
        disabled={busy}
        className="h-12 w-full rounded-lg bg-foreground font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        Create a table
      </button>

      <form onSubmit={handleJoin} className="flex gap-2">
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          placeholder="Room code"
          maxLength={5}
          className="h-12 flex-1 rounded-lg border border-black/[.08] bg-white px-4 text-base uppercase outline-none focus:border-black/30 dark:border-white/[.145] dark:bg-zinc-900 dark:focus:border-white/40"
        />
        <button
          type="submit"
          disabled={busy || joinCode.length === 0}
          className="h-12 rounded-lg border border-black/[.08] px-5 font-medium transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
        >
          Join
        </button>
      </form>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
