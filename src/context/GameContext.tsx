import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import type { GameGateway } from '@/gateways/GameGateway';
import type { GameConfig, GameState, RoundResult, Side } from '@/types/game';

/**
 * GameContext — обёртка над GameGateway.
 * Компоненты подписываются на state через хуки, а не напрямую на gateway.
 */
interface GameContextValue {
  state: GameState;
  config: GameConfig;
  actions: {
    start: () => void;
    pause: () => void;
    reset: () => void;
    fixCard: (side: Side) => void;
    updateConfig: (patch: Partial<GameConfig>) => void;
    onRoundResult: (listener: (r: RoundResult) => void) => () => void;
  };
}

const GameCtx = createContext<GameContextValue | null>(null);

export interface GameProviderProps {
  gateway: GameGateway;
  children: ReactNode;
}

export function GameProvider({ gateway, children }: GameProviderProps): JSX.Element {
  // useSyncExternalStore — каноничный способ подписки React 18 на внешний source.
  const state = useSyncExternalStore(
    cb => gateway.subscribe(cb),
    () => gateway.getState(),
    () => gateway.getState(),
  );

  // Старт игры один раз при mount.
  useEffect(() => {
    gateway.start();
    return () => gateway.stop();
  }, [gateway]);

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      config: gateway.getConfig(),
      actions: {
        start: () => gateway.start(),
        pause: () => gateway.setPaused(!gateway.getState().paused),
        reset: () => gateway.reset(),
        fixCard: (side: Side) => gateway.fixCard(side),
        updateConfig: patch => gateway.updateConfig(patch),
        onRoundResult: listener => gateway.onRoundResult(listener),
      },
    }),
    [state, gateway],
  );

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

/** Доступ к полному GameContext. Используется в редких компонентах (AdminPanel). */
export function useGameContext(): GameContextValue {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error('useGameContext должен вызываться внутри <GameProvider>');
  return ctx;
}

/** Большинство компонентов хотят только state — этим хуком они и обходятся. */
export function useGameState(): GameState {
  return useGameContext().state;
}

/** Удобный хук для действий без подписки на state. */
export function useGameActions(): GameContextValue['actions'] {
  return useGameContext().actions;
}
