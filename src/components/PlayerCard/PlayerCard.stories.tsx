import type { Meta, StoryObj } from '@storybook/react';
import { PlayerCard } from './PlayerCard';
import { GameProvider } from '@/context/GameContext';
import { MockGameGateway } from '@/gateways/MockGameGateway';
import type { Phase, Side } from '@/types/game';

/**
 * Образец stories для команды:
 * - Один компонент, разные состояния через args + decorator.
 * - Provider даёт минимальный mock-gateway. Реальная игра не стартует — start() не зовём.
 */
const gateway = new MockGameGateway();

const meta: Meta<typeof PlayerCard> = {
  title: 'Game/PlayerCard',
  component: PlayerCard,
  tags: ['autodocs'],
  argTypes: {
    who: { control: 'radio', options: ['w1', 'w2'] satisfies Side[] },
  },
  decorators: [
    Story => (
      <GameProvider gateway={gateway}>
        <div style={{ width: 480, padding: 24, background: '#0a0a0b' }}>
          <Story />
        </div>
      </GameProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof PlayerCard>;

export const BlueCorner: Story = { args: { who: 'w1' } };
export const RedCorner: Story = { args: { who: 'w2' } };

// Phase override через тип-кост — для иллюстрации:
type _ = Phase; // в реальном проекте используем play-функции StoryBook для смены phase через gateway
