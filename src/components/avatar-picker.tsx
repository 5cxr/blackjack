"use client";

import {
  CAT_COATS,
  CAT_EYES,
  CAT_FACES,
  coatOf,
  cycle,
  eyesOf,
  faceOf,
  randomAvatar,
  type AvatarConfig,
} from "@/lib/avatar";
import CatAvatar from "./cat-avatar";

function ArrowButton({ dir, onClick, label }: { dir: "left" | "right"; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${dir === "left" ? "Previous" : "Next"} ${label}`}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brass/50 bg-ink/60 text-brass-lit transition-all hover:border-brass hover:bg-brass/15 active:scale-90"
    >
      <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
        {dir === "left" ? <path d="M 15 5 L 8 12 L 15 19" /> : <path d="M 9 5 L 16 12 L 9 19" />}
      </svg>
    </button>
  );
}

function Row({
  label,
  value,
  index,
  count,
  onPrev,
  onNext,
}: {
  label: string;
  value: string;
  index: number;
  count: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <ArrowButton dir="left" onClick={onPrev} label={label} />
      <div className="flex-1 text-center">
        <div className="text-[9px] uppercase tracking-[0.28em] text-cream-dim">{label}</div>
        <div className="font-display text-sm text-brass-lit">{value}</div>
        <div className="mt-1 flex justify-center gap-1">
          {Array.from({ length: count }, (_, i) => (
            <span
              key={i}
              className={`h-1 w-1 rounded-full transition-colors ${i === index ? "bg-brass-lit" : "bg-cream/20"}`}
            />
          ))}
        </div>
      </div>
      <ArrowButton dir="right" onClick={onNext} label={label} />
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
  const coat = coatOf(value.color);

  return (
    <div className="w-full rounded-2xl border border-brass/25 bg-ink-raised/70 p-5 shadow-[inset_0_1px_0_rgba(245,238,218,0.07),0_18px_40px_-24px_rgba(0,0,0,0.9)]">
      <div className="relative mx-auto mb-4 h-32 w-32">
        <div className="rays absolute inset-0 rounded-full opacity-80" />
        <div
          className="absolute inset-0 rounded-full border border-brass/60"
          style={{ background: "radial-gradient(circle at 50% 30%, rgba(200,162,60,0.22), rgba(7,13,12,0.9) 70%)" }}
        />
        <div className="absolute inset-[3px] flex items-center justify-center overflow-hidden rounded-full">
          <CatAvatar color={value.color} eyes={value.eyes} face={value.face} size={116} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Row
          label="coat"
          value={coat.name}
          index={value.color}
          count={CAT_COATS.length}
          onPrev={() => onChange({ ...value, color: cycle(value.color, CAT_COATS.length, -1) })}
          onNext={() => onChange({ ...value, color: cycle(value.color, CAT_COATS.length, 1) })}
        />
        <Row
          label="eyes"
          value={eyesOf(value.eyes)}
          index={value.eyes}
          count={CAT_EYES.length}
          onPrev={() => onChange({ ...value, eyes: cycle(value.eyes, CAT_EYES.length, -1) })}
          onNext={() => onChange({ ...value, eyes: cycle(value.eyes, CAT_EYES.length, 1) })}
        />
        <Row
          label="face"
          value={faceOf(value.face)}
          index={value.face}
          count={CAT_FACES.length}
          onPrev={() => onChange({ ...value, face: cycle(value.face, CAT_FACES.length, -1) })}
          onNext={() => onChange({ ...value, face: cycle(value.face, CAT_FACES.length, 1) })}
        />
      </div>

      <button
        type="button"
        onClick={() => onChange(randomAvatar())}
        className="mt-4 w-full rounded-full border border-cream/15 py-2 text-[10px] uppercase tracking-[0.3em] text-cream-dim transition-colors hover:border-brass/50 hover:text-brass-lit"
      >
        Surprise me
      </button>
    </div>
  );
}
