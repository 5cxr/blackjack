/** Shared deco furniture: brass buttons, lacquer panels, hairline rules. */

import type { ComponentProps, ReactNode } from "react";

export function BrassButton({
  children,
  className = "",
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={`group relative h-12 min-w-0 overflow-hidden rounded-full border border-brass-lit/70 bg-gradient-to-b from-brass-lit via-brass to-[#9a7a1c] px-4 text-[11px] sm:px-6 font-semibold uppercase tracking-[0.24em] text-[#1a1408] shadow-[0_10px_24px_-12px_rgba(200,162,60,0.8)] transition-all hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100 ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-x-0 top-0 h-1/2 bg-white/25" />
    </button>
  );
}

export function GhostButton({
  children,
  className = "",
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={`h-12 min-w-0 rounded-full border border-cream/20 px-4 text-[11px] sm:px-6 font-semibold uppercase tracking-[0.24em] text-cream transition-all hover:border-brass/70 hover:text-brass-lit active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-brass/25 bg-ink-raised/70 shadow-[inset_0_1px_0_rgba(245,238,218,0.07),0_24px_50px_-30px_rgba(0,0,0,0.95)] backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

/** Brass hairline with an optional diamond in the middle. */
export function Rule({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="rule-brass h-px flex-1 opacity-70" />
      <span className="h-1.5 w-1.5 rotate-45 bg-brass" />
      <span className="rule-brass h-px flex-1 opacity-70" />
    </div>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`text-[9px] uppercase tracking-[0.36em] text-cream-dim ${className}`}>
      {children}
    </span>
  );
}
