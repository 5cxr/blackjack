import { NextRequest, NextResponse } from "next/server";
import { getSession, updateUserAvatar } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { normalizeAvatar } from "@/lib/avatar";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const limited = await checkRateLimit(`rl:avatar:${session.userId}`, 30, 60);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const avatar = normalizeAvatar(body);

  await updateUserAvatar(session.userId, avatar);
  return NextResponse.json({ avatar });
}
