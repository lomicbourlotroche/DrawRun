'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from '@/components/ui/icons';

export default function DecathlonCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/app/profile/sync');
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Redirection...</h2>
      </div>
    </div>
  );
}
