import { describe, it, expect } from 'vitest';
import { calcSeriesOdds, seriesWinner } from './series';

describe('calcSeriesOdds', () => {
  it('монотонно растёт с длиной серии', () => {
    const o1 = calcSeriesOdds(1, 1);
    const o5 = calcSeriesOdds(1, 5);
    const o10 = calcSeriesOdds(1, 10);
    const o45 = calcSeriesOdds(1, 45);
    expect(o1).toBeLessThan(o5);
    expect(o5).toBeLessThan(o10);
    expect(o10).toBeLessThan(o45);
  });

  it('минимум — длина 1, не падает в отрицательный диапазон', () => {
    expect(calcSeriesOdds(5, 5)).toBe(calcSeriesOdds(5, 5));
    expect(calcSeriesOdds(10, 5)).toBe(calcSeriesOdds(5, 5)); // to<from, берётся длина 1
  });

  it('округлено до 2 знаков', () => {
    const o = calcSeriesOdds(3, 17);
    expect(o.toString().split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });
});

describe('seriesWinner', () => {
  it('возвращает сторону с большим счётом', () => {
    expect(seriesWinner(3, 1)).toBe('w1');
    expect(seriesWinner(1, 3)).toBe('w2');
  });
  it('возвращает draw при равенстве', () => {
    expect(seriesWinner(2, 2)).toBe('draw');
    expect(seriesWinner(0, 0)).toBe('draw');
  });
});
