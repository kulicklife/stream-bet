import type { Side } from '@/types/game';

/**
 * "Tale of the tape" — спортивная статистика стримера для постерной карточки.
 * Формат заимствован из боксёрской трансляции: запись побед / страна / весовая категория.
 * В проде будет приходить из BetsGateway/StreamerGateway.
 */
export const TALE_OF_TAPE: Record<Side, string> = {
  w1: '25-3-0 · США · ТЯЖ. ВЕС',
  w2: '22-5-1 · ВЛБ · ТЯЖ. ВЕС',
};
