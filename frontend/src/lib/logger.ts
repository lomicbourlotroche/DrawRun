/* eslint-disable no-console */
/**
 * Logger utility for DrawRun frontend
 * Replaces console.* calls with structured logging
 * Supports different log levels and environments
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

class Logger {
  private static instance: Logger;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    // In development, log to console with formatting
    if (this.isDevelopment) {
      const styles = {
        debug: 'color: var(--muted)',
        info: 'color: var(--primary)',
        warn: 'color: var(--warning)',
        error: 'color: var(--danger); font-weight: bold',
      };

      console.log(
        `%c[${entry.level.toUpperCase()}] ${entry.message}`,
        styles[level],
        context ? context : ''
      );
    }

    // TODO: In production, send to logging service (Sentry, LogRocket, etc.)
    // if (!this.isDevelopment) {
    //   sendToLoggingService(entry);
    // }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }
}

export const logger = Logger.getInstance();
