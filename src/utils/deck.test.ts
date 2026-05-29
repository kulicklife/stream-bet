import { describe, it, expect } from 'vitest';
import { makeDeck, shuffle, createDealer, RANKS, SUITS } from './deck';

describe('makeDeck', () => {
  it('содержит 52 уникальные карты', () => {
    const d = makeDeck();
    expect(d).toHaveLength(52);
    const ids = new Set(d.map(c => `${c.rank}${c.suit}`));
    expect(ids.size).toBe(52);
  });

  it('покрывает все ранги и масти', () => {
    const d = makeDeck();
    const ranks = new Set(d.map(c => c.rank));
    const suits = new Set(d.map(c => c.suit));
    expect(ranks).toEqual(new Set(RANKS));
    expect(suits).toEqual(new Set(SUITS));
  });

  it('у туза значение 14, у двойки — 2', () => {
    const d = makeDeck();
    expect(d.find(c => c.rank === 'A')?.value).toBe(14);
    expect(d.find(c => c.rank === '2')?.value).toBe(2);
  });
});

describe('shuffle', () => {
  it('сохраняет длину и состав', () => {
    const src = [1, 2, 3, 4, 5];
    const r = shuffle(src);
    expect(r).toHaveLength(5);
    expect([...r].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('не мутирует вход', () => {
    const src = [1, 2, 3, 4, 5];
    shuffle(src);
    expect(src).toEqual([1, 2, 3, 4, 5]);
  });

  it('детерминирован при seeded rng', () => {
    // Простой LCG-like seeded rng для теста.
    const seedRng = (seed: number) => {
      let s = seed;
      return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };
    };
    const r1 = shuffle([1, 2, 3, 4, 5], seedRng(42));
    const r2 = shuffle([1, 2, 3, 4, 5], seedRng(42));
    expect(r1).toEqual(r2);
  });
});

describe('createDealer', () => {
  it('выдаёт карты, никогда не возвращая null', () => {
    const dealer = createDealer();
    for (let i = 0; i < 200; i++) {
      const c = dealer.next();
      expect(c).toBeDefined();
      expect(c.value).toBeGreaterThanOrEqual(2);
      expect(c.value).toBeLessThanOrEqual(14);
    }
  });

  it('перетасовывает после исчерпания колоды', () => {
    const dealer = createDealer();
    const first52 = Array.from({ length: 52 }, () => dealer.next());
    const ids = new Set(first52.map(c => `${c.rank}${c.suit}`));
    expect(ids.size).toBe(52);
    // 53-я карта — уже из новой перетасовки, не должна сломаться
    const c53 = dealer.next();
    expect(c53).toBeDefined();
  });

  it('reset возвращает к свежей колоде', () => {
    const dealer = createDealer();
    dealer.next();
    dealer.next();
    dealer.reset();
    // После reset набираем 52 карты — должны быть все уникальные
    const fresh = Array.from({ length: 52 }, () => dealer.next());
    expect(new Set(fresh.map(c => `${c.rank}${c.suit}`)).size).toBe(52);
  });
});
