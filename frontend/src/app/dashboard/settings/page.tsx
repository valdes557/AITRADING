'use client';

import { useState, useEffect } from 'react';
import {
  Save,
  Loader2,
  Crown,
  Bell,
  BarChart3,
  Clock,
  Brain,
  Globe,
  Phone,
  CheckCircle,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { preferencesAPI, subscriptionAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const marketOptions = [
  { value: 'crypto', label: 'Crypto', icon: '₿' },
  { value: 'forex', label: 'Forex', icon: '$' },
  { value: 'indices', label: 'Indices', icon: '📊' },
];

const styleOptions = [
  { value: 'scalping', label: 'Scalping', desc: 'Quick trades, small profits' },
  { value: 'intraday', label: 'Intraday', desc: 'Same-day positions' },
  { value: 'swing', label: 'Swing', desc: 'Multi-day holds' },
];

const strategyOptions = [
  { value: 'smart_money', label: 'Smart Money', desc: 'Institutional order flow' },
  { value: 'order_blocks', label: 'Order Blocks', desc: 'Supply & demand zones' },
  { value: 'breakout', label: 'Breakout', desc: 'Range breakout setups' },
  { value: 'trend_following', label: 'Trend Following', desc: 'EMA crossover trends' },
];

const timeframeOptions = [
  { value: 'M5', label: 'M5', desc: '5 minutes' },
  { value: 'M15', label: 'M15', desc: '15 minutes' },
  { value: 'H1', label: 'H1', desc: '1 hour' },
  { value: 'H4', label: 'H4', desc: '4 hours' },
];

const defaultPlans = [
  { id: 'free', name: 'Free', price: 0, signals: '2/day' },
  { id: 'basic', name: 'Basic', price: 19, signals: 'Unlimited' },
  { id: 'pro', name: 'Pro', price: 49, signals: 'Unlimited + AI' },
  { id: 'vip', name: 'VIP', price: 99, signals: 'Premium + Analysis' },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState(defaultPlans);
  const [whatsappNumber, setWhatsappNumber] = useState(user?.whatsappNumber || '');
  const [whatsappSaving, setWhatsappSaving] = useState(false);
  const [whatsappLinked, setWhatsappLinked] = useState(!!user?.whatsappNumber);
  const [preferences, setPreferences] = useState({
    markets: user?.preferences?.markets || ['crypto'],
    tradingStyle: user?.preferences?.tradingStyle || ['intraday'],
    strategies: user?.preferences?.strategies || ['smart_money'],
    timeframes: user?.preferences?.timeframes || ['H1'],
    notifications: user?.preferences?.notifications || {
      telegram: false,
      email: true,
      whatsapp: false,
      webPush: false,
    },
  });

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await subscriptionAPI.getPlans();
        if (data.plans?.length > 0) {
          setPlans(data.plans.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            signals: p.signalsPerDay === 2 ? '2/day' : p.id === 'vip' ? 'Premium + Analysis' : p.id === 'pro' ? 'Unlimited + AI' : 'Unlimited',
          })));
        }
      } catch {}
    };
    fetchPlans();
  }, []);

  const handleLinkWhatsApp = async () => {
    if (!whatsappNumber) return;
    setWhatsappSaving(true);
    try {
      await preferencesAPI.linkWhatsApp(whatsappNumber);
      setWhatsappLinked(true);
      setPreferences((prev) => ({
        ...prev,
        notifications: { ...prev.notifications, whatsapp: true },
      }));
      toast.success('WhatsApp linked!');
    } catch {
      toast.error('Invalid number. Use format: +1234567890');
    } finally {
      setWhatsappSaving(false);
    }
  };

  const toggleArrayItem = (
    key: 'markets' | 'tradingStyle' | 'strategies' | 'timeframes',
    value: string
  ) => {
    setPreferences((prev) => {
      const arr = prev[key] as string[];
      if (arr.includes(value)) {
        if (arr.length === 1) return prev; // At least one must be selected
        return { ...prev, [key]: arr.filter((v) => v !== value) };
      }
      return { ...prev, [key]: [...arr, value] };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await preferencesAPI.update(preferences);
      updateUser({ preferences: preferences as any });
      toast.success('Preferences saved!');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const renderChipGroup = (
    key: 'markets' | 'tradingStyle' | 'strategies' | 'timeframes',
    options: { value: string; label: string; desc?: string; icon?: string }[]
  ) => (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => {
        const selected = (preferences[key] as string[]).includes(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => toggleArrayItem(key, opt.value)}
            className={cn(
              'px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left',
              selected
                ? 'bg-primary-600/15 border-primary-500/40 text-primary-300'
                : 'bg-dark-800 border-dark-600 text-dark-400 hover:border-dark-500 hover:text-dark-300'
            )}
          >
            <div className="flex items-center gap-2">
              {opt.icon && <span>{opt.icon}</span>}
              <span>{opt.label}</span>
            </div>
            {opt.desc && (
              <p className="text-xs mt-0.5 opacity-60">{opt.desc}</p>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-3xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-dark-400">
          Configure your trading preferences. Signals will match these settings.
        </p>
      </div>

      {/* Current Plan */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Crown className="w-5 h-5 text-warning" />
          <h2 className="text-lg font-semibold">Subscription Plan</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'p-4 rounded-xl border text-center transition-all',
                user?.plan === plan.id
                  ? 'border-primary-500 bg-primary-600/10'
                  : 'border-dark-700 bg-dark-800/50'
              )}
            >
              <p className="font-bold">{plan.name}</p>
              <p className="text-2xl font-bold mt-1">
                ${plan.price}
                <span className="text-sm text-dark-400 font-normal">/mo</span>
              </p>
              <p className="text-xs text-dark-400 mt-1">{plan.signals}</p>
              {user?.plan === plan.id ? (
                <span className="inline-block mt-2 text-xs text-primary-400 font-semibold">
                  Current Plan
                </span>
              ) : (
                plan.id !== 'free' && (
                  <button className="btn-primary text-xs mt-2 py-1 px-3">
                    Upgrade
                  </button>
                )
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-dark-500 mt-3">
          Payments accepted: USDT TRC20, Binance Pay
        </p>
      </div>

      {/* Markets */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold">Markets</h2>
        </div>
        {renderChipGroup('markets', marketOptions)}
      </div>

      {/* Trading Style */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold">Trading Style</h2>
        </div>
        {renderChipGroup('tradingStyle', styleOptions)}
      </div>

      {/* Strategy */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold">Strategies</h2>
        </div>
        {renderChipGroup('strategies', strategyOptions)}
      </div>

      {/* Timeframes */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold">Timeframes</h2>
        </div>
        {renderChipGroup('timeframes', timeframeOptions)}
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
        <div className="space-y-3">
          {[
            { key: 'email', label: 'Email Notifications', desc: 'Receive signals via email' },
            { key: 'whatsapp', label: 'WhatsApp Alerts', desc: 'Signal alerts via WhatsApp' },
            { key: 'telegram', label: 'Telegram Alerts', desc: 'Fast alerts via Telegram bot' },
            { key: 'webPush', label: 'Browser Push', desc: 'Desktop notifications' },
          ].map((notif) => (
            <div
              key={notif.key}
              className="flex items-center justify-between p-3 bg-dark-800 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium">{notif.label}</p>
                <p className="text-xs text-dark-400">{notif.desc}</p>
              </div>
              <button
                onClick={() =>
                  setPreferences((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      [notif.key]:
                        !prev.notifications[notif.key as keyof typeof prev.notifications],
                    },
                  }))
                }
                className={cn(
                  'w-12 h-6 rounded-full transition-all relative',
                  preferences.notifications[notif.key as keyof typeof preferences.notifications]
                    ? 'bg-primary-600'
                    : 'bg-dark-600'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all',
                    preferences.notifications[notif.key as keyof typeof preferences.notifications]
                      ? 'left-6'
                      : 'left-0.5'
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* WhatsApp Number */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Phone className="w-5 h-5 text-buy" />
          <h2 className="text-lg font-semibold">WhatsApp Number</h2>
        </div>
        <p className="text-sm text-dark-400 mb-3">
          Enter your WhatsApp number with country code to receive signal alerts.
        </p>
        <div className="flex gap-3">
          <input
            type="tel"
            value={whatsappNumber}
            onChange={(e) => { setWhatsappNumber(e.target.value); setWhatsappLinked(false); }}
            placeholder="+1234567890"
            className="input-field flex-1"
          />
          <button
            onClick={handleLinkWhatsApp}
            disabled={whatsappSaving || !whatsappNumber}
            className="btn-primary flex items-center gap-2 px-5"
          >
            {whatsappSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : whatsappLinked ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Phone className="w-4 h-4" />
            )}
            {whatsappLinked ? 'Linked' : 'Link'}
          </button>
        </div>
        {whatsappLinked && (
          <p className="text-xs text-buy mt-2 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            WhatsApp notifications active
          </p>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-8"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Save Preferences
        </button>
      </div>
    </div>
  );
}
