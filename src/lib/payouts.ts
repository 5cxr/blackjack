import { handValue, type Card } from "./cards";
import type { PlayerHandStatus } from "@/db/schema";

/**
 * Total credited back to a player's balance for the round (0 if they lost).
 * The bet itself was already deducted at placeBet time, so a push credits
 * back exactly the bet, a 1:1 win credits back double, etc.
 */
export function computePayout(
  playerStatus: PlayerHandStatus,
  playerHand: Card[],
  dealerHand: Card[],
  bet: number
): number {
  if (playerStatus === "bust") return 0;

  const dealer = handValue(dealerHand);

  if (playerStatus === "blackjack") {
    // Natural 21 pays 3:2, unless the dealer also has one (push).
    return dealer.isBlackjack ? bet : Math.floor(bet * 2.5);
  }

  if (dealer.isBust) return bet * 2;
  // A dealer's natural blackjack beats any non-natural hand, even a 3-card 21.
  if (dealer.isBlackjack) return 0;

  const player = handValue(playerHand);
  if (player.total > dealer.total) return bet * 2;
  if (player.total === dealer.total) return bet;
  return 0;
}
