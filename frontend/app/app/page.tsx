/**
 * Dashboard Page avec Lazy Loading
 * 
 * Cette page utilise dynamic import pour charger le contenu du dashboard
 * de manière asynchrone, améliorant ainsi le temps de chargement initial.
 */

'use client';

import dynamic from 'next/dynamic';
import { DashboardSkeleton } from '@/components/ui';

// Chargement dynamique du contenu du dashboard avec skeleton
const DashboardContent = dynamic(() => import('./DashboardContent'), {
  loading: () => <DashboardSkeleton />,
  ssr: false, // Désactivé car le dashboard utilise des données client
});

export default function DashboardPage() {
  return <DashboardContent />;
}
