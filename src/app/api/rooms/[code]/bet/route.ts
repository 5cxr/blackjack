import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { placeBet, RoomError } from "@/lib/rooms";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { code } = await params;
  const body = await req.json().catch(() => null);
  const amount = body?.amount;

  if (typeof amount !== "number") {
    return NextResponse.json({ error: "amount must be a number." }, { status: 400 });
  }

  try {
    const result = await placeBet(code.toUpperCase(), session.userId, amount);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof RoomError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
