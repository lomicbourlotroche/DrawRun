'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    console.log('[AppLayout] isAuthenticated:', isAuthenticated);
    if (!isAuthenticated) {
      console.log('[AppLayout] Redirecting to /login');
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
          <p className="text-sm text-slate-500">Chargement…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      {/*
        The sidebar is 64px (collapsed) or 256px (expanded).
        We use lg:pl-64 as the default; the sidebar collapse state is
        managed inside Sidebar itself and doesn't affect this layout
        because the sidebar is fixed-positioned.
        For a fully dynamic collapse-aware layout, CSS variables would be
        needed — kept simple here to avoid over-engineering.
      */}
      <div className="lg:pl-64 min-h-screen transition-all duration-300">
        <Header />
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
