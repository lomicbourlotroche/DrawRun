'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuthStore, useNotificationsStore } from '@/stores';
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  Brain,
  Route,
  Compass,
  Users,
  User,
  Settings,
  LogOut,
  Menu,
  X,
} from '@/components/ui/icons';

const navGroups = [
  {
    key: 'main',
    items: [
      { href: '/app', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
      { href: '/app/activities', label: 'Activités', icon: Activity },
      { href: '/app/performance', label: 'Performance', icon: BarChart3 },
    ],
  },
  {
    key: 'coaching',
    items: [
      { href: '/app/coach', label: 'Coach', icon: Brain },
      { href: '/app/race-planning', label: 'Race Planning', icon: Route },
      { href: '/app/explore', label: 'Explorer', icon: Compass },
      { href: '/app/social', label: 'Social', icon: Users },
    ],
  },
  {
    key: 'account',
    items: [{ href: '/app/profile', label: 'Profil', icon: User }],
  },
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
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-surface/95 backdrop-blur-xl rounded-xl border border-border/60 shadow-sm"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5 text-muted" />
      </button>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-surface/80 backdrop-blur-xl border-r border-border z-50 transition-all duration-300 flex flex-col',
          'before:absolute before:top-0 before:left-0 before:w-[3px] before:h-1/3 before:bg-gradient-to-b before:from-primary before:to-transparent before:pointer-events-none',
          'w-full max-w-64 lg:max-w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex items-center h-16 px-5 border-b border-border/60 flex-shrink-0">
          <Link href="/app" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary/30">
              <span className="text-white font-bold text-sm">DR</span>
            </div>
            <div className="min-w-0">
              <span
                className="text-base font-bold text-foreground tracking-tight truncate block leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                DrawRun
              </span>
              <span className="text-[10px] text-muted font-medium tracking-wide uppercase">Performance Analytics</span>
            </div>
          </Link>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden ml-auto p-1 hover:bg-background rounded-lg transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          {navGroups.map((group, groupIdx) => (
            <div key={group.key}>
              {groupIdx > 0 && <div className="my-3 border-t border-border/50" />}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href, item.exact);
                  const hasNotifications = item.href === '/app/social' && unreadCount > 0;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                        'hover:translate-x-0.5',
                        active
                          ? 'bg-primary/10 text-primary font-semibold shadow-sm before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:rounded-r-full before:bg-primary before:shadow-sm before:shadow-primary/40'
                          : 'text-muted hover:text-foreground hover:bg-muted/10',
                      )}
                    >
                      <item.icon
                        className={cn(
                          'w-5 h-5 flex-shrink-0 transition-colors duration-200',
                          active ? 'text-primary' : 'text-muted group-hover:text-foreground',
                        )}
                      />
                      <span className={cn(active ? 'font-semibold' : 'font-medium')}>{item.label}</span>
                      {hasNotifications && (
                        <span className="ml-auto w-5 h-5 bg-danger rounded-full flex items-center justify-center text-[9px] font-bold text-white leading-none flex-shrink-0 shadow-sm shadow-danger/30">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="flex-shrink-0 border-t border-border/50 px-3 py-3 space-y-1">
          {user && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/10 transition-all duration-200 cursor-pointer group">
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 border-2 border-border flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{initials}</span>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-surface animate-breathe" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate leading-tight">{user.name}</p>
                <p className="text-[11px] text-muted truncate leading-tight mt-0.5">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-danger hover:bg-danger/10 transition-all duration-200',
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
