/**
 * Демо-прогон: печатает симуляцию сессии в консоль - оценить "живость" глазами.
 * Запуск: npx tsx sim/demo.ts [seed]
 */
import { createSimulation, type Side } from './winners-feed-generator';

const seed = Number(process.argv[2]) || undefined;
const sim = createSimulation({ sessionId: 'demo', date: new Date().toISOString().slice(0, 10), seed });

console.log('=== ПРЕМАТЧ (холодный старт тикера) ===');
for (const w of sim.prematch()) console.log(`  ${w.nickMasked.padEnd(9)} +$${w.payout.toLocaleString()}  ${w.marketTag}`);

let side: Side = 'w1';
for (let r = 1; r <= 54; r++) {
  if (Math.random() < 0.5) side = side === 'w1' ? 'w2' : 'w1';
  const { activity, winners, kassaToday } = sim.generateRound({ round: r, winner: side });
  const mark = r === 27 || r === 54 ? '  << конец тайма' : '';
  console.log(`\nРАУНД ${String(r).padStart(2)} | ставок ${String(activity.betCount).padStart(3)} | банк $${activity.bank.toLocaleString().padStart(7)} | касса $${kassaToday.toLocaleString()}${mark}`);
  for (const w of winners)
    console.log(`   +${String(Math.round(w.delayMs / 1000)).padStart(2)}s ${w.nickMasked.padEnd(9)} +$${w.payout.toLocaleString().padEnd(8)} ${w.marketTag}`);
}
