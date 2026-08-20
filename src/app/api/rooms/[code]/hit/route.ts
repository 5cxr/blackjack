import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { hit, RoomError } from "@/lib/rooms";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const limited = await checkRateLimit(`rl:hit:${session.userId}`, 30, 60);
  if (limited) return limited;

  const { code } = await params;

  try {
    const result = await hit(code.toUpperCase(), session.userId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof RoomError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
