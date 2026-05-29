# Архитектура · stream-bet v0.2.2

## Слои

```
┌──────────────────────────────────────────────────────────┐
│  components/  ←  читают context-хуки, не знают про API   │
├──────────────────────────────────────────────────────────┤
│  context/     ←  оборачивают gateway, эмитят React-state │
├──────────────────────────────────────────────────────────┤
│  gateways/    ←  единственный мост к данным              │
│                  Mock* — в dev; WebSocket*/Api* — в prod │
├──────────────────────────────────────────────────────────┤
│  utils/       ←  чистые функции (odds, deck, series)     │
│  data/        ←  статические массивы (ники, фразы)       │
│  types/       ←  TS-контракт                             │
└──────────────────────────────────────────────────────────┘
```

**Правило зависимостей.** Стрелки идут только сверху вниз. Components зависят от Context; Context — от Gateways; Gateways — от Utils/Types. Обратные импорты (например Component → Gateway) запрещены — это сразу видно в diff и блокирует переезд на реальный API.

## Жизненный цикл одного раунда

```
        ┌─────────────────┐
   ┌──→ │   BETTING (20s)  │ ← ставки зрителей-ботов, ставки блогеров активны
   │    └────────┬────────┘
   │             ▼
   │    ┌─────────────────┐
   │    │   CARDS (10s)   │ ← раздача карт, кнопки СТОП у блогеров
   │    └────────┬────────┘
   │             ▼
   │    ┌─────────────────┐
   │    │   RESULT (10s)  │ ← KO-баннер, выплаты, applyRoundResult к ставкам блогеров
   │    └────────┬────────┘
   └─────────────┘  (если autoMode)
```

Полный цикл = 40 секунд. Управляется внутри `MockGameGateway` через `setInterval`/`setTimeout`. Все таймеры гарантированно чистятся в `stop()`, `reset()` и при переходе фаз — это решает баг накапливающихся таймеров из v0.2.1.

## State management

Три провайдера, у каждого один gateway:

- **GameContext** → `GameGateway`. Содержит: `state`, `config`, `actions`. Используется через хуки `useGameState()`, `useGameActions()`.
- **BetsContext** → `BetsGateway`. Содержит: `balances`, `actions`. Хуки: `useBalances()`, `useBalance(who)`.
- **AudioContext** → локальный `useState` (нет gateway, аудио живёт только в браузере).

Подписка идёт через `useSyncExternalStore` — каноничный путь React 18 для внешних источников. Это даёт корректное поведение при concurrent rendering и StrictMode (double-mount не ломает gateway).

## CSS Modules + дизайн-токены

Каждый компонент имеет свой `Component.module.css` — стили не текут наружу. Все цвета/шрифты/spacing берутся из CSS-переменных в `:root` (см. `styles/tokens.css`). Имена переменных **semantic** — `--color-side-w1` вместо `--color-blue`, поэтому смена темы (boxing → cyberpunk → night-classic) сводится к замене значений в одном файле `themes/<name>.css`.

Inline-стили запрещены за единственным исключением — динамическая ширина прогресс-бара таймера (`style={{ width: pct + '%' }}`). Везде остальное — через `className` с условиями.

## Тестовая пирамида

- **Vitest unit-тесты** (`src/**/*.test.ts`) — pure-функции и хуки. Текущее покрытие: `deck`, `odds`, `series`, `format`. Эти 4 файла — образец паттерна для команды; остальные хуки покрываются по нему же.
- **Storybook stories** (`*.stories.tsx`) — каждый компонент в изоляции с фейковым gateway. Сейчас 3 примера, расширяется по паттерну.
- **Playwright E2E** (`e2e/`) — happy-path: загрузка → ставка → полный цикл → проверка изменения баланса. На CI запускается через `npm run e2e` (поднимается preview-сервер автоматически).

## Анти-паттерны (НЕ делать)

- ❌ Звать `fetch` или новые WebSocket прямо из компонента — только через gateway.
- ❌ Хранить state игры в `useState` компонента, который этот state не порождает — для общего state используется Context.
- ❌ Inline-стили в компонентах кроме перечисленного выше исключения.
- ❌ Импорт цветовых hex-значений в JSX — только через CSS-переменные.
- ❌ Глобальный `window.gameGateway` или подобные синглтоны на window — gateway создаётся в `App.tsx` через `useMemo`, остальное — через Context.
- ❌ Использование `dangerouslySetInnerHTML` — единственное место сейчас в ChatPane для подсветки `<span class="amount">`. Когда чат переедет на реальный backend, эту подсветку нужно переделать через структурный JSON-формат сообщения.

## Переход на прод

1. **Реальный game-server.** Реализовать `WebSocketGameGateway implements GameGateway`. Подписаться на события `phase_changed`, `odds_updated`, `round_result`, `card_drawn`. В `App.tsx` поменять одну строку.
2. **Реальный bets-server.** Аналогично — `ApiBetsGateway implements BetsGateway`. Балансы и ставки блогеров — наша бухгалтерия.
3. **OperatorAdapter.** Создать для каждого оператора (1xBet, …) реализацию `OperatorAdapter`. Передавать в `OperatorPage` через prop. Сейчас это TODO — `OperatorPage` использует `XBetWrapper` без интеграции; виджет «ставка зрителя» внутри игры пока работает только с нашим MockBetsGateway.
4. **Видеостримы.** Заменить `<video src="/video/...mp4">` на HLS/RTMP-плеер (например `hls.js`). Контракт `StreamSlot` остаётся, меняется только внутренний рендер.
5. **Чат.** `useChat` сейчас генерирует фейк-сообщения локально. В проде — заменить на подписку на чат-сервер (Twitch IRC / собственный WS). Сигнатура хука остаётся.

## Структура файла компонента

Образец `PlayerBetCabinet/`:

```
PlayerBetCabinet/
├── PlayerBetCabinet.tsx           — JSX + локальное состояние UI
├── PlayerBetCabinet.module.css    — стили, классы по семантике
└── PlayerBetCabinet.stories.tsx   — (TODO) состояния для Storybook
```

Бизнес-логика — в context/gateway. Компонент только:
1. Читает state через хук (`useBalance(who)`).
2. Принимает callbacks через context-action (`actions.placeRoundBet`).
3. Рендерит JSX. Никаких `fetch`, `setInterval`, прямых DOM-операций.

## Что НЕ покрыто в v0.2.2

- Анимации появления чат-сообщений (в HTML-версии были `transition: opacity`). Сейчас сообщения появляются мгновенно — это легко добавить через `CSSTransition` или Framer Motion в `ChatPane`.
- Cityscape с силуэтом зрительного зала (был в HTML-версии). Сейчас в `GamePage.module.css` упрощённый радиальный градиент.
- iOS Safari-specific фикс для autoplay видео (was в `useAudioCrossfade`). Может потребоваться адаптация под целевые браузеры.
- A11y: ARIA-роли для динамических элементов (фаза игры, выплаты). Команда добавит при необходимости.
