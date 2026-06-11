var SimGen = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // sim/winners-feed-generator.ts
  var winners_feed_generator_exports = {};
  __export(winners_feed_generator_exports, {
    createSimulation: () => createSimulation
  });
  function hashStr(s) {
    let h = 1779033703 ^ s.length;
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
      h = h << 13 | h >>> 19;
    }
    return h >>> 0 || 1;
  }
  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0;
      a = a + 1831565813 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gauss(rng) {
    const u = Math.max(rng(), 1e-9), v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function logNormal(rng, median, sigma) {
    return median * Math.exp(sigma * gauss(rng));
  }
  function poisson(rng, lambda) {
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do {
      k++;
      p *= rng();
    } while (p > L);
    return k - 1;
  }
  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  }
  function clamp(x, lo, hi) {
    return Math.max(lo, Math.min(hi, x));
  }
  var NICK_BASES = [
    "ALEX",
    "MAX",
    "DINARA",
    "SERGO",
    "VITYA",
    "KOTYA",
    "RUSLAN",
    "OLGA",
    "ZHEKA",
    "TIMUR",
    "NASTYA",
    "DEN",
    "BARS",
    "VOLK",
    "TIGR",
    "SOKOL",
    "MAGA",
    "ARTUR",
    "DAMIR",
    "KIRA",
    "LEXA",
    "PASHA",
    "GOSHA",
    "ROMA",
    "STAS",
    "TOLYA",
    "BORYA",
    "SANYA",
    "VANYA",
    "MISHA",
    "KENT",
    "BOSS",
    "KING",
    "LUCKY",
    "JOKER",
    "ACE",
    "SHARK",
    "WOLF",
    "HAWK",
    "STORM",
    "NIKITOS",
    "ZHENYA",
    "ANVAR",
    "RASUL",
    "AYAN",
    "BEKA",
    "NURIK",
    "ASEL",
    "AIDA",
    "ZAUR",
    "PROFI",
    "MASTER",
    "CHIEF",
    "BARON",
    "GRAF",
    "DOC",
    "KAPITAN",
    "SNAIPER",
    "TURBO",
    "NEO"
  ];
  var NICK_SUFFIXES = ["", "", "", "", "7", "77", "777", "88", "05", "21", "99", "_X", "PRO", "KZ", "UA", "2K"];
  function buildNickPool(date, size) {
    const rng = mulberry32(hashStr("nicks:" + date));
    const seen = /* @__PURE__ */ new Set();
    const pool = [];
    while (pool.length < size) {
      const n = pick(rng, NICK_BASES) + pick(rng, NICK_SUFFIXES);
      if (!seen.has(n)) {
        seen.add(n);
        pool.push(n);
      }
    }
    const whales = pool.slice(0, 15);
    return { pool, whales };
  }
  function maskNick(nick) {
    const head = nick.length <= 4 ? nick.slice(0, 1) : nick.slice(0, 2);
    return head + "***" + nick.slice(-1);
  }
  function zipfPick(rng, pool, regulars) {
    const n = pool.length;
    let total = 0;
    const idx = Math.floor(n * Math.pow(rng(), 2.2));
    if (rng() < 0.35) return pool[Math.floor(rng() * regulars)];
    return pool[clamp(idx, 0, n - 1)];
    void total;
  }
  var STAKES_USD = [1, 2, 5, 10, 15, 20, 25, 50, 100, 200];
  var STAKES_RUB = [50, 100, 200, 500, 1e3, 1500, 2e3, 5e3, 1e4];
  var WHALE_USD = [500, 1e3, 2e3, 5e3];
  var WHALE_RUB = [5e4, 1e5, 2e5, 5e5];
  function snapStake(rng, raw, nominals) {
    let best = nominals[0];
    for (const n of nominals) if (Math.abs(n - raw) < Math.abs(best - raw)) best = n;
    return best;
  }
  var M_ROUND = { tag: "\u0420\u0410\u0423\u041D\u0414", oddsLo: 1.55, oddsHi: 2.45 };
  var M_SERIES = (n) => ({ tag: `\u0421\u0415\u0420\u0418\u042F \xD7${n}`, oddsLo: 3, oddsHi: 6 * n });
  var M_TOTAL = { tag: "\u0422\u041E\u0422\u0410\u041B", oddsLo: 1.8, oddsHi: 3.5 };
  var M_FORA = { tag: "\u0424\u041E\u0420\u0410", oddsLo: 1.8, oddsHi: 3.5 };
  var M_EXPRESS = { tag: "\u042D\u041A\u0421\u041F\u0420\u0415\u0421\u0421", oddsLo: 5, oddsHi: 80 };
  function createSimulation(cfg) {
    const totalRounds = cfg.totalRounds ?? 54;
    const peak = cfg.peakBetsPerRound ?? 120;
    const currency = cfg.currency ?? "USD";
    const stakes = currency === "USD" ? STAKES_USD : STAKES_RUB;
    const whaleStakes = currency === "USD" ? WHALE_USD : WHALE_RUB;
    const medianStake = currency === "USD" ? 8 : 700;
    const rng = mulberry32(cfg.seed ?? hashStr(cfg.sessionId + ":" + cfg.date));
    const { pool, whales } = buildNickPool(cfg.date, 400);
    let kassa = 0;
    let history = [];
    let lastRoundHadBigWin = false;
    let lastWhaleNick = "";
    let sessionMaxPayout = 0;
    function audience(r) {
      let a = 0.35 + 0.65 / (1 + Math.exp(-(r - totalRounds * 0.37) / (totalRounds * 0.13)));
      if (r <= 2 || r >= totalRounds / 2 + 1 && r <= totalRounds / 2 + 2) a += 0.25;
      if (r > totalRounds - 4) a *= 0.9;
      return a;
    }
    function sampleStake() {
      return snapStake(rng, logNormal(rng, medianStake, 1.5), stakes);
    }
    function unround(x) {
      const v = Math.round(x);
      if (v >= 100 && v % 100 === 0) return v + 3 + Math.floor(rng() * 89);
      return Math.max(1, v);
    }
    function odds(m) {
      return m.oddsLo + rng() * (m.oddsHi - m.oddsLo);
    }
    function pickNick(usedThisRound, lastMask, whale) {
      for (let i = 0; i < 20; i++) {
        const nick = whale ? pick(rng, whales) : zipfPick(rng, pool, 20);
        const mask = maskNick(nick);
        if (mask === lastMask) continue;
        if ((usedThisRound.get(mask) ?? 0) >= 2) continue;
        if (whale && nick === lastWhaleNick) continue;
        usedThisRound.set(mask, (usedThisRound.get(mask) ?? 0) + 1);
        if (whale) lastWhaleNick = nick;
        return mask;
      }
      return maskNick(pool[Math.floor(rng() * pool.length)]);
    }
    function prematch() {
      const used = /* @__PURE__ */ new Map();
      const out = [];
      const n = 10 + Math.floor(rng() * 6);
      let last = "";
      for (let i = 0; i < n; i++) {
        const m = rng() < 0.6 ? M_ROUND : rng() < 0.5 ? M_TOTAL : M_FORA;
        const mask = pickNick(used, last, false);
        last = mask;
        out.push({ round: 0, nickMasked: mask, payout: unround(Math.max(sampleStake() * odds(m), medianStake * (1.2 + rng() * 1.6))), marketTag: m.tag, delayMs: i * 1200 });
      }
      return out;
    }
    function generateRound(ctx) {
      history.push(ctx.winner);
      const noise = clamp(Math.exp(0.25 * gauss(rng)), 0.6, 1.6);
      const damp = lastRoundHadBigWin ? 0.85 : 1;
      const betCount = Math.max(5, Math.round(audience(ctx.round) * peak * noise * damp));
      const stakesArr = [];
      for (let i = 0; i < betCount; i++) stakesArr.push(sampleStake());
      const whaleP = 0.02 + 0.13 * (ctx.round / totalRounds);
      let whaleCount = rng() < whaleP ? poisson(rng, 1.2) : 0;
      for (let i = 0; i < whaleCount; i++) stakesArr.push(pick(rng, whaleStakes));
      let bank = Math.round(stakesArr.reduce((a, b) => a + b, 0) / 10) * 10;
      kassa += bank;
      const activity = { round: ctx.round, betCount: betCount + whaleCount, bank };
      if (ctx.voided) {
        lastRoundHadBigWin = false;
        return { activity, winners: [], kassaToday: kassa };
      }
      const h = history;
      const streakBroken = h.length >= 4 && h[h.length - 1] !== h[h.length - 2] && h[h.length - 2] === h[h.length - 3] && h[h.length - 3] === h[h.length - 4];
      const budget = bank * (streakBroken ? 0.65 + rng() * 0.27 : 0.55 + rng() * 0.37);
      let winCount = clamp(Math.round(3 + betCount / 40), 3, 12);
      if (streakBroken) winCount = Math.max(3, Math.round(winCount * 0.6));
      const isHalfEnd = ctx.round === Math.floor(totalRounds / 2) || ctx.round === totalRounds;
      const seriesBoost = ctx.round % 2 === 0 ? 0.12 : 0;
      const markets = [];
      for (let i = 0; i < winCount; i++) {
        const x = rng();
        if (x < 0.78 - seriesBoost) markets.push(M_ROUND);
        else if (x < 0.78 + seriesBoost) markets.push(M_SERIES(2 + Math.floor(rng() * 4)));
        else markets.push(rng() < 0.5 ? M_TOTAL : M_FORA);
      }
      let bigWins = isHalfEnd ? 1 + Math.floor(rng() * 4) : rng() < 0.07 ? 1 : 0;
      for (let i = 0; i < bigWins; i++) markets.push(rng() < 0.5 ? M_EXPRESS : M_SERIES(4 + Math.floor(rng() * 2)));
      let raw = markets.map((m) => {
        const isBig = m.tag === "\u042D\u041A\u0421\u041F\u0420\u0415\u0421\u0421" || m.oddsHi > 20;
        const stake = isBig ? medianStake * (3 + rng() * 17) : sampleStake();
        return { m, val: stake * odds(m) };
      });
      const rawSum = raw.reduce((a, b) => a + b.val, 0);
      raw = raw.map((w) => ({ ...w, val: w.val / rawSum * budget }));
      raw = raw.map((w) => ({ ...w, val: Math.max(w.val, medianStake * (1.2 + rng() * 1.6)) }));
      const flooredSum = raw.reduce((a, b) => a + b.val, 0);
      if (flooredSum > bank * 0.95) raw = raw.map((w) => ({ ...w, val: w.val * (bank * 0.95) / flooredSum }));
      if (ctx.round === totalRounds && raw.length) {
        const top = raw.reduce((a, b) => a.val > b.val ? a : b);
        top.val = Math.max(top.val, sessionMaxPayout * 1.15);
      }
      const maxVal = Math.max(...raw.map((w) => w.val));
      if (maxVal > bank * 0.4) {
        bank = Math.round(maxVal / 0.4 / 10) * 10;
        kassa += bank - activity.bank;
        activity.bank = bank;
      }
      raw.sort((a, b) => a.val - b.val);
      const used = /* @__PURE__ */ new Map();
      let lastMask = "";
      let delay = 400 + Math.floor(rng() * 800);
      const winners = raw.map((w) => {
        const isWhaleWin = w.val > medianStake * 60;
        const mask = pickNick(used, lastMask, isWhaleWin);
        lastMask = mask;
        const ev = {
          round: ctx.round,
          nickMasked: mask,
          payout: unround(w.val),
          marketTag: w.m.tag,
          delayMs: delay
        };
        delay += 500 + Math.floor(rng() * 3500);
        return ev;
      });
      sessionMaxPayout = Math.max(sessionMaxPayout, ...winners.map((w) => w.payout), 0);
      lastRoundHadBigWin = winners.some((w) => w.payout > medianStake * 60);
      return { activity, winners, kassaToday: kassa };
    }
    return {
      prematch,
      generateRound,
      get kassaToday() {
        return kassa;
      },
      /** Восстановление кассы после рестарта сервиса (значение - из вашего стора). */
      restoreKassa(value) {
        kassa = value;
      }
    };
  }
  return __toCommonJS(winners_feed_generator_exports);
})();
