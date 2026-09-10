import React from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-ink-900 text-paper-100 font-sans flex flex-col selection:bg-brass-500/30 selection:text-paper-100">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      <footer className="border-t border-ink-600 bg-ink-950 py-4 px-6 mt-12 text-xs text-paper-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400"></span>
            <span>BSE Live Trade Operations Terminal</span>
            <span className="text-ink-600">|</span>
            <span className="text-brass-400">Zero Polling Architecture</span>
          </div>
          <div className="text-[11px] text-paper-400 flex items-center gap-4">
            <span>Network Ceiling: &lt;30s connections</span>
            <span>Push Mechanism: Supabase / EventStream</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
