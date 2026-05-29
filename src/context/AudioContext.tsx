import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Side } from '@/types/game';

interface AudioContextValue {
  /** Заглушён ли звук пользователем (стартует true — autoplay-политика браузеров). */
  muted: boolean;
  /** Какой стрим сейчас "доминирует" (громче в кроссфейде). */
  dominant: Side;
  toggleMuted: () => void;
  setDominant: (side: Side) => void;
}

const AudioCtx = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }): JSX.Element {
  const [muted, setMuted] = useState(true);
  const [dominant, setDominantState] = useState<Side>('w1');

  const toggleMuted = useCallback(() => setMuted(prev => !prev), []);
  const setDominant = useCallback((side: Side) => setDominantState(side), []);

  const value = useMemo(
    () => ({ muted, dominant, toggleMuted, setDominant }),
    [muted, dominant, toggleMuted, setDominant],
  );

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}

export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error('useAudio должен вызываться внутри <AudioProvider>');
  return ctx;
}
