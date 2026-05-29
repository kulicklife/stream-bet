import { useGameState } from '@/context/GameContext';
import { PlayerBetCabinet } from '@/components/PlayerBetCabinet/PlayerBetCabinet';
import styles from './BetsPanel.module.css';

/**
 * Заглавный экран фазы BETTING.
 * Два кабинета блогеров — каждый со своим балансом, ставкой на раунд и серией.
 * См. PlayerBetCabinet для контролов.
 */
export function BetsPanel(): JSX.Element {
  const { roundNum } = useGameState();
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        Раунд №{roundNum} · приём ставок
      </div>
      <div className={styles.dual}>
        <PlayerBetCabinet who="w1" name="NOVA" />
        <PlayerBetCabinet who="w2" name="VIPER" />
      </div>
    </div>
  );
}
