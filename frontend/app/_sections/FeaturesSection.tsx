'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import {
  Activity,
  Calendar,
  Trophy,
  TrendingUp,
  Heart,
  Zap,
  BarChart3,
  Users,
} from 'lucide-react';

// 6 features principales avec mockups visuels
const features = [
  {
    id: 1,
    icon: BarChart3,
    title: 'Moteur Scientifique',
    description: 'VDOT, TSS, PMC, TRIMP et 15+ métriques pour analyser chaque activité.',
    color: 'primary',
    mockup: (
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 border border-primary/20">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-primary-600">VDOT</span>
            <span className="text-foreground">52.5</span>
          </div>
          <div className="w-full h-16 bg-gradient-to-r from-primary-200 to-primary-300 rounded-lg relative overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 40">
              <path d="M0,30 Q25,10 50,20 T100,15" stroke="var(--primary-600)" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>
      </div>
    ),
    link: '/guides/science-engine',
  },
  {
    id: 2,
    icon: Calendar,
    title: 'Coaching Adaptatif',
    description: 'Plans personnalisés qui s\'adaptent à votre forme et fatigue en temps réel.',
    color: 'success',
    mockup: (
      <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-xl p-4 border border-success/20">
        <div className="grid grid-cols-7 gap-1 text-xs">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day) => (
            <div key={day} className="text-center font-medium text-muted">
              {day}
            </div>
          ))}
        </div>
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success-500" />
            <span className="text-xs">Endurance</span>
            <span className="text-xs text-muted ml-auto">60 min</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary-500" />
            <span className="text-xs">Seuil</span>
            <span className="text-xs text-muted ml-auto">45 min</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-peak-500" />
            <span className="text-xs">Fractionné</span>
            <span className="text-xs text-muted ml-auto">30 min</span>
          </div>
        </div>
      </div>
    ),
    link: '/guides/coaching-adaptatif',
  },
  {
    id: 3,
    icon: Trophy,
    title: 'Race Planning',
    description: 'Stratégie km par km avec splits optimaux, zones FC et plan nutrition.',
    color: 'warning',
    mockup: (
      <div className="bg-gradient-to-br from-warning-50 to-warning-100 rounded-xl p-4 border border-warning/20">
        <div className="text-center">
          <div className="text-2xl font-bold text-warning-600">42.2 km</div>
          <div className="text-xs text-muted mt-1">Marathon</div>
          <div className="flex justify-between mt-3 text-xs">
            <span>5:10</span>
            <span>5:05</span>
            <span>5:00</span>
            <span>4:55</span>
          </div>
          <svg className="w-full h-8 mt-1" viewBox="0 0 100 20">
            <polyline points="0,15 20,12 40,14 60,10 80,11 100,8" stroke="var(--warning-600)" strokeWidth="2" fill="none" />
          </svg>
        </div>
      </div>
    ),
    link: '/guides/race-planning',
  },
  {
    id: 4,
    icon: TrendingUp,
    title: 'PMC Avancé',
    description: 'Modèle Banister pour suivre fitness, fatigue et forme optimale.',
    color: 'peak',
    mockup: (
      <div className="bg-gradient-to-br from-peak-50 to-peak-100 rounded-xl p-4 border border-peak/20">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-peak-600">CTL</span>
          <span className="text-peak-600">ATL</span>
          <span className="text-peak-600">TSB</span>
        </div>
        <div className="w-full h-16 relative">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 64">
            <path d="M0,50 Q25,40 50,45 T100,42" stroke="var(--primary-600)" strokeWidth="1.5" fill="none" opacity="0.8" />
            <path d="M0,55 Q25,50 50,52 T100,48" stroke="var(--danger-600)" strokeWidth="1.5" fill="none" opacity="0.8" />
          </svg>
        </div>
        <div className="text-right text-xs text-peak-600 font-medium mt-1">+25</div>
      </div>
    ),
    link: '/guides/pmc',
  },
  {
    id: 5,
    icon: Heart,
    title: 'Zones Personnalisées',
    description: '5 zones HR + 7 zones Power basées sur vos seuils réels.',
    color: 'danger',
    mockup: (
      <div className="bg-gradient-to-br from-danger-50 to-danger-100 rounded-xl p-4 border border-danger/20">
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map((zone) => (
            <div key={zone} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full bg-hr-zone-${zone}`} />
              <span className="text-xs">Zone {zone}</span>
              <div className="w-full h-1 bg-muted/20 rounded-full ml-2">
                <div
                  className={`h-full rounded-full bg-hr-zone-${zone}`}
                  style={{ width: `${zone * 20}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    link: '/guides/hr-zones',
  },
  {
    id: 6,
    icon: Users,
    title: 'Social & Communauté',
    description: 'Amis, groupes, classements, draws et commentaires.',
    color: 'recovery',
    mockup: (
      <div className="bg-gradient-to-br from-recovery-50 to-recovery-100 rounded-xl p-4 border border-recovery/20">
        <div className="flex -space-x-2 mb-2">
          {['A', 'B', 'C', 'D'].map((letter, i) => (
            <div
              key={letter}
              className="w-6 h-6 rounded-full bg-primary-200 text-primary-700 text-xs flex items-center justify-center font-semibold border-2 border-primary"
              style={{ zIndex: 4 - i }}
            >
              {letter}
            </div>
          ))}
        </div>
        <div className="text-xs text-muted">
          <div className="flex justify-between">
            <span>🥇 Thomas</span>
            <span className="font-medium">245 km</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>🥈 Claire</span>
            <span className="font-medium">210 km</span>
          </div>
        </div>
      </div>
    ),
    link: '/guides/social',
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
    router.push(link);
  };

  return (
    <section id="features" className="py-20 lg:py-32 bg-gradient-to-b from-neutral-50 to-white dark:from-background dark:to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 lg:mb-20 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 border border-primary-200 rounded-full text-sm font-semibold text-primary-700 mb-6">
            <Zap className="w-4 h-4" />
            Ingénierie de pointe
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight">
            UN ÉCOSYSTÈME
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-secondary bg-clip-text text-transparent">
              SANS COMPROMIS
            </span>
          </h2>
          <p className="mt-6 text-lg text-muted max-w-2xl mx-auto">
            Chaque fonctionnalité transforme vos données en performances concrètes.
          </p>
        </div>

        {/* Features Grid avec mockups visuels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <Card
                key={feature.id}
                variant="elevated"
                hover
                className={`group transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col h-full">
                  {/* Icon avec couleur */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${iconColors[feature.color]} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Titre */}
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-muted leading-relaxed mb-4 flex-1">
                    {feature.description}
                  </p>

                  {/* Mockup visuel */}
                  <div className="mb-4 p-3 bg-surface rounded-lg border border-border">
                    {feature.mockup}
                  </div>

                  {/* CTA */}
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => feature.link && handleFeatureClick(feature.link)}
                    className="w-fit self-start text-primary-600 hover:text-primary-700"
                  >
                    En savoir plus →
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA avec stats */}
        <div className={`mt-16 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Card variant="glass" padding="lg" className="max-w-2xl mx-auto">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div className="p-4">
                <div className="w-12 h-12 mx-auto mb-3 bg-success-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-success-600" />
                </div>
                <div className="text-2xl font-bold text-foreground">15+</div>
                <div className="text-xs text-muted mt-1">Métriques</div>
              </div>
              <div className="p-4">
                <div className="w-12 h-12 mx-auto mb-3 bg-primary-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary-600" />
                </div>
                <div className="text-2xl font-bold text-foreground">98%</div>
                <div className="text-xs text-muted mt-1">Précision</div>
              </div>
              <div className="p-4">
                <div className="w-12 h-12 mx-auto mb-3 bg-peak-100 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-peak-600" />
                </div>
                <div className="text-2xl font-bold text-foreground">24/7</div>
                <div className="text-xs text-muted mt-1">Analyse IA</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
