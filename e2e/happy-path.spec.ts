import { test, expect, type Page } from '@playwright/test';

/**
 * Happy-path: открыть страницу, пройти полный цикл BETTING → CARDS → RESULT.
 * Между фазами могут быть длинные таймеры — используем большие timeout'ы.
 *
 * Сценарий:
 *   1. Открываем /
 *   2. Видим обе карточки бойцов (NOVA, VIPER) и таймер
 *   3. В кабинете блогера w1 делаем ставку $50 на СИН (синего угла) в текущем раунде
 *   4. Ждём перехода в фазу CARDS (фразовая метка меняется)
 *   5. Ждём перехода в RESULT (KO-баннер виден)
 *   6. После RESULT баланс блогера w1 либо вырос (выиграл) либо уменьшился на 50 (проиграл),
 *      но точно не остался 1000 (ставка была размещена).
 */

const SECOND = 1000;
const fullCycleTimeout = 60 * SECOND;

test.describe('Stream-Bet · happy path', () => {
  test('цикл BETTING → CARDS → RESULT с ставкой блогера', async ({ page }) => {
    test.setTimeout(fullCycleTimeout * 2);
    await page.goto('/');

    await expect(page.getByText('NOVA').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('VIPER').first()).toBeVisible();

    // Стартовое состояние — фаза BETTING с расписанием/кабинетами
    await expect(page.getByText('ПРИЁМ СТАВОК', { exact: false })).toBeVisible({
      timeout: 10_000,
    });

    // Ставка $50 (preset активен по умолчанию) на СИНЕГО за блогера w1
    // В колонке w1 кнопка СИН — ищем по тексту и кликаем
    const blueBet = page.locator('button:has-text("СИН")').first();
    await blueBet.click();

    // Баланс должен уменьшиться с 1000 до 950
    await expect(page.getByText('$950', { exact: false }).first()).toBeVisible({
      timeout: 5 * SECOND,
    });

    // Дожидаемся фазы CARDS — лейбл сменится на "БОЙ ИДЁТ"
    await waitForPhase(page, 'БОЙ ИДЁТ', 40 * SECOND);

    // Дожидаемся RESULT (KO-баннер)
    await expect(page.getByText('КО!', { exact: true })).toBeVisible({ timeout: 30 * SECOND });

    // После RESULT баланс w1 ≠ исходных 1000 (ставка либо выиграла, либо проиграла)
    const balance = await readBalance(page, 'NOVA');
    expect(balance).not.toBe(1000);
  });
});

async function waitForPhase(page: Page, label: string, timeout: number): Promise<void> {
  await expect(
    page.locator(`text=${label}`).first(),
  ).toBeVisible({ timeout });
}

/** Считывает балансовое число из колонки указанного блогера. */
async function readBalance(page: Page, who: 'NOVA' | 'VIPER'): Promise<number> {
  const row = page.locator(`text=${who}`).first();
  const col = row.locator('xpath=ancestor::*[contains(@class, "col")][1]');
  const valueText = await col.locator('[data-balance]').first().textContent();
  if (!valueText) return NaN;
  // "$1 234" → 1234
  return parseInt(valueText.replace(/[^0-9]/g, ''), 10);
}
