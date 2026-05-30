import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/providers/Providers';
import { ServiceWorkerRegistration } from '@/components/providers/ServiceWorkerRegistration';
import './globals.css';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.drawrun.fr';

export const metadata: Metadata = {
  title: {
    default: 'DrawRun — Coaching sportif intelligent & analyse de performance',
    template: '%s | DrawRun',
  },
  description: 'Optimisez vos entraînements avec le moteur Jack Daniels VDOT, un coaching adaptatif personnalisé, la météo en temps réel et des stratégies de course scientifiques. Course à pied, vélo, natation — suivez vos progrès avec 15+ métriques avancées.',
  keywords: [
    'coaching sportif',
    'entraînement course à pied',
    'VDOT Jack Daniels',
    'analyse performance sportive',
    'planification course',
    'suivi entraînement',
    'VO2 max',
    'fréquence cardiaque',
    'allure course',
    'application sport',
    'running app',
    'training plan',
  ],
  authors: [{ name: 'DrawRun' }],
  creator: 'DrawRun',
  publisher: 'DrawRun',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: APP_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: APP_URL,
    siteName: 'DrawRun',
    title: 'DrawRun — Coaching sportif intelligent & analyse de performance',
    description: 'Optimisez vos entraînements avec le moteur Jack Daniels VDOT, un coaching adaptatif personnalisé, la météo en temps réel et des stratégies de course scientifiques.',
    images: [
      {
        url: '/logo-icon.svg',
        width: 512,
        height: 512,
        alt: 'DrawRun Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    site: '@drawrun',
    title: 'DrawRun — Coaching sportif intelligent & analyse de performance',
    description: 'Optimisez vos entraînements avec le moteur Jack Daniels VDOT, un coaching adaptatif personnalisé et des stratégies de course scientifiques.',
    images: ['/logo-icon.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/logo-icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/logo-icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    shortcut: '/logo-icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DrawRun',
  },
  category: 'sports',
};

export const viewport: Viewport = {
  themeColor: 'var(--primary)',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/logo-icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo-icon.svg" />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
