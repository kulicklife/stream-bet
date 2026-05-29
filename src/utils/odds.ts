import type { Side } from '@/types/game';

/** Базовый коэффициент при пустом пуле. */
export const DEFAULT_ODDS = 1.8;
/** Минимально допустимый коэффициент. */
export const MIN_ODDS = 1.01;
/** Максимально допустимый коэффициент. */
export const MAX_ODDS = 9.99;
/** Доля комиссии оператора (rake) от тотального пула. */
export const RAKE = 0.2;
/** Делитель для конвертации доли пула в коэффициент: 0.78 = (1-0.20) * небольшой adjust. */
export const ODDS_NUMERATOR = 0.78;

/**
 * Пересчёт коэффициентов pari-mutuel от текущего пула.
 *
 * При пустом пуле возвращает {DEFAULT_ODDS, DEFAULT_ODDS}.
 * При сильном перекосе одна сторона может уйти в MAX_ODDS, другая — в MIN_ODDS.
 */
export function recalcOdds(poolW1: number, poolW2: number): { oddsW1: number; oddsW2: number } {
  const total = poolW1 + poolW2;
  if (total === 0) return { oddsW1: DEFAULT_ODDS, oddsW2: DEFAULT_ODDS };

  const p1 = poolW1 / total;
  const p2 = poolW2 / total;
  return {
    oddsW1: oddsFromShare(p1),
    oddsW2: oddsFromShare(p2),
  };
}

function oddsFromShare(share: number): number {
  if (share < 0.02) return MAX_ODDS;
  const raw = ODDS_NUMERATOR / share;
  const clamped = Math.max(MIN_ODDS, Math.min(MAX_ODDS, raw));
  return +clamped.toFixed(2);
}

/**
 * Выплата по победившей стороне (pari-mutuel).
 * multiplier — на сколько умножается ставка зрителя.
 * totalPayout — сколько денег уйдёт зрителям-победителям суммарно.
 */
export function calcPayout(
  winningSide: Side,
  poolW1: number,
  poolW2: number,
): { multiplier: number; totalPayout: number } {
  const total = poolW1 + poolW2;
  const winPool = winningSide === 'w1' ? poolW1 : poolW2;
  if (winPool === 0) return { multiplier: 0, totalPayout: 0 };

  const dist = total * (1 - RAKE);
  return {
    multiplier: +(dist / winPool).toFixed(2),
    totalPayout: Math.round(dist),
  };
}
