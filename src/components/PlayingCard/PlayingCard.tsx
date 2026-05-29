import type { Card, Side } from '@/types/game';
import styles from './PlayingCard.module.css';

export interface PlayingCardProps {
  who: Side;
  card: Card | null;
  fixed: boolean;
}

/** Лицевая сторона игральной карты с рангом и мастью. */
export function PlayingCard({ who, card, fixed }: PlayingCardProps): JSX.Element {
  return (
    <div className={`${styles.card} ${styles[who]} ${fixed ? styles.fixed : ''}`}>
      <div className={styles.rank}>{card?.rank ?? '?'}</div>
      <div className={styles.suit}>{card?.suit ?? '·'}</div>
    </div>
  );
}
