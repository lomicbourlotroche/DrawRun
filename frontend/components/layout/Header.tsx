'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore, useSyncStore, useNotificationsStore } from '@/stores';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { RefreshCw, Settings, LogOut, User, ChevronDown, Bell } from '@/components/ui/icons';
import { toast } from 'sonner';

const PAGE_TITLES: { prefix: string; label: string; exact?: boolean }[] = [
  { prefix: '/app', label: 'Tableau de bord', exact: true },
  { prefix: '/app/activities/new', label: 'Nouvelle activité' },
  { prefix: '/app/activities', label: 'Activités' },
  { prefix: '/app/performance', label: 'Performance' },
  { prefix: '/app/coach', label: 'Coach' },
  { prefix: '/app/social', label: 'Social' },
  { prefix: '/app/settings', label: 'Paramètres' },
  { prefix: '/app/profile', label: 'Profil' },
  { prefix: '/app/explore', label: 'Explorer' },
];

function getPageTitle(pathname: string): string {
  for (const entry of PAGE_TITLES) {
    if (entry.exact ? pathname === entry.prefix : pathname.startsWith(entry.prefix)) {
      return entry.label;
    }
  }
  return 'DrawRun';
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationsStore();
  const { sync, isSyncing } = useSyncStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const pageTitle = getPageTitle(pathname);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const handleSync = async () => {
    const result = await sync();
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const closeMenus = () => {
    setIsNotifOpen(false);
    setIsUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-sticky bg-surface/80 backdrop-blur-md border-b border-border transition-all duration-200">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="lg:hidden w-10 flex-shrink-0" />
          <h1 className="text-base lg:text-lg font-semibold text-foreground tracking-tight truncate">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:text-primary hover:bg-primary-50 transition-colors disabled:opacity-50"
            aria-label="Synchroniser"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
          </button>

          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:text-primary hover:bg-primary-50 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeMenus} role="presentation" aria-hidden="true" />
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-surface/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-lg z-dropdown py-2 max-h-[70vh] overflow-y-auto">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={() => markAllAsRead()} className="text-xs text-primary hover:underline">
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted">Aucune notification</div>
                  ) : (
                    <div className="divide-y divide-border">
                      {notifications.slice(0, 10).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => {
                            if (n.unread) markAsRead(n.id);
                            setIsNotifOpen(false);
                          }}
                          className={cn(
                            'w-full px-4 py-3 text-left transition-colors hover:bg-primary-50/50',
                            n.unread ? 'bg-primary-50/30' : '',
                          )}
                        >
                          <p className={cn('text-sm', n.unread ? 'font-medium' : 'text-muted')}>{n.message}</p>
                          <p className="text-xs text-muted mt-1">
                            {new Date(n.created_at || Date.now()).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <ThemeToggle />

          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg hover:bg-background transition-colors"
              aria-label="Menu utilisateur"
            >
              <div className="w-7 h-7 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-primary-700">{initials}</span>
              </div>
              <ChevronDown
                size={14}
                className={cn('text-muted hidden sm:block transition-transform', isUserMenuOpen && 'rotate-180')}
              />
            </button>

            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeMenus} role="presentation" aria-hidden="true" />
                <div className="absolute right-0 mt-2 w-56 bg-surface/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-lg z-dropdown py-1">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                    <p className="text-xs text-muted truncate">{user?.email}</p>
                  </div>
                  <Link
                    href="/app/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted hover:text-foreground hover:bg-primary-50/50 transition-colors"
                  >
                    <User size={16} className="text-muted" />
                    Mon profil
                  </Link>
                  <Link
                    href="/app/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted hover:text-foreground hover:bg-primary-50/50 transition-colors"
                  >
                    <Settings size={16} className="text-muted" />
                    Paramètres
                  </Link>
                  <div className="border-t border-border mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-danger hover:text-danger hover:bg-danger-50 transition-colors"
                    >
                      <LogOut size={16} />
                      Déconnexion
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
