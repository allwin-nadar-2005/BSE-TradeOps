export type PullStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface PullRun {
  id: string;
  status: PullStatus;
  total_trades: number | null;
  ingested_count: number;
  chunk_size: number | null;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export interface Trade {
  id: string;
  trade_id: string;
  pull_run_id: string | null;
  client: string;
  symbol: string;
  quantity: number;
  price: number;
  trade_timestamp: string;
  created_at: string;
}
