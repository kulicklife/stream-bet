/** Денежный формат с валютным знаком: $1 234. */
export function formatMoney(amount: number, currency: '$' | '₽' = '$'): string {
  return `${currency}${Math.round(amount).toLocaleString('ru-RU')}`;
}

/** Коэффициент: всегда 2 знака после точки (1.85, 10.00). */
export function formatOdds(odds: number): string {
  return odds.toFixed(2);
}

/** HH:MM локальное. Используется в чате. */
export function formatChatTime(now: Date = new Date()): string {
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** Простой не-криптографический ID (UUID-замена) для ключей коллекций в state. */
export function makeId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
