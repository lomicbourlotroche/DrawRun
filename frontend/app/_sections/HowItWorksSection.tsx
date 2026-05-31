'use client';

import { useEffect, useState } from 'react';
import { Card, Button } from '@/components/ui';
import { 
  UserPlus, 
  Link2, 
  TrendingUp, 
  ArrowRight,
  Sparkles,
  Shield,
  Lock
} from '@/components/ui/icons';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Créez votre compte',
    description: 'Inscrivez-vous gratuitement et configurez votre profil sportif en 2 minutes.',
    color: 'primary',
  },
  {
    number: '02',
    icon: Link2,
    title: 'Connectez vos services',
    description: 'Importez vos activités depuis Strava, Garmin ou Suunto en un clic.',
    color: 'success',
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Analysez et progressez',
    description: 'Suivez votre PMC, vos zones et recevez des recommandations.',
    color: 'recovery',
  },
];

const iconColors: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  recovery: 'bg-recovery/10 text-recovery',
};

export default function HowItWorksSection() {
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

    const section = document.getElementById('comment-ca-marche');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="comment-ca-marche" className="py-20 lg:py-32 bg-surface overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-recovery/10 border border-recovery/20 rounded-full text-sm font-semibold text-recovery mb-6">
            <Sparkles className="w-4 h-4" />
            Simple et rapide
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight mb-6">
            Comment ça
            <br />
            <span className="bg-gradient-to-r from-recovery to-primary bg-clip-text text-transparent">
              Marche ?
            </span>
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Commencez à utiliser DrawRun en 3 étapes simples. 
            Pas de configuration complexe, juste vos données et votre motivation.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 mb-16">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className={`relative transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <Card variant="elevated" hover className="h-full relative z-10">
                  <div className="flex flex-col h-full">
                    {/* Step Number & Icon */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-5xl font-black text-muted">{step.number}</span>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconColors[step.color]}`}>
                        <Icon className="w-7 h-7" />
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-foreground mb-3">
                      {step.title}
                    </h3>
                    <p className="text-muted leading-relaxed flex-1">
                      {step.description}
                    </p>
                  </div>
                </Card>
                
                {/* Connector Arrow (hidden on mobile and last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-6 lg:-right-8 transform -translate-y-1/2 z-0">
                    <ArrowRight className="w-6 h-6 lg:w-8 lg:h-8 text-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className={`text-center transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Button
            size="lg"
            glow
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            Commencer gratuitement
          </Button>
          
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Shield className="w-4 h-4" />
              Données sécurisées
            </div>
            <div className="flex items-center gap-2 text-sm text-muted">
              <Lock className="w-4 h-4" />
              Aucun engagement
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
