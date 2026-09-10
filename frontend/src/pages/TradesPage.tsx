import { useMemo, useState } from 'react';
import { useTradesRealtime } from '../hooks/useTradesRealtime';
import type { Trade } from '../types';
import { Search, Filter, ArrowUpDown, X, FileText, ChevronRight, Check } from 'lucide-react';

export function TradesPage() {
  const { trades } = useTradesRealtime();

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [symbolFilter, setSymbolFilter] = useState('ALL');
  const [clientFilter, setClientFilter] = useState('ALL');
  const [minQty, setMinQty] = useState('');
  const [maxQty, setMaxQty] = useState('');

  // Sort State
  const [sortField, setSortField] = useState<'timestamp' | 'price' | 'quantity' | 'symbol' | 'client'>('timestamp');
  const [sortAsc, setSortAsc] = useState(false);

  // Selected Trade for Slide-Over Drawer
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  // Unique symbols and clients for dropdowns
  const uniqueSymbols = useMemo(() => {
    const set = new Set<string>();
    trades.forEach((t) => set.add(t.symbol));
    return ['ALL', ...Array.from(set).sort()];
  }, [trades]);

  const uniqueClients = useMemo(() => {
    const set = new Set<string>();
    trades.forEach((t) => set.add(t.client));
    return ['ALL', ...Array.from(set).sort()];
  }, [trades]);

  // Filtered and Sorted trades
  const processedTrades = useMemo(() => {
    return trades
      .filter((t) => {
        // Search term check
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchesId = t.trade_id.toLowerCase().includes(q);
          const matchesClient = t.client.toLowerCase().includes(q);
          const matchesSymbol = t.symbol.toLowerCase().includes(q);
          if (!matchesId && !matchesClient && !matchesSymbol) return false;
        }

        // Symbol dropdown
        if (symbolFilter !== 'ALL' && t.symbol !== symbolFilter) return false;

        // Client dropdown
        if (clientFilter !== 'ALL' && t.client !== clientFilter) return false;

        // Min Qty
        if (minQty && t.quantity < Number(minQty)) return false;

        // Max Qty
        if (maxQty && t.quantity > Number(maxQty)) return false;

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === 'timestamp') {
          comp = new Date(a.trade_timestamp).getTime() - new Date(b.trade_timestamp).getTime();
        } else if (sortField === 'price') {
          comp = a.price - b.price;
        } else if (sortField === 'quantity') {
          comp = a.quantity - b.quantity;
        } else if (sortField === 'symbol') {
          comp = a.symbol.localeCompare(b.symbol);
        } else if (sortField === 'client') {
          comp = a.client.localeCompare(b.client);
        }
        return sortAsc ? comp : -comp;
      });
  }, [trades, searchTerm, symbolFilter, clientFilter, minQty, maxQty, sortField, sortAsc]);

  function handleSort(field: typeof sortField) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  }

  return (
    <div className="space-y-6 relative">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-600 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Search className="w-6 h-6 text-brass-400" />
            <h1 className="font-serif text-2xl font-bold text-paper-100">Trade Explorer</h1>
          </div>
          <p className="text-xs text-paper-400 mt-1">
            Search, filter, and inspect ingested trades in real time. Click any row to view trade details.
          </p>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-ink-800 rounded-xl p-4 border border-ink-600 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-paper-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Trade ID, Client, Symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-ink-900 text-paper-100 text-xs font-mono pl-9 pr-3 py-2 rounded-lg border border-ink-600 focus:border-brass-400 focus:outline-none placeholder:text-paper-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-paper-400 hover:text-paper-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Symbol Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-paper-400 whitespace-nowrap">Symbol:</span>
            <select
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
              className="w-full bg-ink-900 text-paper-100 text-xs font-mono px-3 py-2 rounded-lg border border-ink-600 focus:border-brass-400 focus:outline-none"
            >
              {uniqueSymbols.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Client Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-paper-400 whitespace-nowrap">Client:</span>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full bg-ink-900 text-paper-100 text-xs font-mono px-3 py-2 rounded-lg border border-ink-600 focus:border-brass-400 focus:outline-none"
            >
              {uniqueClients.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Qty Range */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min Qty"
              value={minQty}
              onChange={(e) => setMinQty(e.target.value)}
              className="w-1/2 bg-ink-900 text-paper-100 text-xs font-mono px-3 py-2 rounded-lg border border-ink-600 focus:border-brass-400 focus:outline-none"
            />
            <span className="text-paper-400 text-xs">-</span>
            <input
              type="number"
              placeholder="Max Qty"
              value={maxQty}
              onChange={(e) => setMaxQty(e.target.value)}
              className="w-1/2 bg-ink-900 text-paper-100 text-xs font-mono px-3 py-2 rounded-lg border border-ink-600 focus:border-brass-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* RESULTS COUNT & SORT INFO */}
      <div className="flex items-center justify-between text-xs font-mono text-paper-400 px-1">
        <span>
          Showing <span className="text-brass-400 font-bold">{processedTrades.length}</span> of {trades.length} trades
        </span>
        <span>Click row for full execution JSON payload</span>
      </div>

      {/* TRADES TABLE */}
      <div className="bg-ink-800 rounded-xl border border-ink-600 p-4 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-ink-600 text-[11px] text-paper-400 uppercase select-none">
                <th
                  onClick={() => handleSort('symbol')}
                  className="py-3 px-4 cursor-pointer hover:text-paper-100"
                >
                  <div className="flex items-center gap-1">
                    <span>Symbol</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('client')}
                  className="py-3 px-4 cursor-pointer hover:text-paper-100"
                >
                  <div className="flex items-center gap-1">
                    <span>Client</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Trade ID</th>
                <th
                  onClick={() => handleSort('quantity')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-paper-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Quantity</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('price')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-paper-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Price</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('timestamp')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-paper-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Trade Time</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-600/50 text-paper-100">
              {processedTrades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-paper-400">
                    No trades match the active search and filter criteria.
                  </td>
                </tr>
              ) : (
                processedTrades.map((t) => (
                  <tr
                    key={t.id || t.trade_id}
                    onClick={() => setSelectedTrade(t)}
                    className="hover:bg-ink-700/60 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 font-bold text-brass-400">{t.symbol}</td>
                    <td className="py-3 px-4 text-paper-400">{t.client}</td>
                    <td className="py-3 px-4 text-paper-100">{t.trade_id}</td>
                    <td className="py-3 px-4 text-right font-mono">{t.quantity.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono text-teal-400">₹{t.price.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-paper-400 font-mono">
                      {new Date(t.trade_timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SLIDE-OVER TRADE DETAIL DRAWER */}
      {selectedTrade && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-ink-900 border-l border-ink-600 h-full p-6 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-ink-600 pb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brass-400" />
                  <h2 className="font-serif text-lg font-bold text-paper-100">Trade Inspection</h2>
                </div>
                <button
                  onClick={() => setSelectedTrade(null)}
                  className="p-1 rounded-lg text-paper-400 hover:text-paper-100 hover:bg-ink-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Info Badges */}
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="bg-ink-800 p-3 rounded-lg border border-ink-600 space-y-1">
                  <span className="text-[10px] text-paper-400 uppercase">Symbol</span>
                  <div className="text-base font-bold text-brass-400">{selectedTrade.symbol}</div>
                </div>
                <div className="bg-ink-800 p-3 rounded-lg border border-ink-600 space-y-1">
                  <span className="text-[10px] text-paper-400 uppercase">Total Value</span>
                  <div className="text-base font-bold text-teal-400">
                    ₹{(selectedTrade.price * selectedTrade.quantity).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Trade Fields List */}
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between py-2 border-b border-ink-600/60">
                  <span className="text-paper-400">Trade ID:</span>
                  <span className="text-paper-100 font-bold">{selectedTrade.trade_id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-ink-600/60">
                  <span className="text-paper-400">Client / AMC:</span>
                  <span className="text-paper-100 font-bold">{selectedTrade.client}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-ink-600/60">
                  <span className="text-paper-400">Quantity:</span>
                  <span className="text-paper-100 font-bold">{selectedTrade.quantity.toLocaleString()} shares</span>
                </div>
                <div className="flex justify-between py-2 border-b border-ink-600/60">
                  <span className="text-paper-400">Price per Share:</span>
                  <span className="text-teal-400 font-bold">₹{selectedTrade.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-ink-600/60">
                  <span className="text-paper-400">Exchange Timestamp:</span>
                  <span className="text-paper-100">{new Date(selectedTrade.trade_timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-ink-600/60">
                  <span className="text-paper-400">Pull Run ID:</span>
                  <span className="text-brass-400">{selectedTrade.pull_run_id ?? 'Local Stream'}</span>
                </div>
              </div>

              {/* Raw JSON Payload */}
              <div className="space-y-2">
                <span className="text-xs font-serif font-bold text-paper-100">Raw Trade Object</span>
                <pre className="bg-ink-950 p-4 rounded-xl border border-ink-600 text-[11px] font-mono text-teal-400 overflow-x-auto">
                  {JSON.stringify(selectedTrade, null, 2)}
                </pre>
              </div>
            </div>

            <button
              onClick={() => setSelectedTrade(null)}
              className="w-full py-2.5 rounded-lg bg-ink-800 hover:bg-ink-700 text-paper-100 font-mono text-xs border border-ink-600 transition-colors"
            >
              Close Drawer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
