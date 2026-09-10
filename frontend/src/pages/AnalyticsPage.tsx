import { useMemo } from 'react';
import { useTradesRealtime } from '../hooks/useTradesRealtime';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { BarChart3, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

export function AnalyticsPage() {
  const { trades } = useTradesRealtime();

  const analytics = useMemo(() => {
    if (trades.length === 0) {
      return {
        totalValue: 0,
        topSymbol: '—',
        topClient: '—',
        avgQuantity: 0,
        symbolVolumeData: [],
        clientVolumeData: [],
        timelineData: [],
        distributionData: [],
      };
    }

    let totalVal = 0;
    let totalQty = 0;
    const symbolMap = new Map<string, { volume: number; value: number; count: number }>();
    const clientMap = new Map<string, { volume: number; count: number }>();

    // Timeline grouping (by minute or chunk bucket)
    const timelineBuckets = new Map<string, { time: string; count: number; volume: number }>();

    trades.forEach((t) => {
      const val = t.price * t.quantity;
      totalVal += val;
      totalQty += t.quantity;

      // Symbol stats
      const s = symbolMap.get(t.symbol) || { volume: 0, value: 0, count: 0 };
      s.volume += t.quantity;
      s.value += val;
      s.count += 1;
      symbolMap.set(t.symbol, s);

      // Client stats
      const c = clientMap.get(t.client) || { volume: 0, count: 0 };
      c.volume += t.quantity;
      c.count += 1;
      clientMap.set(t.client, c);

      // Timeline stats
      const date = new Date(t.created_at);
      const timeKey = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${(Math.floor(date.getSeconds() / 10) * 10).toString().padStart(2, '0')}`;
      const tb = timelineBuckets.get(timeKey) || { time: timeKey, count: 0, volume: 0 };
      tb.count += 1;
      tb.volume += t.quantity;
      timelineBuckets.set(timeKey, tb);
    });

    const topSymbol = [...symbolMap.entries()].sort((a, b) => b[1].volume - a[1].volume)[0]?.[0] ?? '—';
    const topClient = [...clientMap.entries()].sort((a, b) => b[1].volume - a[1].volume)[0]?.[0] ?? '—';
    const avgQuantity = Math.round(totalQty / trades.length);

    // Prepare Symbol Volume Chart Data
    const symbolVolumeData = [...symbolMap.entries()]
      .map(([symbol, stat]) => ({ symbol, volume: stat.volume, value: Math.round(stat.value) }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

    // Prepare Client Volume Chart Data
    const clientVolumeData = [...clientMap.entries()]
      .map(([client, stat]) => ({ client, volume: stat.volume, count: stat.count }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 6);

    // Prepare Timeline Chart Data
    const timelineData = [...timelineBuckets.values()].reverse().slice(-20);

    // Prepare Distribution (Quantity Buckets)
    const qtyRanges = [
      { name: '50-250', count: 0 },
      { name: '251-500', count: 0 },
      { name: '501-750', count: 0 },
      { name: '751-1000', count: 0 },
    ];
    trades.forEach((t) => {
      if (t.quantity <= 250) qtyRanges[0].count++;
      else if (t.quantity <= 500) qtyRanges[1].count++;
      else if (t.quantity <= 750) qtyRanges[2].count++;
      else qtyRanges[3].count++;
    });

    return {
      totalValue: totalVal,
      topSymbol,
      topClient,
      avgQuantity,
      symbolVolumeData,
      clientVolumeData,
      timelineData,
      distributionData: qtyRanges,
    };
  }, [trades]);

  const COLORS = ['#C79A45', '#4FAE9B', '#D9B25E', '#C0524A', '#8B90A6', '#2A3152'];

  return (
    <div className="space-y-8">
      {/* PAGE TITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-600 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brass-400" />
            <h1 className="font-serif text-2xl font-bold text-paper-100">Trade Analytics Dashboard</h1>
          </div>
          <p className="text-xs text-paper-400 mt-1">
            Realtime market-data statistics computed dynamically from stream buffer ({trades.length} trades).
          </p>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-ink-800 rounded-xl p-4 border border-ink-600 space-y-2">
          <div className="flex items-center justify-between text-paper-400">
            <span className="text-xs font-serif">Total Trade Value</span>
            <DollarSign className="w-4 h-4 text-brass-400" />
          </div>
          <div className="text-xl font-bold font-mono text-paper-100">
            ₹{(analytics.totalValue / 100000).toFixed(2)} Lakhs
          </div>
          <div className="text-[11px] text-paper-400 font-mono">
            ₹{Math.round(analytics.totalValue).toLocaleString()} total turnover
          </div>
        </div>

        <div className="bg-ink-800 rounded-xl p-4 border border-ink-600 space-y-2">
          <div className="flex items-center justify-between text-paper-400">
            <span className="text-xs font-serif">Most Active Symbol</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-bold font-mono text-brass-400">{analytics.topSymbol}</div>
          <div className="text-[11px] text-paper-400 font-mono">Highest trading volume share</div>
        </div>

        <div className="bg-ink-800 rounded-xl p-4 border border-ink-600 space-y-2">
          <div className="flex items-center justify-between text-paper-400">
            <span className="text-xs font-serif">Top Institutional Client</span>
            <Users className="w-4 h-4 text-brass-400" />
          </div>
          <div className="text-xl font-bold font-mono text-paper-100 truncate">{analytics.topClient}</div>
          <div className="text-[11px] text-paper-400 font-mono">Leading order placer</div>
        </div>

        <div className="bg-ink-800 rounded-xl p-4 border border-ink-600 space-y-2">
          <div className="flex items-center justify-between text-paper-400">
            <span className="text-xs font-serif">Average Trade Size</span>
            <Activity className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-bold font-mono text-teal-400">
            {analytics.avgQuantity.toLocaleString()} shares
          </div>
          <div className="text-[11px] text-paper-400 font-mono">Average order quantity</div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Volume by Symbol */}
        <div className="bg-ink-800 rounded-xl p-5 border border-ink-600 space-y-4">
          <div className="flex items-center justify-between border-b border-ink-600 pb-3">
            <h3 className="font-serif text-sm font-bold text-paper-100">Top 10 Symbols by Volume</h3>
            <span className="text-[11px] font-mono text-brass-400">Shares Traded</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.symbolVolumeData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3152" />
                <XAxis dataKey="symbol" stroke="#8B90A6" fontSize={11} tickLine={false} interval={0} angle={-30} textAnchor="end" />
                <YAxis stroke="#8B90A6" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#11162A', borderColor: '#232B4D', borderRadius: '8px', color: '#EDEAE0', fontSize: '12px' }}
                  formatter={(val: any) => [Number(val ?? 0).toLocaleString() + ' shares', 'Volume']}
                />
                <Bar dataKey="volume" fill="#C79A45" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Trade Arrival Timeline */}
        <div className="bg-ink-800 rounded-xl p-5 border border-ink-600 space-y-4">
          <div className="flex items-center justify-between border-b border-ink-600 pb-3">
            <h3 className="font-serif text-sm font-bold text-paper-100">Trade Arrival Timeline</h3>
            <span className="text-[11px] font-mono text-teal-400">Ingested Stream Speed</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3152" />
                <XAxis dataKey="time" stroke="#8B90A6" fontSize={11} tickLine={false} />
                <YAxis stroke="#8B90A6" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#11162A', borderColor: '#232B4D', borderRadius: '8px', color: '#EDEAE0', fontSize: '12px' }}
                  formatter={(val: any) => [Number(val ?? 0).toLocaleString() + ' trades', 'Count']}
                />
                <Area type="monotone" dataKey="count" stroke="#4FAE9B" fill="#4FAE9B" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Top Institutional Clients */}
        <div className="bg-ink-800 rounded-xl p-5 border border-ink-600 space-y-4">
          <div className="flex items-center justify-between border-b border-ink-600 pb-3">
            <h3 className="font-serif text-sm font-bold text-paper-100">Top Clients Volume Share</h3>
            <span className="text-[11px] font-mono text-paper-400">Institutional AMC Share</span>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.clientVolumeData}
                  dataKey="volume"
                  nameKey="client"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={4}
                >
                  {analytics.clientVolumeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#11162A', borderColor: '#232B4D', borderRadius: '8px', color: '#EDEAE0', fontSize: '12px' }}
                  formatter={(val: any) => [Number(val ?? 0).toLocaleString() + ' shares', 'Volume']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: Trade Quantity Spectrum (Distribution) */}
        <div className="bg-ink-800 rounded-xl p-5 border border-ink-600 space-y-4">
          <div className="flex items-center justify-between border-b border-ink-600 pb-3">
            <h3 className="font-serif text-sm font-bold text-paper-100">Order Quantity Spectrum</h3>
            <span className="text-[11px] font-mono text-brass-400">Trade Size Bins</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.distributionData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3152" />
                <XAxis dataKey="name" stroke="#8B90A6" fontSize={11} tickLine={false} />
                <YAxis stroke="#8B90A6" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#11162A', borderColor: '#232B4D', borderRadius: '8px', color: '#EDEAE0', fontSize: '12px' }}
                  formatter={(val: any) => [Number(val ?? 0).toLocaleString() + ' orders', 'Frequency']}
                />
                <Bar dataKey="count" fill="#4FAE9B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
