'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { testimonialsAPI, subscriptionAPI } from '@/lib/api';
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
} from 'lucide-react';

const defaultPlans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: '',
    features: ['2 signals per day', 'Basic dashboard', 'Email notifications', 'Community access'],
    cta: 'Get Started',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 19,
    period: '/month',
    features: ['Unlimited signals', 'Full dashboard & stats', 'Email + Web notifications', 'Signal history', 'Trading journal'],
    cta: 'Start Basic',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    period: '/month',
    features: ['Everything in Basic', 'AI trade explanations', 'WhatsApp & Telegram alerts', 'Advanced analytics', 'Priority support'],
    cta: 'Go Pro',
    highlighted: true,
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 99,
    period: '/month',
    features: ['Everything in Pro', 'Premium signals', 'Daily AI market analysis', 'Custom strategies', 'Personal AI coach', '1-on-1 support'],
    cta: 'Join VIP',
  },
];

const features = [
  {
    icon: Bot,
    title: 'AI-Powered Analysis',
    description:
      'Our AI analyzes trends, support/resistance, liquidity zones, order blocks, RSI, MACD, EMA and volatility in real-time.',
  },
  {
    icon: Zap,
    title: 'Instant Signals',
    description:
      'Receive BUY/SELL signals with precise entry, stop loss, take profit, and risk-reward ratios instantly.',
  },
  {
    icon: Shield,
    title: 'AI Explanations',
    description:
      'Every signal comes with a clear AI explanation of why the trade is valid, helping you learn as you trade.',
  },
  {
    icon: BarChart3,
    title: 'Smart Dashboard',
    description:
      'Track your performance with win rate, equity curve, drawdown, and detailed trading statistics.',
  },
  {
    icon: Bell,
    title: 'Real-Time Alerts',
    description:
      'Get notified via Telegram, email, or web push the moment a new signal is generated.',
  },
  {
    icon: TrendingUp,
    title: 'Auto Trading Journal',
    description:
      'Every signal is automatically logged. Track gains, losses, and improve your trading discipline.',
  },
];

const defaultTestimonials = [
  { name: 'Alex M.', role: 'Crypto Trader', text: 'AI Trading Signals changed my approach to crypto. The AI explanations helped me understand market structure.', rating: 5 },
  { name: 'Sarah K.', role: 'Forex Trader', text: 'The personalized signals match my trading style perfectly. My win rate improved from 45% to 68%.', rating: 5 },
  { name: 'David R.', role: 'Swing Trader', text: 'Best trading signal platform I have used. The Telegram and WhatsApp alerts are incredibly fast.', rating: 5 },
];

export default function LandingPage() {
  const [plans, setPlans] = useState(defaultPlans);
  const [testimonials, setTestimonials] = useState(defaultTestimonials);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, testimonialsRes] = await Promise.allSettled([
          subscriptionAPI.getPlans(),
          testimonialsAPI.getAll(),
        ]);

        if (plansRes.status === 'fulfilled' && plansRes.value.data.plans?.length > 0) {
          const ctaMap: Record<string, string> = { free: 'Get Started', basic: 'Start Basic', pro: 'Go Pro', vip: 'Join VIP' };
          setPlans(plansRes.value.data.plans.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            period: p.price > 0 ? '/month' : '',
            features: p.features || [],
            cta: ctaMap[p.id] || 'Get Started',
            highlighted: p.highlighted,
          })));
        }

        if (testimonialsRes.status === 'fulfilled' && testimonialsRes.value.data.testimonials?.length > 0) {
          setTestimonials(testimonialsRes.value.data.testimonials);
        }
      } catch {}
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-primary-500" />
              <span className="text-xl font-bold gradient-text">
                AI Trading Signals
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-dark-300 hover:text-white transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-dark-300 hover:text-white transition-colors">
                Pricing
              </a>
              <a href="#testimonials" className="text-dark-300 hover:text-white transition-colors">
                Reviews
              </a>
              <Link href="/login" className="text-dark-300 hover:text-white transition-colors">
                Login
              </Link>
              <Link href="/register" className="btn-primary text-sm">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-600/10 border border-primary-500/20 rounded-full px-4 py-2 mb-8">
            <Zap className="w-4 h-4 text-primary-400" />
            <span className="text-sm text-primary-300">
              AI-Powered Trading Intelligence
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Smart Trading Signals
            <br />
            <span className="gradient-text">Powered by AI</span>
          </h1>
          <p className="text-xl text-dark-400 max-w-2xl mx-auto mb-10">
            Get personalized crypto & forex signals with AI explanations,
            real-time alerts, and a complete trading journal. Trade smarter, not
            harder.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="btn-primary text-lg px-8 py-4 flex items-center gap-2"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#features"
              className="btn-secondary text-lg px-8 py-4"
            >
              Learn More
            </Link>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 text-dark-400 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-buy" />
              Free plan available
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-buy" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-buy" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-dark-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need to{' '}
              <span className="gradient-text">Trade Smarter</span>
            </h2>
            <p className="text-dark-400 text-lg max-w-xl mx-auto">
              Powered by advanced AI that analyzes multiple indicators and
              strategies in real-time.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="card-hover group">
                <div className="w-12 h-12 bg-primary-600/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-600/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-dark-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Simple, <span className="gradient-text">Transparent Pricing</span>
            </h2>
            <p className="text-dark-400 text-lg">
              Choose the plan that fits your trading needs. Upgrade anytime.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`card relative ${
                  plan.highlighted
                    ? 'border-primary-500 shadow-xl shadow-primary-500/10'
                    : ''
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">
                    ${plan.price}
                  </span>
                  <span className="text-dark-400">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-buy mt-0.5 flex-shrink-0" />
                      <span className="text-dark-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center py-3 rounded-lg font-medium transition-all ${
                    plan.highlighted
                      ? 'btn-primary w-full'
                      : 'btn-secondary w-full'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-dark-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Trusted by <span className="gradient-text">Traders Worldwide</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="card">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star
                      key={j}
                      className="w-5 h-5 text-warning fill-warning"
                    />
                  ))}
                </div>
                <p className="text-dark-300 mb-4">&quot;{t.text}&quot;</p>
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-dark-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Trade with <span className="gradient-text">AI Power</span>?
          </h2>
          <p className="text-dark-400 text-lg mb-8">
            Join thousands of traders using AI to make smarter decisions.
            Start free, upgrade when ready.
          </p>
          <Link
            href="/register"
            className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2"
          >
            Create Free Account
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
            <a href="#" className="hover:text-white transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Contact
            </a>
          </div>
          <p className="text-sm text-dark-500">
            &copy; 2024 AI Trading Signals. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
