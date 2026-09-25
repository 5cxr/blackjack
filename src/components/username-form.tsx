"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AvatarPicker from "./avatar-picker";
import { BrassButton, Eyebrow } from "./ui";
import { type AvatarConfig } from "@/lib/avatar";

export default function UsernameForm({ initialAvatar }: { initialAvatar: AvatarConfig }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  // Rolled on the server and handed down, so the first cat you see is a
  // surprise without the client re-rolling it and breaking hydration.
  const [avatar, setAvatar] = useState<AvatarConfig>(initialAvatar);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        avatarColor: avatar.color,
        avatarEyes: avatar.eyes,
        avatarFace: avatar.face,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong.");
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
      <div className="animate-rise">
        <AvatarPicker value={avatar} onChange={setAvatar} />
      </div>

      <div className="animate-rise flex flex-col gap-2" style={{ animationDelay: "90ms" }}>
        <Eyebrow className="pl-1">What do they call you</Eyebrow>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="name at the door"
          autoFocus
          maxLength={20}
          className="h-14 w-full rounded-xl border border-cream/15 bg-ink/70 px-5 font-display text-lg text-cream placeholder:font-sans placeholder:text-sm placeholder:tracking-[0.12em] placeholder:text-cream/25 outline-none transition-colors focus:border-brass/70 focus:shadow-[0_0_24px_-10px_rgba(242,220,155,0.8)]"
        />
        <p className="pl-1 text-[10px] tracking-[0.12em] text-cream-dim">
          3–20 characters · letters, numbers, underscores
        </p>
      </div>

      {error && (
        <p className="animate-banner text-center text-xs uppercase tracking-[0.18em] text-ruby">{error}</p>
      )}

      <BrassButton
        type="submit"
        disabled={submitting || username.length < 3}
        className="animate-rise w-full"
        style={{ animationDelay: "160ms" }}
      >
        {submitting ? "Checking the list…" : "Step inside"}
      </BrassButton>
    </form>
  );
}
