'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isHydrated, router]);

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full" />
          <p className="text-sm text-muted">Chargement…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(color-mix(in srgb, var(--primary), transparent 98%)_1px,transparent_1px),linear-gradient(90deg,color-mix(in srgb, var(--primary), transparent 98%)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <Sidebar />
      {/*
        The sidebar is 64px (collapsed) or 256px (expanded).
        We use md:pl-16 for tablets (collapsed sidebar) and lg:pl-64 for desktop.
        The sidebar collapse state is managed inside Sidebar itself and doesn't affect
        this layout because the sidebar is fixed-positioned.
      */}
      <div className="pl-4 md:pl-16 lg:pl-64 min-h-screen transition-all duration-300 relative z-0 overflow-y-auto">
        <Header />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
