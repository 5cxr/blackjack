import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { startRound, RoomError } from "@/lib/rooms";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { code } = await params;

  try {
    const room = await startRound(code.toUpperCase(), session.userId);
    return NextResponse.json({ room });
  } catch (err) {
    if (err instanceof RoomError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
