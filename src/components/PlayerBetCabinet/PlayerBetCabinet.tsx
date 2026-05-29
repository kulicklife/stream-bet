import { useState } from 'react';
import { useGameState } from '@/context/GameContext';
import { useBalance, useBetsContext } from '@/context/BetsContext';
import type { Side } from '@/types/game';
import type { StakePreset } from '@/types/bets';
import { STAKE_PRESETS } from '@/types/bets';
import { calcSeriesOdds } from '@/utils/series';
import { formatMoney, formatOdds } from '@/utils/format';
import styles from './PlayerBetCabinet.module.css';

export interface PlayerBetCabinetProps {
  who: Side;
  name: string;
}

/**
 * Кабинет одного блогера: баланс, выбор ставки, кнопки на исход раунда и серии.
 * Список последних ставок снизу.
 */
export function PlayerBetCabinet({ who, name }: PlayerBetCabinetProps): JSX.Element {
  const { roundNum, oddsW1, oddsW2, phase } = useGameState();
  const balance = useBalance(who);
  const { actions } = useBetsContext();
  const [seriesFrom, setSeriesFrom] = useState(roundNum);
  const [seriesTo, setSeriesTo] = useState(roundNum + 4);
  const seriesOdds = calcSeriesOdds(seriesFrom, seriesTo);
  const canBet = phase === 'BETTING' && balance.balance >= balance.currentStake;

  return (
    <div className={`${styles.col} ${styles[who]}`}>
      <div className={styles.balanceRow}>
        <span className={styles.label}>
          <b className={`${styles.who} ${styles[who]}`}>{name}</b>
        </span>
        <span className={styles.value} data-balance>
          {formatMoney(balance.balance)}
        </span>
      </div>

      <div className={styles.section}>
        <div className={styles.stakeRow}>
          {STAKE_PRESETS.map(s => (
            <button
              key={s}
              type="button"
              className={`${styles.stakeBtn} ${balance.currentStake === s ? styles.active : ''}`}
              onClick={() => actions.setStake(who, s)}
            >
              ${s}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.title}>Раунд · исход</div>
        <div className={styles.sideRow}>
          <button
            type="button"
            disabled={!canBet}
            className={`${styles.betSide} ${styles.blue}`}
            onClick={() => actions.placeRoundBet(who, 'w1', roundNum, oddsW1)}
          >
            СИН<span className={styles.odds}>×{formatOdds(oddsW1)}</span>
          </button>
          <button
            type="button"
            disabled={!canBet}
            className={`${styles.betSide} ${styles.red}`}
            onClick={() => actions.placeRoundBet(who, 'w2', roundNum, oddsW2)}
          >
            КРС<span className={styles.odds}>×{formatOdds(oddsW2)}</span>
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.title}>
          Серия с
          <input
            type="number"
            min={1}
            max={90}
            value={seriesFrom}
            onChange={e => setSeriesFrom(parseInt(e.target.value) || roundNum)}
          />
          по
          <input
            type="number"
            min={1}
            max={90}
            value={seriesTo}
            onChange={e => setSeriesTo(parseInt(e.target.value) || roundNum + 4)}
          />
          · <span className={styles.oddsTag}>×{formatOdds(seriesOdds)}</span>
        </div>
        <div className={styles.sideRow}>
          <button
            type="button"
            disabled={!canBet}
            className={`${styles.betSide} ${styles.blue}`}
            onClick={() => actions.placeSeriesBet(who, 'w1', seriesFrom, seriesTo, seriesOdds)}
          >
            СИН
          </button>
          <button
            type="button"
            disabled={!canBet}
            className={`${styles.betSide} ${styles.red}`}
            onClick={() => actions.placeSeriesBet(who, 'w2', seriesFrom, seriesTo, seriesOdds)}
          >
            КРС
          </button>
        </div>
      </div>

      <div className={`${styles.section} ${styles.listSection}`}>
        <div className={styles.title}>Мои ставки</div>
        <div className={styles.list}>
          {balance.bets.length === 0 ? (
            <div className={styles.empty}>Ставок нет</div>
          ) : (
            balance.bets
              .slice(-8)
              .reverse()
              .map(b => {
                const label = b.type === 'round' ? `Р${b.round}` : `С${b.from}–${b.to}`;
                const sideLabel = b.side === 'w1' ? 'СИН' : 'КРС';
                const statusText =
                  b.status === 'won'
                    ? `+${formatMoney(b.payout ?? 0)}`
                    : b.status === 'lost'
                      ? `−${formatMoney(b.stake)}`
                      : b.type === 'series'
                        ? `${b.w1count}:${b.w2count}`
                        : '…';
                return (
                  <div key={b.id} className={`${styles.item} ${styles[b.status]}`}>
                    <span>
                      {label} ${b.stake}{' '}
                      <span className={`${styles.bSide} ${styles[b.side]}`}>{sideLabel}</span>{' '}
                      ×{formatOdds(b.odds)}
                    </span>
                    <span className={styles.bStatus}>{statusText}</span>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}
