# stream-bet · v0.2.2

PvP-стрим-казино: игра между двумя ведущими-блогерами в режиме live с pari-mutuel ставками. Этот пакет — продакшн-ready handoff для frontend-команды.

**Что это рефакторинг чего?** В `../demo-v0.2.1.html` лежит точка отсчёта — один HTML-файл с inline CSS+JS (~2000 строк). Этот проект — тот же UX, разнесённый по слоям: TypeScript, React 18, CSS Modules, Vite, Vitest, Storybook, Playwright.

## Быстрый старт

```bash
npm install
npm run dev            # http://localhost:5173
```

Открывает главную страницу `/` — чистая игра.
Откройте `/operator` для версии внутри обёртки 1xBet.

## Скрипты

| Команда | Что делает |
|---|---|
| `npm run dev` | Vite dev-server с HMR |
| `npm run build` | TypeScript-check + сборка в `dist/` |
| `npm run preview` | Локальный сервер `dist/` (для финальной проверки) |
| `npm run test` | Vitest в watch-режиме |
| `npm run test:run` | Vitest one-shot (для CI) |
| `npm run test:coverage` | Отчёт покрытия в `coverage/` |
| `npm run e2e` | Playwright E2E (сам поднимает preview) |
| `npm run storybook` | Storybook на :6006 |
| `npm run storybook:build` | Статический Storybook в `storybook-static/` |
| `npm run typecheck` | Только TS-проверка без сборки |
| `npm run lint` | ESLint по `src/` |

## Структура

```
demo-v0.2.2/
├── public/                  ← статика: video/, assets/
├── src/
│   ├── main.tsx             ← entry-point, BrowserRouter
│   ├── components/          ← 18 компонентов, каждый в своей папке
│   │   └── <Name>/
│   │       ├── <Name>.tsx
│   │       ├── <Name>.module.css
│   │       └── <Name>.stories.tsx
│   ├── routes/              ← GamePage (/), OperatorPage (/operator)
│   ├── context/             ← Game / Bets / Audio Provider
│   ├── gateways/            ← интерфейсы + Mock-реализации
│   ├── hooks/               ← useGameLoop, useChat, useAudioCrossfade, useScaleToViewport
│   ├── utils/               ← pure-функции с unit-тестами рядом
│   ├── data/                ← статические массивы (фразы, ники, tale-of-tape)
│   ├── types/               ← TS-контракт (game, bets, chat)
│   ├── styles/              ← tokens.css + themes/<name>.css + reset.css
│   └── test/setup.ts        ← jsdom + jest-dom matchers
├── e2e/                     ← Playwright happy-path
├── .storybook/              ← конфиг Storybook
├── ARCHITECTURE.md          ← как устроено (читать ВТОРЫМ после этого README)
└── docs/                    ← (опц.) ADR-документы
```

## Где что искать при первой задаче

| Что нужно сделать | Куда смотреть |
|---|---|
| Поправить визуал карточки бойца | `src/components/PlayerCard/PlayerCard.module.css` |
| Поменять размеры предлагаемых ставок | `src/types/bets.ts` → `STAKE_PRESETS` |
| Поменять коэффициенты pari-mutuel | `src/utils/odds.ts` — формула с тестами |
| Добавить новую фазу в игру | `src/types/game.ts` (Phase) + `src/gateways/MockGameGateway.ts` |
| Подключиться к реальному WebSocket | Создать `src/gateways/WebSocketGameGateway.ts` (см. `gateways/README.md`) |
| Добавить новый скин (cyberpunk/night) | Скопировать `styles/themes/boxing-bout.css` → `<name>.css`, поменять значения, импортировать в `main.tsx`, переключить `data-theme` на `<html>` |
| Заменить mock-чат на Twitch | Заменить `src/hooks/useChat.ts` — сигнатура остаётся, источник меняется |
| Добавить stories для компонента | См. `src/components/PlayerCard/PlayerCard.stories.tsx` как образец |

## Главное про данные

Три владельца данных:

1. **GameGateway** — раунд, фаза, odds, карты, результат. Общее состояние всех зрителей. В проде — WebSocket к нашему бэку.
2. **BetsGateway** — балансы блогеров (NOVA / VIPER) и их ставки. Наша бухгалтерия PvP-механики.
3. **OperatorAdapter** (TODO) — ставки зрителей оператора (1xBet и др.). НЕ наши, уходят через адаптер.

UI-компоненты ходят за данными только через эти три интерфейса. Подмена Mock → Production делается в одном файле — `App.tsx`. См. подробности в `ARCHITECTURE.md` и `src/gateways/README.md`.

## Чек-лист перед мержем PR

- [ ] `npm run typecheck` — нет ошибок
- [ ] `npm run test:run` — все unit-тесты зелёные
- [ ] `npm run e2e` — happy-path проходит
- [ ] Если правил компонент: открыл в Storybook и убедился что хотя бы default-story рендерится
- [ ] Если добавил inline-стиль — есть комментарий почему (см. ARCHITECTURE → анти-паттерны)
- [ ] Если добавил `fetch`/`WebSocket` напрямую — переехал в gateway
- [ ] `.env`/секреты не закоммичены (защищено `.gitignore`)

## Что ещё стоит сделать (известные TODO)

- **Анимации появления чат-сообщений** — сейчас сообщения возникают мгновенно. Добавить `CSSTransition` или `framer-motion` в `ChatPane.tsx`.
- **Cityscape с силуэтом зрительного зала** — в HTML-версии был SVG-силуэт publika. Сейчас в `GamePage.module.css` упрощённый градиент.
- **A11y** — добавить ARIA-роли для фазы игры (`role="status"`) и плашек выплат.
- **i18n** — все строки сейчас русские inline. При необходимости — вынести в `src/i18n/` через `react-intl` или `i18next`.
- **OperatorAdapter** — реальная интеграция со ставками зрителей 1xBet.
- **WebSocketGameGateway** — продакшн-реализация GameGateway вместо MockGameGateway.

## Контакт

Эта точка отсчёта — рефакторинг рабочего HTML-демо `demo-v0.2.1.html`. Если в новой реализации поведение отличается — это, скорее всего, баг рефакторинга, а не намеренное изменение. Сравнивай с HTML-версией; она лежит в корне репозитория.
