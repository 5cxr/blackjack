import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createRoom } from "@/lib/rooms";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const limited = await checkRateLimit(`rl:create-room:${session.userId}`, 10, 60);
  if (limited) return limited;

  const room = await createRoom(session.userId);
  return NextResponse.json({ room });
}
