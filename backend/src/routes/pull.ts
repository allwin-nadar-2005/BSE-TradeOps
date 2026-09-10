import { Router } from 'express';
import {
  startPull,
  isPullActive,
  getLatestPullRunRow,
  getIngestedTrades,
  subscribeToEvents,
} from '../services/ingestionWorker.js';

export const pullRouter = Router();

// POST /api/pull/start — kicks off a new ingestion run.
pullRouter.post('/pull/start', async (_req, res) => {
  if (isPullActive()) {
    return res.status(409).json({ error: 'A pull is already running' });
  }

  try {
    const run = await startPull();
    res.status(202).json(run);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to start pull' });
  }
});

// GET /api/pull/status — fetch most recent pull run.
pullRouter.get('/pull/status', async (_req, res) => {
  try {
    const data = await getLatestPullRunRow();
    res.json(data ?? null);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch status' });
  }
});

// GET /api/trades — fetch current ingested trades.
pullRouter.get('/trades', async (req, res) => {
  try {
    const limit = Number(req.query.limit ?? 500);
    const data = await getIngestedTrades(limit);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch trades' });
  }
});

// GET /api/events — Server-Sent Events endpoint for real-time fallback streaming.
pullRouter.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const unsubscribe = subscribeToEvents((event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
});
