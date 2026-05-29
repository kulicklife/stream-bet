import type { GameConfig, GameState, RoundResult, Side } from '@/types/game';
import { createDealer } from '@/utils/deck';
import { calcPayout, recalcOdds, DEFAULT_ODDS } from '@/utils/odds';
import type { GameGateway } from './GameGateway';

/** Дефолтный конфиг — тот же что в v0.2.x. */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  betDuration: 20,
  cardDuration: 10,
  resultDuration: 10,
  playerCount: 100,
  avgBet: 25,
  w1Skew: 50,
  streamer1: 'NOVA',
  streamer2: 'VIPER',
  autoMode: true,
  forceWinner: null,
};

/** Начальное состояние. */
const INITIAL_STATE: GameState = {
  phase: 'IDLE',
  roundNum: 0,
  timer: 0,
  timerTotal: 0,
  paused: false,
  oddsW1: DEFAULT_ODDS,
  oddsW2: DEFAULT_ODDS,
  poolW1: 0,
  poolW2: 0,
  totalPool: 0,
  betCount: 0,
  history: [],
  cardW1: null,
  cardW2: null,
  fixedW1: false,
  fixedW2: false,
  winner: null,
  payoutMultiplier: 0,
  totalPayout: 0,
  w1Wins: 0,
  w2Wins: 0,
  w1Losses: 0,
  w2Losses: 0,
  totalWonToday: 0,
};

/**
 * Клиентская симуляция игры — портирована из demo-v0.2.html.
 * Все setTimeout/setInterval управляются изнутри gateway и гарантированно
 * чистятся при stop()/reset().
 */
export class MockGameGateway implements GameGateway {
  private config: GameConfig = { ...DEFAULT_GAME_CONFIG };
  private state: GameState = { ...INITIAL_STATE };
  private listeners = new Set<(s: GameState) => void>();
  private resultListeners = new Set<(r: RoundResult) => void>();

  private dealer1 = createDealer();
  private dealer2 = createDealer();

  private timerId: ReturnType<typeof setInterval> | null = null;
  private burstId: ReturnType<typeof setTimeout> | null = null;
  private shuffleId: ReturnType<typeof setInterval> | null = null;
  private resultId: ReturnType<typeof setInterval> | null = null;

  // ── Публичный API ──────────────────────────────────────
  getState(): GameState {
    return this.state;
  }
  getConfig(): GameConfig {
    return this.config;
  }
  subscribe(listener: (s: GameState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  onRoundResult(listener: (r: RoundResult) => void): () => void {
    this.resultListeners.add(listener);
    return () => this.resultListeners.delete(listener);
  }

  start(): void {
    if (this.state.phase !== 'IDLE' && this.state.phase !== 'RESULT') return;
    this.startBettingPhase();
  }
  stop(): void {
    this.clearAllTimers();
  }
  setPaused(paused: boolean): void {
    this.state = { ...this.state, paused };
    this.emit();
  }
  reset(): void {
    this.clearAllTimers();
    this.state = { ...INITIAL_STATE };
    this.emit();
  }
  updateConfig(patch: Partial<GameConfig>): void {
    this.config = { ...this.config, ...patch };
  }
  fixCard(side: Side): void {
    if (this.state.phase !== 'CARDS') return;
    if (side === 'w1' && !this.state.fixedW1) {
      this.state = { ...this.state, fixedW1: true };
    }
    if (side === 'w2' && !this.state.fixedW2) {
      this.state = { ...this.state, fixedW2: true };
    }
    this.emit();
    if (this.state.fixedW1 && this.state.fixedW2) {
      setTimeout(() => this.revealResult(), 400);
    }
  }

  // ── Внутренняя машина состояний ────────────────────────
  private startBettingPhase(): void {
    this.clearAllTimers();
    this.dealer1.reset();
    this.dealer2.reset();

    this.state = {
      ...INITIAL_STATE,
      // Сохраняем агрегаты сессии
      roundNum: this.state.roundNum + 1,
      history: this.state.history,
      w1Wins: this.state.w1Wins,
      w2Wins: this.state.w2Wins,
      w1Losses: this.state.w1Losses,
      w2Losses: this.state.w2Losses,
      totalWonToday: this.state.totalWonToday,
      phase: 'BETTING',
      timer: this.config.betDuration,
      timerTotal: this.config.betDuration,
    };
    // Случайный сдвиг ботов в этом раунде, чтобы пулы и odds жили
    this.config = { ...this.config, w1Skew: 25 + Math.random() * 50 };
    this.emit();

    this.scheduleBurst();
    this.timerId = setInterval(() => {
      if (this.state.paused) return;
      const t = this.state.timer - 1;
      this.state = { ...this.state, timer: t };
      this.emit();
      if (t <= 0) this.startCardPhase();
    }, 1000);
  }

  private scheduleBurst(): void {
    if (this.state.phase !== 'BETTING') return;
    this.burstId = setTimeout(() => {
      if (this.state.phase !== 'BETTING') return;
      const burstSize = 8 + Math.floor(Math.random() * 8);
      for (let i = 0; i < burstSize; i++) this.simulateBet();
      this.scheduleBurst();
    }, 600 + Math.random() * 600);
  }

  private simulateBet(): void {
    if (this.state.phase !== 'BETTING') return;
    const side: Side = Math.random() * 100 < this.config.w1Skew ? 'w1' : 'w2';
    const variance = this.config.avgBet * 0.6;
    const amount = Math.round(
      Math.max(5, this.config.avgBet + (Math.random() - 0.5) * 2 * variance),
    );
    const poolW1 = side === 'w1' ? this.state.poolW1 + amount : this.state.poolW1;
    const poolW2 = side === 'w2' ? this.state.poolW2 + amount : this.state.poolW2;
    const { oddsW1, oddsW2 } = recalcOdds(poolW1, poolW2);
    this.state = {
      ...this.state,
      poolW1,
      poolW2,
      totalPool: poolW1 + poolW2,
      betCount: this.state.betCount + 1,
      oddsW1,
      oddsW2,
    };
    this.emit();
  }

  private startCardPhase(): void {
    this.clearAllTimers();
    this.state = {
      ...this.state,
      phase: 'CARDS',
      timer: this.config.cardDuration,
      timerTotal: this.config.cardDuration,
      fixedW1: false,
      fixedW2: false,
    };
    this.emit();

    this.shuffleId = setInterval(() => {
      if (!this.state.fixedW1 || !this.state.fixedW2) {
        this.state = {
          ...this.state,
          cardW1: this.state.fixedW1 ? this.state.cardW1 : this.dealer1.next(),
          cardW2: this.state.fixedW2 ? this.state.cardW2 : this.dealer2.next(),
        };
        this.emit();
      }
    }, 100);

    this.timerId = setInterval(() => {
      if (this.state.paused) return;
      const t = this.state.timer - 1;
      this.state = { ...this.state, timer: t };
      this.emit();
      if (t <= 0) this.revealResult();
    }, 1000);
  }

  private revealResult(): void {
    this.clearAllTimers();
    let cardW1 = this.state.cardW1 ?? this.dealer1.next();
    let cardW2 = this.state.cardW2 ?? this.dealer2.next();

    // Ничья по карте — переразаём (упрощённо: тянем заново до неравных)
    while (cardW1.value === cardW2.value) {
      cardW1 = this.dealer1.next();
      cardW2 = this.dealer2.next();
    }

    const winner: Side =
      this.config.forceWinner ?? (cardW1.value > cardW2.value ? 'w1' : 'w2');
    const { multiplier, totalPayout } = calcPayout(winner, this.state.poolW1, this.state.poolW2);

    this.state = {
      ...this.state,
      phase: 'RESULT',
      cardW1,
      cardW2,
      winner,
      payoutMultiplier: multiplier,
      totalPayout,
      history: [winner, ...this.state.history].slice(0, 10),
      w1Wins: winner === 'w1' ? this.state.w1Wins + 1 : this.state.w1Wins,
      w2Wins: winner === 'w2' ? this.state.w2Wins + 1 : this.state.w2Wins,
      w1Losses: winner === 'w2' ? this.state.w1Losses + 1 : this.state.w1Losses,
      w2Losses: winner === 'w1' ? this.state.w2Losses + 1 : this.state.w2Losses,
      totalWonToday: this.state.totalWonToday + totalPayout,
      timer: this.config.resultDuration,
      timerTotal: this.config.resultDuration,
    };
    this.emit();
    this.fireResult({
      roundNum: this.state.roundNum,
      winner,
      cardW1,
      cardW2,
      payoutMultiplier: multiplier,
      totalPayout,
      totalPool: this.state.totalPool,
      betCount: this.state.betCount,
    });

    // Countdown до следующего раунда (если автомат)
    this.resultId = setInterval(() => {
      if (this.state.paused) return;
      const t = this.state.timer - 1;
      this.state = { ...this.state, timer: t };
      this.emit();
      if (t <= 0) {
        if (this.resultId) clearInterval(this.resultId);
        this.resultId = null;
        if (this.config.autoMode) this.startBettingPhase();
      }
    }, 1000);
  }

  private clearAllTimers(): void {
    if (this.timerId) clearInterval(this.timerId);
    if (this.burstId) clearTimeout(this.burstId);
    if (this.shuffleId) clearInterval(this.shuffleId);
    if (this.resultId) clearInterval(this.resultId);
    this.timerId = this.shuffleId = this.resultId = null;
    this.burstId = null;
  }

  private emit(): void {
    for (const l of this.listeners) l(this.state);
  }
  private fireResult(r: RoundResult): void {
    for (const l of this.resultListeners) l(r);
  }
}
