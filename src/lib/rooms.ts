import { db } from "@/db";
import { rooms, roomPlayers, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";

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
      bet: roomPlayers.bet,
      hand: roomPlayers.hand,
      balance: users.balance,
    })
    .from(roomPlayers)
    .innerJoin(users, eq(users.id, roomPlayers.userId))
    .where(eq(roomPlayers.roomId, room.id));

  return { room, players: players.sort((a, b) => a.seat - b.seat) };
}

const MIN_BET = 1;

export async function startRound(code: string, userId: string) {
  return db.transaction(async (tx) => {
    const [room] = await tx.select().from(rooms).where(eq(rooms.code, code)).for("update");
    if (!room) throw new RoomError("Room not found.");
    if (room.status !== "waiting") throw new RoomError("A round is already in progress.");

    const players = await tx.select().from(roomPlayers).where(eq(roomPlayers.roomId, room.id));
    if (!players.some((p) => p.userId === userId)) {
      throw new RoomError("You are not seated at this table.");
    }

    const [updatedRoom] = await tx
      .update(rooms)
      .set({ status: "betting", currentTurnSeat: null, dealerHand: [] })
      .where(eq(rooms.id, room.id))
      .returning();

    await tx
      .update(roomPlayers)
      .set({ bet: 0, hand: [] })
      .where(eq(roomPlayers.roomId, room.id));

    return updatedRoom;
  });
}

export async function placeBet(code: string, userId: string, amount: number) {
  if (!Number.isInteger(amount) || amount < MIN_BET) {
    throw new RoomError(`Bet must be a whole number of at least ${MIN_BET}.`);
  }

  return db.transaction(async (tx) => {
    const [room] = await tx.select().from(rooms).where(eq(rooms.code, code)).for("update");
    if (!room) throw new RoomError("Room not found.");
    if (room.status !== "betting") throw new RoomError("Betting is not open right now.");

    const [player] = await tx
      .select()
      .from(roomPlayers)
      .where(and(eq(roomPlayers.roomId, room.id), eq(roomPlayers.userId, userId)));
    if (!player) throw new RoomError("You are not seated at this table.");
    if (player.bet > 0) throw new RoomError("You already placed a bet this round.");

    const [user] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
    if (!user || user.balance < amount) {
      throw new RoomError("Insufficient balance.");
    }

    const [updatedUser] = await tx
      .update(users)
      .set({ balance: user.balance - amount })
      .where(eq(users.id, userId))
      .returning();

    await tx.update(roomPlayers).set({ bet: amount }).where(eq(roomPlayers.id, player.id));

    return { balance: updatedUser.balance, bet: amount };
  });
}
