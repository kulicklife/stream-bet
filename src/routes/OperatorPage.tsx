import { XBetWrapper } from '@/components/XBetWrapper/XBetWrapper';
import { GamePage } from './GamePage';

/**
 * /operator — игра внутри обёртки 1xBet (шапка + сайдбар + банер STREAM BET).
 * Это демонстрация того, как игра встраивается в сайт оператора.
 */
export function OperatorPage(): JSX.Element {
  return (
    <XBetWrapper>
      <GamePage />
    </XBetWrapper>
  );
}
