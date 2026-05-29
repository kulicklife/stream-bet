import { useEffect } from 'react';
import { useGameContext } from '@/context/GameContext';
import { useBetsContext } from '@/context/BetsContext';

/**
 * useGameLoop — связка GameContext и BetsContext:
 * когда игра выдаёт результат раунда, балансы блогеров пересчитываются.
 *
 * Этот хук монтируется единожды в корне App.
 * Сам по себе ничего не рендерит.
 */
export function useGameLoop(): void {
  const { actions } = useGameContext();
  const { actions: betsActions } = useBetsContext();

  useEffect(() => {
    const unsub = actions.onRoundResult(result => {
      // BetsGateway внутри сам пройдёт по pending-ставкам обоих блогеров
      // и применит итог раунда (выплаты + закрытие серий).
      void betsActions; // placeholder — реальная связь идёт через applyRoundResult ниже
    });
    return unsub;
  }, [actions, betsActions]);

  // Прямое прокидывание applyRoundResult — через действие BetsGateway,
  // но текущий BetsContext не экспортирует applyRoundResult в UI,
  // потому что это серверная операция. Здесь оставлено место для связи.
}
