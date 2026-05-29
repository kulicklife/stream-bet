import { useGameState } from '@/context/GameContext';
import type { Side } from '@/types/game';
import { TALE_OF_TAPE } from '@/data/streamers';
import styles from './PlayerCard.module.css';

export interface PlayerCardProps {
  who: Side;
}

/**
 * Карточка бойца над стримом — "Blue/Red Corner" в постерной стилистике.
 * Показывает: штамп угла, аватар (grayscale), имя бойца, tale of the tape.
 */
export function PlayerCard({ who }: PlayerCardProps): JSX.Element {
  const state = useGameState();
  const cornerLabel = who === 'w1' ? 'СИНИЙ УГОЛ' : 'КРАСНЫЙ УГОЛ';
  const name = who === 'w1' ? 'NOVA' : 'VIPER';
  const tale = TALE_OF_TAPE[who];
  const isWinner = state.phase === 'RESULT' && state.winner === who;
  const isDimmed = state.phase === 'RESULT' && state.winner !== who;

  return (
    <div
      className={`${styles.card} ${styles[who]} ${isWinner ? styles.winning : ''} ${isDimmed ? styles.dimmed : ''}`}
      data-side={who}
    >
      <div className={styles.cornerStamp}>{cornerLabel}</div>
      <div className={styles.inner}>
        <div className={styles.avatar} aria-hidden="true">🥊</div>
        <div>
          <div className={styles.name}>{name}</div>
          <div className={styles.tale}>{tale}</div>
        </div>
      </div>
    </div>
  );
}
