/**
 * ============================================================
 * API CLIENT - Export Direct (Migration Terminée)
 * ============================================================
 * 
 * L'API client a été complètement modularisée.
 * Import direct depuis le module modulaire.
 * 
 * Usage recommandé:
 *   import { authApi, activitiesApi } from '@/lib/api';
 *   import api from '@/lib/api';
 * 
 * @module lib/api
 */

// Export direct depuis le module modulaire
export * from './api/index';
export { default } from './api/index';
