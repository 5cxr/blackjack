"use client";

import { useRef } from "react";

/**
 * Five brass cells for a table code. One real input sits invisibly on top so
 * paste, autofill and mobile keyboards all behave; the cells are just paint.
 */
export default function CodeInput({
  value,
  onChange,
  length = 5,
}: {
  value: string;
  onChange: (next: string) => void;
  length?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const chars = value.padEnd(length).slice(0, length).split("");
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <div className="relative" onClick={() => inputRef.current?.focus()}>
      <div className="flex justify-between gap-2">
        {chars.map((char, i) => (
          <span
            key={i}
            className={`flex h-14 flex-1 items-center justify-center rounded-lg border bg-ink/70 font-display text-xl text-brass-lit transition-colors ${
              i === activeIndex
                ? "border-brass shadow-[0_0_0_1px_rgba(200,162,60,0.4),0_0_18px_-6px_rgba(242,220,155,0.7)]"
                : "border-cream/15"
            }`}
          >
            {char.trim() || <span className="text-cream/20">·</span>}
          </span>
        ))}
      </div>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, length))}
        maxLength={length}
        inputMode="text"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        aria-label="Table code"
        className="absolute inset-0 h-full w-full cursor-pointer bg-transparent text-transparent caret-transparent outline-none"
      />
    </div>
  );
}
