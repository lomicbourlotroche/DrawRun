'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { 
  Activity, 
  Calendar, 
  Trophy,
  CloudSun,
  Bell,
  Share2,
  TrendingUp, 
  Heart, 
  Zap,
  Target,
  Users
} from 'lucide-react';

const features = [
  {
    icon: Activity,
    title: 'ScienceEngine™',
    description: '15+ métriques scientifiques : TSS, VDOT dynamique, TRIMP, NP, Age Grading, W\', et profils athlétiques complets.',
    color: 'primary',
    size: 'large',
    link: '/app/performance',
  },
  {
    icon: Calendar,
    title: 'Coaching Adaptatif',
    description: 'Plans personnalisés (5K, 10K, Semi, Marathon) ajustés automatiquement selon votre forme et récupération.',
    color: 'success',
    size: 'normal',
    link: '/app/coach',
  },
  {
    icon: Trophy,
    title: 'Race Planning',
    description: 'Stratégie de course avec splits km par km, zones FC et plan nutrition pour chaque compétition.',
    color: 'warning',
    size: 'normal',
    link: '/app/race-planning',
  },
  {
    icon: CloudSun,
    title: 'Météo intégrée',
    description: 'Conditions météo de chaque activité avec impact estimé sur votre allure.',
    color: 'primary',
    size: 'normal',
    link: '#weather',
  },
  {
    icon: TrendingUp,
    title: 'PMC Avancé',
    description: 'Suivi de la charge d\'entraînement avec modèle Banister et prédiction de forme.',
    color: 'peak',
    size: 'normal',
    link: '/app/performance',
  },
  {
    icon: Heart,
    title: 'Zones Personnalisées',
    description: 'Zones de fréquence cardiaque basées sur votre FCM réelle et seuils lactate.',
    color: 'danger',
    size: 'normal',
    link: '/vdot-calculator',
  },
  {
    icon: Users,
    title: 'Social & Communauté',
    description: 'Amis, groupes, classements, draws et commentaires pour interagir avec la communauté.',
    color: 'recovery',
    size: 'normal',
    link: '#social',
  },
  {
    icon: Bell,
    title: 'Notifications Push',
    description: 'Alertes en temps réel sur vos activités, draws et demandes d\'ami.',
    color: 'warning',
    size: 'normal',
    link: '/login?mode=register',
  },
  {
    icon: Share2,
    title: 'Partage d\'activités',
    description: 'Générez une image résumée de votre sortie et partagez-la en un clic.',
    color: 'success',
    size: 'normal',
    link: '/app/activities',
  },
];

const iconColors: Record<string, string> = {
  primary: 'bg-primary-100 text-primary-600',
  success: 'bg-success-100 text-success-600',
  recovery: 'bg-recovery-100 text-recovery-600',
  warning: 'bg-warning-100 text-warning-600',
  danger: 'bg-danger-100 text-danger-600',
  peak: 'bg-peak-100 text-peak-600',
};

export default function FeaturesSection() {
  const router = useRouter();
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

    const section = document.getElementById('features');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  const handleFeatureClick = (link: string) => {
    if (link.startsWith('#')) {
      const element = document.querySelector(link);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      router.push(link);
    }
  };

  return (
    <section id="features" className="py-20 lg:py-32 bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 lg:mb-20 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 border border-primary-200 rounded-full text-sm font-semibold text-primary-700 mb-6">
            <Zap className="w-4 h-4" />
            Ingénierie de pointe
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-900 tracking-tight">
            UN ÉCOSYSTÈME
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-secondary bg-clip-text text-transparent">
              SANS COMPROMIS
            </span>
          </h2>
          <p className="mt-6 text-lg text-neutral-600 max-w-2xl mx-auto">
            Chaque fonctionnalité est pensée pour transformer vos données en performances concrètes.
          </p>
        </div>

        {/* Features Grid - Masonry Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isLarge = feature.size === 'large';
            
            return (
              <Card
                key={index}
                variant="elevated"
                hover
                className={`group transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${isLarge ? 'md:col-span-2 lg:col-span-1' : ''}`}
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
                  
                  <p className="text-neutral-600 leading-relaxed flex-1">
                    {feature.description}
                  </p>
                  
                  <div className="mt-5 pt-5 border-t border-neutral-100">
                    <button 
                      onClick={() => feature.link && handleFeatureClick(feature.link)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      En savoir plus
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className={`mt-16 text-center transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-8 p-6 bg-white border border-neutral-200 rounded-2xl shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-success-600" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-neutral-900">98%</div>
                <div className="text-sm text-neutral-500">Précision VDOT</div>
              </div>
            </div>
            <div className="w-px h-12 bg-neutral-200" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary-600" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-neutral-900">15+</div>
                <div className="text-sm text-neutral-500">Métriques</div>
              </div>
            </div>
            <div className="w-px h-12 bg-neutral-200" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-recovery-100 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-recovery-600" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-neutral-900">24/7</div>
                <div className="text-sm text-neutral-500">Analyse IA</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
