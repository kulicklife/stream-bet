import { useGameState, useGameActions } from '@/context/GameContext';
import { PlayingCard } from '@/components/PlayingCard/PlayingCard';
import { StopButton } from '@/components/StopButton/StopButton';
import styles from './CardArena.module.css';

/** Раздача карт — две карточки лицом, между ними VS, кнопки СТОП. */
export function CardArena(): JSX.Element {
  const { cardW1, cardW2, fixedW1, fixedW2 } = useGameState();
  const { fixCard } = useGameActions();

  return (
    <div className={styles.arena}>
      <div className={styles.title}>Раздача карт</div>
      <div className={styles.hint}>Жми СТОП — зафиксируй карту</div>
      <div className={styles.inner}>
        <div className={`${styles.slot} ${styles.w1}`}>
          <div className={styles.label}>СИНИЙ · NOVA</div>
          <PlayingCard who="w1" card={cardW1} fixed={fixedW1} />
          <StopButton onClick={() => fixCard('w1')} disabled={fixedW1} />
        </div>
        <div className={styles.vs}>vs</div>
        <div className={`${styles.slot} ${styles.w2}`}>
          <div className={styles.label}>КРАСНЫЙ · VIPER</div>
          <PlayingCard who="w2" card={cardW2} fixed={fixedW2} />
          <StopButton onClick={() => fixCard('w2')} disabled={fixedW2} />
        </div>
      </div>
    </div>
  );
}
