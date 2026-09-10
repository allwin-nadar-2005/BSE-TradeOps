import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { mockBseRouter } from './routes/mockBse.js';
import { pullRouter } from './routes/pull.js';
import { chatRouter } from './routes/chat.js';
import { isSupabaseConfigured } from './services/supabaseClient.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    status: 'online',
    service: 'BSE Live Trade Ingestion Backend Engine',
    supabaseConnected: isSupabaseConfigured,
    endpoints: {
      health: 'GET /health',
      mockExchangeFeed: 'GET /getTrades?offset=0&limit=100',
      startPull: 'POST /api/pull/start',
      pullStatus: 'GET /api/pull/status',
      trades: 'GET /api/trades',
      eventsStream: 'GET /api/events',
      copilotChat: 'POST /api/chat',
    },
    frontendDashboard: 'http://localhost:5173/',
  });
});

app.get('/health', (_req, res) => res.json({ ok: true }));

// Mock exchange feed (simulates the real BSE Exchange API)
app.use('/', mockBseRouter);

// Ingestion trigger + status
app.use('/api', pullRouter);

// TradeOps Copilot AI Chat route
app.use('/api', chatRouter);

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`BSE dashboard backend listening on http://localhost:${PORT}`);
  console.log(`  Root status:    GET  http://localhost:${PORT}/`);
  console.log(`  Mock exchange:  GET  http://localhost:${PORT}/getTrades`);
  console.log(`  Trigger a pull: POST http://localhost:${PORT}/api/pull/start`);
  console.log(`  Copilot AI:     POST http://localhost:${PORT}/api/chat`);
});
