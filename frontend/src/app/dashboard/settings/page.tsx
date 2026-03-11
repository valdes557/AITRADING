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
  Send,
  Copy,
  ExternalLink,
  Unlink,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { preferencesAPI, subscriptionAPI } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const marketOptions = [
  { value: 'crypto', label: 'Crypto', icon: '₿' },
  { value: 'forex', label: 'Forex', icon: '$' },
  { value: 'indices', label: 'Indices', icon: '📊' },
];

const styleOptions = [
  { value: 'scalping', label: 'Scalping' },
  { value: 'intraday', label: 'Intraday' },
  { value: 'swing', label: 'Swing' },
];

const strategyOptions = [
  { value: 'smart_money', label: 'Smart Money' },
  { value: 'order_blocks', label: 'Order Blocks' },
  { value: 'breakout', label: 'Breakout' },
  { value: 'trend_following', label: 'Trend Following' },
];

const timeframeOptions = [
  { value: 'M5', label: 'M5' },
  { value: 'M15', label: 'M15' },
  { value: 'H1', label: 'H1' },
  { value: 'H4', label: 'H4' },
];

const defaultPlans = [
  { id: 'basic', name: 'Basic', price: 19, signals: 'Illimite' },
  { id: 'pro', name: 'Pro', price: 49, signals: 'Illimite + IA' },
  { id: 'vip', name: 'VIP', price: 99, signals: 'Premium + Analyse' },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState(defaultPlans);
  const [whatsappNumber, setWhatsappNumber] = useState(user?.whatsappNumber || '');
  const [whatsappSaving, setWhatsappSaving] = useState(false);
  const [whatsappLinked, setWhatsappLinked] = useState(!!user?.whatsappNumber);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Telegram linking state
  const [telegramLinked, setTelegramLinked] = useState(!!user?.telegramChatId);
  const [telegramCode, setTelegramCode] = useState('');
  const [telegramBotLink, setTelegramBotLink] = useState('');
  const [telegramLoading, setTelegramLoading] = useState(false);

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
          setPlans(data.plans.filter((p: any) => p.id !== 'free').map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            signals: p.id === 'vip' ? 'Premium + Analyse' : p.id === 'pro' ? 'Illimite + IA' : 'Illimite',
          })));
        }
      } catch {}
    };
    fetchPlans();

    // Fetch current preferences from server
    const fetchPreferences = async () => {
      try {
        const { data } = await preferencesAPI.get();
        if (data.preferences) {
          setPreferences({
            markets: data.preferences.markets || ['crypto'],
            tradingStyle: data.preferences.tradingStyle || ['intraday'],
            strategies: data.preferences.strategies || ['smart_money'],
            timeframes: data.preferences.timeframes || ['H1'],
            notifications: data.preferences.notifications || {
              telegram: false,
              email: true,
              whatsapp: false,
              webPush: false,
            },
          });
        }
        setPrefsLoaded(true);
      } catch {
        setPrefsLoaded(true);
      }
    };
    fetchPreferences();

    // Check Telegram status
    const fetchTelegramStatus = async () => {
      try {
        const { data } = await preferencesAPI.getTelegramStatus();
        setTelegramLinked(data.linked);
        if (data.botLink) setTelegramBotLink(data.botLink);
      } catch {}
    };
    fetchTelegramStatus();

    // Load WhatsApp from user profile
    if (user?.whatsappNumber) {
      setWhatsappNumber(user.whatsappNumber);
      setWhatsappLinked(true);
    }
  }, [user?.whatsappNumber]);

  const handleGenerateTelegramCode = async () => {
    setTelegramLoading(true);
    try {
      const { data } = await preferencesAPI.generateTelegramCode();
      setTelegramCode(data.code);
      if (data.botLink) setTelegramBotLink(data.botLink);
      toast.success(t('settings.telegramCodeGenerated'));
    } catch {
      toast.error(t('settings.telegramCodeError'));
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    try {
      await preferencesAPI.unlinkTelegram();
      setTelegramLinked(false);
      setTelegramCode('');
      setPreferences((prev) => ({
        ...prev,
        notifications: { ...prev.notifications, telegram: false },
      }));
      toast.success(t('settings.telegramUnlinked'));
    } catch {
      toast.error('Erreur');
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(telegramCode);
    toast.success(t('settings.codeCopied'));
  };

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
      updateUser({ whatsappNumber } as any);
      toast.success('WhatsApp lie !');
    } catch {
      toast.error('Numero invalide. Format: +1234567890');
    } finally {
      setWhatsappSaving(false);
    }
  };

  const handleUnlinkWhatsApp = async () => {
    try {
      await preferencesAPI.unlinkWhatsApp();
      setWhatsappLinked(false);
      setWhatsappNumber('');
      setPreferences((prev) => ({
        ...prev,
        notifications: { ...prev.notifications, whatsapp: false },
      }));
      updateUser({ whatsappNumber: undefined } as any);
      toast.success(t('settings.whatsappUnlinked'));
    } catch {
      toast.error('Erreur');
    }
  };

  const toggleArrayItem = (
    key: 'markets' | 'tradingStyle' | 'strategies' | 'timeframes',
    value: string
  ) => {
    setPreferences((prev) => {
      const arr = prev[key] as string[];
      if (arr.includes(value)) {
        if (arr.length === 1) return prev;
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
      toast.success(t('settings.saved'));
    } catch {
      toast.error(t('settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const renderChipGroup = (
    key: 'markets' | 'tradingStyle' | 'strategies' | 'timeframes',
    options: { value: string; label: string; icon?: string }[]
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
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-3xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1">{t('settings.title')}</h1>
        <p className="text-dark-400">{t('settings.subtitle')}</p>
      </div>

      {/* Current Plan */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Crown className="w-5 h-5 text-warning" />
          <h2 className="text-lg font-semibold">{t('settings.plan')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <span className="text-sm text-dark-400 font-normal">/mois</span>
              </p>
              <p className="text-xs text-dark-400 mt-1">{plan.signals}</p>
              {user?.plan === plan.id ? (
                <span className="inline-block mt-2 text-xs text-primary-400 font-semibold">
                  {t('settings.currentPlan')}
                </span>
              ) : (
                <button className="btn-primary text-xs mt-2 py-1 px-3">
                  {t('settings.upgrade')}
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-dark-500 mt-3">
          {t('settings.paymentMethods')}
        </p>
      </div>

      {/* Markets */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold">{t('settings.markets')}</h2>
        </div>
        {renderChipGroup('markets', marketOptions)}
      </div>

      {/* Trading Style */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold">{t('settings.tradingStyle')}</h2>
        </div>
        {renderChipGroup('tradingStyle', styleOptions)}
      </div>

      {/* Strategy */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold">{t('settings.strategies')}</h2>
        </div>
        {renderChipGroup('strategies', strategyOptions)}
      </div>

      {/* Timeframes */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold">{t('settings.timeframes')}</h2>
        </div>
        {renderChipGroup('timeframes', timeframeOptions)}
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold">{t('settings.notifications')}</h2>
        </div>
        <div className="space-y-3">
          {[
            { key: 'email', label: t('settings.emailNotif'), desc: t('settings.emailNotifDesc') },
            { key: 'whatsapp', label: t('settings.whatsappNotif'), desc: t('settings.whatsappNotifDesc') },
            { key: 'telegram', label: t('settings.telegramNotif'), desc: t('settings.telegramNotifDesc') },
            { key: 'webPush', label: t('settings.browserPush'), desc: t('settings.browserPushDesc') },
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

      {/* Telegram Linking */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Send className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold">{t('settings.telegramLink')}</h2>
        </div>

        {telegramLinked ? (
          <div>
            <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-700/30 rounded-lg mb-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-sm text-green-300 font-medium">{t('settings.telegramActive')}</p>
            </div>
            <button
              onClick={handleUnlinkTelegram}
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              <Unlink className="w-4 h-4" />
              {t('settings.telegramDisconnect')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-dark-400">{t('settings.telegramInstructions')}</p>

            <div className="space-y-3">
              <p className="text-sm font-medium">{t('settings.telegramStep1')}</p>
              {telegramBotLink && (
                <a
                  href={telegramBotLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-blue-600/30 transition-colors text-sm"
                >
                  <Send className="w-4 h-4" />
                  {t('settings.openBot')}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              <p className="text-sm font-medium">{t('settings.telegramStep2')}</p>
              <button
                onClick={handleGenerateTelegramCode}
                disabled={telegramLoading}
                className="btn-primary flex items-center gap-2 px-5"
              >
                {telegramLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {t('settings.generateCode')}
              </button>

              {telegramCode && (
                <div className="mt-3">
                  <div className="flex items-center gap-3">
                    <code className="px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-primary-300 font-mono text-lg tracking-widest">
                      {telegramCode}
                    </code>
                    <button
                      onClick={copyCode}
                      className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                      title="Copier"
                    >
                      <Copy className="w-4 h-4 text-dark-400" />
                    </button>
                  </div>
                  <p className="text-xs text-dark-500 mt-2">{t('settings.telegramStep3')}</p>
                  <p className="text-xs text-warning mt-1">{t('settings.codeExpiry')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp Number */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Phone className="w-5 h-5 text-buy" />
          <h2 className="text-lg font-semibold">{t('settings.whatsappTitle')}</h2>
        </div>

        {whatsappLinked ? (
          <div>
            <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-700/30 rounded-lg mb-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm text-green-300 font-medium">{t('settings.whatsappActive')}</p>
                <p className="text-xs text-dark-400 font-mono mt-0.5">{whatsappNumber}</p>
              </div>
            </div>
            <button
              onClick={handleUnlinkWhatsApp}
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              <Unlink className="w-4 h-4" />
              {t('settings.whatsappDisconnect')}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-dark-400 mb-3">{t('settings.whatsappDesc')}</p>
            <div className="flex gap-3">
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
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
                ) : (
                  <Phone className="w-4 h-4" />
                )}
                {t('settings.link')}
              </button>
            </div>
          </div>
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
          {t('settings.save')}
        </button>
      </div>
    </div>
  );
}
