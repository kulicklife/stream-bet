import { useGameState } from '@/context/GameContext';
import styles from './TickerBar.module.css';

/**
 * Бегущая лента победителей (последний раунд → промо-фразы).
 * В проде ленту наполняет GameGateway-event "round_result".
 * Тут — простая заглушка, обновляющаяся при смене winner.
 */
export function TickerBar(): JSX.Element {
  const { history, phase } = useGameState();
  const visible = phase === 'BETTING'; // тикер скрыт в фазах CARDS/RESULT (как и в HTML-версии)

  return (
    <div className={styles.bar} data-visible={visible}>
      <div className={styles.track}>
        {history.length === 0 ? (
          <span className={styles.entry}>ПРИЁМ СТАВОК · РАУНД ОТКРЫТ</span>
        ) : (
          history.map((side, idx) => (
            <span key={idx} className={styles.entry}>
              РАУНД {history.length - idx} → <span className={styles[side]}>{side === 'w1' ? 'СИНИЙ' : 'КРАСНЫЙ'}</span>
              <span className={styles.cross}>×</span>
            </span>
          ))
        )}
      </div>
    </div>
  );
}
