import { db } from "@/db";
import { rooms, roomPlayers, users } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { createShoe, handValue, playDealerHand, type Card } from "./cards";
import { nextTurnSeat } from "./turn-order";
import { computePayout } from "./payouts";
import { publishRoomUpdate } from "./room-events";
import type { PlayerHandStatus } from "@/db/schema";

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

/** Credits every seated player's payout for the round now that the dealer's hand is final. */
async function settleRound(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  roomId: string,
  dealerHand: Card[]
) {
  const players = await tx.select().from(roomPlayers).where(eq(roomPlayers.roomId, roomId));

  for (const p of players) {
    const payout = computePayout(p.status, p.hand, dealerHand, p.bet);
    if (payout > 0) {
      await tx
        .update(users)
        .set({ balance: sql`${users.balance} + ${payout}` })
        .where(eq(users.id, p.userId));
    }
  }
}

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
  const result = await db.transaction(async (tx) => {
    const [room] = await tx
      .select()
      .from(rooms)
      .where(eq(rooms.code, code))
      .for("update");

    if (!room) throw new RoomError("Room not found.");
    if (room.status !== "waiting" && room.status !== "round_over") {
      throw new RoomError("Room already started.");
    }

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

  await publishRoomUpdate(code);
  return result;
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
      status: roomPlayers.status,
      balance: users.balance,
    })
    .from(roomPlayers)
    .innerJoin(users, eq(users.id, roomPlayers.userId))
    .where(eq(roomPlayers.roomId, room.id));

  // Hole card stays hidden from every client until the dealer's turn
  // resolves the round; shoe order is never sent to clients at all.
  return {
    room: {
      id: room.id,
      code: room.code,
      hostUserId: room.hostUserId,
      status: room.status,
      currentTurnSeat: room.currentTurnSeat,
      dealerHand: room.status === "playing" ? room.dealerHand.slice(0, 1) : room.dealerHand,
      createdAt: room.createdAt,
    },
    players: players.sort((a, b) => a.seat - b.seat),
  };
}

const MIN_BET = 1;

export async function startRound(code: string, userId: string) {
  const result = await db.transaction(async (tx) => {
    const [room] = await tx.select().from(rooms).where(eq(rooms.code, code)).for("update");
    if (!room) throw new RoomError("Room not found.");
    if (room.status !== "waiting" && room.status !== "round_over") {
      throw new RoomError("A round is already in progress.");
    }

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
      .set({ bet: 0, hand: [], status: "active" })
      .where(eq(roomPlayers.roomId, room.id));

    return updatedRoom;
  });

  await publishRoomUpdate(code);
  return result;
}

export async function placeBet(code: string, userId: string, amount: number) {
  if (!Number.isInteger(amount) || amount < MIN_BET) {
    throw new RoomError(`Bet must be a whole number of at least ${MIN_BET}.`);
  }

  const result = await db.transaction(async (tx) => {
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

    const allPlayers = await tx.select().from(roomPlayers).where(eq(roomPlayers.roomId, room.id));
    const allBet = allPlayers.every((p) => p.bet > 0);

    if (allBet) {
      const sorted = [...allPlayers].sort((a, b) => a.seat - b.seat);
      const shoe = createShoe();
      let i = 0;
      const hands = new Map(sorted.map((p) => [p.id, [] as Card[]]));
      const dealerHand: Card[] = [];

      // Deal like a real table: one card round-robin to each player then the
      // dealer, twice — not all of a player's cards at once.
      for (let round = 0; round < 2; round++) {
        for (const p of sorted) {
          hands.get(p.id)!.push(shoe[i++]);
        }
        dealerHand.push(shoe[i++]);
      }

      const statuses = new Map<string, PlayerHandStatus>(
        sorted.map((p) => [p.id, handValue(hands.get(p.id)!).isBlackjack ? "blackjack" : "active"])
      );

      for (const p of sorted) {
        await tx
          .update(roomPlayers)
          .set({ hand: hands.get(p.id), status: statuses.get(p.id) })
          .where(eq(roomPlayers.id, p.id));
      }

      // Players dealt a natural blackjack never get an active turn this
      // round, so the fixed turn order is everyone else, in seat order.
      const turnSeats = sorted.filter((p) => statuses.get(p.id) !== "blackjack").map((p) => p.seat);
      const firstSeat = nextTurnSeat(turnSeats, null);
      const remainingShoe = shoe.slice(i);

      if (firstSeat === null) {
        // Everyone was dealt a natural blackjack — no player turns at all,
        // dealer resolves immediately.
        const resolved = playDealerHand(dealerHand, remainingShoe);
        await settleRound(tx, room.id, resolved.dealerHand);
        await tx
          .update(rooms)
          .set({
            status: "round_over",
            dealerHand: resolved.dealerHand,
            shoe: resolved.shoe,
            currentTurnSeat: null,
          })
          .where(eq(rooms.id, room.id));
      } else {
        await tx
          .update(rooms)
          .set({ status: "playing", dealerHand, shoe: remainingShoe, currentTurnSeat: firstSeat })
          .where(eq(rooms.id, room.id));
      }
    }

    return { balance: updatedUser.balance, bet: amount, dealt: allBet };
  });

  await publishRoomUpdate(code);
  return result;
}

/**
 * Recomputes whose turn is next. Once the last seated player finishes, the
 * dealer isn't waited on for input — its hand resolves immediately, in the
 * same transaction as the action that ended the round.
 */
async function advanceTurn(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  roomId: string,
  actingSeat: number
) {
  const allPlayers = await tx.select().from(roomPlayers).where(eq(roomPlayers.roomId, roomId));
  const turnSeats = allPlayers.filter((p) => p.status !== "blackjack").map((p) => p.seat);
  const next = nextTurnSeat(turnSeats, actingSeat);

  if (next !== null) {
    await tx.update(rooms).set({ currentTurnSeat: next }).where(eq(rooms.id, roomId));
    return;
  }

  const [room] = await tx.select().from(rooms).where(eq(rooms.id, roomId));
  const resolved = playDealerHand(room.dealerHand, room.shoe);
  await settleRound(tx, roomId, resolved.dealerHand);

  await tx
    .update(rooms)
    .set({
      status: "round_over",
      dealerHand: resolved.dealerHand,
      shoe: resolved.shoe,
      currentTurnSeat: null,
    })
    .where(eq(rooms.id, roomId));
}

async function loadActingPlayer(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  code: string,
  userId: string
) {
  const [room] = await tx.select().from(rooms).where(eq(rooms.code, code)).for("update");
  if (!room) throw new RoomError("Room not found.");
  if (room.status !== "playing") throw new RoomError("No player turn is active right now.");

  const [player] = await tx
    .select()
    .from(roomPlayers)
    .where(and(eq(roomPlayers.roomId, room.id), eq(roomPlayers.userId, userId)));
  if (!player) throw new RoomError("You are not seated at this table.");
  if (room.currentTurnSeat !== player.seat) throw new RoomError("It's not your turn.");
  if (player.status !== "active") throw new RoomError("You already finished this hand.");

  return { room, player };
}

export async function hit(code: string, userId: string) {
  const result = await db.transaction(async (tx) => {
    const { room, player } = await loadActingPlayer(tx, code, userId);
    if (room.shoe.length === 0) throw new RoomError("Shoe exhausted, cannot deal another card.");

    const card = room.shoe[0];
    const hand = [...player.hand, card];
    const value = handValue(hand);
    const status = value.isBust ? "bust" : value.total === 21 ? "stood" : "active";

    await tx.update(roomPlayers).set({ hand, status }).where(eq(roomPlayers.id, player.id));
    await tx.update(rooms).set({ shoe: room.shoe.slice(1) }).where(eq(rooms.id, room.id));

    if (status !== "active") {
      await advanceTurn(tx, room.id, player.seat);
    }

    return { hand, status };
  });

  await publishRoomUpdate(code);
  return result;
}

export async function stand(code: string, userId: string) {
  const result = await db.transaction(async (tx) => {
    const { room, player } = await loadActingPlayer(tx, code, userId);

    await tx.update(roomPlayers).set({ status: "stood" }).where(eq(roomPlayers.id, player.id));
    await advanceTurn(tx, room.id, player.seat);

    return { hand: player.hand, status: "stood" as const };
  });

  await publishRoomUpdate(code);
  return result;
}

export async function doubleDown(code: string, userId: string) {
  const result = await db.transaction(async (tx) => {
    const { room, player } = await loadActingPlayer(tx, code, userId);
    if (player.hand.length !== 2) {
      throw new RoomError("Double down is only allowed as your first action.");
    }
    if (room.shoe.length === 0) throw new RoomError("Shoe exhausted, cannot deal another card.");

    const [user] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
    if (!user || user.balance < player.bet) {
      throw new RoomError("Insufficient balance to double down.");
    }

    const card = room.shoe[0];
    const hand = [...player.hand, card];
    const value = handValue(hand);
    const status = value.isBust ? "bust" : "stood";

    await tx.update(users).set({ balance: user.balance - player.bet }).where(eq(users.id, userId));
    await tx
      .update(roomPlayers)
      .set({ hand, status, bet: player.bet * 2 })
      .where(eq(roomPlayers.id, player.id));
    await tx.update(rooms).set({ shoe: room.shoe.slice(1) }).where(eq(rooms.id, room.id));

    await advanceTurn(tx, room.id, player.seat);

    return { hand, status, bet: player.bet * 2, balance: user.balance - player.bet };
  });

  await publishRoomUpdate(code);
  return result;
}
