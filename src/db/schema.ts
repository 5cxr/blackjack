import { pgTable, uuid, text, integer, timestamp, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
import type { Card } from "@/lib/cards";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  username: text("username").notNull(),
  balance: integer("balance").notNull().default(500),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    hostUserId: uuid("host_user_id")
      .notNull()
      .references(() => users.id),
    status: text("status").notNull().default("waiting"), // waiting | betting | playing
    currentTurnSeat: integer("current_turn_seat"),
    dealerHand: jsonb("dealer_hand").$type<Card[]>().notNull().default([]),
    shoe: jsonb("shoe").$type<Card[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("rooms_code_idx").on(table.code)]
);

export const roomPlayers = pgTable(
  "room_players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    seat: integer("seat").notNull(),
    hand: jsonb("hand").$type<Card[]>().notNull().default([]),
    bet: integer("bet").notNull().default(0),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("room_players_room_seat_idx").on(table.roomId, table.seat)]
);
