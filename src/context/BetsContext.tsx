import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import type { BetsGateway } from '@/gateways/BetsGateway';
import type { PlayerBalance, PlayerBalancesMap, StakePreset } from '@/types/bets';
import type { Side } from '@/types/game';

interface BetsContextValue {
  balances: PlayerBalancesMap;
  actions: {
    setStake: (who: Side, stake: StakePreset) => void;
    placeRoundBet: (who: Side, side: Side, round: number, odds: number) => void;
    placeSeriesBet: (who: Side, side: Side, from: number, to: number, odds: number) => void;
  };
}

const BetsCtx = createContext<BetsContextValue | null>(null);

export interface BetsProviderProps {
  gateway: BetsGateway;
  children: ReactNode;
}

export function BetsProvider({ gateway, children }: BetsProviderProps): JSX.Element {
  const balances = useSyncExternalStore(
    cb => gateway.subscribe(cb),
    () => gateway.getBalances(),
    () => gateway.getBalances(),
  );

  const value = useMemo<BetsContextValue>(
    () => ({
      balances,
      actions: {
        setStake: (who, stake) => gateway.setCurrentStake(who, stake),
        placeRoundBet: (who, side, round, odds) => {
          gateway.placeRoundBet(who, side, round, odds);
        },
        placeSeriesBet: (who, side, from, to, odds) => {
          gateway.placeSeriesBet(who, side, from, to, odds);
        },
      },
    }),
    [balances, gateway],
  );

  return <BetsCtx.Provider value={value}>{children}</BetsCtx.Provider>;
}

export function useBetsContext(): BetsContextValue {
  const ctx = useContext(BetsCtx);
  if (!ctx) throw new Error('useBetsContext должен вызываться внутри <BetsProvider>');
  return ctx;
}

/** Балансы обоих блогеров. */
export function useBalances(): PlayerBalancesMap {
  return useBetsContext().balances;
}

/** Баланс одного блогера. */
export function useBalance(who: Side): PlayerBalance {
  return useBetsContext().balances[who];
}
