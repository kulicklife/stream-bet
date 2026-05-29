import type { Card } from '@/types/game';

export const RANKS: ReadonlyArray<Card['rank']> = [
  '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A',
];
export const VALUES: ReadonlyArray<number> = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
export const SUITS: ReadonlyArray<Card['suit']> = ['♠', '♥', '♦', '♣'];

/** Создаёт чистую новую колоду 52 карты. */
export function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let i = 0; i < RANKS.length; i++) {
      // С учётом строгого tsconfig (noUncheckedIndexedAccess) — нужны явные assertions.
      const rank = RANKS[i] as Card['rank'];
      const value = VALUES[i] as number;
      deck.push({ rank, suit, value });
    }
  }
  return deck;
}

/** Чистый Fisher-Yates, не модифицирует вход. */
export function shuffle<T>(input: ReadonlyArray<T>, rng: () => number = Math.random): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = arr[i] as T;
    const b = arr[j] as T;
    arr[i] = b;
    arr[j] = a;
  }
  return arr;
}

/** Стейт-фул-курсор по колоде. Возвращает next-card и автоматически перетасовывает при исчерпании. */
export function createDealer(initialSeed?: () => number) {
  let deck = shuffle(makeDeck(), initialSeed);
  let i = 0;
  return {
    next(): Card {
      if (i >= deck.length) {
        deck = shuffle(makeDeck(), initialSeed);
        i = 0;
      }
      const card = deck[i] as Card;
      i++;
      return card;
    },
    reset() {
      deck = shuffle(makeDeck(), initialSeed);
      i = 0;
    },
  };
}
