import { useEffect, useRef } from 'react';
import { useAudio } from '@/context/AudioContext';
import type { Side } from '@/types/game';

/**
 * Аудио-кроссфейд между двумя видео-стримами.
 * Активный стрим звучит на 1.0, неактивный — на 0.20.
 * Доминанта переключается каждые 3–10 секунд, если звук размучен.
 *
 * Возвращает рефы для двух video-элементов (нужно прикрепить вручную в StreamSlot).
 */
const DOMINANCE_MIN_MS = 3000;
const DOMINANCE_MAX_MS = 10_000;
const FADE_MS = 800;

export function useAudioCrossfade(): {
  videoRefW1: React.RefObject<HTMLVideoElement>;
  videoRefW2: React.RefObject<HTMLVideoElement>;
} {
  const { muted, dominant, setDominant } = useAudio();
  const videoRefW1 = useRef<HTMLVideoElement>(null);
  const videoRefW2 = useRef<HTMLVideoElement>(null);
  const dominantRef = useRef<Side>(dominant);
  dominantRef.current = dominant;

  // Mute/unmute оба видео при изменении audio-state
  useEffect(() => {
    const v1 = videoRefW1.current;
    const v2 = videoRefW2.current;
    if (!v1 || !v2) return;
    v1.muted = muted;
    v2.muted = muted;
    if (!muted) {
      v1.volume = dominant === 'w1' ? 1.0 : 0.2;
      v2.volume = dominant === 'w2' ? 1.0 : 0.2;
      v1.play().catch(() => undefined);
      v2.play().catch(() => undefined);
    }
  }, [muted, dominant]);

  // Циклическое переключение доминанты
  useEffect(() => {
    if (muted) return;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const cycle = (): void => {
      const next: Side = dominantRef.current === 'w1' ? 'w2' : 'w1';
      setDominant(next);
      fadeVolume(videoRefW1.current, next === 'w1' ? 1.0 : 0.2);
      fadeVolume(videoRefW2.current, next === 'w2' ? 1.0 : 0.2);
      timeoutId = setTimeout(
        cycle,
        DOMINANCE_MIN_MS + Math.random() * (DOMINANCE_MAX_MS - DOMINANCE_MIN_MS),
      );
    };
    timeoutId = setTimeout(cycle, DOMINANCE_MIN_MS);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [muted, setDominant]);

  return { videoRefW1, videoRefW2 };
}

function fadeVolume(video: HTMLVideoElement | null, target: number): void {
  if (!video) return;
  const start = video.volume;
  const t0 = performance.now();
  const step = (now: number): void => {
    const p = Math.min((now - t0) / FADE_MS, 1);
    try {
      video.volume = start + (target - start) * p;
    } catch {
      // SecurityError на iOS до user gesture — игнорируем
    }
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
