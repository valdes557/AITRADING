import { create } from 'zustand';

export type Locale = 'fr' | 'en';

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const translations: Record<Locale, Record<string, string>> = {
  fr: {
    // Navbar
    'nav.features': 'Fonctionnalites',
    'nav.pricing': 'Tarifs',
    'nav.reviews': 'Avis',
    'nav.login': 'Connexion',
    'nav.getStarted': 'Commencer',
    'nav.terms': 'Conditions',
    'nav.privacy': 'Confidentialite',
    'nav.contact': 'Contact',

    // Hero
    'hero.badge': 'Intelligence de Trading par IA',
    'hero.title1': 'Signaux de Trading',
    'hero.title2': 'Propulses par l\'IA',
    'hero.subtitle': 'Recevez des signaux crypto et forex personnalises avec des explications IA, des alertes en temps reel et un journal de trading complet. Tradez plus intelligemment.',
    'hero.cta': 'Essai Gratuit 3 Jours',
    'hero.learnMore': 'En Savoir Plus',
    'hero.trial': '3 jours d\'essai gratuit',
    'hero.noCard': 'Sans carte bancaire',
    'hero.cancel': 'Annulation a tout moment',

    // Features
    'features.title1': 'Tout Ce Dont Vous Avez Besoin Pour',
    'features.title2': 'Trader Plus Intelligemment',
    'features.subtitle': 'Propulse par une IA avancee qui analyse de multiples indicateurs et strategies en temps reel.',
    'feature.ai.title': 'Analyse par IA',
    'feature.ai.desc': 'Notre IA analyse les tendances, supports/resistances, zones de liquidite, order blocks, RSI, MACD, EMA et la volatilite en temps reel.',
    'feature.signals.title': 'Signaux Instantanes',
    'feature.signals.desc': 'Recevez des signaux BUY/SELL avec prix d\'entree, stop loss, take profit et ratio risque/rendement precis instantanement.',
    'feature.explanations.title': 'Explications IA',
    'feature.explanations.desc': 'Chaque signal est accompagne d\'une explication IA claire pour vous aider a comprendre et apprendre en tradant.',
    'feature.dashboard.title': 'Dashboard Intelligent',
    'feature.dashboard.desc': 'Suivez vos performances avec le taux de reussite, la courbe de capital, le drawdown et des statistiques detaillees.',
    'feature.alerts.title': 'Alertes Temps Reel',
    'feature.alerts.desc': 'Soyez notifie par Telegram, email ou notification desktop des qu\'un nouveau signal est genere.',
    'feature.journal.title': 'Journal de Trading Auto',
    'feature.journal.desc': 'Chaque signal est automatiquement enregistre. Suivez vos gains, pertes et ameliorez votre discipline de trading.',

    // Live stats
    'stats.winRate': 'Taux de Reussite',
    'stats.signals': 'Signaux Generes',
    'stats.traders': 'Traders Actifs',
    'stats.markets': 'Marches Couverts',

    // Pricing
    'pricing.title1': 'Tarification',
    'pricing.title2': 'Simple et Transparente',
    'pricing.subtitle': 'Choisissez le plan qui correspond a vos besoins de trading.',
    'pricing.perMonth': '/mois',
    'pricing.popular': 'Le Plus Populaire',
    'pricing.trial': '3 jours d\'essai gratuit',
    'plan.basic.cta': 'Essai Gratuit 3 Jours',
    'plan.pro.cta': 'Choisir Pro',
    'plan.vip.cta': 'Rejoindre VIP',

    // Plan features
    'plan.basic.f1': 'Signaux illimites',
    'plan.basic.f2': 'Dashboard complet & stats',
    'plan.basic.f3': 'Notifications email & web',
    'plan.basic.f4': 'Historique des signaux',
    'plan.basic.f5': 'Journal de trading',
    'plan.pro.f1': 'Tout le plan Basic inclus',
    'plan.pro.f2': 'Explications IA des trades',
    'plan.pro.f3': 'Alertes Telegram & Email',
    'plan.pro.f4': 'Analytiques avancees',
    'plan.pro.f5': 'Support prioritaire',
    'plan.vip.f1': 'Tout le plan Pro inclus',
    'plan.vip.f2': 'Signaux premium',
    'plan.vip.f3': 'Analyse de marche quotidienne IA',
    'plan.vip.f4': 'Strategies personnalisees',
    'plan.vip.f5': 'Coach IA personnel',
    'plan.vip.f6': 'Support 1-a-1',

    // Testimonials
    'testimonials.title1': 'La Confiance Des',
    'testimonials.title2': 'Traders Du Monde Entier',

    // CTA
    'cta.title1': 'Pret a Trader avec la',
    'cta.title2': 'Puissance de l\'IA',
    'cta.subtitle': 'Rejoignez des milliers de traders qui utilisent l\'IA pour prendre de meilleures decisions. Essayez gratuitement pendant 3 jours.',
    'cta.button': 'Commencer l\'Essai Gratuit',

    // Footer
    'footer.rights': 'Tous droits reserves.',

    // Auth
    'auth.welcomeBack': 'Content de Vous Revoir',
    'auth.signInSubtitle': 'Connectez-vous pour acceder a vos signaux',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.rememberMe': 'Se souvenir de moi',
    'auth.forgotPassword': 'Mot de passe oublie ?',
    'auth.signIn': 'Se Connecter',
    'auth.noAccount': 'Pas encore de compte ?',
    'auth.signUpFree': 'Inscrivez-vous',
    'auth.createAccount': 'Creer un Compte',
    'auth.createSubtitle': 'Commencez a recevoir des signaux de trading IA',
    'auth.fullName': 'Nom Complet',
    'auth.confirmPassword': 'Confirmer le Mot de Passe',
    'auth.create': 'Creer le Compte',
    'auth.hasAccount': 'Vous avez deja un compte ?',
    'auth.signInLink': 'Connectez-vous',
    'auth.passwordMinLength': 'Le mot de passe doit contenir au moins 8 caracteres',
    'auth.passwordMismatch': 'Les mots de passe ne correspondent pas',
    'auth.accountCreated': 'Compte cree avec succes !',
    'auth.loginSuccess': 'Bienvenue !',
    'auth.loginFailed': 'Echec de connexion',
    'auth.registerFailed': 'Echec de l\'inscription',
    'auth.trialDenied': 'Votre essai gratuit n\'est pas disponible. Veuillez souscrire a un plan pour continuer.',

    // Dashboard nav
    'dash.dashboard': 'Tableau de Bord',
    'dash.signals': 'Signaux',
    'dash.journal': 'Journal',
    'dash.analytics': 'Analytiques',
    'dash.settings': 'Parametres',
    'dash.admin': 'Administration',
    'dash.signOut': 'Deconnexion',
    'dash.upgrade': 'Ameliorer',
    'dash.plan': 'Plan',

    // Settings
    'settings.title': 'Parametres',
    'settings.subtitle': 'Configurez vos preferences de trading. Les signaux correspondront a ces parametres.',
    'settings.plan': 'Plan d\'Abonnement',
    'settings.currentPlan': 'Plan Actuel',
    'settings.upgrade': 'Ameliorer',
    'settings.paymentMethods': 'Paiements acceptes : USDT TRC20, Binance Pay',
    'settings.markets': 'Marches',
    'settings.tradingStyle': 'Style de Trading',
    'settings.strategies': 'Strategies',
    'settings.timeframes': 'Timeframes',
    'settings.notifications': 'Notifications',
    'settings.emailNotif': 'Notifications Email',
    'settings.emailNotifDesc': 'Recevoir les signaux par email',
    'settings.whatsappNotif': 'Alertes WhatsApp',
    'settings.whatsappNotifDesc': 'Alertes de signaux via WhatsApp',
    'settings.telegramNotif': 'Alertes Telegram',
    'settings.telegramNotifDesc': 'Alertes rapides via le bot Telegram',
    'settings.browserPush': 'Notifications Navigateur',
    'settings.browserPushDesc': 'Notifications sur le bureau',
    'settings.telegramLink': 'Lier Telegram',
    'settings.telegramActive': 'Telegram connecte - Vous recevez les signaux !',
    'settings.telegramDisconnect': 'Deconnecter Telegram',
    'settings.telegramInstructions': 'Liez votre compte Telegram pour recevoir les signaux de trading en temps reel.',
    'settings.telegramStep1': '1. Ouvrez notre bot Telegram :',
    'settings.openBot': 'Ouvrir le Bot Telegram',
    'settings.telegramStep2': '2. Generez un code de liaison :',
    'settings.generateCode': 'Generer un Code',
    'settings.telegramStep3': '3. Copiez ce code et envoyez-le au bot Telegram.',
    'settings.codeExpiry': 'Ce code expire dans 10 minutes.',
    'settings.telegramCodeGenerated': 'Code de liaison genere !',
    'settings.telegramCodeError': 'Erreur lors de la generation du code',
    'settings.telegramUnlinked': 'Telegram deconnecte',
    'settings.codeCopied': 'Code copie !',
    'settings.whatsappTitle': 'Numero WhatsApp',
    'settings.whatsappDesc': 'Entrez votre numero WhatsApp avec l\'indicatif pays pour recevoir les alertes.',
    'settings.whatsappActive': 'WhatsApp connecte - Vous recevez les alertes !',
    'settings.whatsappDisconnect': 'Deconnecter WhatsApp',
    'settings.whatsappUnlinked': 'WhatsApp deconnecte',
    'settings.linked': 'Lie',
    'settings.link': 'Lier',
    'settings.save': 'Sauvegarder les Preferences',
    'settings.saved': 'Preferences sauvegardees !',
    'settings.saveFailed': 'Echec de la sauvegarde',

    // Misc
    'misc.loading': 'Chargement...',
    'misc.save': 'Sauvegarder',
    'misc.cancel': 'Annuler',
    'misc.delete': 'Supprimer',
    'misc.edit': 'Modifier',
    'misc.search': 'Rechercher',
    'misc.add': 'Ajouter',
  },
  en: {
    // Navbar
    'nav.features': 'Features',
    'nav.pricing': 'Pricing',
    'nav.reviews': 'Reviews',
    'nav.login': 'Login',
    'nav.getStarted': 'Get Started',
    'nav.terms': 'Terms',
    'nav.privacy': 'Privacy',
    'nav.contact': 'Contact',

    // Hero
    'hero.badge': 'AI-Powered Trading Intelligence',
    'hero.title1': 'Smart Trading Signals',
    'hero.title2': 'Powered by AI',
    'hero.subtitle': 'Get personalized crypto & forex signals with AI explanations, real-time alerts, and a complete trading journal. Trade smarter, not harder.',
    'hero.cta': 'Start Free 3-Day Trial',
    'hero.learnMore': 'Learn More',
    'hero.trial': '3-day free trial',
    'hero.noCard': 'No credit card required',
    'hero.cancel': 'Cancel anytime',

    // Features
    'features.title1': 'Everything You Need to',
    'features.title2': 'Trade Smarter',
    'features.subtitle': 'Powered by advanced AI that analyzes multiple indicators and strategies in real-time.',
    'feature.ai.title': 'AI-Powered Analysis',
    'feature.ai.desc': 'Our AI analyzes trends, support/resistance, liquidity zones, order blocks, RSI, MACD, EMA and volatility in real-time.',
    'feature.signals.title': 'Instant Signals',
    'feature.signals.desc': 'Receive BUY/SELL signals with precise entry, stop loss, take profit, and risk-reward ratios instantly.',
    'feature.explanations.title': 'AI Explanations',
    'feature.explanations.desc': 'Every signal comes with a clear AI explanation of why the trade is valid, helping you learn as you trade.',
    'feature.dashboard.title': 'Smart Dashboard',
    'feature.dashboard.desc': 'Track your performance with win rate, equity curve, drawdown, and detailed trading statistics.',
    'feature.alerts.title': 'Real-Time Alerts',
    'feature.alerts.desc': 'Get notified via Telegram, email, or desktop push the moment a new signal is generated.',
    'feature.journal.title': 'Auto Trading Journal',
    'feature.journal.desc': 'Every signal is automatically logged. Track gains, losses, and improve your trading discipline.',

    // Live stats
    'stats.winRate': 'Win Rate',
    'stats.signals': 'Signals Generated',
    'stats.traders': 'Active Traders',
    'stats.markets': 'Markets Covered',

    // Pricing
    'pricing.title1': 'Simple,',
    'pricing.title2': 'Transparent Pricing',
    'pricing.subtitle': 'Choose the plan that fits your trading needs.',
    'pricing.perMonth': '/month',
    'pricing.popular': 'Most Popular',
    'pricing.trial': '3-day free trial',
    'plan.basic.cta': 'Start Free 3-Day Trial',
    'plan.pro.cta': 'Go Pro',
    'plan.vip.cta': 'Join VIP',

    // Plan features
    'plan.basic.f1': 'Unlimited signals',
    'plan.basic.f2': 'Full dashboard & stats',
    'plan.basic.f3': 'Email & Web notifications',
    'plan.basic.f4': 'Signal history',
    'plan.basic.f5': 'Trading journal',
    'plan.pro.f1': 'Everything in Basic',
    'plan.pro.f2': 'AI trade explanations',
    'plan.pro.f3': 'Telegram & Email alerts',
    'plan.pro.f4': 'Advanced analytics',
    'plan.pro.f5': 'Priority support',
    'plan.vip.f1': 'Everything in Pro',
    'plan.vip.f2': 'Premium signals',
    'plan.vip.f3': 'Daily AI market analysis',
    'plan.vip.f4': 'Custom strategies',
    'plan.vip.f5': 'Personal AI coach',
    'plan.vip.f6': '1-on-1 support',

    // Testimonials
    'testimonials.title1': 'Trusted by',
    'testimonials.title2': 'Traders Worldwide',

    // CTA
    'cta.title1': 'Ready to Trade with',
    'cta.title2': 'AI Power',
    'cta.subtitle': 'Join thousands of traders using AI to make smarter decisions. Try free for 3 days.',
    'cta.button': 'Start Free Trial',

    // Footer
    'footer.rights': 'All rights reserved.',

    // Auth
    'auth.welcomeBack': 'Welcome Back',
    'auth.signInSubtitle': 'Sign in to access your trading signals',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.rememberMe': 'Remember me',
    'auth.forgotPassword': 'Forgot password?',
    'auth.signIn': 'Sign In',
    'auth.noAccount': "Don't have an account?",
    'auth.signUpFree': 'Sign up free',
    'auth.createAccount': 'Create Account',
    'auth.createSubtitle': 'Start receiving AI-powered trading signals',
    'auth.fullName': 'Full Name',
    'auth.confirmPassword': 'Confirm Password',
    'auth.create': 'Create Account',
    'auth.hasAccount': 'Already have an account?',
    'auth.signInLink': 'Sign in',
    'auth.passwordMinLength': 'Password must be at least 8 characters',
    'auth.passwordMismatch': 'Passwords do not match',
    'auth.accountCreated': 'Account created successfully!',
    'auth.loginSuccess': 'Welcome back!',
    'auth.loginFailed': 'Login failed',
    'auth.registerFailed': 'Registration failed',
    'auth.trialDenied': 'Your free trial is not available. Please subscribe to a plan to continue.',

    // Dashboard nav
    'dash.dashboard': 'Dashboard',
    'dash.signals': 'Signals',
    'dash.journal': 'Journal',
    'dash.analytics': 'Analytics',
    'dash.settings': 'Settings',
    'dash.admin': 'Admin',
    'dash.signOut': 'Sign Out',
    'dash.upgrade': 'Upgrade',
    'dash.plan': 'Plan',

    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Configure your trading preferences. Signals will match these settings.',
    'settings.plan': 'Subscription Plan',
    'settings.currentPlan': 'Current Plan',
    'settings.upgrade': 'Upgrade',
    'settings.paymentMethods': 'Payments accepted: USDT TRC20, Binance Pay',
    'settings.markets': 'Markets',
    'settings.tradingStyle': 'Trading Style',
    'settings.strategies': 'Strategies',
    'settings.timeframes': 'Timeframes',
    'settings.notifications': 'Notifications',
    'settings.emailNotif': 'Email Notifications',
    'settings.emailNotifDesc': 'Receive signals via email',
    'settings.whatsappNotif': 'WhatsApp Alerts',
    'settings.whatsappNotifDesc': 'Signal alerts via WhatsApp',
    'settings.telegramNotif': 'Telegram Alerts',
    'settings.telegramNotifDesc': 'Fast alerts via Telegram bot',
    'settings.browserPush': 'Browser Push',
    'settings.browserPushDesc': 'Desktop notifications',
    'settings.telegramLink': 'Link Telegram',
    'settings.telegramActive': 'Telegram connected - You are receiving signals!',
    'settings.telegramDisconnect': 'Disconnect Telegram',
    'settings.telegramInstructions': 'Link your Telegram account to receive real-time trading signals.',
    'settings.telegramStep1': '1. Open our Telegram bot:',
    'settings.openBot': 'Open Telegram Bot',
    'settings.telegramStep2': '2. Generate a linking code:',
    'settings.generateCode': 'Generate Code',
    'settings.telegramStep3': '3. Copy this code and send it to the Telegram bot.',
    'settings.codeExpiry': 'This code expires in 10 minutes.',
    'settings.telegramCodeGenerated': 'Linking code generated!',
    'settings.telegramCodeError': 'Error generating code',
    'settings.telegramUnlinked': 'Telegram disconnected',
    'settings.codeCopied': 'Code copied!',
    'settings.whatsappTitle': 'WhatsApp Number',
    'settings.whatsappDesc': 'Enter your WhatsApp number with country code to receive signal alerts.',
    'settings.whatsappActive': 'WhatsApp connected - You are receiving alerts!',
    'settings.whatsappDisconnect': 'Disconnect WhatsApp',
    'settings.whatsappUnlinked': 'WhatsApp disconnected',
    'settings.linked': 'Linked',
    'settings.link': 'Link',
    'settings.save': 'Save Preferences',
    'settings.saved': 'Preferences saved!',
    'settings.saveFailed': 'Failed to save preferences',

    // Misc
    'misc.loading': 'Loading...',
    'misc.save': 'Save',
    'misc.cancel': 'Cancel',
    'misc.delete': 'Delete',
    'misc.edit': 'Edit',
    'misc.search': 'Search',
    'misc.add': 'Add',
  },
};

export const useI18n = create<I18nState>((set, get) => ({
  locale: 'fr',
  setLocale: (locale: Locale) => {
    set({ locale });
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale);
    }
  },
  t: (key: string) => {
    const { locale } = get();
    return translations[locale][key] || translations['en'][key] || key;
  },
}));

// Initialize from localStorage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('locale') as Locale | null;
  if (saved && (saved === 'fr' || saved === 'en')) {
    useI18n.setState({ locale: saved });
  }
}
