import type { ReactNode } from 'react';
import styles from './XBetWrapper.module.css';

/**
 * Обёртка-имитация UI 1xBet — шапка, навигация, левый сайдбар, банер STREAM BET.
 * Внутрь кладётся игра (children).
 *
 * Используется на /operator. Полностью изолирована от игровых стилей,
 * никаких CSS-переменных игры не задевает.
 */
const NAV = ['TOP-EVENTS', 'SPORTS', 'LIVE', '1XGAMES', 'CASINO', 'LIVE CASINO', 'ESPORTS', 'PROMO', 'MORE'];
const SIDEBAR_ICONS = ['🏈', '🏉', '⚽', '🏒', '🤸', '🎾', '🤼', '🏎️', '🚗', '⛳', '🏁', '🔧', '⛷️', '🥊', '🎲', '🎯', '🎱', '🎵', '🎿', '🌐', '🏹'];

export function XBetWrapper({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <img src="/assets/1xbet-logo.svg" alt="1xBET" />
        </div>
      </header>

      <nav className={styles.nav}>
        {NAV.map(item => (
          <div key={item} className={`${styles.navItem} ${item === 'LIVE' ? styles.active : ''}`}>
            {item} <span className={styles.caret}>▾</span>
          </div>
        ))}
      </nav>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          {SIDEBAR_ICONS.map((icon, i) => (
            <div key={i} className={styles.sportIcon}>{icon}</div>
          ))}
        </aside>

        <main className={styles.main}>
          <div className={styles.banner}>STREAM BET</div>
          <div className={styles.gameWrap}>{children}</div>
        </main>
      </div>
    </div>
  );
}
