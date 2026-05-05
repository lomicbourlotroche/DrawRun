'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import { 
  Users, 
  UserPlus, 
  Trophy, 
  Check,
  MessageCircle,
  Heart
} from 'lucide-react';

const socialFeatures = [
  {
    icon: UserPlus,
    title: 'Amis & Connaissances',
    description: 'Ajoutez vos amis coureurs et suivez leurs activités. Recevez des notifications quand ils réalisent de nouvelles performances.',
    color: 'primary',
    features: ['Demandes d\'amis', 'Activités partagées', 'Notifications temps réel'],
  },
  {
    icon: Users,
    title: 'Groupes d\'Entraînement',
    description: 'Créez ou rejoignez des groupes privés avec vos coéquipiers, club ou communauté de running.',
    color: 'success',
    features: ['Codes invitation privés', 'Planning de groupe', 'Défis collectifs'],
  },
  {
    icon: Trophy,
    title: 'Classements',
    description: 'Comparez vos statistiques avec vos amis ou votre groupe. Distance, TSS, durée - qui sera en tête cette semaine ?',
    color: 'peak',
    features: ['Classements hebdomadaires', 'Par distance, durée, TSS', 'Récompenses et badges'],
  },
];

const iconColors: Record<string, string> = {
  primary: 'bg-primary-100 text-primary-600',
  success: 'bg-success-100 text-success-600',
  peak: 'bg-peak-100 text-peak-600',
};

export default function SocialSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById('social');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="social" className="py-20 lg:py-32 bg-gradient-to-b from-white to-neutral-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 border border-primary-200 rounded-full text-sm font-semibold text-primary-700 mb-6">
            <Users className="w-4 h-4" />
            Fonctionnalité Communauté
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-900 tracking-tight mb-6">
            Entraînez-vous
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-secondary bg-clip-text text-transparent">
              Ensemble
            </span>
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Rejoignez une communauté de coureurs passionnés. Partagez vos progrès, 
            comparez vos performances et motivez-vous mutuellement.
          </p>
        </div>

        {/* Social Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {socialFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                variant="elevated"
                hover
                className={`group transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col h-full">
                  <div className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center mb-5
                    ${iconColors[feature.color]}
                    group-hover:scale-110 transition-transform duration-300
                  `}>
                    <Icon className="w-7 h-7" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">
                    {feature.title}
                  </h3>
                  
                  <p className="text-neutral-600 leading-relaxed mb-6 flex-1">
                    {feature.description}
                  </p>
                  
                  <ul className="space-y-2">
                    {feature.features.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-neutral-600">
                        <Check className="w-4 h-4 text-success-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Community Preview */}
        <div className={`transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Card variant="glass" className="relative overflow-hidden bg-gradient-to-br from-primary-500 to-secondary p-8 text-white">
            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">
                  Déjà 2,500+ athlètes nous font confiance
                </h3>
                <p className="text-white/80 mb-6">
                  Rejoignez une communauté active qui partage la même passion pour la course et la performance.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium">
                    50K+ activités partagées
                  </span>
                  <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium">
                    1,200+ groupes créés
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-12 h-12 rounded-full bg-white border-2 border-primary-500 flex items-center justify-center text-primary-600 font-bold text-sm"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                  <div className="w-12 h-12 rounded-full bg-white/30 border-2 border-white flex items-center justify-center text-white font-bold text-sm">
                    +2k
                  </div>
                </div>
              </div>
            </div>
            
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
