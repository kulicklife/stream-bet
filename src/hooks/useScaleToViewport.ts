import { useEffect } from 'react';

/**
 * Масштабирует контейнер 1280×720 под viewport через transform: scale(...).
 * Возвращает ref, который нужно прикрепить к корневому div игры.
 *
 * Решает ту же задачу что scaleGame() в demo-v0.2.html, но через идиоматичный React.
 */
export function useScaleToViewport(ref: React.RefObject<HTMLDivElement>, canvasW = 1280, canvasH = 720): void {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const update = (): void => {
      const scale = Math.min(window.innerWidth / canvasW, window.innerHeight / canvasH);
      node.style.transform = `scale(${scale})`;
      node.style.marginLeft = `${(window.innerWidth - canvasW * scale) / 2}px`;
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [ref, canvasW, canvasH]);
}
