'use client';

import { useEffect, useState } from 'react';
import { VDOTDemoCalculator } from '@/components/features/performance';
import { 
  Activity, 
  TrendingUp, 
  Target, 
  Zap, 
  Calculator
} from 'lucide-react';

const vdotFeatures = [
  {
    icon: Target,
    title: 'Prédiction de Performances',
    description: '5K, 10K, Semi, Marathon - basé sur votre VDOT actuel.',
  },
  {
    icon: Activity,
    title: 'Zones Personnalisées',
    description: '5 zones d\'entraînement calculées sur votre VDOT unique.',
  },
  {
    icon: Zap,
    title: 'TSS en Temps Réel',
    description: 'Charge d\'entraînement calculée dynamiquement.',
  },
  {
    icon: TrendingUp,
    title: '15+ Métriques Avancées',
    description: 'Age Grading, W\', RAI, Marathon Prediction et plus.',
  },
];

export default function VDOTSection() {
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

    const section = document.getElementById('vdot');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="vdot" className="py-20 lg:py-32 bg-surface overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 border border-primary-200 rounded-full text-sm font-semibold text-primary-700 mb-6">
              <Calculator className="w-4 h-4" />
              Jack Daniels VDOT V6.4
            </span>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight mb-6">
              LA SCIENCE
              <br />
              DERRIÈRE LA{' '}
              <span className="bg-gradient-to-r from-primary-600 to-secondary bg-clip-text text-transparent">
                VITESSE
              </span>
            </h2>
            
            <p className="text-lg text-muted leading-relaxed mb-8 max-w-xl">
              Le VDOT n&apos;est pas qu&apos;un chiffre. C&apos;est l&apos;essence de votre efficacité running.
              DrawRun analyse chaque foulée pour affiner votre profil physiologique.
            </p>

            {/* Features List */}
            <div className="space-y-4">
              {vdotFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={index}
                    className="flex items-start gap-4 p-4 bg-background border border-surface rounded-xl hover:bg-surface transition-colors"
                  >
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Content - Interactive VDOT Calculator */}
          <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <VDOTDemoCalculator />
          </div>
        </div>
      </div>
    </section>
  );
}
