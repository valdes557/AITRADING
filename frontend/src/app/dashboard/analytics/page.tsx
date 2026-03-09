'use client';

import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Target,
  Calendar,
  PieChart,
} from 'lucide-react';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const weeklyPnl = [
  { week: 'W1', pnl: 320 },
  { week: 'W2', pnl: -120 },
  { week: 'W3', pnl: 480 },
  { week: 'W4', pnl: 210 },
  { week: 'W5', pnl: -80 },
  { week: 'W6', pnl: 550 },
  { week: 'W7', pnl: 310 },
  { week: 'W8', pnl: -150 },
];

const strategyPerformance = [
  { name: 'Smart Money', winRate: 76, trades: 45, pnl: 1240 },
  { name: 'Order Blocks', winRate: 68, trades: 38, pnl: 820 },
  { name: 'Breakout', winRate: 72, trades: 52, pnl: 960 },
  { name: 'Trend Following', winRate: 80, trades: 30, pnl: 1100 },
];

const assetDistribution = [
  { name: 'BTC/USDT', value: 35, color: '#f7931a' },
  { name: 'ETH/USDT', value: 25, color: '#627eea' },
  { name: 'EUR/USD', value: 20, color: '#22c55e' },
  { name: 'GBP/USD', value: 12, color: '#6366f1' },
  { name: 'Others', value: 8, color: '#64748b' },
];

const monthlyWinRate = [
  { month: 'Jan', rate: 65 },
  { month: 'Feb', rate: 70 },
  { month: 'Mar', rate: 68 },
  { month: 'Apr', rate: 72 },
  { month: 'May', rate: 75 },
  { month: 'Jun', rate: 71 },
  { month: 'Jul', rate: 78 },
  { month: 'Aug', rate: 74 },
];

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#f1f5f9',
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-1">Analytics</h1>
          <p className="text-dark-400 text-sm sm:text-base">Deep dive into your trading performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                period === p
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                  : 'bg-dark-800 text-dark-400 hover:text-dark-200'
              )}
            >
              {p === 'all' ? 'All Time' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly P&L Chart */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold">Weekly P&L</h2>
        </div>
        <div className="h-48 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyPnl}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="week" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'P&L']} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {weeklyPnl.map((entry, i) => (
                  <Cell key={i} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Win Rate Trend */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-buy" />
            <h2 className="text-lg font-semibold">Win Rate Trend</h2>
          </div>
          <div className="h-44 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyWinRate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} domain={[50, 100]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Win Rate']} />
                <Line type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Distribution */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <PieChart className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold">Asset Distribution</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="h-40 w-40 sm:h-48 sm:w-48 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={assetDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    dataKey="value"
                    stroke="none"
                  >
                    {assetDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Share']} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 w-full space-y-2">
              {assetDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-dark-300">{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Performance Table */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold">Strategy Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left py-3 px-4 text-dark-400 font-medium">Strategy</th>
                <th className="text-right py-3 px-4 text-dark-400 font-medium">Trades</th>
                <th className="text-right py-3 px-4 text-dark-400 font-medium">Win Rate</th>
                <th className="text-right py-3 px-4 text-dark-400 font-medium">P&L</th>
                <th className="text-right py-3 px-4 text-dark-400 font-medium">Performance</th>
              </tr>
            </thead>
            <tbody>
              {strategyPerformance.map((strat) => (
                <tr key={strat.name} className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors">
                  <td className="py-3 px-4 font-medium">{strat.name}</td>
                  <td className="py-3 px-4 text-right text-dark-300">{strat.trades}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={strat.winRate >= 70 ? 'text-buy' : 'text-warning'}>
                      {strat.winRate}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={strat.pnl >= 0 ? 'text-buy' : 'text-sell'}>
                      {formatCurrency(strat.pnl)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${strat.winRate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
