import { describe, it, expect } from 'vitest';
import { formatMoney, formatOdds, formatChatTime, makeId } from './format';

describe('formatMoney', () => {
  it('форматирует с пробелом-разделителем разрядов и знаком $', () => {
    expect(formatMoney(1234)).toBe('$1 234');
    expect(formatMoney(0)).toBe('$0');
    expect(formatMoney(1500000)).toBe('$1 500 000');
  });
});

describe('formatOdds', () => {
  it('всегда 2 знака после точки', () => {
    expect(formatOdds(1.8)).toBe('1.80');
    expect(formatOdds(10)).toBe('10.00');
    expect(formatOdds(2.345)).toBe('2.35');
  });
});

describe('formatChatTime', () => {
  it('HH:MM с лидирующими нулями', () => {
    expect(formatChatTime(new Date(2024, 0, 1, 9, 5))).toBe('09:05');
    expect(formatChatTime(new Date(2024, 0, 1, 23, 59))).toBe('23:59');
  });
});

describe('makeId', () => {
  it('возвращает уникальный id с заданным префиксом', () => {
    const a = makeId('bet');
    const b = makeId('bet');
    expect(a).toMatch(/^bet_/);
    expect(b).toMatch(/^bet_/);
    expect(a).not.toBe(b);
  });
});
