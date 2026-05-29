/**
 * Серия раундов — продукт нашей PvP-механики.
 * Блогер ставит на исход некоторого диапазона раундов [from, to].
 * Победитель серии — тот, у кого больше побед в этом диапазоне.
 * При равенстве — ставка возвращается (push).
 */

/**
 * Коэффициент серии монотонно растёт с длиной диапазона:
 * базовый 1.85 + sqrt(n) * 0.65, округлённый до 2 знаков.
 *
 * Длина 1  ⇒ 2.50
 * Длина 5  ⇒ 3.30
 * Длина 10 ⇒ 3.91
 * Длина 45 ⇒ 6.21 (целый тайм)
 */
export function calcSeriesOdds(from: number, to: number): number {
  const n = Math.max(1, (to | 0) - (from | 0) + 1);
  return +(1.85 + Math.sqrt(n) * 0.65).toFixed(2);
}

/** Чей счёт больше: 'w1' | 'w2' | 'draw'. */
export function seriesWinner(w1count: number, w2count: number): 'w1' | 'w2' | 'draw' {
  if (w1count > w2count) return 'w1';
  if (w2count > w1count) return 'w2';
  return 'draw';
}
