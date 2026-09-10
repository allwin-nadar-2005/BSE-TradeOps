import type { MockTrade } from '../types.js';

// Small deterministic PRNG so the "exchange" returns the same dataset every run
// (handy for demos — no flakiness between rehearsal and the live pitch).
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SYMBOLS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR',
  'BHARTIARTL', 'SBIN', 'BAJFINANCE', 'LT', 'ASIANPAINT', 'MARUTI',
  'AXISBANK', 'ITC', 'KOTAKBANK', 'SUNPHARMA', 'TITAN', 'WIPRO',
];

const CLIENTS = [
  'Ashoka Capital', 'Vertex Securities', 'Meridian Advisors', 'Northgate Fund',
  'Silverline Partners', 'Crown Point Holdings', 'Blue Harbor AMC', 'Ridgeline Trading',
  'Anchor Point Investments', 'Delta Bridge Capital',
];

let cachedDataset: MockTrade[] | null = null;
let cachedTotal: number | null = null;

/**
 * Generates (once, and caches) the exchange's full seeded dataset for this run.
 * TOTAL_TRADES is read lazily so tests/demos can override it via env before first call.
 */
export function getSeedDataset(): MockTrade[] {
  const total = Number(process.env.TOTAL_TRADES ?? 4800);

  if (cachedDataset && cachedTotal === total) {
    return cachedDataset;
  }

  const rand = mulberry32(42);
  const baseTime = Date.now() - 1000 * 60 * 60; // trades start "an hour ago"

  const dataset: MockTrade[] = Array.from({ length: total }, (_, i) => {
    const symbol = SYMBOLS[Math.floor(rand() * SYMBOLS.length)];
    const client = CLIENTS[Math.floor(rand() * CLIENTS.length)];
    const quantity = Math.floor(rand() * 950) + 50; // 50–1000
    const price = Math.round((rand() * 3000 + 100) * 100) / 100; // 100–3100, 2dp
    const tradeTimestamp = new Date(baseTime + i * 700).toISOString();

    return {
      trade_id: `BSE-${String(i + 1).padStart(6, '0')}`,
      client,
      symbol,
      quantity,
      price,
      trade_timestamp: tradeTimestamp,
    };
  });

  cachedDataset = dataset;
  cachedTotal = total;
  return dataset;
}
