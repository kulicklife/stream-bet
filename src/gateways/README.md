# Gateways — изоляция данных от UI

Gateways — единственный мостик между UI-компонентами и источником данных.

## Зачем

Без gateways компонент `<BetsPanel>` напрямую звал бы `fetch('/api/bets')` или держал бы state в useState. И то и другое плохо: интеграция течёт по всему дереву, тесты требуют mock'ать сеть, при подмене API нужно править десятки компонентов.

С gateways — компонент знает только про интерфейс. Реализацию подменяет `App.tsx` (или `main.tsx`) через React Context.

## Три gateway

| Gateway | Что хранит | Кто владеет |
|---|---|---|
| `GameGateway` | Состояние игры: фаза, раунд, odds, карты, итог | Наш бэк (в проде); MockGameGateway в dev |
| `BetsGateway` | Балансы и ставки двух блогеров (NOVA / VIPER) | Наш бэк; MockBetsGateway в dev |
| `OperatorAdapter` (TODO) | Ставки зрителей оператора 1xBet | Сторонний бэк оператора |

## Как подменить Mock на реальный API

1. Создать новый файл `WebSocketGameGateway.ts`, реализовать тот же интерфейс `GameGateway`.
2. Внутри `subscribe` подписаться на ws-events: `phase_changed`, `odds_updated`, `round_result`.
3. В `App.tsx` (или в провайдере) поменять одну строку:
   ```ts
   const gateway = new WebSocketGameGateway('wss://game.example.com');
   // вместо:
   const gateway = new MockGameGateway();
   ```
4. Компоненты не изменятся.

## OperatorAdapter — что это

UI-виджет «ставка зрителя» (внутри `OperatorPage` под 1xBet-шапкой) показывает кнопки `[$10] [$50] [$100]` и плашки `СИНИЙ ×1.85` / `КРАСНЫЙ ×2.10`. При клике этот виджет НЕ списывает деньги напрямую — он зовёт `operatorAdapter.placeBet({ amount, side, round })`. Реализация `OperatorAdapter` для каждого оператора (1xBet, другие) — отдельный пакет. В демо это no-op stub.

## Контракт для интеграции

При замене Mock на прод-реализацию **обязательно**:
- Метод `subscribe` идемпотентен (повторный вызов с тем же listener не плодит подписок).
- Возврат `unsubscribe` должен реально отключать listener (используется в useEffect cleanup).
- `start()` идемпотентен — повторный вызов в IDLE/RESULT возобновляет цикл, в BETTING/CARDS — no-op.
- `stop()` чистит все таймеры/ws-соединения. После `stop()` можно вызвать `start()` снова.

## Unit-тесты

`MockGameGateway` — кандидат на интеграционный тест (fake timers + проверка переходов фаз). См. `src/utils/*.test.ts` — пример паттерна. Тест на gateway не реализован в этом коммите, добавится при наполнении.
