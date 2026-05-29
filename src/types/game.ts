/**
 * Базовые типы игры (одна сессия PvP-стрима).
 * Контракт между gateways, контекстами, хуками и компонентами.
 */

/** Сторона раунда. W1 всегда левый (синий угол), W2 — правый (красный). */
export type Side = 'w1' | 'w2';

/** Фазы цикла одного раунда. */
export type Phase = 'IDLE' | 'BETTING' | 'CARDS' | 'RESULT';

/** Карта в колоде. */
export interface Card {
  rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
  suit: '♠' | '♥' | '♦' | '♣';
  /** Числовое значение для сравнения старшинства: 2..14 (туз = 14). */
  value: number;
}

/** Снимок состояния игры в любой момент. */
export interface GameState {
  phase: Phase;
  roundNum: number;
  /** Сколько секунд осталось в текущей фазе. */
  timer: number;
  /** Общая длительность текущей фазы (для прогресс-бара). */
  timerTotal: number;
  paused: boolean;

  /** Текущие коэффициенты по сторонам. */
  oddsW1: number;
  oddsW2: number;
  /** Пулы pari-mutuel — сколько денег зрителей легло на каждую сторону. */
  poolW1: number;
  poolW2: number;
  totalPool: number;
  betCount: number;

  /** Последние 10 победителей раундов в этой сессии. */
  history: Side[];

  /** Карты текущего раунда (могут быть null до фазы CARDS). */
  cardW1: Card | null;
  cardW2: Card | null;
  /** Зафиксирован ли STOP'ом. */
  fixedW1: boolean;
  fixedW2: boolean;

  /** Результат раунда. null до фазы RESULT. */
  winner: Side | null;
  payoutMultiplier: number;
  totalPayout: number;

  /** Агрегаты сессии. */
  w1Wins: number;
  w2Wins: number;
  w1Losses: number;
  w2Losses: number;
  totalWonToday: number;
}

/** Конфиг игры — задаётся из admin-панели или GameGateway. */
export interface GameConfig {
  betDuration: number;
  cardDuration: number;
  resultDuration: number;
  /** Количество эмулируемых зрителей-ботов (для MockGameGateway). */
  playerCount: number;
  /** Средний размер ставки бота. */
  avgBet: number;
  /** % от 0 до 100 — насколько боты предвзяты к W1. */
  w1Skew: number;
  streamer1: string;
  streamer2: string;
  autoMode: boolean;
  /** Если задано — следующий раунд гарантированно завершится этой стороной. */
  forceWinner: Side | null;
}

/** Имя и числа стримера для отображения в карточке. */
export interface Streamer {
  name: string;
  /** Запись побед/поражений, страна, весовая категория. */
  taleOfTape: string;
}

/** Событие итога раунда — выкидывается из GameGateway. */
export interface RoundResult {
  roundNum: number;
  winner: Side;
  cardW1: Card;
  cardW2: Card;
  payoutMultiplier: number;
  totalPayout: number;
  totalPool: number;
  betCount: number;
}
