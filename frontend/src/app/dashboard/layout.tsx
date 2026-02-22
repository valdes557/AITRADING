'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  TrendingUp,
  LayoutDashboard,
  Zap,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  Crown,
  Bell,
  User,
  BarChart3,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', adminOnly: false },
  { href: '/dashboard/signals', icon: Zap, label: 'Signals', adminOnly: false },
  { href: '/dashboard/journal', icon: BookOpen, label: 'Journal', adminOnly: false },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics', adminOnly: false },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings', adminOnly: false },
  { href: '/dashboard/admin', icon: Shield, label: 'Admin', adminOnly: true },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, fetchProfile, logout, isLoading } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) return null;

  const planColors: Record<string, string> = {
    free: 'text-dark-400',
    basic: 'text-blue-400',
    pro: 'text-primary-400',
    vip: 'text-warning',
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-dark-900 border-r border-dark-700 flex flex-col transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6 border-b border-dark-700">
          <Link href="/" className="flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-primary-500" />
            <span className="text-lg font-bold gradient-text">AI Signals</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.filter((item) => !item.adminOnly || user?.role === 'admin').map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary-600/10 text-primary-400 border border-primary-500/20'
                    : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-dark-700">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className={cn('text-xs font-semibold uppercase flex items-center gap-1', planColors[user.plan])}>
                {user.plan === 'vip' && <Crown className="w-3 h-3" />}
                {user.plan} Plan
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-dark-400 hover:text-sell hover:bg-dark-800 w-full transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 border-b border-dark-700 flex items-center justify-between px-6 glass sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-dark-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <button className="relative text-dark-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
            </button>
            {user.plan === 'free' && (
              <Link
                href="/dashboard/settings"
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
              >
                <Crown className="w-3.5 h-3.5" />
                Upgrade
              </Link>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
