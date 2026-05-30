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
  Trophy,
  Compass,
} from 'lucide-react';

const navItems = [
  { href: '/app', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/app/activities', label: 'Activités', icon: BookOpen },
  { href: '/app/performance', label: 'Performance', icon: Activity },
  { href: '/app/coach', label: 'Coach', icon: Dumbbell },
  { href: '/app/race-planning', label: 'Race Planning', icon: Trophy },
  { href: '/app/explore', label: 'Explorer', icon: Compass },
  { href: '/app/social', label: 'Social', icon: Users },
  { href: '/app/profile', label: 'Profil', icon: User },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, logout, user } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationsStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  if (!isAuthenticated) return null;

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-surface/95 backdrop-blur-xl rounded-xl border border-border/60 shadow-sm"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5 text-muted" />
      </button>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/40 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-surface/95 backdrop-blur-md border-r border-border z-50 transition-all duration-300 ease-smooth flex flex-col',
          'w-full max-w-64 lg:max-w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center h-16 px-4 border-b border-border/60 flex-shrink-0">
          <Link href="/app" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">DR</span>
            </div>
            <span className="text-base font-bold text-foreground tracking-tight truncate">DrawRun</span>
          </Link>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden ml-auto p-1 hover:bg-background rounded-lg transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            const hasNotifications = item.href === '/app/social' && unreadCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ease-smooth relative group',
                  active
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-muted-foreground hover:bg-muted/20 hover:text-foreground'
                )}
              >
                <div className="relative flex-shrink-0">
                  <item.icon
                    className={cn('w-5 h-5', active ? 'text-primary-600' : 'text-muted group-hover:text-muted')}
                  />
                  {hasNotifications && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-danger rounded-full flex items-center justify-center text-[8px] font-bold text-white leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className={cn('text-sm', active ? 'font-semibold' : 'font-medium')}>
                  {item.label}
                </span>
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary-500 rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex-shrink-0 border-t border-border/60 p-3 space-y-1">
          {user && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary-700">{initials}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-muted hover:text-danger-600 hover:bg-danger-50 transition-all duration-150'
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
