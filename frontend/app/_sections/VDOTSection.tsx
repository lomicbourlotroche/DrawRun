'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { 
  Activity, 
  TrendingUp, 
  Target, 
  Zap, 
  Clock,
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

const zones = [
  { name: 'EASY (E)', range: '4:45 - 5:15', color: '#22C55E', description: 'Récupération & endurance' },
  { name: 'MARATHON (M)', range: '4:15', color: '#3B82F6', description: 'Allure marathon' },
  { name: 'THRESHOLD (T)', range: '3:58', color: '#A855F7', description: 'Seuil lactique' },
  { name: 'INTERVAL (I)', range: '3:42', color: '#EF4444', description: 'VO2max' },
  { name: 'REPETITION (R)', range: '3:25', color: '#F59E0B', description: 'Vitesse pure' },
];

export default function VDOTSection() {
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

    const section = document.getElementById('vdot');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="vdot" className="py-20 lg:py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 border border-primary-200 rounded-full text-sm font-semibold text-primary-700 mb-6">
              <Calculator className="w-4 h-4" />
              Jack Daniels VDOT V6.4
            </span>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-900 tracking-tight mb-6">
              LA SCIENCE
              <br />
              DERRIÈRE LA{' '}
              <span className="bg-gradient-to-r from-primary-600 to-secondary bg-clip-text text-transparent">
                VITESSE
              </span>
            </h2>
            
            <p className="text-lg text-neutral-600 leading-relaxed mb-8 max-w-xl">
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
                    className="flex items-start gap-4 p-4 bg-neutral-50 border border-neutral-100 rounded-xl hover:bg-neutral-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-1">{feature.title}</h3>
                      <p className="text-sm text-neutral-600">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Content - Zones Card */}
          <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <Card variant="glass" className="relative overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">ZONES VDOT</h3>
                  <p className="text-sm text-neutral-500">Basé sur 10km en 39:00</p>
                </div>
              </div>

              {/* Zones List */}
              <div className="space-y-3">
                {zones.map((zone, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between gap-2 p-3 bg-white/50 rounded-xl border border-neutral-100 hover:border-neutral-200 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: zone.color }}
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-neutral-900 text-sm truncate">{zone.name}</div>
                        <div className="text-xs text-neutral-500 truncate">{zone.description}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 whitespace-nowrap">
                      <div className="font-bold text-neutral-900 font-mono">{zone.range}</div>
                      <div className="text-xs text-neutral-400">min/km</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculator Preview */}
              <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-secondary/10 rounded-xl border border-primary-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-neutral-700">VDOT Calculator</span>
                  <span className="text-xs text-primary-600 font-medium">VDOT: 52.4</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Clock className="w-4 h-4" />
                  <span>10km → Marathon: 3:12:00</span>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => router.push('/vdot-calculator')}
                className="w-full mt-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-button-primary cursor-pointer"
              >
                Calculer mon VDOT
              </button>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
