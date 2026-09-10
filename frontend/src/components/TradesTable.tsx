import type { Trade } from '../types';

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour12: false });
}

function formatPrice(price: number) {
  return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function TradesTable({ trades, newestIds }: { trades: Trade[]; newestIds: Set<string> }) {
  return (
    <div className="border border-ink-600 rounded-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-ink-600 flex items-baseline justify-between">
        <h2 className="font-serif text-base text-paper-100">Trades ledger</h2>
        <span className="text-xs text-paper-400 font-mono">{trades.length.toLocaleString()} shown</span>
      </div>

      <div className="max-h-[560px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-ink-800 text-paper-400 text-xs">
            <tr className="border-b border-ink-600">
              <th className="text-left font-medium px-4 py-2">Trade ID</th>
              <th className="text-left font-medium px-4 py-2">Client</th>
              <th className="text-left font-medium px-4 py-2">Symbol</th>
              <th className="text-right font-medium px-4 py-2">Qty</th>
              <th className="text-right font-medium px-4 py-2">Price</th>
              <th className="text-right font-medium px-4 py-2">Time</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {trades.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-paper-400 font-sans">
                  No trades yet. Start a pull to see them stream in.
                </td>
              </tr>
            )}
            {trades.map((t) => (
              <tr
                key={t.id}
                className={`border-b border-ink-700 hover:bg-ink-700/50 ${
                  newestIds.has(t.id) ? 'animate-row-in' : ''
                }`}
              >
                <td className="px-4 py-1.5 text-paper-400">{t.trade_id}</td>
                <td className="px-4 py-1.5 font-sans text-paper-100">{t.client}</td>
                <td className="px-4 py-1.5 text-brass-400">{t.symbol}</td>
                <td className="px-4 py-1.5 text-right text-paper-100">{t.quantity.toLocaleString()}</td>
                <td className="px-4 py-1.5 text-right text-paper-100">{formatPrice(t.price)}</td>
                <td className="px-4 py-1.5 text-right text-paper-400">{formatTime(t.trade_timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
