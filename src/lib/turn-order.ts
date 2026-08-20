/**
 * Given occupied seats and the seat that just acted (or null to start a round),
 * returns the next seat in ascending, wrap-around order — or null once every
 * seat has had a turn since `startedFrom`.
 */
export function nextTurnSeat(
  occupiedSeats: number[],
  currentSeat: number | null
): number | null {
  if (occupiedSeats.length === 0) return null;

  const sorted = [...occupiedSeats].sort((a, b) => a - b);
  if (currentSeat === null) return sorted[0];

  const idx = sorted.indexOf(currentSeat);
  if (idx === -1 || idx === sorted.length - 1) return null;

  return sorted[idx + 1];
}
