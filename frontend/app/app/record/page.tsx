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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Chargement...</div>
      </div>
    );
  }

  if (!isMobile) return null;

  return <MobileActivityRecorder onSave={handleSave} onCancel={handleCancel} />;
}
