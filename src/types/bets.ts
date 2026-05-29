import type { Side } from './game';

/**
 * Ставки блогеров — это НАША собственная PvP-механика между ведущими,
 * а не ставки зрителей оператора (тех мы НЕ храним, они уходят в OperatorAdapter).
 */

export type BetType = 'round' | 'series';
export type BetStatus = 'pending' | 'won' | 'lost';

/** Базовые поля любой ставки блогера. */
interface BetBase {
  /** UUID для идемпотентности и React-key. */
  id: string;
  /** На какую сторону поставлено. */
  side: Side;
  /** Размер ставки на момент размещения (баланс блогера). */
  stake: number;
  /** Зафиксированный коэффициент на момент размещения. */
  odds: number;
  status: BetStatus;
  /** Сколько денег вернётся (выплата >= stake). Заполняется при resolve. */
  payout?: number;
}

/** Ставка на исход одного конкретного раунда. */
export interface RoundBet extends BetBase {
  type: 'round';
  round: number;
}

/** Ставка на исход серии раундов [from, to]. Победитель определяется большинством. */
export interface SeriesBet extends BetBase {
  type: 'series';
  from: number;
  to: number;
  /** Сколько раундов уже выиграно каждой стороной внутри [from, to]. */
  w1count: number;
  w2count: number;
}

export type PlayerBet = RoundBet | SeriesBet;

/** Состояние одного блогера (баланс + ставки). */
export interface PlayerBalance {
  balance: number;
  /** Выбранный размер ставки в UI (одна из STAKE_PRESETS). */
  currentStake: number;
  bets: PlayerBet[];
}

/** Готовые варианты размера ставки в UI. */
export const STAKE_PRESETS = [10, 50, 100, 500] as const;
export type StakePreset = (typeof STAKE_PRESETS)[number];

/** Кабинеты обоих блогеров (ключ Side). */
export type PlayerBalancesMap = Record<Side, PlayerBalance>;
