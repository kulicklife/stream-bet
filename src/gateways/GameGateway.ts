import type { GameConfig, GameState, RoundResult } from '@/types/game';

/**
 * GameGateway — единственный источник правды о состоянии игры.
 *
 * MockGameGateway держит логику на клиенте (вся текущая v0.2.x симуляция).
 * WebSocketGameGateway будет в проде — подписываться на ws://game-server.
 *
 * Компоненты НЕ знают какая реализация активна.
 */
export interface GameGateway {
  /** Текущее состояние (для синхронного чтения, например при unmount). */
  getState(): GameState;

  /**
   * Подписка на обновления состояния (тикер таймера, изменение odds, смена фазы).
   * Вызывается при каждом state-update. Возвращает unsubscribe.
   */
  subscribe(listener: (state: GameState) => void): () => void;

  /**
   * Подписка на событие итога раунда (отдельно от state, чтобы можно было
   * запустить анимацию / звон колокола / тост, не реагируя на каждый state-tick).
   */
  onRoundResult(listener: (result: RoundResult) => void): () => void;

  /** Старт жизненного цикла. Идемпотентно. */
  start(): void;
  /** Остановка/cleanup интервалов. */
  stop(): void;
  /** Пауза/резюм без сброса state. */
  setPaused(paused: boolean): void;
  /** Сброс всей сессии. */
  reset(): void;

  /** Изменение конфига (тайминги, имена стримеров, режим автомата, force-winner). */
  updateConfig(patch: Partial<GameConfig>): void;
  getConfig(): GameConfig;

  /** Фиксация карты в фазе CARDS (имитация кнопки STOP в стриме). */
  fixCard(side: 'w1' | 'w2'): void;
}
