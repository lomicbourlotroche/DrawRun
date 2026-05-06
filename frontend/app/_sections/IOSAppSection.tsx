'use client';

import { useEffect, useState } from 'react';
import { Card, Button } from '@/components/ui';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  Calendar,
  ArrowRight,
  Smartphone,
  Heart
} from 'lucide-react';

const iosFeatures = [
  {
    icon: Users,
    title: 'Fonctionnalités Sociales',
    description: 'Amis, groupes, classements et DrawRuns (likes) pour interagir avec la communauté.',
    color: 'primary',
  },
  {
    icon: Activity,
    title: 'Enregistrement en Direct',
    description: 'Suivi GPS/FC en temps réel avec intégration HealthKit et calcul automatique TSS.',
    color: 'danger',
  },
  {
    icon: TrendingUp,
    title: 'PMC & Métriques',
    description: 'Visualisez votre forme (CTL), fatigue (ATL) et balance (TSB) en temps réel.',
    color: 'success',
  },
  {
    icon: Calendar,
    title: 'Coaching Adaptatif',
    description: 'Plans d\'entraînement personnalisés avec ajustements automatiques basés sur votre récupération.',
    color: 'recovery',
  },
];

const iconColors: Record<string, string> = {
  primary: 'bg-primary-100 text-primary-600',
  danger: 'bg-danger-100 text-danger-600',
  success: 'bg-success-100 text-success-600',
  recovery: 'bg-recovery-100 text-recovery-600',
};

export default function IOSAppSection() {
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

    const section = document.getElementById('ios');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="ios" className="py-20 lg:py-32 bg-neutral-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm font-semibold text-white mb-6">
              <Smartphone className="w-4 h-4" />
              iOS App - NOUVEAU
            </span>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6">
              DrawRun
              <br />
              <span className="bg-gradient-to-r from-primary-400 to-recovery-400 bg-clip-text text-transparent">
                Sur Votre iPhone
              </span>
            </h2>
            
            <p className="text-lg text-neutral-300 leading-relaxed mb-8 max-w-xl">
              L&apos;application iOS DrawRun est maintenant disponible ! Profitez de toutes les fonctionnalités
              directement sur votre iPhone : suivi GPS, analyses scientifiques, coaching adaptatif et
              <span className="text-white font-semibold"> fonctionnalités sociales complètes</span>.
            </p>

            {/* Tech Stack */}
            <div className="flex items-center gap-4 mb-8">
              {['SwiftUI', 'HealthKit', 'Combine', 'CoreLocation'].map((tech, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-neutral-400"
                >
                  {tech}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                glow
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="bg-white text-neutral-900 hover:bg-neutral-100"
              >
                <Smartphone className="w-5 h-5" />
                Bientôt sur l&apos;App Store
              </Button>
              <Button
                variant="glass"
                size="lg"
              >
                En savoir plus
              </Button>
            </div>
          </div>

          {/* Right Content - Features Grid */}
          <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <div className="grid grid-cols-2 gap-4">
              {iosFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={index}
                    variant="glass"
                    className={`group transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    style={{ transitionDelay: `${index * 100 + 200}ms` }}
                  >
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center mb-4
                      ${iconColors[feature.color]}
                      group-hover:scale-110 transition-transform duration-300
                    `}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">{feature.description}</p>
                  </Card>
                );
              })}
            </div>

            {/* HealthKit Integration Preview */}
            <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-danger-500/20 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-danger-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">HealthKit Intégré</div>
                  <div className="text-xs text-neutral-400">Synchronisation automatique</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-danger-500 to-primary-500 rounded-full" />
                </div>
                <span className="text-xs text-neutral-400">75% objectif quotidien</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
