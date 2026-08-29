"use client";

import { CAT_COLORS, CAT_EYES, CAT_FACES, cycle, type AvatarConfig } from "@/lib/avatar";
import CatAvatar from "./cat-avatar";

function ArrowButton({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "left" ? "Previous" : "Next"}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[.08] text-lg text-black transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
    >
      {dir === "left" ? "‹" : "›"}
    </button>
  );
}

function Row({
  label,
  onPrev,
  onNext,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <ArrowButton dir="left" onClick={onPrev} />
      <span className="min-w-20 text-center text-sm capitalize text-zinc-600 dark:text-zinc-400">
        {label}
      </span>
      <ArrowButton dir="right" onClick={onNext} />
    </div>
  );
}

export default function AvatarPicker({
  value,
  onChange,
}: {
  value: AvatarConfig;
  onChange: (next: AvatarConfig) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-900">
      <div className="rounded-full bg-zinc-100 p-2 dark:bg-zinc-800">
        <CatAvatar color={value.color} eyes={value.eyes} face={value.face} size={88} />
      </div>

      <div className="flex flex-col gap-2">
        <Row
          label="color"
          onPrev={() => onChange({ ...value, color: cycle(value.color, CAT_COLORS.length, -1) })}
          onNext={() => onChange({ ...value, color: cycle(value.color, CAT_COLORS.length, 1) })}
        />
        <Row
          label={CAT_EYES[value.eyes]}
          onPrev={() => onChange({ ...value, eyes: cycle(value.eyes, CAT_EYES.length, -1) })}
          onNext={() => onChange({ ...value, eyes: cycle(value.eyes, CAT_EYES.length, 1) })}
        />
        <Row
          label={CAT_FACES[value.face]}
          onPrev={() => onChange({ ...value, face: cycle(value.face, CAT_FACES.length, -1) })}
          onNext={() => onChange({ ...value, face: cycle(value.face, CAT_FACES.length, 1) })}
        />
      </div>
    </div>
  );
}
