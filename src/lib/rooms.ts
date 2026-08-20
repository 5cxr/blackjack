import { db } from "@/db";
import { rooms, roomPlayers, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const MAX_SEATS = 6;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
const CODE_LENGTH = 5;

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export class RoomError extends Error {}

export async function createRoom(hostUserId: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    try {
      return await db.transaction(async (tx) => {
        const [room] = await tx
          .insert(rooms)
          .values({ code, hostUserId })
          .returning();

        await tx.insert(roomPlayers).values({ roomId: room.id, userId: hostUserId, seat: 0 });

        return room;
      });
    } catch (err: unknown) {
      const pgErr = err as { code?: string; constraint?: string };
      if (pgErr.code === "23505" && pgErr.constraint === "rooms_code_idx") {
        continue; // code collision, retry with a new code
      }
      throw err;
    }
  }
  throw new RoomError("Could not generate a unique room code, try again.");
}

export async function joinRoom(code: string, userId: string) {
  return db.transaction(async (tx) => {
    const [room] = await tx
      .select()
      .from(rooms)
      .where(eq(rooms.code, code))
      .for("update");

    if (!room) throw new RoomError("Room not found.");
    if (room.status !== "waiting") throw new RoomError("Room already started.");

    const existingPlayers = await tx
      .select()
      .from(roomPlayers)
      .where(eq(roomPlayers.roomId, room.id));

    const already = existingPlayers.find((p) => p.userId === userId);
    if (already) return { room, seat: already.seat };

    if (existingPlayers.length >= MAX_SEATS) {
      throw new RoomError("Room is full.");
    }

    const takenSeats = new Set(existingPlayers.map((p) => p.seat));
    let seat = 0;
    while (takenSeats.has(seat)) seat++;

    await tx.insert(roomPlayers).values({ roomId: room.id, userId, seat });

    return { room, seat };
  });
}

export async function getRoomByCode(code: string) {
  const [room] = await db.select().from(rooms).where(eq(rooms.code, code));
  if (!room) return null;

  const players = await db
    .select({
      seat: roomPlayers.seat,
      userId: roomPlayers.userId,
      username: users.username,
    })
    .from(roomPlayers)
    .innerJoin(users, eq(users.id, roomPlayers.userId))
    .where(eq(roomPlayers.roomId, room.id));

  return { room, players: players.sort((a, b) => a.seat - b.seat) };
}
