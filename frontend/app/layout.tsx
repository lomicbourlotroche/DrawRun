import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/providers/Providers';
import { ServiceWorkerRegistration } from '@/components/providers/ServiceWorkerRegistration';
import './globals.css';

export const metadata: Metadata = {
  title: 'DrawRun - Smart Training',
  description: 'Plateforme d\'entraînement sportif avec coaching intelligent',
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
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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