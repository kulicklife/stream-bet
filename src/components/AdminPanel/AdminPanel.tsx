import { useEffect, useState } from 'react';
import { useGameActions, useGameContext } from '@/context/GameContext';
import type { Side } from '@/types/game';
import styles from './AdminPanel.module.css';

/**
 * Минимальная админ-панель — образец интеграции с GameContext.
 * Команда расширит набором настроек и стримерами.
 */
export function AdminPanel(): JSX.Element {
  const [open, setOpen] = useState(false);
  const { config } = useGameContext();
  const actions = useGameActions();

  useEffect(() => {
    const handler = (e: Event): void => {
      const detail = (e as CustomEvent<{ open: boolean }>).detail;
      setOpen(detail.open);
    };
    window.addEventListener('admin-panel:toggle', handler);
    return () => window.removeEventListener('admin-panel:toggle', handler);
  }, []);

  if (!open) return <></>;

  const force = (side: Side | null) => actions.updateConfig({ forceWinner: side });

  return (
    <div className={styles.panel}>
      <div className={styles.header}>⚙ Управление</div>
      <div className={styles.section}>
        <div className={styles.title}>Раунд</div>
        <div className={styles.btnGroup}>
          <button className={`${styles.btn} ${styles.success}`} onClick={actions.start}>▶ Гонг</button>
          <button className={`${styles.btn} ${styles.danger}`} onClick={actions.pause}>⏸ Пауза</button>
          <button className={styles.btn} onClick={actions.reset}>↺ Сброс</button>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.title}>Форсировать</div>
        <div className={styles.btnGroup}>
          <button className={styles.btn} onClick={() => force('w1')}>Синий</button>
          <button className={styles.btn} onClick={() => force('w2')}>Красный</button>
          <button className={styles.btn} onClick={() => force(null)}>Случайно</button>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.title}>Текущий конфиг (для иллюстрации)</div>
        <pre className={styles.pre}>{JSON.stringify(config, null, 2)}</pre>
      </div>
    </div>
  );
}
