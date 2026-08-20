import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { lt } from "drizzle-orm";

// Idle-gated rooms (30 min, see src/lib/rooms.ts) are already invisible and
// unplayable well before this runs. This just reclaims the rows so the
// table doesn't grow forever -- a much longer window since it's destructive
// (cascades to room_players) rather than just a visibility check.
const DELETE_AFTER_HOURS = 24;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const cutoff = new Date(Date.now() - DELETE_AFTER_HOURS * 60 * 60 * 1000);
  const deleted = await db.delete(rooms).where(lt(rooms.lastActiveAt, cutoff)).returning();

  return NextResponse.json({ deletedCount: deleted.length });
}
