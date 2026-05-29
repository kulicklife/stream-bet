import { useAudio } from '@/context/AudioContext';
import styles from './AudioToggle.module.css';

export function AudioToggle(): JSX.Element {
  const { muted, toggleMuted } = useAudio();
  return (
    <button
      type="button"
      onClick={toggleMuted}
      title={muted ? 'Включить звук' : 'Выключить звук'}
      className={`${styles.btn} ${!muted ? styles.active : ''}`}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
