import { NextRequest, NextResponse } from "next/server";
import { createSession, getSession } from "@/lib/session";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export async function GET() {
  const session = await getSession();
  return NextResponse.json({ session });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = body?.username;

  if (typeof username !== "string" || !USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3-20 characters: letters, numbers, underscores." },
      { status: 400 }
    );
  }

  const session = await createSession(username);
  return NextResponse.json({ session });
}
