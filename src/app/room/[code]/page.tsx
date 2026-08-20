import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getRoomByCode, MAX_SEATS } from "@/lib/rooms";
import RoomView from "@/components/room-view";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/");

  const { code } = await params;
  const result = await getRoomByCode(code.toUpperCase());
  if (!result) notFound();

  return (
    <RoomView
      code={result.room.code}
      status={result.room.status}
      dealerHand={result.room.dealerHand}
      currentTurnSeat={result.room.currentTurnSeat}
      players={result.players}
      maxSeats={MAX_SEATS}
      selfUserId={session.userId}
    />
  );
}
