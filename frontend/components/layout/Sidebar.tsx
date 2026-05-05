'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuthStore, useNotificationsStore } from '@/stores';
import {
  LayoutDashboard,
  BookOpen,
  Activity,
  Dumbbell,
  User,
  Users,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Zap,
  Trophy,
} from 'lucide-react';

const navItems = [
  { href: '/app', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/app/activities', label: 'Activités', icon: BookOpen },
  { href: '/app/performance', label: 'Performance', icon: Activity },
  { href: '/app/coach', label: 'Coach', icon: Dumbbell },
  { href: '/app/race-planning', label: 'Race Planning', icon: Trophy },
  { href: '/app/social', label: 'Social', icon: Users },
  { href: '/app/profile', label: 'Profil', icon: User },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, logout, user } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationsStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30_000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchNotifications]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  // Initials for user avatar
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm active:scale-95 transition-transform"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5 text-slate-700" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-50 transition-all duration-300 flex flex-col',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex items-center h-16 px-4 border-b border-slate-200 flex-shrink-0',
            isCollapsed && 'justify-center px-0'
          )}
        >
          <Link href="/app" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
              <Zap className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <span className="text-base font-bold text-slate-900 truncate">DrawRun</span>
            )}
          </Link>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden ml-auto p-1 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            const hasNotifications = item.href === '/app/social' && unreadCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative group',
                  isCollapsed && 'justify-center px-0',
                  active
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <div className="relative flex-shrink-0">
                  <item.icon
                    className={cn(
                      'w-5 h-5',
                      active ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'
                    )}
                  />
                  {hasNotifications && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                {!isCollapsed && (
                  <span
                    className={cn(
                      'text-sm truncate',
                      active ? 'font-semibold text-blue-600' : 'font-medium'
                    )}
                  >
                    {item.label}
                  </span>
                )}
                {/* Active indicator bar */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="flex-shrink-0 border-t border-slate-200 p-3 space-y-1">
          {!isCollapsed && user && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-blue-700">{initials}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Déconnexion' : undefined}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-150',
              isCollapsed && 'justify-center px-0'
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Déconnexion</span>}
          </button>
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center hover:bg-slate-50 shadow-sm transition-colors"
          aria-label={isCollapsed ? 'Développer la sidebar' : 'Réduire la sidebar'}
        >
          <ChevronLeft
            className={cn('w-3.5 h-3.5 text-slate-500 transition-transform duration-300', isCollapsed && 'rotate-180')}
          />
        </button>
      </aside>
    </>
  );
}
