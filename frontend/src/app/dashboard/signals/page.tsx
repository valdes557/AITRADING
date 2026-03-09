'use client';

import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { signalsAPI } from '@/lib/api';
import { formatDate, getConfidenceColor, cn } from '@/lib/utils';
import type { Signal } from '@/types';

const mockSignals: Signal[] = [
  {
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
    aiExplanation:
      'Strong bullish order block detected at 67,200 with significant liquidity sweep below. RSI showing bullish divergence on H4. MACD histogram turning positive.',
    status: 'active',
    createdAt: new Date().toISOString(),
    isPremium: false,
  },
  {
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
    aiExplanation:
      'Bearish order block rejection at 1.0870 resistance. MACD crossover bearish on H1. EMA 50 acting as dynamic resistance.',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isPremium: false,
  },
  {
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
    aiExplanation:
      'Breakout above key resistance at 3,440 with strong volume confirmation. RSI at 62, room for upside. EMA20 crossed above EMA50.',
    status: 'won',
    result: 4.93,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    closedAt: new Date(Date.now() - 1800000).toISOString(),
    isPremium: true,
  },
  {
    _id: '4',
    asset: 'GBP/USD',
    market: 'forex',
    direction: 'BUY',
    entry: 1.272,
    stopLoss: 1.269,
    takeProfit: 1.279,
    riskReward: 2.33,
    timeframe: 'M15',
    strategy: 'Trend Following',
    confidenceScore: 74,
    aiExplanation:
      'Strong uptrend confirmed with price above all major EMAs. Pullback to EMA20 providing entry. Volume increasing on the bounce.',
    status: 'lost',
    result: -1.2,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    closedAt: new Date(Date.now() - 10800000).toISOString(),
    isPremium: false,
  },
  {
    _id: '5',
    asset: 'SOL/USDT',
    market: 'crypto',
    direction: 'SELL',
    entry: 172.5,
    stopLoss: 176.0,
    takeProfit: 164.0,
    riskReward: 2.43,
    timeframe: 'H1',
    strategy: 'Smart Money',
    confidenceScore: 71,
    aiExplanation:
      'Bearish SMC setup: liquidity grab above 173 followed by bearish engulfing. RSI overbought at 72 showing divergence.',
    status: 'active',
    createdAt: new Date(Date.now() - 1200000).toISOString(),
    isPremium: false,
  },
];

const statusConfig = {
  active: { label: 'Active', icon: Zap, color: 'text-primary-400', bg: 'bg-primary-400/10' },
  won: { label: 'Won', icon: CheckCircle2, color: 'text-buy', bg: 'bg-buy/10' },
  lost: { label: 'Lost', icon: XCircle, color: 'text-sell', bg: 'bg-sell/10' },
  expired: { label: 'Expired', icon: Clock, color: 'text-dark-400', bg: 'bg-dark-400/10' },
  cancelled: { label: 'Cancelled', icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10' },
};

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>(mockSignals);
  const [filter, setFilter] = useState<string>('all');
  const [marketFilter, setMarketFilter] = useState<string>('all');

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const { data } = await signalsAPI.getHistory({ limit: 50 });
        if (data.signals?.length > 0) setSignals(data.signals);
      } catch {
        // Use mock data
      }
    };
    fetchSignals();
  }, []);

  const filtered = signals.filter((s) => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (marketFilter !== 'all' && s.market !== marketFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold mb-1">Trading Signals</h1>
        <p className="text-dark-400 text-sm sm:text-base">AI-generated signals for your preferred markets</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-dark-400" />
          <span className="text-sm text-dark-400">Status:</span>
        </div>
        {['all', 'active', 'won', 'lost'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              filter === s
                ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                : 'bg-dark-800 text-dark-400 hover:text-dark-200 border border-transparent'
            )}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}

        <div className="hidden sm:block w-px h-8 bg-dark-700 mx-2" />

        <span className="text-sm text-dark-400 self-center">Market:</span>
        {['all', 'crypto', 'forex'].map((m) => (
          <button
            key={m}
            onClick={() => setMarketFilter(m)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              marketFilter === m
                ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                : 'bg-dark-800 text-dark-400 hover:text-dark-200 border border-transparent'
            )}
          >
            {m === 'all' ? 'All' : m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Signals List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="card text-center py-12">
            <Zap className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark-400">No signals found</h3>
            <p className="text-dark-500 text-sm mt-1">Try changing your filters</p>
          </div>
        ) : (
          filtered.map((signal) => {
            const status = statusConfig[signal.status];
            const StatusIcon = status.icon;

            return (
              <div
                key={signal._id}
                className={`signal-card ${signal.direction.toLowerCase()} p-5`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-bold">{signal.asset}</h3>
                    <span
                      className={signal.direction === 'BUY' ? 'badge-buy' : 'badge-sell'}
                    >
                      {signal.direction === 'BUY' ? (
                        <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
                      )}
                      {signal.direction}
                    </span>
                    <span className="badge-neutral">{signal.timeframe}</span>
                    <span className="badge-neutral hidden sm:inline-flex">{signal.strategy}</span>
                    <span className={cn('badge-neutral', status.color, status.bg)}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-bold ${getConfidenceColor(signal.confidenceScore)}`}
                    >
                      {signal.confidenceScore}%
                    </span>
                    {signal.isPremium && (
                      <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full font-semibold">
                        PREMIUM
                      </span>
                    )}
                  </div>
                </div>

                {/* Prices */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="bg-dark-800/50 rounded-lg p-3">
                    <span className="text-xs text-dark-400 uppercase tracking-wide">Entry</span>
                    <p className="font-mono font-bold text-lg">{signal.entry}</p>
                  </div>
                  <div className="bg-dark-800/50 rounded-lg p-3">
                    <span className="text-xs text-dark-400 uppercase tracking-wide">Stop Loss</span>
                    <p className="font-mono font-bold text-lg text-sell">{signal.stopLoss}</p>
                  </div>
                  <div className="bg-dark-800/50 rounded-lg p-3">
                    <span className="text-xs text-dark-400 uppercase tracking-wide">Take Profit</span>
                    <p className="font-mono font-bold text-lg text-buy">{signal.takeProfit}</p>
                  </div>
                  <div className="bg-dark-800/50 rounded-lg p-3">
                    <span className="text-xs text-dark-400 uppercase tracking-wide">Risk/Reward</span>
                    <p className="font-mono font-bold text-lg text-primary-400">
                      {signal.riskReward}:1
                    </p>
                  </div>
                </div>

                {/* AI Explanation */}
                <div className="bg-dark-800/30 border border-dark-700/50 rounded-lg p-4">
                  <span className="text-sm font-semibold text-primary-400">AI Analysis</span>
                  <p className="text-sm text-dark-300 mt-1">{signal.aiExplanation}</p>
                </div>

                {/* Footer */}
                <div className="flex flex-wrap items-center justify-between mt-3 text-xs text-dark-500">
                  <span>{formatDate(signal.createdAt)}</span>
                  {signal.result !== undefined && (
                    <span
                      className={cn(
                        'font-bold text-sm',
                        signal.result >= 0 ? 'text-buy' : 'text-sell'
                      )}
                    >
                      {signal.result >= 0 ? '+' : ''}
                      {signal.result}%
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
