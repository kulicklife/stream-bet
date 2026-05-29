import { useGameState } from '@/context/GameContext';
import { formatMoney, formatOdds } from '@/utils/format';
import styles from './ResultBanner.module.css';

/**
 * KO-баннер: появляется в фазе RESULT, перекрывает центр.
 * Содержит чемпионский пояс и упоминание промо 1×БЕТ.
 */
export function ResultBanner(): JSX.Element {
  const { phase, winner, payoutMultiplier, totalPayout, totalPool, betCount, timer } = useGameState();
  if (phase !== 'RESULT' || !winner) return <></>;

  const name = winner === 'w1' ? 'NOVA' : 'VIPER';
  const corner = winner === 'w1' ? 'СИНИЙ' : 'КРАСНЫЙ';

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <div className={styles.ko}>КО!</div>
        <div className={`${styles.winner} ${styles[winner]}`}>
          {corner} · {name}
        </div>
        <div className={styles.belt}>ЧЕМПИОН РАУНДА</div>
        <div className={styles.payout}>
          ВЫПЛАТА ×{formatOdds(payoutMultiplier)} · +{formatMoney(totalPayout)}
        </div>
        <div className={styles.total}>
          ОБЩИЙ ПУЛ {formatMoney(totalPool)} · {betCount} СТАВОК
        </div>
        <div className={styles.promo}>
          Ставки на этот бой принимаются на <b>1×БЕТ</b>
        </div>
        <div className={styles.next}>
          Следующий раунд через <span>{timer}</span> с
        </div>
      </div>
    </div>
  );
}
