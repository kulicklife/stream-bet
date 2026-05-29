import { useGameState } from '@/context/GameContext';
import { BetsPanel } from '@/components/BetsPanel/BetsPanel';
import { CardArena } from '@/components/CardArena/CardArena';
import styles from './CenterInfo.module.css';

/**
 * Центральный блок — переключается по фазе игры:
 *   BETTING → BetsPanel (кабинеты обоих блогеров)
 *   CARDS   → CardArena (раздача карт)
 *   RESULT  → ничего (ResultBanner перекрывает всё)
 */
export function CenterInfo(): JSX.Element {
  const { phase } = useGameState();
  return (
    <div className={styles.info}>
      <div className={styles.panel}>
        {phase === 'BETTING' && <BetsPanel />}
        {phase === 'CARDS' && <CardArena />}
      </div>
    </div>
  );
}
