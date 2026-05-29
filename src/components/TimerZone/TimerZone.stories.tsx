import type { Meta, StoryObj } from '@storybook/react';
import { TimerZone } from './TimerZone';
import { GameProvider } from '@/context/GameContext';
import { MockGameGateway } from '@/gateways/MockGameGateway';

const gateway = new MockGameGateway();

const meta: Meta<typeof TimerZone> = {
  title: 'Game/TimerZone',
  component: TimerZone,
  tags: ['autodocs'],
  decorators: [
    Story => (
      <GameProvider gateway={gateway}>
        <div style={{ padding: 24, background: '#0a0a0b' }}><Story /></div>
      </GameProvider>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof TimerZone>;

export const Default: Story = {};
