'use client';

import { Toaster } from 'sonner';
import { QueryProvider } from './QueryProvider';
import { ErrorBoundary } from './ErrorBoundary';
import { LanguageProvider } from './LanguageProvider';

/**
 * Providers
 * =========
 * Wrapper client qui regroupe tous les providers de l'application
 * Permet au layout racine d'être un Server Component
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <LanguageProvider>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'bg-surface border border-border text-foreground',
            }}
          />
        </LanguageProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
