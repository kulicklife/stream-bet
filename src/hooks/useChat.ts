import { useEffect, useRef, useState } from 'react';
import type { Side } from '@/types/game';
import type { ChatMessage, ChatPhraseContext } from '@/types/chat';
import { CHAT_NICKS } from '@/data/nicks';
import { CHAT_PHRASES } from '@/data/phrases';
import { formatChatTime, makeId } from '@/utils/format';

/**
 * Симуляция чата зрительного зала для одной стороны.
 * Лента — до MAX_MESSAGES сообщений в DOM.
 *
 * Реальная интеграция с Twitch/YouTube chat будет через отдельный ChatGateway —
 * этот хук станет тоньше (только подписка).
 */
const MAX_MESSAGES = 8;
const PUMP_MIN_MS = 1200;
const PUMP_MAX_MS = 2700;

function pickPhrase(ctx: ChatPhraseContext): string {
  const bank = CHAT_PHRASES[ctx] ?? CHAT_PHRASES.generic;
  return bank[Math.floor(Math.random() * bank.length)] ?? 'go!';
}

function pickNick(): string {
  return CHAT_NICKS[Math.floor(Math.random() * CHAT_NICKS.length)] ?? 'guest';
}

function makeSimMessage(side: Side, ctx: ChatPhraseContext): ChatMessage {
  // 65% — болеет за свою сторону, 35% — за противоположную
  const team: Side = Math.random() < 0.65 ? side : side === 'w1' ? 'w2' : 'w1';
  return {
    id: makeId('msg'),
    nick: pickNick(),
    team,
    text: pickPhrase(ctx),
    time: formatChatTime(),
  };
}

interface UseChatOptions {
  /** Какой стороне принадлежит чат (для team-bias симуляции). */
  side: Side;
  /** Контекст игры → влияет на банк фраз. */
  context: ChatPhraseContext;
  /** Подавить симуляцию (например в Storybook). */
  paused?: boolean;
}

interface UseChatApi {
  messages: ChatMessage[];
  /** Внешнее добавление сообщения (системное / highlight / ставка зрителя). */
  push: (msg: Omit<ChatMessage, 'id' | 'time'> & { time?: string }) => void;
}

export function useChat({ side, context, paused = false }: UseChatOptions): UseChatApi {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Контекст в ref, чтобы рекурсивный setTimeout читал свежий контекст без перезапуска цикла
  const contextRef = useRef(context);
  contextRef.current = context;

  // Самопополняющаяся симуляция
  useEffect(() => {
    if (paused) return;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const tick = (): void => {
      if (cancelled) return;
      setMessages(prev => appendCapped(prev, makeSimMessage(side, contextRef.current)));
      timeoutId = setTimeout(tick, PUMP_MIN_MS + Math.random() * (PUMP_MAX_MS - PUMP_MIN_MS));
    };
    tick();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [side, paused]);

  const push: UseChatApi['push'] = msg => {
    const full: ChatMessage = {
      id: makeId('msg'),
      time: msg.time ?? formatChatTime(),
      ...msg,
    };
    setMessages(prev => appendCapped(prev, full));
  };

  return { messages, push };
}

function appendCapped(prev: ChatMessage[], next: ChatMessage): ChatMessage[] {
  const out = [...prev, next];
  if (out.length > MAX_MESSAGES) out.shift();
  return out;
}
