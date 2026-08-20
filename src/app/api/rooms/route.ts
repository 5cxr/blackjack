import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createRoom } from "@/lib/rooms";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const room = await createRoom(session.userId);
  return NextResponse.json({ room });
}
