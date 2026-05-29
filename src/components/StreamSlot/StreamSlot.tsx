import { useAudioCrossfade } from '@/hooks/useAudioCrossfade';
import { useAudio } from '@/context/AudioContext';
import type { Side } from '@/types/game';
import styles from './StreamSlot.module.css';

export interface StreamSlotProps {
  who: Side;
}

/**
 * Видео-слот одного стримера.
 * AudioCrossfade-хук создаёт два рефа на оба видео; здесь — кладём свой.
 * (В проде вместо одного хука лучше отдельный AudioController, но для демо хватает.)
 */
export function StreamSlot({ who }: StreamSlotProps): JSX.Element {
  const { videoRefW1, videoRefW2 } = useAudioCrossfade();
  const { dominant } = useAudio();
  const isActive = dominant === who;
  const cornerLabel = who === 'w1' ? 'СИНИЙ УГОЛ' : 'КРАСНЫЙ УГОЛ';

  return (
    <div className={`${styles.slot} ${styles[who]} ${isActive ? styles.active : ''}`}>
      <div className={styles.cornerLabel}>{cornerLabel}</div>
      <video
        ref={who === 'w1' ? videoRefW1 : videoRefW2}
        src={`/video/stream-${who === 'w1' ? '1' : '2'}.mp4`}
        autoPlay
        loop
        muted
        playsInline
      />
    </div>
  );
}
