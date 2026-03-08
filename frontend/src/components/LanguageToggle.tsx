'use client';

import { useI18n } from '@/lib/i18n';
import { Languages } from 'lucide-react';

export default function LanguageToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  return (
    <button
      onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-dark-600 bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white transition-all ${className}`}
      title={locale === 'fr' ? 'Switch to English' : 'Passer en Français'}
    >
      <Languages className="w-4 h-4" />
      {locale === 'fr' ? 'EN' : 'FR'}
    </button>
  );
}
