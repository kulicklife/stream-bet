import { useState, useEffect } from 'react';
import styles from './AdminToggle.module.css';

/**
 * Кнопка вверху-справа открывает AdminPanel.
 * Управляется через CustomEvent — для простоты в демо без своего контекста.
 */
export function AdminToggle(): JSX.Element {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('admin-panel:toggle', { detail: { open } }));
  }, [open]);

  return (
    <button
      type="button"
      onClick={() => setOpen(v => !v)}
      title="Админ-панель"
      className={`${styles.btn} ${open ? styles.open : ''}`}
    >
      ⚙
    </button>
  );
}
