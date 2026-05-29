import { useGameState } from '@/context/GameContext';
import { HistoryStrip } from '@/components/HistoryStrip/HistoryStrip';
import { formatMoney } from '@/utils/format';
import styles from './StatsBar.module.css';

/** Нижняя панель с агрегатами сессии. */
export function StatsBar(): JSX.Element {
  const { w1Wins, w1Losses, w2Wins, w2Losses, totalWonToday } = useGameState();
  return (
    <div className={styles.bar}>
      <div className={styles.side}>
        <div className={styles.label}>СИНИЙ · NOVA · СЕГОДНЯ</div>
        <div className={`${styles.record} ${styles.w1}`}>
          <span className={styles.w}>П</span>{w1Wins} · <span className={styles.l}>П</span>{w1Losses}
        </div>
      </div>
      <div className={styles.center}>
        <HistoryStrip />
        <div className={styles.total}>
          КАССА СЕГОДНЯ &nbsp;/&nbsp; <span>+{formatMoney(totalWonToday)}</span>
        </div>
      </div>
      <div className={styles.side}>
        <div className={styles.label}>КРАСНЫЙ · VIPER · СЕГОДНЯ</div>
        <div className={`${styles.record} ${styles.w2}`}>
          <span className={styles.w}>П</span>{w2Wins} · <span className={styles.l}>П</span>{w2Losses}
        </div>
      </div>
    </div>
  );
}
