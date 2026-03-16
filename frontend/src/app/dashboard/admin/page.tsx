'use client';

import { useEffect, useState } from 'react';
import {
  Shield,
  DollarSign,
  Star,
  Plus,
  Trash2,
  Save,
  Loader2,
  MessageSquare,
  Users,
  Settings,
  X,
  Search,
  Crown,
  Ban,
  CheckCircle,
  Image,
  TrendingUp,
  Send,
} from 'lucide-react';
import { adminAPI, chatAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface PlanConfig {
  _id: string;
  planId: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  signalsPerDay: any;
  highlighted: boolean;
  isActive: boolean;
}

interface Testimonial {
  _id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  isVisible: boolean;
  order: number;
}

interface ClientUser {
  _id: string;
  name: string;
  email: string;
  plan: string;
  planExpiresAt?: string;
  role: string;
  isBanned: boolean;
  createdAt: string;
}

type TabKey = 'clients' | 'signals' | 'plans' | 'testimonials' | 'settings';

export default function AdminPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>('clients');
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Clients
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  // Site config
  const [platformName, setPlatformName] = useState('AI Trading Signals');
  const [logoUrl, setLogoUrl] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  // New testimonial form
  const [showForm, setShowForm] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({
    name: '',
    role: '',
    text: '',
    rating: 5,
  });
  const [submitting, setSubmitting] = useState(false);

  // Manual signal form
  const [signalForm, setSignalForm] = useState({
    asset: '',
    market: 'crypto',
    direction: 'BUY',
    entry: '',
    stopLoss: '',
    takeProfit: '',
    timeframe: 'H1',
    strategy: 'smart_money',
    confidenceScore: '75',
    aiExplanation: '',
    isPremium: false,
  });
  const [sendingSignal, setSendingSignal] = useState(false);
  const [shareToChat, setShareToChat] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, testimonialsRes, statsRes, usersRes, configRes] = await Promise.allSettled([
        adminAPI.getPlans(),
        adminAPI.getTestimonials(),
        adminAPI.getStats(),
        adminAPI.getUsers({ page: 1 }),
        adminAPI.getSiteConfig(),
      ]);

      if (plansRes.status === 'fulfilled') setPlans(plansRes.value.data.plans || []);
      if (testimonialsRes.status === 'fulfilled') setTestimonials(testimonialsRes.value.data.testimonials || []);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (usersRes.status === 'fulfilled') setClients(usersRes.value.data.users || []);
      if (configRes.status === 'fulfilled') {
        setPlatformName(configRes.value.data.platformName || 'AI Trading Signals');
        setLogoUrl(configRes.value.data.logoUrl || '');
      }
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const searchClients = async () => {
    try {
      const { data } = await adminAPI.getUsers({ search: clientSearch });
      setClients(data.users || []);
    } catch {
      toast.error('Search failed');
    }
  };

  const handleUpdateUserPlan = async (userId: string, plan: string) => {
    setUpdatingUser(userId);
    try {
      const { data } = await adminAPI.updateUserPlan(userId, { plan, duration: 30 });
      setClients((prev) =>
        prev.map((c) =>
          c._id === userId ? { ...c, plan: data.user.plan, planExpiresAt: data.user.planExpiresAt } : c
        )
      );
      toast.success(data.message);
    } catch {
      toast.error('Failed to update user plan');
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleBanToggle = async (userId: string, isBanned: boolean) => {
    try {
      if (isBanned) {
        await adminAPI.unbanUser(userId);
      } else {
        await adminAPI.banUser(userId);
      }
      setClients((prev) =>
        prev.map((c) => (c._id === userId ? { ...c, isBanned: !isBanned } : c))
      );
      toast.success(isBanned ? 'User unbanned' : 'User banned');
    } catch {
      toast.error('Action failed');
    }
  };

  const handleUpdatePlanPrice = async (planId: string, newPrice: number) => {
    setSavingPlan(planId);
    try {
      await adminAPI.updatePlan(planId, { price: newPrice });
      setPlans((prev) =>
        prev.map((p) => (p.planId === planId ? { ...p, price: newPrice } : p))
      );
      toast.success(`${planId} plan price updated to $${newPrice}`);
    } catch {
      toast.error('Failed to update plan price');
    } finally {
      setSavingPlan(null);
    }
  };

  const handleUpdatePlanFeatures = async (planId: string, features: string[]) => {
    setSavingPlan(planId);
    try {
      await adminAPI.updatePlan(planId, { features });
      setPlans((prev) =>
        prev.map((p) => (p.planId === planId ? { ...p, features } : p))
      );
      toast.success('Features updated');
    } catch {
      toast.error('Failed to update features');
    } finally {
      setSavingPlan(null);
    }
  };

  const handleSaveSiteConfig = async () => {
    setSavingConfig(true);
    try {
      await adminAPI.updateSiteConfig({ platformName, logoUrl });
      toast.success('Platform settings saved!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleAddTestimonial = async () => {
    if (!newTestimonial.name || !newTestimonial.role || !newTestimonial.text) {
      toast.error('All fields are required');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await adminAPI.createTestimonial(newTestimonial);
      setTestimonials((prev) => [data.testimonial, ...prev]);
      setNewTestimonial({ name: '', role: '', text: '', rating: 5 });
      setShowForm(false);
      toast.success('Testimonial added!');
    } catch {
      toast.error('Failed to add testimonial');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    try {
      await adminAPI.deleteTestimonial(id);
      setTestimonials((prev) => prev.filter((t) => t._id !== id));
      toast.success('Testimonial deleted');
    } catch {
      toast.error('Failed to delete testimonial');
    }
  };

  const handleToggleVisibility = async (id: string, isVisible: boolean) => {
    try {
      await adminAPI.updateTestimonial(id, { isVisible: !isVisible });
      setTestimonials((prev) =>
        prev.map((t) => (t._id === id ? { ...t, isVisible: !isVisible } : t))
      );
    } catch {
      toast.error('Failed to update visibility');
    }
  };

  const handleSendSignal = async () => {
    const { asset, market, direction, entry, stopLoss, takeProfit, timeframe, strategy, confidenceScore, aiExplanation } = signalForm;
    if (!asset || !entry || !stopLoss || !takeProfit || !aiExplanation) {
      toast.error('All fields are required');
      return;
    }
    setSendingSignal(true);
    try {
      const { data } = await adminAPI.createManualSignal({
        asset: asset.toUpperCase(),
        market,
        direction,
        entry: parseFloat(entry),
        stopLoss: parseFloat(stopLoss),
        takeProfit: parseFloat(takeProfit),
        timeframe,
        strategy,
        confidenceScore: parseInt(confidenceScore),
        aiExplanation,
        isPremium: signalForm.isPremium,
      });

      // Optionally share the signal in the group chat
      if (shareToChat && data.signal?._id) {
        try {
          await chatAPI.sendSignalMessage(data.signal._id);
        } catch {}
      }

      toast.success('Signal sent + notifications dispatched!');
      setSignalForm({
        asset: '',
        market: 'crypto',
        direction: 'BUY',
        entry: '',
        stopLoss: '',
        takeProfit: '',
        timeframe: 'H1',
        strategy: 'smart_money',
        confidenceScore: '75',
        aiExplanation: '',
        isPremium: false,
      });
    } catch {
      toast.error('Failed to send signal');
    } finally {
      setSendingSignal(false);
    }
  };

  const planColors: Record<string, string> = {
    free: 'text-dark-400 bg-dark-700',
    basic: 'text-blue-400 bg-blue-500/15',
    pro: 'text-primary-400 bg-primary-500/15',
    vip: 'text-warning bg-warning/15',
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-dark-400">Admin Access Required</h2>
          <p className="text-dark-500 mt-2">You don&apos;t have permission to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold mb-1">Admin Panel</h1>
        <p className="text-dark-400 text-sm sm:text-base">Manage clients, plans, testimonials, and platform settings</p>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <span className="text-xs text-dark-400 uppercase">Users</span>
            <p className="text-lg sm:text-2xl font-bold">{stats.totalUsers}</p>
          </div>
          <div className="stat-card">
            <span className="text-xs text-dark-400 uppercase">Active Subs</span>
            <p className="text-lg sm:text-2xl font-bold text-primary-400">{stats.activeSubscriptions}</p>
          </div>
          <div className="stat-card">
            <span className="text-xs text-dark-400 uppercase">Revenue</span>
            <p className="text-lg sm:text-2xl font-bold text-buy">${stats.revenue}</p>
          </div>
          <div className="stat-card">
            <span className="text-xs text-dark-400 uppercase">Signals</span>
            <p className="text-lg sm:text-2xl font-bold">{stats.signalsGenerated}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-dark-700 pb-2 overflow-x-auto">
        {[
          { key: 'clients' as TabKey, label: 'Clients', icon: Users },
          { key: 'signals' as TabKey, label: 'Send Signal', icon: TrendingUp },
          { key: 'plans' as TabKey, label: 'Plan Pricing', icon: DollarSign },
          { key: 'testimonials' as TabKey, label: 'Testimonials', icon: MessageSquare },
          { key: 'settings' as TabKey, label: 'Settings', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              activeTab === tab.key
                ? 'bg-primary-600/15 text-primary-400 border border-primary-500/30'
                : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========== CLIENTS TAB ========== */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchClients()}
                placeholder="Search by name or email..."
                className="input-field pl-10 w-full"
              />
            </div>
            <button onClick={searchClients} className="btn-primary px-4">
              Search
            </button>
          </div>

          <div className="space-y-2">
            {clients.length === 0 ? (
              <div className="card text-center py-8">
                <Users className="w-10 h-10 text-dark-600 mx-auto mb-3" />
                <p className="text-dark-400">No clients found</p>
              </div>
            ) : (
              clients.map((client) => (
                <div
                  key={client._id}
                  className={cn('card', client.isBanned && 'opacity-50 border-sell/30')}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold truncate">{client.name}</p>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium uppercase', planColors[client.plan] || planColors.free)}>
                          {client.plan}
                        </span>
                        {client.isBanned && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-sell/20 text-sell">Banned</span>
                        )}
                      </div>
                      <p className="text-sm text-dark-400 truncate">{client.email}</p>
                      <div className="flex gap-4 mt-1 text-xs text-dark-500">
                        <span>Joined: {new Date(client.createdAt).toLocaleDateString()}</span>
                        {client.planExpiresAt && (
                          <span>Expires: {new Date(client.planExpiresAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={client.plan}
                        onChange={(e) => handleUpdateUserPlan(client._id, e.target.value)}
                        disabled={updatingUser === client._id}
                        className="input-field text-sm py-1.5 px-3 w-28"
                      >
                        <option value="free">Free</option>
                        <option value="basic">Basic</option>
                        <option value="pro">Pro</option>
                        <option value="vip">VIP</option>
                      </select>

                      {updatingUser === client._id && (
                        <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
                      )}

                      <button
                        onClick={() => handleBanToggle(client._id, client.isBanned)}
                        className={cn(
                          'text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
                          client.isBanned
                            ? 'bg-buy/15 text-buy hover:bg-buy/25'
                            : 'bg-sell/15 text-sell hover:bg-sell/25'
                        )}
                      >
                        {client.isBanned ? 'Unban' : 'Ban'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========== SEND SIGNAL TAB ========== */}
      {activeTab === 'signals' && (
        <div className="space-y-4">
          <p className="text-sm text-dark-400">
            Create and send a manual trading signal. Users will receive notifications (Email, Telegram, WhatsApp) just like AI-generated signals.
          </p>

          <div className="card max-w-2xl">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-400" />
              New Signal
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-dark-400 mb-1 block">Asset *</label>
                <input
                  type="text"
                  value={signalForm.asset}
                  onChange={(e) => setSignalForm((p) => ({ ...p, asset: e.target.value }))}
                  placeholder="BTC/USDT, EUR/USD..."
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-sm text-dark-400 mb-1 block">Market *</label>
                <select
                  value={signalForm.market}
                  onChange={(e) => setSignalForm((p) => ({ ...p, market: e.target.value }))}
                  className="input-field"
                >
                  <option value="crypto">Crypto</option>
                  <option value="forex">Forex</option>
                  <option value="indices">Indices</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-sm text-dark-400 mb-1 block">Direction *</label>
                <select
                  value={signalForm.direction}
                  onChange={(e) => setSignalForm((p) => ({ ...p, direction: e.target.value }))}
                  className="input-field"
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-dark-400 mb-1 block">Entry *</label>
                <input
                  type="number"
                  step="any"
                  value={signalForm.entry}
                  onChange={(e) => setSignalForm((p) => ({ ...p, entry: e.target.value }))}
                  placeholder="0.00"
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-sm text-dark-400 mb-1 block">Stop Loss *</label>
                <input
                  type="number"
                  step="any"
                  value={signalForm.stopLoss}
                  onChange={(e) => setSignalForm((p) => ({ ...p, stopLoss: e.target.value }))}
                  placeholder="0.00"
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-sm text-dark-400 mb-1 block">Take Profit *</label>
                <input
                  type="number"
                  step="any"
                  value={signalForm.takeProfit}
                  onChange={(e) => setSignalForm((p) => ({ ...p, takeProfit: e.target.value }))}
                  placeholder="0.00"
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm text-dark-400 mb-1 block">Timeframe</label>
                <select
                  value={signalForm.timeframe}
                  onChange={(e) => setSignalForm((p) => ({ ...p, timeframe: e.target.value }))}
                  className="input-field"
                >
                  <option value="M5">M5</option>
                  <option value="M15">M15</option>
                  <option value="H1">H1</option>
                  <option value="H4">H4</option>
                  <option value="D1">D1</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-dark-400 mb-1 block">Strategy</label>
                <select
                  value={signalForm.strategy}
                  onChange={(e) => setSignalForm((p) => ({ ...p, strategy: e.target.value }))}
                  className="input-field"
                >
                  <option value="smart_money">Smart Money</option>
                  <option value="order_blocks">Order Blocks</option>
                  <option value="breakout">Breakout</option>
                  <option value="trend_following">Trend Following</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-dark-400 mb-1 block">Confidence (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={signalForm.confidenceScore}
                  onChange={(e) => setSignalForm((p) => ({ ...p, confidenceScore: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm text-dark-400 mb-1 block">AI Explanation / Analysis *</label>
              <textarea
                value={signalForm.aiExplanation}
                onChange={(e) => setSignalForm((p) => ({ ...p, aiExplanation: e.target.value }))}
                placeholder="Describe your analysis, key levels, and reasoning..."
                rows={4}
                className="input-field resize-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={signalForm.isPremium}
                  onChange={(e) => setSignalForm((p) => ({ ...p, isPremium: e.target.checked }))}
                  className="w-4 h-4 rounded bg-dark-700 border-dark-600 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-dark-300">Premium signal (Pro/VIP only)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareToChat}
                  onChange={(e) => setShareToChat(e.target.checked)}
                  className="w-4 h-4 rounded bg-dark-700 border-dark-600 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-dark-300">Share in group chat</span>
              </label>
            </div>

            <button
              onClick={handleSendSignal}
              disabled={sendingSignal}
              className="btn-primary flex items-center gap-2 px-6"
            >
              {sendingSignal ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send Signal & Notify Users
            </button>
          </div>
        </div>
      )}

      {/* ========== PLAN PRICING TAB ========== */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <p className="text-sm text-dark-400">
            Modify the price of each subscription plan. Changes are applied immediately.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div key={plan.planId} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    <span className="text-xs text-dark-400 uppercase">{plan.planId}</span>
                  </div>
                  {plan.highlighted && (
                    <span className="text-xs bg-primary-600/20 text-primary-400 px-2 py-1 rounded-full">
                      Popular
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <label className="text-sm text-dark-400 mb-1 block">Price ($/month)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      value={plan.price}
                      onChange={(e) =>
                        setPlans((prev) =>
                          prev.map((p) =>
                            p.planId === plan.planId
                              ? { ...p, price: parseFloat(e.target.value) || 0 }
                              : p
                          )
                        )
                      }
                      className="input-field flex-1"
                    />
                    <button
                      onClick={() => handleUpdatePlanPrice(plan.planId, plan.price)}
                      disabled={savingPlan === plan.planId}
                      className="btn-primary flex items-center gap-1 px-4"
                    >
                      {savingPlan === plan.planId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-dark-400 mb-1 block">Features</label>
                  <div className="space-y-1">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={f}
                          onChange={(e) => {
                            const updated = [...plan.features];
                            updated[i] = e.target.value;
                            setPlans((prev) =>
                              prev.map((p) =>
                                p.planId === plan.planId ? { ...p, features: updated } : p
                              )
                            );
                          }}
                          className="input-field text-xs py-1 flex-1"
                        />
                        <button
                          onClick={() => {
                            const updated = plan.features.filter((_, idx) => idx !== i);
                            setPlans((prev) =>
                              prev.map((p) =>
                                p.planId === plan.planId ? { ...p, features: updated } : p
                              )
                            );
                          }}
                          className="text-dark-500 hover:text-sell"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() =>
                          setPlans((prev) =>
                            prev.map((p) =>
                              p.planId === plan.planId
                                ? { ...p, features: [...p.features, ''] }
                                : p
                            )
                          )
                        }
                        className="text-xs text-primary-400 hover:underline"
                      >
                        + Add feature
                      </button>
                      <button
                        onClick={() => handleUpdatePlanFeatures(plan.planId, plan.features)}
                        className="text-xs text-buy hover:underline ml-auto"
                      >
                        Save features
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== TESTIMONIALS TAB ========== */}
      {activeTab === 'testimonials' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-dark-400">
              Manage client reviews displayed on the landing page.
            </p>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Testimonial
            </button>
          </div>

          {/* Add Form */}
          {showForm && (
            <div className="card border-primary-500/30">
              <h3 className="font-semibold mb-4">New Testimonial</h3>
              <div className="grid md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-sm text-dark-400 mb-1 block">Client Name</label>
                  <input
                    type="text"
                    value={newTestimonial.name}
                    onChange={(e) => setNewTestimonial((p) => ({ ...p, name: e.target.value }))}
                    placeholder="John D."
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-sm text-dark-400 mb-1 block">Role</label>
                  <input
                    type="text"
                    value={newTestimonial.role}
                    onChange={(e) => setNewTestimonial((p) => ({ ...p, role: e.target.value }))}
                    placeholder="Crypto Trader"
                    className="input-field"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="text-sm text-dark-400 mb-1 block">Review Text</label>
                <textarea
                  value={newTestimonial.text}
                  onChange={(e) => setNewTestimonial((p) => ({ ...p, text: e.target.value }))}
                  placeholder="This platform changed my trading..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
              <div className="mb-4">
                <label className="text-sm text-dark-400 mb-1 block">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => setNewTestimonial((p) => ({ ...p, rating: r }))}
                    >
                      <Star
                        className={cn(
                          'w-6 h-6 transition-colors',
                          r <= newTestimonial.rating
                            ? 'text-warning fill-warning'
                            : 'text-dark-600'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddTestimonial}
                  disabled={submitting}
                  className="btn-primary flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add
                </button>
                <button onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Testimonial List */}
          <div className="space-y-3">
            {testimonials.length === 0 ? (
              <div className="card text-center py-8">
                <MessageSquare className="w-10 h-10 text-dark-600 mx-auto mb-3" />
                <p className="text-dark-400">No testimonials yet. Add the first one!</p>
              </div>
            ) : (
              testimonials.map((t) => (
                <div
                  key={t._id}
                  className={cn('card flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4', !t.isVisible && 'opacity-50')}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold">{t.name}</p>
                      <span className="text-xs text-dark-400">{t.role}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: t.rating }).map((_, j) => (
                          <Star key={j} className="w-3 h-3 text-warning fill-warning" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-dark-300">&quot;{t.text}&quot;</p>
                    {!t.isVisible && (
                      <span className="text-xs text-sell mt-1 inline-block">Hidden</span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleVisibility(t._id, t.isVisible)}
                      className="text-xs px-2 py-1 rounded bg-dark-800 text-dark-400 hover:text-white transition-colors"
                    >
                      {t.isVisible ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => handleDeleteTestimonial(t._id)}
                      className="text-dark-500 hover:text-sell transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========== SETTINGS TAB ========== */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <p className="text-sm text-dark-400">
            Modify your platform name and logo. These will be displayed across the site.
          </p>

          <div className="card max-w-xl">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary-400" />
              Platform Identity
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-dark-400 mb-1 block">Platform Name</label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  placeholder="AI Trading Signals"
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-sm text-dark-400 mb-1 block">Logo URL</label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="input-field"
                />
                <p className="text-xs text-dark-500 mt-1">
                  Enter a URL to your logo image (PNG, SVG recommended). Leave empty to use the default icon.
                </p>
              </div>

              {logoUrl && (
                <div className="p-4 bg-dark-800 rounded-lg">
                  <p className="text-xs text-dark-400 mb-2">Preview:</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      className="w-10 h-10 object-contain rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span className="text-lg font-bold gradient-text">{platformName}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleSaveSiteConfig}
                disabled={savingConfig}
                className="btn-primary flex items-center gap-2 px-6"
              >
                {savingConfig ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
