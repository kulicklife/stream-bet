import { useGameState } from '@/context/GameContext';
import styles from './TimerZone.module.css';

const PHASE_LABELS: Record<string, string> = {
  IDLE: 'ОЖИДАНИЕ',
  BETTING: 'ПРИЁМ СТАВОК',
  CARDS: 'БОЙ ИДЁТ',
  RESULT: 'ИТОГ',
};

/**
 * Центральный round-indicator с количеством секунд и прогресс-баром.
 * Стандартная "лента" 1xBet-style, без анимаций пульсации
 * (анимации в данной теме делаем через постерные приёмы).
 */
export function TimerZone(): JSX.Element {
  const { timer, timerTotal, phase } = useGameState();
  const seconds = Math.max(0, timer);
  const pct = timerTotal > 0 ? (seconds / timerTotal) * 100 : 0;
  const tone = seconds <= 5 ? 'crit' : seconds <= 10 ? 'warn' : 'ok';

  return (
    <div className={styles.zone}>
      <div className={styles.label}>{PHASE_LABELS[phase] ?? phase}</div>
      <div className={`${styles.display} ${styles[tone]}`}>{String(seconds).padStart(2, '0')}</div>
      <div className={styles.ring}>
        <div className={`${styles.fill} ${styles[tone]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
