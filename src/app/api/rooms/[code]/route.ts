import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getRoomByCode } from "@/lib/rooms";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { code } = await params;
  const result = await getRoomByCode(code.toUpperCase());
  if (!result) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  return NextResponse.json(result);
}
