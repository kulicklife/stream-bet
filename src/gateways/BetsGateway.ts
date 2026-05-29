import type { Side } from '@/types/game';
import type { PlayerBalance, PlayerBalancesMap, PlayerBet, StakePreset } from '@/types/bets';

/**
 * BetsGateway — кабинеты обоих блогеров (NOVA / VIPER).
 *
 * MockBetsGateway держит балансы в памяти (текущая v0.2.x).
 * Прод — за этим интерфейсом будет API нашего бэка.
 *
 * Ставки зрителей оператора 1xBet тут НЕ живут — для них отдельный OperatorAdapter.
 */
export interface BetsGateway {
  getBalances(): PlayerBalancesMap;
  getBalance(who: Side): PlayerBalance;

  subscribe(listener: (balances: PlayerBalancesMap) => void): () => void;

  /** Изменить текущий размер ставки в UI блогера. */
  setCurrentStake(who: Side, stake: StakePreset): void;

  /** Поставить на исход текущего раунда. Если баланса не хватает — no-op. */
  placeRoundBet(who: Side, side: Side, round: number, odds: number): PlayerBet | null;

  /** Поставить на исход серии раундов. */
  placeSeriesBet(
    who: Side,
    side: Side,
    from: number,
    to: number,
    odds: number,
  ): PlayerBet | null;

  /**
   * Применить итог раунда: pending-ставки на этот раунд закрываются,
   * series-ставки получают +1 к счёту, и закрываются если достигли `to`.
   */
  applyRoundResult(roundNum: number, winner: Side): void;
}
