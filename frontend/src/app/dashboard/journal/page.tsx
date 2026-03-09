'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen,
  Plus,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { journalAPI } from '@/lib/api';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import type { JournalEntry } from '@/types';

const mockEntries: JournalEntry[] = [
  {
    _id: '1',
    userId: '1',
    signalId: '1',
    signal: {
      _id: '1',
      asset: 'BTC/USDT',
      market: 'crypto',
      direction: 'BUY',
      entry: 67500,
      stopLoss: 66800,
      takeProfit: 69200,
      riskReward: 2.43,
      timeframe: 'H4',
      strategy: 'Smart Money',
      confidenceScore: 87,
      aiExplanation: 'Bullish order block with liquidity sweep',
      status: 'won',
      result: 2.52,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      isPremium: false,
    },
    action: 'followed',
    entryPrice: 67500,
    exitPrice: 69200,
    pnl: 340,
    pnlPercent: 2.52,
    notes: 'Great setup, followed the signal perfectly. Entry was right at the OB.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: '2',
    userId: '1',
    signalId: '2',
    signal: {
      _id: '2',
      asset: 'EUR/USD',
      market: 'forex',
      direction: 'SELL',
      entry: 1.0865,
      stopLoss: 1.0895,
      takeProfit: 1.0785,
      riskReward: 2.67,
      timeframe: 'H1',
      strategy: 'Order Blocks',
      confidenceScore: 79,
      aiExplanation: 'Bearish OB rejection at resistance',
      status: 'lost',
      result: -1.1,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      isPremium: false,
    },
    action: 'followed',
    entryPrice: 1.0865,
    exitPrice: 1.0895,
    pnl: -120,
    pnlPercent: -1.1,
    notes: 'Stopped out. News event caused a spike against the position.',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    _id: '3',
    userId: '1',
    signalId: '3',
    signal: {
      _id: '3',
      asset: 'ETH/USDT',
      market: 'crypto',
      direction: 'BUY',
      entry: 3450,
      stopLoss: 3380,
      takeProfit: 3620,
      riskReward: 2.43,
      timeframe: 'H4',
      strategy: 'Breakout',
      confidenceScore: 82,
      aiExplanation: 'Breakout above 3440 with volume',
      status: 'won',
      result: 4.93,
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      isPremium: true,
    },
    action: 'followed',
    entryPrice: 3450,
    exitPrice: 3620,
    pnl: 510,
    pnlPercent: 4.93,
    notes: 'Excellent breakout. Held through a small pullback. Discipline paid off.',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>(mockEntries);
  const [stats, setStats] = useState({
    totalTrades: 3,
    wins: 2,
    losses: 1,
    winRate: 66.7,
    totalPnl: 730,
    avgWin: 425,
    avgLoss: -120,
    profitFactor: 3.54,
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const [entriesRes, statsRes] = await Promise.all([
          journalAPI.getEntries({ limit: 50 }),
          journalAPI.getStats(),
        ]);
        if (entriesRes.data.entries?.length > 0) setEntries(entriesRes.data.entries);
        if (statsRes.data) setStats(statsRes.data);
      } catch {
        // Use mock data
      }
    };
    fetch();
  }, []);

  const statCards = [
    { label: 'Total Trades', value: stats.totalTrades, color: 'text-dark-100' },
    { label: 'Win Rate', value: `${stats.winRate}%`, color: 'text-buy' },
    { label: 'Total P&L', value: formatCurrency(stats.totalPnl), color: stats.totalPnl >= 0 ? 'text-buy' : 'text-sell' },
    { label: 'Profit Factor', value: stats.profitFactor, color: 'text-primary-400' },
    { label: 'Avg Win', value: formatCurrency(stats.avgWin), color: 'text-buy' },
    { label: 'Avg Loss', value: formatCurrency(stats.avgLoss), color: 'text-sell' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold mb-1">Trading Journal</h1>
        <p className="text-dark-400 text-sm sm:text-base">Track your trades and improve your discipline</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="stat-card">
            <span className="text-xs text-dark-400 font-medium uppercase tracking-wide">
              {stat.label}
            </span>
            <p className={`text-lg sm:text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Journal Entries */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="card text-center py-12">
            <BookOpen className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark-400">No journal entries yet</h3>
            <p className="text-dark-500 text-sm mt-1">
              Your trades will appear here automatically
            </p>
          </div>
        ) : (
          entries.map((entry) => {
            const signal = entry.signal;
            const isPnlPositive = (entry.pnl || 0) >= 0;

            return (
              <div key={entry._id} className="card-hover">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center',
                        isPnlPositive ? 'bg-buy/10' : 'bg-sell/10'
                      )}
                    >
                      {isPnlPositive ? (
                        <TrendingUp className="w-5 h-5 text-buy" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-sell" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">{signal.asset}</h3>
                        <span
                          className={
                            signal.direction === 'BUY' ? 'badge-buy' : 'badge-sell'
                          }
                        >
                          {signal.direction}
                        </span>
                        <span className="badge-neutral">{signal.timeframe}</span>
                        <span className="badge-neutral hidden sm:inline-flex">{signal.strategy}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-xs text-dark-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(entry.createdAt)}
                        </span>
                        <span>
                          Action:{' '}
                          <span className="text-dark-300 capitalize">{entry.action}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex sm:block items-center gap-3">
                    <p
                      className={cn(
                        'text-lg sm:text-xl font-bold',
                        isPnlPositive ? 'text-buy' : 'text-sell'
                      )}
                    >
                      {isPnlPositive ? '+' : ''}
                      {formatCurrency(entry.pnl || 0)}
                    </p>
                    <p
                      className={cn(
                        'text-sm',
                        isPnlPositive ? 'text-buy' : 'text-sell'
                      )}
                    >
                      {isPnlPositive ? '+' : ''}
                      {entry.pnlPercent?.toFixed(2)}%
                    </p>
                  </div>
                </div>

                {/* Trade Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  <div className="bg-dark-800/50 rounded-lg p-2 text-center">
                    <span className="text-xs text-dark-400">Entry</span>
                    <p className="font-mono text-sm font-semibold">{entry.entryPrice}</p>
                  </div>
                  <div className="bg-dark-800/50 rounded-lg p-2 text-center">
                    <span className="text-xs text-dark-400">Exit</span>
                    <p className="font-mono text-sm font-semibold">{entry.exitPrice}</p>
                  </div>
                  <div className="bg-dark-800/50 rounded-lg p-2 text-center">
                    <span className="text-xs text-dark-400">SL</span>
                    <p className="font-mono text-sm font-semibold text-sell">
                      {signal.stopLoss}
                    </p>
                  </div>
                  <div className="bg-dark-800/50 rounded-lg p-2 text-center">
                    <span className="text-xs text-dark-400">TP</span>
                    <p className="font-mono text-sm font-semibold text-buy">
                      {signal.takeProfit}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {entry.notes && (
                  <div className="bg-dark-800/30 rounded-lg p-3 flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-dark-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-dark-300">{entry.notes}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
