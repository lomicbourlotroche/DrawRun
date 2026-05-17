/**
 * ============================================================
 * PERFORMANCE UTILITIES
 * ============================================================
 * 
 * Utilitaires d'optimisation des performances pour DrawRun
 * - Lazy loading des composants
 * - Virtualisation des listes
 * - Optimisation des images
 * - Cache management
 */

import React, { Suspense } from 'react';

// ============================================================================
// LAZY LOADING COMPONENTS
// ============================================================================

// Lazy loading pour les composants lourds (commentés pour éviter les erreurs d'import)
// export const LazyDashboard = lazy(() => import('@/components/features/dashboard/Dashboard'));
// export const LazyActivitiesList = lazy(() => import('@/components/features/activities/ActivitiesList'));
// export const LazyPerformanceCharts = lazy(() => import('@/components/features/performance/PerformanceCharts'));
// export const LazySocialFeed = lazy(() => import('@/components/features/social/SocialFeed'));

// Wrapper pour les composants lazy avec fallback
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LazyWrapper({ children, fallback }: LazyWrapperProps): React.ReactElement {
  const defaultFallback = React.createElement('div', {
    className: 'animate-pulse bg-gray-200 h-32 rounded'
  });
  
  return React.createElement(
    Suspense,
    { fallback: fallback || defaultFallback },
    children
  );
}

// ============================================================================
// VIRTUALIZATION
// ============================================================================

/**
 * Hook pour la virtualisation de longues listes
 * @param items - Liste des éléments
 * @param itemHeight - Hauteur de chaque élément
 * @param containerHeight - Hauteur du conteneur
 * @returns {Object} Éléments visibles et fonctions de scroll
 */
export function useVirtualization<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount, items.length);

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    offsetY,
    startIndex,
    endIndex,
    handleScroll,
    totalHeight: items.length * itemHeight,
  };
}

// ============================================================================
// IMAGE OPTIMIZATION
// ============================================================================

/**
 * Génère des URLs d'images optimisées
 * @param src - Source de l'image
 * @param width - Largeur souhaitée
 * @param quality - Qualité (1-100)
 * @returns {string} URL optimisée
 */
export function getOptimizedImageUrl(src: string, width: number, quality = 80): string {
  // Si c'est déjà une URL optimisée, la retourner
  if (src.includes('?')) {
    return src;
  }

  // Pour les images locales, utiliser Next.js Image optimization
  if (src.startsWith('/')) {
    return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
  }

  // Pour les images externes, ajouter des paramètres d'optimisation
  try {
    const url = new URL(src);
    url.searchParams.set('w', width.toString());
    url.searchParams.set('q', quality.toString());
    
    return url.toString();
  } catch {
    // Si l'URL est invalide, retourner l'URL originale
    return src;
  }
}

/**
 * Précharge les images critiques
 * @param urls - Liste des URLs à précharger
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  const promises = urls.map(url => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
  });

  return Promise.all(promises);
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class PerformanceCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize = 100; // Max 100 entrées

  /**
   * Stocke une valeur dans le cache
   * @param key - Clé du cache
   * @param data - Données à stocker
   * @param ttl - Durée de vie en millisecondes
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Nettoyer les entrées expirées
    this.cleanup();

    // Si le cache est plein, supprimer la plus ancienne entrée
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Récupère une valeur du cache
   * @param key - Clé du cache
   * @returns {T|null} Données ou null si expiré/inexistant
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Vérifier si l'entrée est expirée
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Supprime une entrée du cache
   * @param key - Clé du cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Vide le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Nettoie les entrées expirées
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Retourne les statistiques du cache
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl,
        expired: Date.now() - entry.timestamp > entry.ttl,
      })),
    };
  }
}

// Instance globale du cache
export const performanceCache = new PerformanceCache();

// ============================================================================
// DEBOUNCE ET THROTTLE
// ============================================================================

/**
 * Debounce une fonction
 * @param func - Fonction à debounce
 * @param delay - Délai en millisecondes
 * @returns {Function} Fonction debouncée
 */
export function debounce<T extends (..._args: never[]) => unknown>(
  func: T,
  delay: number
): (..._args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (..._args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(..._args), delay);
  };
}

/**
 * Throttle une fonction
 * @param func - Fonction à throttle
 * @param delay - Délai en millisecondes
 * @returns {Function} Fonction throttlée
 */
export function throttle<T extends (..._args: never[]) => unknown>(
  func: T,
  delay: number
): (..._args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (..._args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(..._args);
    }
  };
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  /**
   * Démarre le monitoring des performances
   */
  start(): void {
    if (typeof window === 'undefined') return;

    // Observer pour les mesures de navigation
    const navigationObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.recordMetric('domContentLoaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
          this.recordMetric('loadComplete', navEntry.loadEventEnd - navEntry.loadEventStart);
          this.recordMetric('firstPaint', navEntry.responseEnd - navEntry.requestStart);
        }
      }
    });

    navigationObserver.observe({ entryTypes: ['navigation'] });
    this.observers.push(navigationObserver);

    // Observer pour les mesures de ressources
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.recordMetric(`resource-${resourceEntry.name}`, resourceEntry.duration);
        }
      }
    });

    resourceObserver.observe({ entryTypes: ['resource'] });
    this.observers.push(resourceObserver);
  }

  /**
   * Enregistre une métrique personnalisée
   * @param name - Nom de la métrique
   * @param value - Valeur de la métrique
   */
  recordMetric(name: string, value: number): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
    });

    // Garder seulement les 1000 dernières métriques
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Mesure le temps d'exécution d'une fonction
   * @param name - Nom de la mesure
   * @param fn - Fonction à mesurer
   * @returns {Promise<*>} Résultat de la fonction
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name}-error`, duration);
      throw error;
    }
  }

  /**
   * Retourne les métriques enregistrées
   * @param {string} name - Nom optionnel pour filtrer
   * @returns {PerformanceMetric[]} Métriques
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(metric => metric.name === name);
    }
    return [...this.metrics];
  }

  /**
   * Arrête le monitoring
   */
  stop(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * Retourne les statistiques des métriques
   * @param {string} name - Nom optionnel pour filtrer
   * @returns {Object} Statistiques
   */
  getStats(name?: string) {
    const metrics = this.getMetrics(name);
    
    if (metrics.length === 0) {
      return null;
    }

    const values = metrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculer la médiane
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    return {
      count: metrics.length,
      avg,
      min,
      max,
      median,
      sum,
      metrics: metrics.slice(-10), // 10 dernières mesures
    };
  }
}

// Instance globale du monitoring
export const performanceMonitor = new PerformanceMonitor();

// ============================================================================
// UTILITAIRES D'OPTIMISATION
// ============================================================================

/**
 * Vérifie si l'utilisateur est sur un appareil mobile
 * @returns {boolean} True si mobile
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Vérifie si l'utilisateur a une connexion lente
 * @returns {boolean} True si connexion lente
 */
/**
 * Network connection information from the Network Information API
 */
interface NetworkConnection extends EventTarget {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  saveData: boolean;
  downlink?: number;
  rtt?: number;
  downlinkMax?: number;
}

/**
 * Extended navigator with connection property
 */
interface NavigatorWithConnection extends Navigator {
  connection?: NetworkConnection;
}

export function isSlowConnection(): boolean {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return false;
  }

  const nav = navigator as NavigatorWithConnection;
  const connection = nav.connection;
  return connection?.effectiveType === 'slow-2g' || 
         connection?.effectiveType === '2g' ||
         connection?.saveData === true;
}

/**
 * Adaptative quality based on device and connection
 * @returns {number} Quality factor (0.5 to 1)
 */
export function getAdaptiveQuality(): number {
  if (isMobile()) return 0.7;
  if (isSlowConnection()) return 0.5;
  return 1.0;
}

/**
 * Optimise les animations en fonction des préférences utilisateur
 * @returns {boolean} True si les animations sont réduites
 */
export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Démarrer le monitoring au chargement
if (typeof window !== 'undefined') {
  performanceMonitor.start();
}
