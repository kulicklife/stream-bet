import { useChat } from '@/hooks/useChat';
import { phaseToChatContext } from '@/data/phrases';
import type { Phase, Side } from '@/types/game';
import styles from './ChatPane.module.css';

export interface ChatPaneProps {
  who: Side;
  phase: Phase;
}

/** Чат "зрительного зала" одного стрима. */
export function ChatPane({ who, phase }: ChatPaneProps): JSX.Element {
  const cornerTitle = who === 'w1' ? 'ЗАЛ · СИНИЙ' : 'ЗАЛ · КРАСНЫЙ';
  const { messages } = useChat({ side: who, context: phaseToChatContext(phase) });

  return (
    <div className={styles.pane} data-side={who}>
      <div className={styles.head}>
        <span>
          <span className={styles.dot} />
          {cornerTitle}
        </span>
        <span>ЭФИР</span>
      </div>
      <div className={styles.feed}>
        {messages.map(m => (
          <div
            key={m.id}
            className={`${styles.msg} ${m.system ? styles.system : ''} ${m.highlight ? styles.highlight : ''}`}
          >
            {m.system ? (
              m.text
            ) : (
              <>
                <span className={styles.time}>{m.time}</span>
                <span className={`${styles.nick} ${m.team ? styles[m.team] : ''}`}>{m.nick}</span>
                <span dangerouslySetInnerHTML={{ __html: m.text }} />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
