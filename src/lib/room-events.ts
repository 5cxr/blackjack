import type { WebSocket } from "ws";
import { redisPub, redisSub } from "./redis";

const CHANNEL_PREFIX = "room:";

// Sockets connected to *this* instance, grouped by room code. Cross-instance
// fanout goes through Redis pub/sub (see the Vercel Functions WebSocket
// docs: a reconnect or new deployment can land a room's players on
// different instances, so nothing here may be the source of truth).
const roomSockets = new Map<string, Set<WebSocket>>();

redisSub.on("message", (channel: string, message: string) => {
  if (!channel.startsWith(CHANNEL_PREFIX)) return;
  const code = channel.slice(CHANNEL_PREFIX.length);
  const sockets = roomSockets.get(code);
  if (!sockets) return;

  for (const ws of sockets) {
    if (ws.readyState === ws.OPEN) ws.send(message);
  }
});

/** Call after any committed mutation to a room so every connected client refetches. */
export async function publishRoomUpdate(code: string) {
  await redisPub.publish(`${CHANNEL_PREFIX}${code}`, "update");
}

export async function subscribeSocketToRoom(code: string, ws: WebSocket) {
  let sockets = roomSockets.get(code);
  if (!sockets) {
    sockets = new Set();
    roomSockets.set(code, sockets);
    await redisSub.subscribe(`${CHANNEL_PREFIX}${code}`);
  }
  sockets.add(ws);
}

export async function unsubscribeSocketFromRoom(code: string, ws: WebSocket) {
  const sockets = roomSockets.get(code);
  if (!sockets) return;

  sockets.delete(ws);
  if (sockets.size === 0) {
    roomSockets.delete(code);
    await redisSub.unsubscribe(`${CHANNEL_PREFIX}${code}`);
  }
}
