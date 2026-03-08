'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import LanguageToggle from '@/components/LanguageToggle';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success(t('auth.loginSuccess'));
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <TrendingUp className="w-10 h-10 text-primary-500" />
            <span className="text-2xl font-bold gradient-text">AI Trading Signals</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">{t('auth.welcomeBack')}</h1>
          <p className="text-dark-400">{t('auth.signInSubtitle')}</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11 pr-11"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-dark-400">
                <input type="checkbox" className="rounded border-dark-600" />
                {t('auth.rememberMe')}
              </label>
              <Link href="/forgot-password" className="text-sm text-primary-400 hover:text-primary-300">
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.signIn')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-dark-400 text-sm">
              {t('auth.noAccount')}{' '}
              <Link href="/register" className="text-primary-400 hover:text-primary-300 font-medium">
                {t('auth.signUpFree')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
