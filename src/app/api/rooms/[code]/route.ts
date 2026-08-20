import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getRoomByCode } from "@/lib/rooms";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // Generous: normal usage is the WS push firing a refetch plus a 15s
  // fallback poll, well under this even with several rapid WS updates.
  const limited = await checkRateLimit(`rl:get-room:${session.userId}`, 60, 60);
  if (limited) return limited;

  const { code } = await params;
  const result = await getRoomByCode(code.toUpperCase());
  if (!result) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  return NextResponse.json(result);
}
