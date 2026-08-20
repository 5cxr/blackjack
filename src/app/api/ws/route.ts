import { experimental_upgradeWebSocket } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { subscribeSocketToRoom, unsubscribeSocketFromRoom } from "@/lib/room-events";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const code = req.nextUrl.searchParams.get("code")?.toUpperCase();
  if (!code) {
    return new Response("Missing room code", { status: 400 });
  }

  return experimental_upgradeWebSocket(async (ws) => {
    await subscribeSocketToRoom(code, ws);
    ws.on("close", () => {
      unsubscribeSocketFromRoom(code, ws).catch(() => {});
    });
  });
}
