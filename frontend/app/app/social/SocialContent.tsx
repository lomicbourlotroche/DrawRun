/**
 * SocialContent - Contenu de la page Social
 */

'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';
import SocialHub from '@/components/features/social/SocialHub';

export default function SocialContent() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.social?.title || 'Communauté'}</h1>
        <p className="text-muted mt-1">{t.social?.subtitle || 'Connectez-vous avec d\'autres athlètes et partagez vos exploits'}</p>
      </div>

      <SocialHub />
    </div>
  );
}
