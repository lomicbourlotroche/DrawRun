'use client';

import { Toaster } from 'sonner';
import { QueryProvider } from './QueryProvider';
import { ErrorBoundary } from './ErrorBoundary';
import { LanguageProvider } from './LanguageProvider';
import { ThemeProvider } from './ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
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
      </ThemeProvider>
    </ErrorBoundary>
  );
}
