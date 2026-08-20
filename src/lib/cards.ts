import { randomInt } from "crypto";

export const SUITS = ["S", "H", "D", "C"] as const;
export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;

export type Suit = (typeof SUITS)[number];
export type Rank = (typeof RANKS)[number];

/** Card code, e.g. "AS" (ace of spades), "10H" (ten of hearts). */
export type Card = `${Rank}${Suit}`;

export const NUM_DECKS = 6;

export function createShoe(numDecks: number = NUM_DECKS): Card[] {
  const shoe: Card[] = [];
  for (let d = 0; d < numDecks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        shoe.push(`${rank}${suit}`);
      }
    }
  }
  return shuffle(shoe);
}

/** Fisher-Yates shuffle using a CSPRNG so shoe order isn't predictable/replayable. */
export function shuffle<T>(deck: T[]): T[] {
  const result = [...deck];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function rankOf(card: Card): Rank {
  return card.slice(0, -1) as Rank;
}

export function suitOf(card: Card): Suit {
  return card.slice(-1) as Suit;
}

const SUIT_SYMBOLS: Record<Suit, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };

export function formatCard(card: Card): string {
  return `${rankOf(card)}${SUIT_SYMBOLS[suitOf(card)]}`;
}

export function cardValue(card: Card): number {
  const rank = rankOf(card);
  if (rank === "A") return 11;
  if (rank === "J" || rank === "Q" || rank === "K") return 10;
  return Number(rank);
}

/**
 * Dealer draws until 17+, standing on soft 17 (S17) — the more
 * player-favorable of the two common house conventions.
 */
export function playDealerHand(
  startingHand: Card[],
  shoe: Card[]
): { dealerHand: Card[]; shoe: Card[] } {
  let hand = [...startingHand];
  let remaining = [...shoe];

  while (handValue(hand).total < 17 && remaining.length > 0) {
    hand = [...hand, remaining[0]];
    remaining = remaining.slice(1);
  }

  return { dealerHand: hand, shoe: remaining };
}

export interface HandValue {
  total: number;
  soft: boolean; // true if an ace is counted as 11
  isBlackjack: boolean;
  isBust: boolean;
}

/** Standard blackjack hand value: aces count as 11 unless that busts, then drop to 1 one at a time. */
export function handValue(hand: Card[]): HandValue {
  let total = 0;
  let aces = 0;

  for (const card of hand) {
    total += cardValue(card);
    if (rankOf(card) === "A") aces++;
  }

  let softAces = aces;
  while (total > 21 && softAces > 0) {
    total -= 10;
    softAces--;
  }

  return {
    total,
    soft: softAces > 0,
    isBlackjack: hand.length === 2 && total === 21,
    isBust: total > 21,
  };
}
