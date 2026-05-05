/**
 * ============================================================
 * API CLIENT - Wrapper de rétrocompatibilité
 * ============================================================
 * 
 * CE FICHIER EST UN WRAPPER pour maintenir la compatibilité.
 * 
 * Le code a été migré vers une architecture modulaire dans:
 *   src/lib/api/
 * 
 * Ce fichier réexporte simplement tout depuis le nouveau module
 * pour que les anciens imports continuent de fonctionner.
 * 
 * @deprecated Utilisez directement '@/lib/api' (module index.ts)
 * @module lib/api
 */

// Réexporte tout depuis le nouveau module modulaire
export * from './api/index';
export { default } from './api/index';

// Log de migration en développement
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line no-console
  console.log(
    '[API] Note: Le client API a été modularisé. ' +
    'Vous pouvez maintenant importer par domaine: ' +
    'import { authApi } from "@/lib/api"'
  );
}
