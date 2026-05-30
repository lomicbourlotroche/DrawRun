'use client';

import { useEffect, useState } from 'react';
import { Card, Button } from '@/components/ui';
import { 
  Watch, 
  Activity, 
  Target, 
  Calendar, 
  Download,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const garminFeatures = [
  {
    icon: Activity,
    title: 'PMC en Temps Réel',
    description: 'Consultez votre forme (CTL), fatigue (ATL) et balance (TSB) directement sur la montre.',
    color: 'primary',
  },
  {
    icon: Target,
    title: 'Zones Cibles',
    description: 'Vos 5 zones de fréquence cardiaque et d\'allure toujours accessibles pendant l\'effort.',
    color: 'peak',
  },
  {
    icon: Calendar,
    title: 'Séance du Jour',
    description: 'Découvrez chaque jour la séance recommandée basée sur votre charge d\'entraînement.',
    color: 'success',
  },
  {
    icon: Download,
    title: 'Export Garmin',
    description: 'Transférez vos séances vers le Training Calendar Garmin pour un guidage complet.',
    color: 'recovery',
  },
];

const compatibleDevices = [
  'Forerunner 55/255/955/965',
  'Fenix 6/7/8/Epix',
  'Instinct 2/2S/2X',
  'Vivoactive 4/5',
];

const iconColors: Record<string, string> = {
  primary: 'bg-primary-100 text-primary-600',
  peak: 'bg-peak-100 text-peak-600',
  success: 'bg-success-100 text-success-600',
  recovery: 'bg-recovery-100 text-recovery-600',
};

export default function GarminAppSection() {
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

    const section = document.getElementById('garmin');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="garmin" className="py-20 lg:py-32 bg-gradient-to-b from-neutral-50 to-white dark:from-background dark:to-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-peak-100 border border-peak-200 rounded-full text-sm font-semibold text-peak-700 mb-6">
            <Watch className="w-4 h-4" />
            App Connect IQ
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight mb-6">
            Votre Plan d&apos;Entraînement
            <br />
            <span className="bg-gradient-to-r from-peak-500 to-warning-500 bg-clip-text text-transparent">
              Sur Votre Montre Garmin
            </span>
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            L&apos;application DrawRun Training pour montres Garmin vous permet d&apos;accéder à votre séance du jour,
            votre plan d&apos;entraînement et vos zones cibles directement depuis votre poignet.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {garminFeatures.map((feature, index) => {
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

        {/* Compatible Devices */}
        <div className={`mb-12 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h3 className="text-center text-lg font-semibold text-foreground mb-6">Compatible avec</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {compatibleDevices.map((device, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 bg-surface border border-surface rounded-full text-sm font-medium text-muted"
              >
                <CheckCircle className="w-4 h-4 text-success-500" />
                {device}
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Button
            size="lg"
            glow
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            <Watch className="w-5 h-5" />
            Bientôt sur Connect IQ Store
          </Button>
          <Button
            variant="secondary"
            size="lg"
          >
            Documentation Technique
          </Button>
        </div>
      </div>
    </section>
  );
}
