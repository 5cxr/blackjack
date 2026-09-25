import { getSession, getUserProfile } from "@/lib/session";
import UsernameForm from "@/components/username-form";
import Lobby from "@/components/lobby";
import { Rule } from "@/components/ui";
import { randomAvatar } from "@/lib/avatar";

export default async function Home() {
  const session = await getSession();
  const profile = session ? await getUserProfile(session.userId) : null;

  return (
    <div className="relative flex flex-1 flex-col items-center overflow-hidden px-5 pb-12 pt-10 lg:justify-center lg:py-10">
      <div className="rays pointer-events-none absolute inset-x-0 top-0 h-[85vh]" aria-hidden />
      <div className="vignette pointer-events-none absolute inset-0" aria-hidden />

      <main className="relative z-10 grid w-full max-w-md items-center gap-8 lg:max-w-4xl lg:grid-cols-[1fr_minmax(0,24rem)] lg:gap-16">
        <header className="animate-rise flex flex-col items-center text-center lg:items-start lg:text-left">
          <span className="text-[9px] uppercase tracking-[0.5em] text-brass/70">
            Est. 1931 · members only
          </span>

          <h1 className="mt-3 bg-gradient-to-b from-brass-lit via-brass to-[#8a6c17] bg-clip-text font-display text-[2.6rem] leading-[1.05] tracking-[0.04em] text-transparent drop-shadow-[0_2px_18px_rgba(200,162,60,0.35)] sm:text-5xl lg:text-[4.2rem]">
            Whisker
            <br />
            Jack
          </h1>

          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream-dim lg:max-w-sm lg:text-base">
            Nine lives, one shoe, six seats. Cats only — the dealer checks paws at the door.
          </p>

          <Rule className="my-6 w-40 lg:my-7" />

          <p className="text-[10px] uppercase tracking-[0.26em] text-cream/40">
            Blackjack pays 3 to 2 · dealer stands on 17 · six-deck shoe
          </p>
        </header>

        <div className="flex w-full justify-center">
          {session && profile ? (
            <Lobby username={profile.username} balance={profile.balance} avatar={profile.avatar} />
          ) : (
            <UsernameForm initialAvatar={randomAvatar()} />
          )}
        </div>
      </main>
    </div>
  );
}
