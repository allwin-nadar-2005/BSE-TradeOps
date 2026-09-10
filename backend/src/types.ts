export interface MockTrade {
  trade_id: string;
  client: string;
  symbol: string;
  quantity: number;
  price: number;
  trade_timestamp: string; // ISO string
}

export interface GetTradesResponse {
  trades: MockTrade[];
  offset: number;
  limit: number;
  nextOffset: number | null;
  total: number;
  hasMore: boolean;
}

export type PullStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface PullRunRow {
  id: string;
  status: PullStatus;
  total_trades: number | null;
  ingested_count: number;
  chunk_size: number | null;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}
