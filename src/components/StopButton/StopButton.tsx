import styles from './StopButton.module.css';

export interface StopButtonProps {
  onClick: () => void;
  disabled: boolean;
}

export function StopButton({ onClick, disabled }: StopButtonProps): JSX.Element {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={styles.btn}>
      СТОП
    </button>
  );
}
