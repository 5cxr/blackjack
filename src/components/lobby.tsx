"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { type AvatarConfig } from "@/lib/avatar";
import CatAvatar from "./cat-avatar";
import AvatarPicker from "./avatar-picker";
import CodeInput from "./code-input";
import { PlayingCard } from "./playing-card";
import { BrassButton, Eyebrow, GhostButton, Panel } from "./ui";

export default function Lobby({
  username,
  balance,
  avatar: initialAvatar,
}: {
  username: string;
  balance: number;
  avatar: AvatarConfig;
}) {
  const router = useRouter();
  const [avatar, setAvatar] = useState(initialAvatar);
  const [editing, setEditing] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function saveAvatar(next: AvatarConfig) {
    setAvatar(next);
    await fetch("/api/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarColor: next.color, avatarEyes: next.eyes, avatarFace: next.face }),
    });
  }

  async function handleCreate() {
    setError(null);
    setBusy(true);
    const res = await fetch("/api/rooms", { method: "POST" });
    if (!res.ok) {
      setBusy(false);
      setError("Could not open a table. Try again.");
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
    if (!res.ok) {
      setBusy(false);
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not join that table.");
      return;
    }
    router.push(`/room/${code}`);
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <Panel className="animate-rise p-5" >
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0">
            <div
              className="absolute inset-0 rounded-full border border-brass/50"
              style={{ background: "radial-gradient(circle at 50% 30%, rgba(200,162,60,0.25), rgba(7,13,12,0.9) 70%)" }}
            />
            <div className="absolute inset-[2px] overflow-hidden rounded-full">
              <CatAvatar color={avatar.color} eyes={avatar.eyes} face={avatar.face} size={60} />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <Eyebrow>Member</Eyebrow>
            <p className="truncate font-display text-lg leading-tight text-cream">{username}</p>
            <p className="font-mono text-xs tabular-nums text-brass-lit">{balance.toLocaleString()} chips</p>
          </div>

          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="shrink-0 rounded-full border border-cream/15 px-3 py-1.5 text-[9px] uppercase tracking-[0.24em] text-cream-dim transition-colors hover:border-brass/60 hover:text-brass-lit"
          >
            {editing ? "Done" : "Change look"}
          </button>
        </div>

        {editing && (
          <div className="mt-4">
            <AvatarPicker value={avatar} onChange={saveAvatar} />
          </div>
        )}
      </Panel>

      <div className="animate-rise flex flex-col gap-4" style={{ animationDelay: "90ms" }}>
        <BrassButton onClick={handleCreate} disabled={busy} className="w-full">
          Open a new table
        </BrassButton>

        <div className="flex items-center gap-3">
          <span className="rule-brass h-px flex-1 opacity-50" />
          <Eyebrow>or sit in</Eyebrow>
          <span className="rule-brass h-px flex-1 opacity-50" />
        </div>

        <form onSubmit={handleJoin} className="flex flex-col gap-3">
          <CodeInput value={joinCode} onChange={setJoinCode} />
          <GhostButton type="submit" disabled={busy || joinCode.length < 5} className="w-full">
            Join table
          </GhostButton>
        </form>
      </div>

      {error && (
        <p className="animate-banner text-center text-xs uppercase tracking-[0.18em] text-ruby">{error}</p>
      )}

      <div className="flex items-end justify-center opacity-90">
        <div className="rotate-[-14deg]">
          <PlayingCard card="AS" size="md" />
        </div>
        <div className="-ml-5 rotate-[11deg]">
          <PlayingCard card="KH" size="md" />
        </div>
      </div>
    </div>
  );
}
