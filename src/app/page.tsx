import { getSession } from "@/lib/session";
import UsernameForm from "@/components/username-form";
import RoomActions from "@/components/room-actions";

export default async function Home() {
  const session = await getSession();

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-sm flex-col items-center gap-6 px-6 py-32">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Blackjack
        </h1>
        {session ? (
          <>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Welcome back, <span className="font-medium text-black dark:text-zinc-50">{session.username}</span>.
            </p>
            <RoomActions />
          </>
        ) : (
          <UsernameForm />
        )}
      </main>
    </div>
  );
}
