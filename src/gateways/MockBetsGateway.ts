import type { Side } from '@/types/game';
import type { PlayerBalance, PlayerBalancesMap, PlayerBet, StakePreset } from '@/types/bets';
import { makeId } from '@/utils/format';
import { seriesWinner } from '@/utils/series';
import type { BetsGateway } from './BetsGateway';

const STARTING_BALANCE = 1000;
const DEFAULT_STAKE: StakePreset = 50;

const initialBalance = (): PlayerBalance => ({
  balance: STARTING_BALANCE,
  currentStake: DEFAULT_STAKE,
  bets: [],
});

export class MockBetsGateway implements BetsGateway {
  private balances: PlayerBalancesMap = {
    w1: initialBalance(),
    w2: initialBalance(),
  };
  private listeners = new Set<(b: PlayerBalancesMap) => void>();

  getBalances(): PlayerBalancesMap {
    return this.balances;
  }
  getBalance(who: Side): PlayerBalance {
    return this.balances[who];
  }
  subscribe(listener: (b: PlayerBalancesMap) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  setCurrentStake(who: Side, stake: StakePreset): void {
    this.balances = {
      ...this.balances,
      [who]: { ...this.balances[who], currentStake: stake },
    };
    this.emit();
  }

  placeRoundBet(who: Side, side: Side, round: number, odds: number): PlayerBet | null {
    const p = this.balances[who];
    if (p.balance < p.currentStake) return null;
    const bet: PlayerBet = {
      id: makeId('bet'),
      type: 'round',
      round,
      side,
      stake: p.currentStake,
      odds,
      status: 'pending',
    };
    this.balances = {
      ...this.balances,
      [who]: { ...p, balance: p.balance - p.currentStake, bets: [...p.bets, bet] },
    };
    this.emit();
    return bet;
  }

  placeSeriesBet(who: Side, side: Side, from: number, to: number, odds: number): PlayerBet | null {
    const p = this.balances[who];
    if (p.balance < p.currentStake) return null;
    const bet: PlayerBet = {
      id: makeId('sbet'),
      type: 'series',
      from,
      to: Math.max(from, to),
      side,
      stake: p.currentStake,
      odds,
      w1count: 0,
      w2count: 0,
      status: 'pending',
    };
    this.balances = {
      ...this.balances,
      [who]: { ...p, balance: p.balance - p.currentStake, bets: [...p.bets, bet] },
    };
    this.emit();
    return bet;
  }

  applyRoundResult(roundNum: number, winner: Side): void {
    const sides: Side[] = ['w1', 'w2'];
    const next: PlayerBalancesMap = { ...this.balances };
    for (const who of sides) {
      const p = next[who];
      let balance = p.balance;
      const bets = p.bets.map(b => {
        if (b.status !== 'pending') return b;

        // Раунд-ставка: закрывается только в свой раунд
        if (b.type === 'round') {
          if (b.round !== roundNum) return b;
          if (b.side === winner) {
            const payout = Math.round(b.stake * b.odds);
            balance += payout;
            return { ...b, status: 'won' as const, payout };
          }
          return { ...b, status: 'lost' as const };
        }

        // Серия: инкрементируем счёт пока внутри диапазона, закрываем когда дошли до `to`
        if (roundNum < b.from || roundNum > b.to) return b;
        const w1count = winner === 'w1' ? b.w1count + 1 : b.w1count;
        const w2count = winner === 'w2' ? b.w2count + 1 : b.w2count;
        if (roundNum < b.to) return { ...b, w1count, w2count };

        // Серия дошла до конца
        const sw = seriesWinner(w1count, w2count);
        if (sw === 'draw') {
          balance += b.stake;
          return { ...b, w1count, w2count, status: 'won' as const, payout: b.stake };
        }
        if (sw === b.side) {
          const payout = Math.round(b.stake * b.odds);
          balance += payout;
          return { ...b, w1count, w2count, status: 'won' as const, payout };
        }
        return { ...b, w1count, w2count, status: 'lost' as const };
      });
      next[who] = { ...p, balance, bets };
    }
    this.balances = next;
    this.emit();
  }

  private emit(): void {
    for (const l of this.listeners) l(this.balances);
  }
}
