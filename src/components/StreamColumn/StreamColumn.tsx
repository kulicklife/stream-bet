import { useGameState } from '@/context/GameContext';
import { StreamSlot } from '@/components/StreamSlot/StreamSlot';
import { ChatPane } from '@/components/ChatPane/ChatPane';
import type { Side } from '@/types/game';
import styles from './StreamColumn.module.css';

export interface StreamColumnProps {
  who: Side;
}

/** Колонка одного стримера: видео сверху, чат снизу. */
export function StreamColumn({ who }: StreamColumnProps): JSX.Element {
  const { phase } = useGameState();
  return (
    <div className={styles.column}>
      <StreamSlot who={who} />
      <ChatPane who={who} phase={phase} />
    </div>
  );
}
