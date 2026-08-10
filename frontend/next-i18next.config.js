/**
 * ============================================================
 * NEXT-I18NEXT CONFIGURATION
 * ============================================================
 *
 * Configuration pour l'internationalisation de DrawRun
 * Support: Français (par défaut), Anglais
 */

module.exports = {
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    localePath: './public/locales',
    localeDetection: true,
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};
