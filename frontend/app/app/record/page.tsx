/**
 * Record Activity Page - Mobile-only GPS recording
 * =====================================================
 * Page complète pour enregistrer une activité avec GPS en temps réel.
 * Visible uniquement sur mobile. Redirige le desktop vers /app/activities/new.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MobileActivityRecorder } from '@/components/features/activities/MobileActivityRecorder';

export default function RecordActivityPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        const mobile = window.innerWidth < 1024;
        setIsMobile(mobile);
        if (!mobile) {
          router.replace('/app/activities/new');
        }
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [router]);

  const handleSave = () => {
    router.push('/app/activities');
  };

  const handleCancel = () => {
    router.back();
  };

  if (isMobile === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-blue-500 animate-spin" />
        <div className="text-slate-400 text-sm font-medium">Préparation de l&apos;enregistrement...</div>
      </div>
    );
  }

  if (!isMobile) return null;

  return <MobileActivityRecorder onSave={handleSave} onCancel={handleCancel} />;
}
