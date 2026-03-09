export interface User {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: 'free' | 'basic' | 'pro' | 'vip' | 'expired';
  planExpiresAt?: string;
  preferences: UserPreferences;
  telegramChatId?: string;
  whatsappNumber?: string;
  createdAt: string;
  role: 'user' | 'admin';
}

export interface UserPreferences {
  markets: ('crypto' | 'forex' | 'indices')[];
  tradingStyle: ('scalping' | 'intraday' | 'swing')[];
  strategies: ('smart_money' | 'order_blocks' | 'breakout' | 'trend_following')[];
  timeframes: ('M5' | 'M15' | 'H1' | 'H4')[];
  notifications: {
    telegram: boolean;
    email: boolean;
    whatsapp: boolean;
    webPush: boolean;
  };
}

export interface Signal {
  _id: string;
  asset: string;
  market: 'crypto' | 'forex';
  direction: 'BUY' | 'SELL';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  timeframe: string;
  strategy: string;
  confidenceScore: number;
  aiExplanation: string;
  status: 'active' | 'won' | 'lost' | 'expired' | 'cancelled';
  result?: number;
  createdAt: string;
  closedAt?: string;
  isPremium: boolean;
}

export interface JournalEntry {
  _id: string;
  userId: string;
  signalId: string;
  signal: Signal;
  action: 'followed' | 'skipped' | 'modified';
  entryPrice?: number;
  exitPrice?: number;
  pnl?: number;
  pnlPercent?: number;
  notes?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalSignals: number;
  activeSignals: number;
  winRate: number;
  avgRR: number;
  totalPnl: number;
  drawdown: number;
  bestTrade: number;
  worstTrade: number;
  equityCurve: EquityPoint[];
  recentSignals: Signal[];
  dailyAnalysis?: DailyAnalysis;
}

export interface EquityPoint {
  date: string;
  value: number;
}

export interface DailyAnalysis {
  date: string;
  marketSummary: string;
  bias: string;
  opportunities: string[];
  keyLevels: { asset: string; support: number; resistance: number }[];
}

export interface Subscription {
  _id: string;
  userId: string;
  plan: 'free' | 'basic' | 'pro' | 'vip' | 'expired';
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  paymentMethod: string;
  amount: number;
}

export interface PlanInfo {
  id: 'free' | 'basic' | 'pro' | 'vip';
  name: string;
  price: number;
  features: string[];
  signalsPerDay: number | 'unlimited';
  highlighted?: boolean;
}

export interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  revenue: number;
  signalsGenerated: number;
  userGrowth: { date: string; count: number }[];
}
