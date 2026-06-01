/**
 * Record Activity Page - Mobile-only GPS recording
 * =====================================================
 * Page compl\u00e8te pour enregistrer une activit\u00e9 avec GPS en temps r\u00e9el.
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
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
          <div className="text-muted text-sm font-medium">Pr\u00e9paration...</div>
        </div>
      </div>
    );
  }

  if (!isMobile) return null;

  return (
    <div className="min-h-screen bg-background">
      <MobileActivityRecorder onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}
