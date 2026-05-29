import type { Meta, StoryObj } from '@storybook/react';
import { PlayingCard } from './PlayingCard';
import type { Card } from '@/types/game';

const ACE_OF_SPADES: Card = { rank: 'A', suit: '♠', value: 14 };
const KING_OF_HEARTS: Card = { rank: 'K', suit: '♥', value: 13 };

const meta: Meta<typeof PlayingCard> = {
  title: 'Game/PlayingCard',
  component: PlayingCard,
  tags: ['autodocs'],
  decorators: [Story => <div style={{ padding: 24, background: '#f0ead9' }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof PlayingCard>;

export const BlueAceShuffling: Story = { args: { who: 'w1', card: ACE_OF_SPADES, fixed: false } };
export const BlueAceFixed: Story = { args: { who: 'w1', card: ACE_OF_SPADES, fixed: true } };
export const RedKingFixed: Story = { args: { who: 'w2', card: KING_OF_HEARTS, fixed: true } };
export const Empty: Story = { args: { who: 'w1', card: null, fixed: false } };
