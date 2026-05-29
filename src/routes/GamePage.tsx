import { useRef } from 'react';
import { useScaleToViewport } from '@/hooks/useScaleToViewport';
import { TickerBar } from '@/components/TickerBar/TickerBar';
import { PlayerCard } from '@/components/PlayerCard/PlayerCard';
import { TimerZone } from '@/components/TimerZone/TimerZone';
import { StreamColumn } from '@/components/StreamColumn/StreamColumn';
import { CenterInfo } from '@/components/CenterInfo/CenterInfo';
import { ResultBanner } from '@/components/ResultBanner/ResultBanner';
import { StatsBar } from '@/components/StatsBar/StatsBar';
import { AudioToggle } from '@/components/AudioToggle/AudioToggle';
import { AdminToggle } from '@/components/AdminToggle/AdminToggle';
import { AdminPanel } from '@/components/AdminPanel/AdminPanel';
import { useGameLoop } from '@/hooks/useGameLoop';
import styles from './GamePage.module.css';

/**
 * GamePage — главная страница: чистая игра 1280×720 без обёрток оператора.
 * URL: /
 */
export function GamePage(): JSX.Element {
  useGameLoop();
  const appRef = useRef<HTMLDivElement>(null);
  useScaleToViewport(appRef);

  return (
    <>
      <div className={styles.cityscape} aria-hidden="true" />
      <AudioToggle />
      <AdminToggle />
      <AdminPanel />

      <div className={styles.app} ref={appRef}>
        <TickerBar />
        <div className={styles.gameArea}>
          <div className={styles.topRow}>
            <PlayerCard who="w1" />
            <TimerZone />
            <PlayerCard who="w2" />
          </div>

          <div className={styles.centerArea}>
            <StreamColumn who="w1" />
            <CenterInfo />
            <StreamColumn who="w2" />
            <ResultBanner />
          </div>

          <StatsBar />
        </div>
      </div>
    </>
  );
}
