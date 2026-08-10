import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { ErrorBoundary } from './ErrorBoundary';

// Suppress React's console.error output for expected errors in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalConsoleError;
});

// Component that throws an error with the given message
function ThrowingComponent({ message }: { message: string }): never {
  throw new Error(message);
}

// Component that renders normally
function NormalComponent() {
  return <div>Normal content</div>;
}

describe('ErrorBoundary', () => {
  describe('Unit tests', () => {
    it('renders children when no error is thrown', () => {
      render(
        <ErrorBoundary>
          <NormalComponent />
        </ErrorBoundary>,
      );
      expect(screen.getByText('Normal content')).toBeTruthy();
    });

    it('renders fallback UI when a child throws', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent message="test error" />
        </ErrorBoundary>,
      );
      expect(screen.getByText('Une erreur est survenue')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Réessayer' })).toBeTruthy();
    });

    it('renders custom fallback when provided and child throws', () => {
      render(
        <ErrorBoundary fallback={<div>Custom fallback</div>}>
          <ThrowingComponent message="test error" />
        </ErrorBoundary>,
      );
      expect(screen.getByText('Custom fallback')).toBeTruthy();
    });

    it('calls onError callback when a child throws', () => {
      const onError = vi.fn();
      render(
        <ErrorBoundary onError={onError}>
          <ThrowingComponent message="specific error" />
        </ErrorBoundary>,
      );
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(onError.mock.calls[0][0].message).toBe('specific error');
    });

    it('retry button resets error state and re-renders children', () => {
      let shouldThrow = true;

      function ConditionalThrow() {
        if (shouldThrow) throw new Error('conditional error');
        return <div>Recovered</div>;
      }

      const { rerender } = render(
        <ErrorBoundary>
          <ConditionalThrow />
        </ErrorBoundary>,
      );

      expect(screen.getByRole('button', { name: 'Réessayer' })).toBeTruthy();

      // Stop throwing before retry
      shouldThrow = false;
      fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

      rerender(
        <ErrorBoundary>
          <ConditionalThrow />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Recovered')).toBeTruthy();
    });

    it('shows error message in development environment', () => {
      const _originalEnv = process.env.NODE_ENV;
      // NODE_ENV is 'test' (not 'production'), so dev branch should render
      render(
        <ErrorBoundary>
          <ThrowingComponent message="dev error message" />
        </ErrorBoundary>,
      );
      expect(screen.getByText('dev error message')).toBeTruthy();
    });
  });

  describe('Property-based tests', () => {
    // Feature: drawrun-improvements, Property 10: onError called for any caught error
    // Validates: Requirement 8.4
    it('Property 10: onError callback called with the thrown error for any error message', () => {
      fc.assert(
        fc.property(fc.string(), (message) => {
          const onError = vi.fn();

          const { unmount } = render(
            <ErrorBoundary onError={onError}>
              <ThrowingComponent message={message} />
            </ErrorBoundary>,
          );

          const called = onError.mock.calls.length === 1;
          const errorMatches =
            onError.mock.calls[0]?.[0] instanceof Error && onError.mock.calls[0][0].message === message;

          unmount();

          return called && errorMatches;
        }),
        { numRuns: 50 },
      );
    });
  });
});
