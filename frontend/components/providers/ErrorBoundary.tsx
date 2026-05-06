/* eslint-disable unused-imports/no-unused-vars */
'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // TODO: In production, send to error tracking service (Sentry, etc.)
    logger.error('ErrorBoundary caught error', { 
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack 
    });
    this.props.onError?.(error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          background: '#1a1a1a', 
          color: '#fff',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Une erreur est survenue</h1>
            {process.env.NODE_ENV !== 'production' ? (
              <p style={{ color: '#f87171', marginBottom: '16px' }}>
                {this.state.error?.message}
              </p>
            ) : (
              <p style={{ color: '#888', marginBottom: '16px' }}>
                Une erreur inattendue est survenue. Veuillez réessayer.
              </p>
            )}
            <button
              onClick={this.handleRetry}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
