/**
 * Инвариант-тесты генератора: 100 seed x 54 раунда.
 * Запуск: npx tsx sim/winners-feed-generator.test.ts
 */
import { createSimulation, type Side } from './winners-feed-generator';

let failures = 0;
function check(cond: boolean, msg: string) {
  if (!cond) { failures++; console.error('FAIL:', msg); }
}

const SEEDS = 100, ROUNDS = 54;
let roundish = 0, totalW = 0;

for (let s = 0; s < SEEDS; s++) {
  const sim = createSimulation({ sessionId: 'qa-' + s, date: '2026-06-11', seed: 1000 + s });
  const histRng = (i: number) => ((s * 31 + i * 7) % 2 === 0 ? 'w1' : 'w2') as Side;
  let kassaCheck = 0;
  let prevBetCounts: number[] = [];

  for (let r = 1; r <= ROUNDS; r++) {
    const voided = r === 17 && s % 10 === 0;     // иногда проверяем void
    const out = sim.generateRound({ round: r, winner: histRng(r), voided });
    const { activity, winners, kassaToday } = out;
    kassaCheck = Math.round((kassaCheck + activity.bank) * 100) / 100;

    check(activity.betCount >= 3, `seed ${s} r${r}: betCount < 3`);
    check(kassaToday === kassaCheck, `seed ${s} r${r}: касса != сумме банков (${kassaToday} vs ${kassaCheck})`);

    if (voided) { check(winners.length === 0, `seed ${s} r${r}: победители в void-раунде`); continue; }

    check(winners.length >= 2 && winners.length <= 13, `seed ${s} r${r}: winners=${winners.length}`);
    // короткие маркеты (РАУНД/ФОРА) обязаны помещаться в банк раунда;
    // длинные (СЕРИЯ/ТОТАЛ/ЭКСПРЕСС) - ставки прошлых раундов, банк не ограничивает
    const shortSum = winners.filter(w => w.marketTag === 'РАУНД' || w.marketTag === 'ФОРА')
      .reduce((a, w) => a + w.payout, 0);
    check(shortSum <= activity.bank + 0.1, `seed ${s} r${r}: короткие выплаты ${shortSum} > банка ${activity.bank}`);
    const mx = Math.max(...winners.map(w => w.payout));
    check(mx <= 600, `seed ${s} r${r}: выплата ${mx} выше потолка аудитории`);
    // конвертация RUB->USD: суммы не должны быть массово круглыми
    roundish += winners.filter(w => Number.isInteger(w.payout)).length;
    totalW += winners.length;

    // ники: маска максимум 2 раза за раунд и не подряд
    const cnt = new Map<string, number>();
    for (let i = 0; i < winners.length; i++) {
      cnt.set(winners[i].nickMasked, (cnt.get(winners[i].nickMasked) ?? 0) + 1);
      if (i > 0) check(winners[i].nickMasked !== winners[i - 1].nickMasked, `seed ${s} r${r}: маска подряд`);
      if (i > 0) check(winners[i].delayMs > winners[i - 1].delayMs, `seed ${s} r${r}: delayMs не растет`);
    }
    for (const [m, c] of cnt) check(c <= 2, `seed ${s} r${r}: маска ${m} x${c}`);

    prevBetCounts.push(activity.betCount);
  }

  // объем в конце сессии в среднем выше, чем в начале (кривая аудитории)
  const head = prevBetCounts.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
  const tail = prevBetCounts.slice(-10).reduce((a, b) => a + b, 0) / 10;
  check(tail > head, `seed ${s}: объем не растет к концу (${head.toFixed(0)} -> ${tail.toFixed(0)})`);
}

check(roundish / totalW < 0.1, `слишком много круглых выплат: ${(100 * roundish / totalW).toFixed(1)}%`);

// детерминизм: одинаковый конфиг = идентичный поток
{
  const mk = () => {
    const sim = createSimulation({ sessionId: 'det', date: '2026-06-11' });
    const acc: unknown[] = [sim.prematch()];
    for (let r = 1; r <= ROUNDS; r++) acc.push(sim.generateRound({ round: r, winner: r % 3 ? 'w1' : 'w2' }));
    return JSON.stringify(acc);
  };
  check(mk() === mk(), 'детерминизм нарушен: два прогона одного конфига разошлись');
}

if (failures) { console.error(`\n${failures} провалов`); process.exit(1); }
console.log(`OK: ${SEEDS} seeds x ${ROUNDS} раундов, все инварианты держатся`);
