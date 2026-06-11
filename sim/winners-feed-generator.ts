/**
 * Генератор симулированной активности игроков (лента победителей, банк раунда, касса дня).
 * Zero-dependency TypeScript. Подробности модели - в комментариях по ходу кода,
 * человеческое описание - в winners-feed-simulation-spec.md.
 *
 * Использование:
 *   const sim = createSimulation({ sessionId:'m-123', date:'2026-06-11' });
 *   sim.prematch();                                  // наполнить тикер до первого раунда
 *   sim.generateRound({ round:1, winner:'w1' });     // после каждого round_result
 *
 * Генератор детерминирован: одинаковый конфиг = одинаковый поток (QA, реплеи).
 * Персистентность кассы между рестартами - на стороне интегратора: сохранить
 * sim.kassaToday, после рестарта restoreKassa(value).
 */

export type Currency = 'USD' | 'RUB';
export type Side = 'w1' | 'w2';

export interface SimConfig {
  sessionId: string;
  date: string;                 // YYYY-MM-DD: задает пул ников и базовый seed
  totalRounds?: number;         // дефолт 54
  peakBetsPerRound?: number;    // дефолт 120 - пик объема в конце сессии
  currency?: Currency;          // дефолт USD
  seed?: number;                // переопределение seed для QA
}

export interface RoundContext {
  round: number;                // 1..totalRounds
  winner: Side;                 // реальный победитель раунда (из game loop)
  voided?: boolean;             // round_aborted: банк был, победителей не показываем
}

export interface RoundActivity { round: number; betCount: number; bank: number; }
export interface WinnerEvent {
  round: number;
  nickMasked: string;
  payout: number;
  marketTag: string;            // "РАУНД" | "СЕРИЯ ×N" | "ТОТАЛ" | "ФОРА" | "ЭКСПРЕСС"
  delayMs: number;              // когда эмитить после round_result (дрип-показ)
}
export interface RoundSim { activity: RoundActivity; winners: WinnerEvent[]; kassaToday: number; }

/* ────────────────────────── PRNG (mulberry32) ────────────────────────── */

function hashStr(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h >>> 0) || 1;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ───────────────────── распределения поверх PRNG ─────────────────────── */

function gauss(rng: () => number): number {
  // Box-Muller
  const u = Math.max(rng(), 1e-9), v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function logNormal(rng: () => number, median: number, sigma: number): number {
  return median * Math.exp(sigma * gauss(rng));
}
function poisson(rng: () => number, lambda: number): number {
  // Knuth
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= rng(); } while (p > L);
  return k - 1;
}
function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
function clamp(x: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, x)); }

/* ─────────────────────────── пул ников ───────────────────────────────── */

const NICK_BASES = [
  'ALEX','MAX','DINARA','SERGO','VITYA','KOTYA','RUSLAN','OLGA','ZHEKA','TIMUR',
  'NASTYA','DEN','BARS','VOLK','TIGR','SOKOL','MAGA','ARTUR','DAMIR','KIRA',
  'LEXA','PASHA','GOSHA','ROMA','STAS','TOLYA','BORYA','SANYA','VANYA','MISHA',
  'KENT','BOSS','KING','LUCKY','JOKER','ACE','SHARK','WOLF','HAWK','STORM',
  'NIKITOS','ZHENYA','ANVAR','RASUL','AYAN','BEKA','NURIK','ASEL','AIDA','ZAUR',
  'PROFI','MASTER','CHIEF','BARON','GRAF','DOC','KAPITAN','SNAIPER','TURBO','NEO',
] as const;
const NICK_SUFFIXES = ['', '', '', '', '7', '77', '777', '88', '05', '21', '99', '_X', 'PRO', 'KZ', 'UA', '2K'] as const;

function buildNickPool(date: string, size: number): { pool: string[]; whales: string[] } {
  // Пул фиксирован на дату: между сессиями дня ники общие, между днями - меняются.
  const rng = mulberry32(hashStr('nicks:' + date));
  const seen = new Set<string>();
  const pool: string[] = [];
  while (pool.length < size) {
    const n = pick(rng, NICK_BASES) + pick(rng, NICK_SUFFIXES);
    if (!seen.has(n)) { seen.add(n); pool.push(n); }
  }
  // Киты - отдельные повторяющиеся персонажи дня.
  const whales = pool.slice(0, 15);
  return { pool, whales };
}

function maskNick(nick: string): string {
  const head = nick.length <= 4 ? nick.slice(0, 1) : nick.slice(0, 2);
  return head + '***' + nick.slice(-1);
}

/** Выбор по Zipf: голова пула повторяется часто, хвост - почти одноразовый. */
function zipfPick(rng: () => number, pool: string[], regulars: number): string {
  // weight_i ~ 1/(i+1)^0.9, первые `regulars` ников - вес x5 (завсегдатаи)
  const n = pool.length;
  let total = 0;
  // Дешевый трюк: сэмплим индекс через инверсию степенного распределения,
  // потом с вероятностью 0.35 подменяем на завсегдатая.
  const idx = Math.floor(n * Math.pow(rng(), 2.2)); // плотность у головы
  if (rng() < 0.35) return pool[Math.floor(rng() * regulars)];
  return pool[clamp(idx, 0, n - 1)];
  void total;
}

/* ─────────────────────────── номиналы/валюта ─────────────────────────── */

/* Калибровка на аудиторию RU-стримеров (~200к подписчиков, небогатый регион):
   подавляющее большинство ставок $1-3, "разогретые" $10-20 - уже тяжелый порог,
   кит этой аудитории - $50-200, а не $5000. */
const STAKES_USD = [1, 2, 3, 5, 10, 15, 20] as const;
const STAKES_RUB = [50, 100, 200, 300, 500, 1000, 1500] as const;
const WHALE_USD = [50, 100, 200] as const;
const WHALE_RUB = [5000, 10000, 20000] as const;

function snapStake(rng: () => number, raw: number, nominals: readonly number[]): number {
  // ближайший человеческий номинал (с легким случайным сдвигом вверх/вниз)
  let best = nominals[0];
  for (const n of nominals) if (Math.abs(n - raw) < Math.abs(best - raw)) best = n;
  return best;
}

/* ─────────────────────────── маркеты ──────────────────────────────────── */

interface Market { tag: string; oddsLo: number; oddsHi: number; }
const M_ROUND: Market = { tag: 'РАУНД', oddsLo: 1.55, oddsHi: 2.45 };
const M_SERIES = (n: number): Market => ({ tag: `СЕРИЯ ×${n}`, oddsLo: 3, oddsHi: 6 * n });
const M_TOTAL: Market = { tag: 'ТОТАЛ', oddsLo: 1.8, oddsHi: 3.5 };
const M_FORA: Market = { tag: 'ФОРА', oddsLo: 1.8, oddsHi: 3.5 };
const M_EXPRESS: Market = { tag: 'ЭКСПРЕСС', oddsLo: 5, oddsHi: 80 };

/* ═══════════════════════════ Симуляция ═══════════════════════════════── */

export function createSimulation(cfg: SimConfig) {
  const totalRounds = cfg.totalRounds ?? 54;
  const peak = cfg.peakBetsPerRound ?? 35;   // на пике эфира ~20-45 ставок за раунд
  const currency: Currency = cfg.currency ?? 'USD';
  const stakes = currency === 'USD' ? STAKES_USD : STAKES_RUB;
  const whaleStakes = currency === 'USD' ? WHALE_USD : WHALE_RUB;
  const medianStake = currency === 'USD' ? 1.3 : 110;

  const rng = mulberry32(cfg.seed ?? hashStr(cfg.sessionId + ':' + cfg.date));
  const { pool, whales } = buildNickPool(cfg.date, 400);

  // Состояние сессии
  let kassa = 0;
  let history: Side[] = [];
  let lastRoundHadBigWin = false;
  let lastWhaleNick = '';
  let sessionMaxPayout = 0;

  /* Кривая аудитории: рост 0.35 -> 1.0 + бампы длинных окон + спад в конце. */
  function audience(r: number): number {
    let a = 0.35 + 0.65 / (1 + Math.exp(-(r - totalRounds * 0.37) / (totalRounds * 0.13)));
    if (r <= 2 || (r >= totalRounds / 2 + 1 && r <= totalRounds / 2 + 2)) a += 0.25;
    if (r > totalRounds - 4) a *= 0.9;
    return a;
  }

  function sampleStake(): number {
    return snapStake(rng, logNormal(rng, medianStake, 1.1), stakes);
  }

  /** Некруглая выплата: круглые суммы подряд - палево. */
  function unround(x: number): number {
    const v = Math.round(x);
    if (v >= 100 && v % 100 === 0) return v + 3 + Math.floor(rng() * 89);
    return Math.max(1, v);
  }

  function odds(m: Market): number { return m.oddsLo + rng() * (m.oddsHi - m.oddsLo); }

  function pickNick(usedThisRound: Map<string, number>, lastMask: string, whale: boolean): string {
    for (let i = 0; i < 20; i++) {
      const nick = whale ? pick(rng, whales) : zipfPick(rng, pool, 20);
      const mask = maskNick(nick);
      if (mask === lastMask) continue;                          // не подряд
      if ((usedThisRound.get(mask) ?? 0) >= 2) continue;        // максимум 2 за раунд
      if (whale && nick === lastWhaleNick) continue;            // кит не выигрывает 2 раунда подряд
      usedThisRound.set(mask, (usedThisRound.get(mask) ?? 0) + 1);
      if (whale) lastWhaleNick = nick;
      return mask;
    }
    return maskNick(pool[Math.floor(rng() * pool.length)]);
  }

  /** Прематч-лента для холодного старта тикера (до первого round_result). */
  function prematch(): WinnerEvent[] {
    const used = new Map<string, number>();
    const out: WinnerEvent[] = [];
    const n = 10 + Math.floor(rng() * 6);
    let last = '';
    for (let i = 0; i < n; i++) {
      const m = rng() < 0.6 ? M_ROUND : rng() < 0.5 ? M_TOTAL : M_FORA;
      const mask = pickNick(used, last, false);
      last = mask;
      out.push({ round: 0, nickMasked: mask, payout: unround(Math.max(sampleStake() * odds(m), medianStake * (1.2 + rng() * 1.6))), marketTag: m.tag, delayMs: i * 1200 });
    }
    return out;
  }

  function generateRound(ctx: RoundContext): RoundSim {
    history.push(ctx.winner);

    /* ── объем ставок ── */
    const noise = clamp(Math.exp(0.25 * gauss(rng)), 0.6, 1.6);
    const damp = lastRoundHadBigWin ? 0.85 : 1;                  // пул "выдохся" после крупняка
    const betCount = Math.max(3, Math.round(audience(ctx.round) * peak * noise * damp));

    /* ── банк = сумма реально насэмпленных ставок ── */
    const stakesArr: number[] = [];
    for (let i = 0; i < betCount; i++) stakesArr.push(sampleStake());
    const whaleP = 0.02 + 0.10 * (ctx.round / totalRounds);     // киты: редко, чаще к концу
    let whaleCount = rng() < whaleP ? poisson(rng, 1.2) : 0;     // иногда 0, иногда 5
    for (let i = 0; i < whaleCount; i++) stakesArr.push(pick(rng, whaleStakes));
    let bank = Math.round(stakesArr.reduce((a, b) => a + b, 0) / 10) * 10;

    kassa += bank;
    const activity: RoundActivity = { round: ctx.round, betCount: betCount + whaleCount, bank };
    if (ctx.voided) { lastRoundHadBigWin = false; return { activity, winners: [], kassaToday: kassa }; }

    /* ── сломанная серия: реже, но крупнее (связь с реальным ходом матча) ── */
    const h = history;
    const streakBroken = h.length >= 4 && h[h.length - 1] !== h[h.length - 2]
      && h[h.length - 2] === h[h.length - 3] && h[h.length - 3] === h[h.length - 4];

    /* ── бюджет выплат: всегда меньше банка ── */
    const budget = bank * (streakBroken ? 0.65 + rng() * 0.27 : 0.55 + rng() * 0.37);

    /* ── сколько победителей показываем ── */
    let winCount = clamp(Math.round(2 + betCount / 8), 2, 8);
    if (streakBroken) winCount = Math.max(2, Math.round(winCount * 0.6));

    /* ── маркеты: короткие живут в банке раунда, длинные - нет ── */
    const isHalfEnd = ctx.round === Math.floor(totalRounds / 2) || ctx.round === totalRounds;
    const seriesBoost = ctx.round % 2 === 0 ? 0.12 : 0;          // закрытия коротких серий

    /* короткие (РАУНД/ФОРА): расчет внутри раунда, сумма выплат <= бюджета банка */
    const shorts: Market[] = [];
    for (let i = 0; i < winCount; i++) shorts.push(rng() < 0.85 ? M_ROUND : M_FORA);
    let raw = shorts.map(m => ({ m, val: sampleStake() * odds(m) }));
    const rawSum = raw.reduce((a, b) => a + b.val, 0) || 1;
    raw = raw.map(w => ({ ...w, val: (w.val / rawSum) * budget }));
    /* пол выплаты с джиттером: одинаковые минимумы сами становятся паттерном */
    raw = raw.map(w => ({ ...w, val: Math.max(w.val, medianStake * (1.2 + rng() * 1.6)) }));
    const flooredSum = raw.reduce((a, b) => a + b.val, 0);
    if (flooredSum > bank * 0.95) raw = raw.map(w => ({ ...w, val: w.val * (bank * 0.95) / flooredSum }));

    /* длинные (СЕРИЯ/ТОТАЛ/ЭКСПРЕСС): ставки сделаны в ПРОШЛЫХ раундах,
       поэтому выплата не обязана помещаться в банк текущего раунда.
       Потолок правдоподобия: аудитория ставит $1-5 на длинные кэфы. */
    const ceiling = medianStake * 450;                            // ~$580 / ~50к ₽
    const longs: Market[] = [];
    if (rng() < 0.25 + seriesBoost) longs.push(M_SERIES(2 + Math.floor(rng() * 4)));
    const bigWins = isHalfEnd ? 1 + Math.floor(rng() * 3) : (rng() < 0.06 ? 1 : 0);
    for (let i = 0; i < bigWins; i++)
      longs.push(rng() < 0.5 ? M_EXPRESS : (rng() < 0.5 ? M_TOTAL : M_SERIES(4 + Math.floor(rng() * 2))));
    const longRaw = longs.map(m => {
      const stake = Math.max(1, Math.round(medianStake * (1 + rng() * 5)));
      return { m, val: clamp(stake * odds(m), medianStake * 8, ceiling) };
    });

    /* хедлайнер последнего раунда: крупнейший залет сессии (в пределах потолка) */
    if (ctx.round === totalRounds && longRaw.length) {
      const top = longRaw.reduce((a, b) => (a.val > b.val ? a : b));
      top.val = clamp(Math.max(top.val, sessionMaxPayout * 1.15), medianStake * 8, ceiling);
    }
    raw = raw.concat(longRaw);

    /* ── сборка событий: по возрастанию, крупные в конце (драматургия) ── */
    raw.sort((a, b) => a.val - b.val);
    const used = new Map<string, number>();
    let lastMask = '';
    let delay = 400 + Math.floor(rng() * 800);
    const winners: WinnerEvent[] = raw.map(w => {
      const isWhaleWin = w.val > medianStake * 60;
      const mask = pickNick(used, lastMask, isWhaleWin);
      lastMask = mask;
      const ev: WinnerEvent = {
        round: ctx.round, nickMasked: mask, payout: unround(w.val),
        marketTag: w.m.tag, delayMs: delay,
      };
      delay += 500 + Math.floor(rng() * 3500);
      return ev;
    });

    sessionMaxPayout = Math.max(sessionMaxPayout, ...winners.map(w => w.payout), 0);
    lastRoundHadBigWin = winners.some(w => w.payout > medianStake * 60);

    return { activity, winners, kassaToday: kassa };
  }

  return {
    prematch,
    generateRound,
    get kassaToday() { return kassa; },
    /** Восстановление кассы после рестарта сервиса (значение - из вашего стора). */
    restoreKassa(value: number) { kassa = value; },
  };
}
