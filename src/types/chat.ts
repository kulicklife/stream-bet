import type { Side } from './game';

/**
 * Чат — симуляция зрительного зала для одной из сторон.
 * Реальная интеграция с чатом (Twitch / собственный WS) будет позже
 * через подмену useChat-хука или ChatGateway.
 */

export interface ChatMessage {
  id: string;
  /** Если null — системное сообщение центра (без ника, italic). */
  nick: string | null;
  /** За какую сторону "болеет" автор. Влияет на цвет ника. */
  team: Side | null;
  text: string;
  /** HH:MM, локализованное. */
  time: string;
  /** Спецоформление: подкрашенный фон, например при крупной ставке зрителя. */
  highlight?: boolean;
  /** Системное сообщение центра (раунд открыт, KO и т.п.). */
  system?: boolean;
}

/** Контекст для подбора фразы (зависит от фазы игры). */
export type ChatPhraseContext = 'generic' | 'betting' | 'cards' | 'result';
