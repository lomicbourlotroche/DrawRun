'use client';

import { useEffect, useState } from 'react';
import { Card, Button } from '@/components/ui';
import { 
  Trophy, 
  MapPin, 
  Heart, 
  Droplets, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';

const raceFeatures = [
  {
    icon: MapPin,
    title: 'Splits détaillés km par km',
    description: 'Allure cible, zones de fréquence cardiaque et ravitaillements calculés pour chaque kilomètre.',
    color: 'primary',
  },
  {
    icon: Heart,
    title: 'Zones FC adaptatives',
    description: 'Départ conservateur, allure de croisière et finish push — votre FC cible évolue selon la phase de course.',
    color: 'danger',
  },
  {
    icon: Droplets,
    title: 'Stratégie nutrition',
    description: 'Hydratation et gels planifiés automatiquement selon la durée estimée de votre course.',
    color: 'success',
  },
  {
    icon: TrendingUp,
    title: 'Profil du terrain',
    description: 'Ajustement de l\'allure selon le profil : plat, vallonné ou montagneux avec facteurs correctifs.',
    color: 'warning',
  },
];

const iconColors: Record<string, string> = {
  primary: 'bg-primary-100 text-primary-600',
  danger: 'bg-danger-100 text-danger-600',
  success: 'bg-success-100 text-success-600',
  warning: 'bg-warning-100 text-warning-600',
};

export default function RacePlanningSection() {
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

    const section = document.getElementById('race-planning');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="race-planning" className="py-20 lg:py-32 bg-gradient-to-b from-neutral-50 to-white dark:from-background dark:to-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-warning-100 border border-warning-200 rounded-full text-sm font-semibold text-warning-700 mb-6">
            <Trophy className="w-4 h-4" />
            NOUVEAU — Race Planning
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight mb-6">
            Préparez votre
            <br />
            <span className="bg-gradient-to-r from-warning-500 to-primary-500 bg-clip-text text-transparent">
              stratégie de course
            </span>
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Du 5K au marathon, planifiez chaque kilomètre avec des splits détaillés,
            des zones de fréquence cardiaque et une stratégie de nutrition personnalisée.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {raceFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                variant="elevated"
                hover
                className={`group transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center shrink-0
                    ${iconColors[feature.color]}
                    group-hover:scale-110 transition-transform duration-300
                  `}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Preview */}
        <div className={`mb-12 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Card variant="elevated" className="max-w-3xl mx-auto overflow-hidden">
            <div className="bg-background text-white p-4">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-warning-400" />
                <span className="text-sm font-semibold">Plan de course — Semi-marathon</span>
              </div>
              <div className="flex items-center gap-6 text-xs text-muted">
                <span>21.1 km</span>
                <span>1h35:00</span>
                <span>4:30/km</span>
                <span>Vallonné</span>
              </div>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface">
                      <th className="text-left py-2 text-xs text-muted font-medium">KM</th>
                      <th className="text-left py-2 text-xs text-muted font-medium">Allure</th>
                      <th className="text-left py-2 text-xs text-muted font-medium">Zone FC</th>
                      <th className="text-left py-2 text-xs text-muted font-medium">Ravitaillement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { km: 1, pace: '4:38', hr: 'Zone 2 (Aérobie)', nut: null },
                      { km: 2, pace: '4:38', hr: 'Zone 2 (Aérobie)', nut: null },
                      { km: 3, pace: '4:30', hr: 'Zone 3 (Seuil)', nut: null },
                      { km: 5, pace: '4:30', hr: 'Zone 3 (Seuil)', nut: 'Eau 200ml' },
                      { km: 10, pace: '4:30', hr: 'Zone 3-4 (Seuil)', nut: 'Eau 200ml + Gel' },
                      { km: 15, pace: '4:30', hr: 'Zone 4 (Seuil)', nut: 'Eau 200ml' },
                      { km: 21, pace: '4:22', hr: 'Zone 5 (Anaérobie)', nut: null },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-surface">
                        <td className="py-2 font-medium">{row.km}</td>
                        <td className="py-2">{row.pace}/km</td>
                        <td className="py-2">
                          <span className="px-2 py-0.5 bg-surface rounded-full text-xs">{row.hr}</span>
                        </td>
                        <td className="py-2 text-muted">{row.nut || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>

        {/* CTA */}
        <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <a href="/app/race-planning">
            <Button
              size="lg"
              glow
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              <Trophy className="w-5 h-5" />
              Planifier ma course
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
