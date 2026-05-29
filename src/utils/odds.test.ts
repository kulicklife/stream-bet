import { describe, it, expect } from 'vitest';
import { recalcOdds, calcPayout, DEFAULT_ODDS, MIN_ODDS, MAX_ODDS } from './odds';

describe('recalcOdds', () => {
  it('при пустом пуле возвращает DEFAULT_ODDS для обеих сторон', () => {
    expect(recalcOdds(0, 0)).toEqual({ oddsW1: DEFAULT_ODDS, oddsW2: DEFAULT_ODDS });
  });

  it('при равных пулах ≈ 1.56 на каждую сторону', () => {
    const r = recalcOdds(100, 100);
    expect(r.oddsW1).toBeCloseTo(1.56, 1);
    expect(r.oddsW2).toBeCloseTo(1.56, 1);
  });

  it('меньшая ставка на стороне — большой коэффициент, большая — маленький', () => {
    const r = recalcOdds(800, 200); // 80% на W1
    expect(r.oddsW1).toBeLessThan(r.oddsW2);
    expect(r.oddsW1).toBeGreaterThanOrEqual(MIN_ODDS);
    expect(r.oddsW2).toBeLessThanOrEqual(MAX_ODDS);
  });

  it('при крайнем перекосе сторона с ~0 уходит в MAX_ODDS', () => {
    const r = recalcOdds(1000, 5);
    expect(r.oddsW2).toBe(MAX_ODDS);
  });

  it('коэффициенты округлены до 2 знаков', () => {
    const r = recalcOdds(123, 456);
    expect(r.oddsW1.toString().split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });
});

describe('calcPayout', () => {
  it('пустой пул победителя — нулевая выплата', () => {
    expect(calcPayout('w1', 0, 500)).toEqual({ multiplier: 0, totalPayout: 0 });
  });

  it('rake = 20% — при пуле 1000 распределяется 800', () => {
    const { totalPayout } = calcPayout('w1', 500, 500);
    expect(totalPayout).toBe(800);
  });

  it('multiplier × stake суммарно даёт totalPayout (приблизительно)', () => {
    const poolW1 = 600;
    const poolW2 = 400;
    const { multiplier, totalPayout } = calcPayout('w1', poolW1, poolW2);
    // multiplier должен укладываться в диапазон, и multiplier * poolW1 ≈ totalPayout
    expect(multiplier * poolW1).toBeCloseTo(totalPayout, 0);
  });
});
