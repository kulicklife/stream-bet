import { useGameState } from '@/context/GameContext';
import styles from './HistoryStrip.module.css';

/** Лента последних 10 побед — прямоугольные B/R-плашки. */
export function HistoryStrip(): JSX.Element {
  const { history } = useGameState();
  return (
    <div className={styles.strip}>
      <span className={styles.label}>ИСТОРИЯ БОЁВ</span>
      {history.map((side, idx) => (
        <div key={`${idx}-${side}`} className={`${styles.chip} ${styles[side]}`}>
          {side === 'w1' ? 'B' : 'R'}
        </div>
      ))}
    </div>
  );
}
