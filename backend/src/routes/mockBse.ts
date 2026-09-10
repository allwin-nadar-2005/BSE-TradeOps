import { Router } from 'express';
import { getSeedDataset } from '../services/mockData.js';
import type { GetTradesResponse } from '../types.js';

export const mockBseRouter = Router();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * GET /getTrades?offset=0&limit=100&delayMs=1500
 *
 * Simulates the real BSE exchange feed: cursor/offset pagination over a large
 * dataset, with an artificial per-call delay. Every individual call is short
 * enough to comfortably clear inside the 30s network ceiling — the *worker*
 * is what strings many of these together into a long-running pull, never a
 * single held-open connection.
 */
mockBseRouter.get('/getTrades', async (req, res) => {
  const dataset = getSeedDataset();

  const offset = Math.max(0, Number(req.query.offset ?? 0));
  const limit = Math.min(500, Math.max(1, Number(req.query.limit ?? 100)));
  const delayMs = Number(req.query.delayMs ?? process.env.CHUNK_DELAY_MS ?? 1500);

  // Simulate exchange latency for this chunk. Stays well under 30s per call.
  await sleep(Math.min(delayMs, 25_000));

  const page = dataset.slice(offset, offset + limit);
  const nextOffset = offset + limit < dataset.length ? offset + limit : null;

  const body: GetTradesResponse = {
    trades: page,
    offset,
    limit,
    nextOffset,
    total: dataset.length,
    hasMore: nextOffset !== null,
  };

  res.json(body);
});
