'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Activity,
} from 'lucide-react';
import { dashboardAPI } from '@/lib/api';
import { formatPercent, formatCurrency, getConfidenceColor } from '@/lib/utils';
import type { DashboardStats, Signal } from '@/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

const mockStats: DashboardStats = {
  totalSignals: 247,
  activeSignals: 5,
  winRate: 72.4,
  avgRR: 2.3,
  totalPnl: 3420.5,
  drawdown: -8.2,
  bestTrade: 520.0,
  worstTrade: -180.0,
  equityCurve: [
    { date: '2024-01', value: 10000 },
    { date: '2024-02', value: 10450 },
    { date: '2024-03', value: 10820 },
    { date: '2024-04', value: 10600 },
    { date: '2024-05', value: 11200 },
    { date: '2024-06', value: 11890 },
    { date: '2024-07', value: 12340 },
    { date: '2024-08', value: 12100 },
    { date: '2024-09', value: 12780 },
    { date: '2024-10', value: 13420 },
  ],
  recentSignals: [
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
      aiExplanation: 'Strong bullish order block detected at 67,200 with significant liquidity sweep below. RSI showing bullish divergence on H4.',
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
      aiExplanation: 'Bearish order block rejection at 1.0870 resistance. MACD crossover bearish on H1. EMA 50 acting as dynamic resistance.',
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
      aiExplanation: 'Breakout above key resistance at 3,440 with strong volume confirmation. RSI at 62, room for upside.',
      status: 'won',
      result: 4.93,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      isPremium: true,
    },
  ],
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const { data } = await dashboardAPI.getStats();
        setStats(data);
      } catch {
        // Use mock data on error
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'Win Rate',
      value: `${stats.winRate}%`,
      icon: Target,
      color: 'text-buy',
      bgColor: 'bg-buy/10',
    },
    {
      label: 'Total P&L',
      value: formatCurrency(stats.totalPnl),
      icon: TrendingUp,
      color: stats.totalPnl >= 0 ? 'text-buy' : 'text-sell',
      bgColor: stats.totalPnl >= 0 ? 'bg-buy/10' : 'bg-sell/10',
    },
    {
      label: 'Active Signals',
      value: stats.activeSignals,
      icon: Zap,
      color: 'text-primary-400',
      bgColor: 'bg-primary-400/10',
    },
    {
      label: 'Avg Risk/Reward',
      value: `${stats.avgRR}:1`,
      icon: BarChart3,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Total Signals',
      value: stats.totalSignals,
      icon: Activity,
      color: 'text-primary-300',
      bgColor: 'bg-primary-300/10',
    },
    {
      label: 'Max Drawdown',
      value: `${stats.drawdown}%`,
      icon: TrendingDown,
      color: 'text-sell',
      bgColor: 'bg-sell/10',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-dark-400">Overview of your trading performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-xs text-dark-400 font-medium uppercase tracking-wide">
                {stat.label}
              </span>
              <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className={`text-lg sm:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts & Signals Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Equity Curve */}
        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold mb-4">Equity Curve</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.equityCurve}>
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Equity']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#equityGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Performance</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-dark-800 rounded-lg">
              <span className="text-dark-400 text-sm">Best Trade</span>
              <span className="text-buy font-semibold">
                {formatCurrency(stats.bestTrade)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-dark-800 rounded-lg">
              <span className="text-dark-400 text-sm">Worst Trade</span>
              <span className="text-sell font-semibold">
                {formatCurrency(stats.worstTrade)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-dark-800 rounded-lg">
              <span className="text-dark-400 text-sm">Win Rate</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-buy rounded-full"
                    style={{ width: `${stats.winRate}%` }}
                  />
                </div>
                <span className="text-buy font-semibold text-sm">
                  {stats.winRate}%
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-dark-800 rounded-lg">
              <span className="text-dark-400 text-sm">Drawdown</span>
              <span className="text-sell font-semibold">{stats.drawdown}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Signals */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Signals</h2>
          <a
            href="/dashboard/signals"
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            View all
          </a>
        </div>
        <div className="space-y-3">
          {stats.recentSignals.map((signal) => (
            <div
              key={signal._id}
              className={`signal-card ${signal.direction.toLowerCase()} p-4`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-lg">{signal.asset}</span>
                  <span
                    className={
                      signal.direction === 'BUY' ? 'badge-buy' : 'badge-sell'
                    }
                  >
                    {signal.direction === 'BUY' ? (
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 mr-1" />
                    )}
                    {signal.direction}
                  </span>
                  <span className="badge-neutral">{signal.timeframe}</span>
                  <span className="badge-neutral hidden sm:inline-flex">{signal.strategy}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${getConfidenceColor(signal.confidenceScore)}`}>
                    {signal.confidenceScore}%
                  </span>
                  {signal.status === 'active' && (
                    <span className="flex items-center gap-1 text-xs text-primary-400">
                      <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
                      LIVE
                    </span>
                  )}
                  {signal.status === 'won' && (
                    <span className="text-xs text-buy font-semibold">
                      +{signal.result}%
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                <div>
                  <span className="text-dark-400">Entry</span>
                  <p className="font-mono font-semibold">{signal.entry}</p>
                </div>
                <div>
                  <span className="text-dark-400">Stop Loss</span>
                  <p className="font-mono font-semibold text-sell">
                    {signal.stopLoss}
                  </p>
                </div>
                <div>
                  <span className="text-dark-400">Take Profit</span>
                  <p className="font-mono font-semibold text-buy">
                    {signal.takeProfit}
                  </p>
                </div>
              </div>
              <div className="bg-dark-800/50 rounded-lg p-3 text-sm text-dark-300">
                <span className="text-primary-400 font-medium">AI Insight:</span>{' '}
                {signal.aiExplanation}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
