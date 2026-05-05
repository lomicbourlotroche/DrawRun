'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore, useSyncStore } from '@/stores';
import { ThemeToggle } from '@/components/providers/ThemeToggle';
import { LanguageToggle } from '@/components/providers/LanguageToggle';
import { InstallPrompt } from '@/components/providers/InstallPrompt';
import { RefreshCw, Settings, LogOut, User, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

/** Map pathname prefixes to human-readable page titles */
const PAGE_TITLES: { prefix: string; label: string; exact?: boolean }[] = [
  { prefix: '/app', label: 'Tableau de bord', exact: true },
  { prefix: '/app/activities/new', label: 'Nouvelle activité' },
  { prefix: '/app/activities', label: 'Activités' },
  { prefix: '/app/performance', label: 'Performance' },
  { prefix: '/app/coach', label: 'Coach' },
  { prefix: '/app/social', label: 'Social' },
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
  const { sync, isSyncing } = useSyncStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const pageTitle = getPageTitle(pathname);

  // Initials for avatar
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

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left: spacer for mobile hamburger + page title */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Spacer for mobile hamburger button rendered by Sidebar */}
          <div className="lg:hidden w-10 flex-shrink-0" />
          <h1 className="text-base lg:text-lg font-semibold text-slate-900 truncate">
            {pageTitle}
          </h1>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* Sync button */}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
              'border border-slate-200 bg-white text-slate-600',
              'hover:bg-slate-50 hover:text-slate-900',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <ThemeToggle />
          <LanguageToggle />
          <InstallPrompt />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
              aria-label="Menu utilisateur"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-blue-700">{initials}</span>
              </div>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-slate-400 hidden sm:block transition-transform duration-150',
                  isUserMenuOpen && 'rotate-180'
                )}
              />
            </button>

            {isUserMenuOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 animate-slide-down overflow-hidden">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>

                  <Link
                    href="/app/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    Mon profil
                  </Link>
                  <Link
                    href="/app/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Paramètres
                  </Link>

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
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
