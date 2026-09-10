import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  BarChart2,
  Cpu,
  History,
  Play,
  Search,
  Terminal,
  Zap,
  Globe,
} from 'lucide-react';
import { usePullStatus } from '../../hooks/usePullStatus';
import { useTradesRealtime } from '../../hooks/useTradesRealtime';
import { startPull } from '../../lib/api';
import { useState } from 'react';

export function Navbar() {
  const location = useLocation();
  const { pullRun } = usePullStatus();
  const { trades } = useTradesRealtime();
  const [starting, setStarting] = useState(false);

  const isPulling = pullRun?.status === 'running';

  async function handleStartPull() {
    if (isPulling || starting) return;
    setStarting(true);
    try {
      await startPull();
    } catch (err) {
      console.error('Failed to start pull:', err);
    } finally {
      setStarting(false);
    }
  }

  const navItems = [
    { label: 'Overview', path: '/', icon: Globe },
    { label: 'Live Ops', path: '/live', icon: Activity, badge: isPulling ? 'LIVE' : undefined },
    { label: 'Analytics', path: '/analytics', icon: BarChart2 },
    { label: 'Pull Runs', path: '/runs', icon: History },
    { label: 'Pipeline Health', path: '/pipeline', icon: Cpu },
    { label: 'Trade Explorer', path: '/trades', icon: Search },
  ];

  return (
    <header className="sticky top-0 z-50 bg-ink-950/90 backdrop-blur-md border-b border-ink-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-brass-500/10 border border-brass-500/30 flex items-center justify-center text-brass-400 group-hover:border-brass-400 transition-colors">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif text-base font-bold text-paper-100 tracking-tight">
                    BSE TradeOps
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-ink-700 text-brass-400 border border-brass-500/20 px-1.5 py-0.5 rounded">
                    v2.0
                  </span>
                </div>
                <p className="text-[11px] text-paper-400 hidden sm:block">
                  Exchange Data Engine
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-ink-700 text-paper-100 border border-brass-500/30 shadow-sm'
                      : 'text-paper-400 hover:text-paper-100 hover:bg-ink-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brass-400' : 'text-paper-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action & Live Telemetry Badge */}
          <div className="flex items-center gap-3">
            {/* Realtime Stream Badge */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded border border-teal-400/30 bg-teal-400/5 text-teal-400 text-[11px] font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
              </span>
              <span>REALTIME NO-POLL</span>
            </div>

            {/* Quick Stat Ticker */}
            <div className="hidden sm:flex flex-col text-right font-mono text-[11px] text-paper-400 border-l border-ink-600 pl-3">
              <span className="text-paper-100 font-bold">{trades.length.toLocaleString()} Trades</span>
              <span className="text-[10px] text-paper-400">
                {isPulling ? `${pullRun?.ingested_count ?? 0} Ingesting...` : 'Pipeline Idle'}
              </span>
            </div>

            {/* Start Pull CTA */}
            <button
              onClick={handleStartPull}
              disabled={isPulling || starting}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                isPulling
                  ? 'bg-ink-700 text-paper-400 cursor-not-allowed border border-ink-600'
                  : 'bg-brass-500 hover:bg-brass-400 text-ink-950 font-bold shadow-md shadow-brass-500/20 active:scale-95'
              }`}
            >
              {isPulling ? (
                <>
                  <Zap className="w-3.5 h-3.5 animate-spin text-brass-400" />
                  <span>Pull Active</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{starting ? 'Starting...' : 'Start Pull'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-ink-600 overflow-x-auto text-[11px]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 ${
                  isActive ? 'text-brass-400 font-bold' : 'text-paper-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
