import Link from "next/link";
import { CardBack } from "@/components/playing-card";
import { Rule } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="rays pointer-events-none absolute inset-x-0 top-0 h-[70vh]" aria-hidden />
      <div className="vignette pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-8 flex">
          <div className="rotate-[-10deg]">
            <CardBack size="lg" />
          </div>
          <div className="-ml-6 rotate-[8deg]">
            <CardBack size="lg" />
          </div>
        </div>

        <h1 className="font-display text-3xl tracking-[0.06em] text-brass-lit">Table&apos;s gone</h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-cream-dim">
          That code doesn&apos;t match an open table. Tables close after half an hour with no
          play — ask for a fresh code, or deal your own.
        </p>

        <Rule className="my-7 w-40" />

        <Link
          href="/"
          className="rounded-full border border-brass/50 px-6 py-3 text-[11px] uppercase tracking-[0.24em] text-brass-lit transition-colors hover:bg-brass/10"
        >
          Back to the door
        </Link>
      </div>
    </div>
  );
}
