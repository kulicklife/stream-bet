import { useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MockGameGateway } from '@/gateways/MockGameGateway';
import { MockBetsGateway } from '@/gateways/MockBetsGateway';
import { GameProvider } from '@/context/GameContext';
import { BetsProvider } from '@/context/BetsContext';
import { AudioProvider } from '@/context/AudioContext';
import { GamePage } from '@/routes/GamePage';
import { OperatorPage } from '@/routes/OperatorPage';

/**
 * App — корневой компонент.
 * Создаёт gateways (синглтоны на жизнь приложения) и оборачивает дерево провайдерами.
 *
 * Для прода: подмени MockGameGateway → WebSocketGameGateway,
 * MockBetsGateway → ApiBetsGateway. Дерево компонентов не изменится.
 */
export function App(): JSX.Element {
  const gameGateway = useMemo(() => new MockGameGateway(), []);
  const betsGateway = useMemo(() => new MockBetsGateway(), []);

  return (
    <GameProvider gateway={gameGateway}>
      <BetsProvider gateway={betsGateway}>
        <AudioProvider>
          <Routes>
            <Route path="/" element={<GamePage />} />
            <Route path="/operator" element={<OperatorPage />} />
          </Routes>
        </AudioProvider>
      </BetsProvider>
    </GameProvider>
  );
}
