'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { testimonialsAPI, subscriptionAPI } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import LanguageToggle from '@/components/LanguageToggle';
import {
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  Bot,
  Bell,
  ChevronRight,
  Star,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react';

/* ─── Animated SVG Trading Chart ─── */
function TradingChartSVG() {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 via-accent-500/10 to-primary-600/20 blur-3xl animate-glow rounded-full" />
      <svg viewBox="0 0 800 400" className="w-full h-auto relative z-10 drop-shadow-2xl">
        {/* Background */}
        <defs>
          <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="50%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="800" height="400" rx="16" fill="#0f172a" stroke="#334155" strokeWidth="1" />
        {/* Grid lines */}
        {[80, 160, 240, 320].map((y) => (
          <line key={y} x1="60" y1={y} x2="760" y2={y} stroke="#1e293b" strokeWidth="1" />
        ))}
        {/* Candlesticks */}
        {[
          { x: 100, o: 280, c: 240, h: 220, l: 300, bull: true },
          { x: 140, o: 240, c: 200, h: 180, l: 260, bull: true },
          { x: 180, o: 200, c: 230, h: 190, l: 250, bull: false },
          { x: 220, o: 230, c: 180, h: 160, l: 250, bull: true },
          { x: 260, o: 180, c: 150, h: 130, l: 200, bull: true },
          { x: 300, o: 150, c: 180, h: 140, l: 200, bull: false },
          { x: 340, o: 180, c: 160, h: 140, l: 200, bull: true },
          { x: 380, o: 160, c: 120, h: 100, l: 180, bull: true },
          { x: 420, o: 120, c: 140, h: 100, l: 160, bull: false },
          { x: 460, o: 140, c: 110, h: 90, l: 160, bull: true },
          { x: 500, o: 110, c: 130, h: 100, l: 150, bull: false },
          { x: 540, o: 130, c: 100, h: 80, l: 150, bull: true },
          { x: 580, o: 100, c: 120, h: 80, l: 140, bull: false },
          { x: 620, o: 120, c: 90, h: 70, l: 140, bull: true },
          { x: 660, o: 90, c: 110, h: 80, l: 130, bull: false },
          { x: 700, o: 110, c: 80, h: 60, l: 130, bull: true },
        ].map((c, i) => (
          <g key={i} className="animate-candle-grow origin-bottom" style={{ animationDelay: `${i * 0.1}s` }}>
            <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke={c.bull ? '#22c55e' : '#ef4444'} strokeWidth="1.5" />
            <rect
              x={c.x - 8}
              y={Math.min(c.o, c.c)}
              width="16"
              height={Math.abs(c.o - c.c) || 2}
              fill={c.bull ? '#22c55e' : '#ef4444'}
              rx="2"
            />
          </g>
        ))}
        {/* Price line overlay */}
        <path
          d="M100,280 L140,200 L180,230 L220,180 L260,150 L300,180 L340,160 L380,120 L420,140 L460,110 L500,130 L540,100 L580,120 L620,90 L660,110 L700,80"
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="1000"
          className="animate-line-draw"
        />
        {/* Area fill */}
        <path
          d="M100,280 L140,200 L180,230 L220,180 L260,150 L300,180 L340,160 L380,120 L420,140 L460,110 L500,130 L540,100 L580,120 L620,90 L660,110 L700,80 L700,380 L100,380 Z"
          fill="url(#chartGrad)"
          opacity="0.5"
        />
        {/* BUY signal badge */}
        <g className="animate-float">
          <rect x="355" y="85" width="50" height="24" rx="12" fill="#22c55e" />
          <text x="380" y="101" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">BUY</text>
        </g>
        {/* TP line */}
        <line x1="380" y1="70" x2="700" y2="70" stroke="#22c55e" strokeWidth="1" strokeDasharray="6,4" opacity="0.6" />
        <text x="720" y="74" fill="#22c55e" fontSize="10">TP</text>
        {/* SL line */}
        <line x1="380" y1="180" x2="700" y2="180" stroke="#ef4444" strokeWidth="1" strokeDasharray="6,4" opacity="0.6" />
        <text x="720" y="184" fill="#ef4444" fontSize="10">SL</text>
        {/* Entry line */}
        <line x1="380" y1="120" x2="700" y2="120" stroke="#818cf8" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
        <text x="720" y="124" fill="#818cf8" fontSize="10">Entry</text>
      </svg>
    </div>
  );
}

/* ─── Animated counter ─── */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const step = Math.ceil(target / 60);
          const timer = setInterval(() => {
            start += step;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(start);
            }
          }, 20);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <div ref={ref}>{count.toLocaleString()}{suffix}</div>;
}

/* ─── Floating Signal Card ─── */
function FloatingSignalCard({ asset, direction, entry, tp, delay }: { asset: string; direction: 'BUY' | 'SELL'; entry: string; tp: string; delay: string }) {
  return (
    <div
      className="absolute glass rounded-xl p-3 shadow-2xl border border-dark-600 animate-float hidden lg:block"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${direction === 'BUY' ? 'bg-buy/20 text-buy' : 'bg-sell/20 text-sell'}`}>
          {direction}
        </span>
        <span className="text-sm font-bold">{asset}</span>
      </div>
      <div className="text-xs text-dark-400 space-y-0.5">
        <div>Entry: <span className="text-dark-200">{entry}</span></div>
        <div>TP: <span className="text-buy">{tp}</span></div>
      </div>
    </div>
  );
}

/* ─── Market ticker ─── */
function MarketTicker() {
  const items = [
    { pair: 'BTC/USDT', price: '67,432.50', change: '+2.4%', up: true },
    { pair: 'ETH/USDT', price: '3,521.80', change: '+1.8%', up: true },
    { pair: 'EUR/USD', price: '1.0842', change: '-0.3%', up: false },
    { pair: 'GBP/USD', price: '1.2654', change: '+0.5%', up: true },
    { pair: 'SOL/USDT', price: '142.35', change: '+5.2%', up: true },
    { pair: 'XRP/USDT', price: '0.5432', change: '-1.1%', up: false },
    { pair: 'USD/JPY', price: '149.82', change: '+0.2%', up: true },
    { pair: 'ADA/USDT', price: '0.4521', change: '+3.1%', up: true },
  ];
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden border-y border-dark-800 bg-dark-950/80 py-3">
      <div className="flex animate-ticker whitespace-nowrap">
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-3 mx-6">
            <span className="text-sm font-medium text-dark-200">{item.pair}</span>
            <span className="text-sm font-mono text-dark-300">{item.price}</span>
            <span className={`text-xs font-semibold ${item.up ? 'text-buy' : 'text-sell'}`}>{item.change}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { t } = useI18n();
  const [testimonials, setTestimonials] = useState([
    { name: 'Alex M.', role: 'Crypto Trader', text: 'AI Trading Signals a change mon approche du crypto. Les explications IA m\'ont aide a comprendre la structure du marche.', rating: 5 },
    { name: 'Sarah K.', role: 'Forex Trader', text: 'Les signaux personnalises correspondent parfaitement a mon style de trading. Mon taux de reussite est passe de 45% a 68%.', rating: 5 },
    { name: 'David R.', role: 'Swing Trader', text: 'La meilleure plateforme de signaux que j\'ai utilisee. Les alertes Telegram sont incroyablement rapides.', rating: 5 },
  ]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [plans, setPlans] = useState([
    {
      id: 'basic', name: 'Basic', price: 19, highlighted: false,
      features: [t('plan.basic.f1'), t('plan.basic.f2'), t('plan.basic.f3'), t('plan.basic.f4'), t('plan.basic.f5')],
    },
    {
      id: 'pro', name: 'Pro', price: 49, highlighted: true,
      features: [t('plan.pro.f1'), t('plan.pro.f2'), t('plan.pro.f3'), t('plan.pro.f4'), t('plan.pro.f5')],
    },
    {
      id: 'vip', name: 'VIP', price: 99, highlighted: false,
      features: [t('plan.vip.f1'), t('plan.vip.f2'), t('plan.vip.f3'), t('plan.vip.f4'), t('plan.vip.f5'), t('plan.vip.f6')],
    },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, testimonialsRes] = await Promise.allSettled([
          subscriptionAPI.getPlans(),
          testimonialsAPI.getAll(),
        ]);

        if (plansRes.status === 'fulfilled' && plansRes.value.data.plans?.length > 0) {
          const fetched = plansRes.value.data.plans
            .filter((p: any) => p.planId !== 'free')
            .map((p: any) => ({
              id: p.planId,
              name: p.name,
              price: p.price,
              features: p.features || [],
              highlighted: p.highlighted || false,
            }));
          if (fetched.length > 0) setPlans(fetched);
        }

        if (testimonialsRes.status === 'fulfilled' && testimonialsRes.value.data.testimonials?.length > 0) {
          setTestimonials(testimonialsRes.value.data.testimonials);
        }
      } catch {}
    };
    fetchData();
  }, []);

  const featuresData = [
    { icon: Bot, titleKey: 'feature.ai.title', descKey: 'feature.ai.desc' },
    { icon: Zap, titleKey: 'feature.signals.title', descKey: 'feature.signals.desc' },
    { icon: Shield, titleKey: 'feature.explanations.title', descKey: 'feature.explanations.desc' },
    { icon: BarChart3, titleKey: 'feature.dashboard.title', descKey: 'feature.dashboard.desc' },
    { icon: Bell, titleKey: 'feature.alerts.title', descKey: 'feature.alerts.desc' },
    { icon: TrendingUp, titleKey: 'feature.journal.title', descKey: 'feature.journal.desc' },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-primary-500" />
              <span className="text-xl font-bold gradient-text">AI Trading Signals</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-dark-300 hover:text-white transition-colors text-sm">{t('nav.features')}</a>
              <a href="#pricing" className="text-dark-300 hover:text-white transition-colors text-sm">{t('nav.pricing')}</a>
              <a href="#testimonials" className="text-dark-300 hover:text-white transition-colors text-sm">{t('nav.reviews')}</a>
              <Link href="/login" className="text-dark-300 hover:text-white transition-colors text-sm">{t('nav.login')}</Link>
              <LanguageToggle />
              <Link href="/register" className="btn-primary text-sm">{t('nav.getStarted')}</Link>
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-dark-300">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-dark-900 border-t border-dark-700 px-4 py-4 space-y-3">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-dark-300 hover:text-white">{t('nav.features')}</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-dark-300 hover:text-white">{t('nav.pricing')}</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="block text-dark-300 hover:text-white">{t('nav.reviews')}</a>
            <Link href="/login" className="block text-dark-300 hover:text-white">{t('nav.login')}</Link>
            <div className="flex gap-3 pt-2">
              <LanguageToggle />
              <Link href="/register" className="btn-primary text-sm flex-1 text-center">{t('nav.getStarted')}</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Market Ticker */}
      <div className="pt-16">
        <MarketTicker />
      </div>

      {/* Hero */}
      <section className="pt-16 pb-20 px-4 relative">
        {/* Background glow effects */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl animate-glow" />
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl animate-glow" style={{ animationDelay: '1.5s' }} />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary-600/10 border border-primary-500/20 rounded-full px-4 py-2 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <Zap className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-primary-300">{t('hero.badge')}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              {t('hero.title1')}
              <br />
              <span className="gradient-text">{t('hero.title2')}</span>
            </h1>
            <p className="text-xl text-dark-400 max-w-2xl mx-auto mb-10 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <Link href="/register" className="btn-primary text-lg px-8 py-4 flex items-center gap-2 shadow-xl shadow-primary-600/30 hover:shadow-primary-600/50 transition-shadow">
                {t('hero.cta')}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#features" className="btn-secondary text-lg px-8 py-4">{t('hero.learnMore')}</a>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-dark-400 text-sm opacity-0 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-buy" />
                {t('hero.trial')}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-buy" />
                {t('hero.noCard')}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-buy" />
                {t('hero.cancel')}
              </div>
            </div>
          </div>

          {/* Animated Trading Chart */}
          <div className="relative mt-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
            <FloatingSignalCard asset="BTC/USDT" direction="BUY" entry="67,430" tp="69,200" delay="0s" />
            <div className="absolute top-10 right-0 lg:right-10">
              <FloatingSignalCard asset="EUR/USD" direction="SELL" entry="1.0845" tp="1.0780" delay="2s" />
            </div>
            <div className="absolute bottom-10 left-0 lg:left-10">
              <FloatingSignalCard asset="SOL/USDT" direction="BUY" entry="142.30" tp="155.00" delay="4s" />
            </div>
            <TradingChartSVG />
          </div>
        </div>
      </section>

      {/* Live Stats Bar */}
      <section className="py-12 px-4 bg-dark-900/70 border-y border-dark-800">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 87, suffix: '%', label: t('stats.winRate') },
            { value: 12450, suffix: '+', label: t('stats.signals') },
            { value: 3200, suffix: '+', label: t('stats.traders') },
            { value: 25, suffix: '+', label: t('stats.markets') },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-dark-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              {t('features.title1')}{' '}
              <span className="gradient-text">{t('features.title2')}</span>
            </h2>
            <p className="text-dark-400 text-lg max-w-xl mx-auto">{t('features.subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuresData.map((feature, i) => (
              <div
                key={i}
                className="card-hover group opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className="w-12 h-12 bg-primary-600/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-600/20 group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t(feature.titleKey)}</h3>
                <p className="text-dark-400">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-dark-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              {t('pricing.title1')} <span className="gradient-text">{t('pricing.title2')}</span>
            </h2>
            <p className="text-dark-400 text-lg">{t('pricing.subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <div
                key={plan.id}
                className={`card relative opacity-0 animate-fade-in-up transition-transform hover:scale-105 duration-300 ${
                  plan.highlighted ? 'border-primary-500 shadow-2xl shadow-primary-500/20 scale-105' : ''
                }`}
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    {t('pricing.popular')}
                  </div>
                )}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                {plan.id === 'basic' && (
                  <span className="text-xs text-buy font-semibold">{t('pricing.trial')}</span>
                )}
                <div className="flex items-baseline gap-1 mb-6 mt-2">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-dark-400">{t('pricing.perMonth')}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature: string, j: number) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-buy mt-0.5 flex-shrink-0" />
                      <span className="text-dark-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center py-3 rounded-lg font-medium transition-all ${
                    plan.highlighted ? 'btn-primary w-full' : 'btn-secondary w-full'
                  }`}
                >
                  {plan.id === 'basic' ? t('plan.basic.cta') : plan.id === 'pro' ? t('plan.pro.cta') : t('plan.vip.cta')}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              {t('testimonials.title1')} <span className="gradient-text">{t('testimonials.title2')}</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((te, i) => (
              <div
                key={i}
                className="card opacity-0 animate-fade-in-up hover:border-dark-600 transition-all duration-300"
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: te.rating }).map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-warning fill-warning" />
                  ))}
                </div>
                <p className="text-dark-300 mb-4">&quot;{te.text}&quot;</p>
                <div>
                  <p className="font-semibold">{te.name}</p>
                  <p className="text-sm text-dark-400">{te.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-950/20 to-transparent" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl font-bold mb-4">
            {t('cta.title1')} <span className="gradient-text">{t('cta.title2')}</span> ?
          </h2>
          <p className="text-dark-400 text-lg mb-8">{t('cta.subtitle')}</p>
          <Link href="/register" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2 shadow-xl shadow-primary-600/30">
            {t('cta.button')}
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary-500" />
            <span className="font-bold gradient-text">AI Trading Signals</span>
          </div>
          <div className="flex gap-6 text-sm text-dark-400">
            <a href="#" className="hover:text-white transition-colors">{t('nav.terms')}</a>
            <a href="#" className="hover:text-white transition-colors">{t('nav.privacy')}</a>
            <a href="#" className="hover:text-white transition-colors">{t('nav.contact')}</a>
          </div>
          <p className="text-sm text-dark-500">&copy; 2024 AI Trading Signals. {t('footer.rights')}</p>
        </div>
      </footer>
    </div>
  );
}
