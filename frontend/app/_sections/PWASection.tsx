'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import { 
  Smartphone, 
  Bell, 
  Share2, 
  WifiOff, 
  Monitor,
  Zap
} from 'lucide-react';

const pwaFeatures = [
  {
    icon: Smartphone,
    title: 'Installable sur tous les appareils',
    description: 'Ajoutez DrawRun à votre écran d\'accueil — iPhone, Android, tablette ou desktop.',
    color: 'primary',
  },
  {
    icon: WifiOff,
    title: 'Fonctionne hors ligne',
    description: 'Consultez vos activités et votre plan d\'entraînement même sans connexion internet.',
    color: 'success',
  },
  {
    icon: Bell,
    title: 'Notifications push',
    description: 'Alertes en temps réel : nouvelles demandes d\'ami, draws et commentaires sur vos activités.',
    color: 'danger',
  },
  {
    icon: Share2,
    title: 'Partage d\'activités',
    description: 'Générez une image résumée de votre sortie et partagez-la en un clic sur les réseaux.',
    color: 'warning',
  },
];

const iconColors: Record<string, string> = {
  primary: 'bg-primary-100 text-primary-600',
  success: 'bg-success-100 text-success-600',
  danger: 'bg-danger-100 text-danger-600',
  warning: 'bg-warning-100 text-warning-600',
};

export default function PWASection() {
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

    const section = document.getElementById('pwa');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="pwa" className="py-20 lg:py-32 bg-gradient-to-b from-white to-neutral-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 border border-primary-200 rounded-full text-sm font-semibold text-primary-700 mb-6">
            <Zap className="w-4 h-4" />
            Progressive Web App
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight mb-6">
            Une seule app
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-secondary bg-clip-text text-transparent">
              pour tous vos écrans
            </span>
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Pas besoin de télécharger sur un store. DrawRun s&apos;installe directement depuis votre navigateur
            et fonctionne comme une application native — sur téléphone, tablette et ordinateur.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {pwaFeatures.map((feature, index) => {
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

        {/* Device Preview */}
        <div className={`mb-12 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {/* Desktop */}
            <div className="text-center">
              <div className="w-48 h-32 bg-background rounded-xl border-4 border flex items-center justify-center mx-auto mb-3">
                <Monitor className="w-8 h-8 text-primary-400" />
              </div>
              <p className="text-sm font-medium text-muted">Desktop</p>
              <p className="text-xs text-muted">Chrome, Firefox, Safari</p>
            </div>
            {/* Tablet */}
            <div className="text-center">
              <div className="w-28 h-40 bg-background rounded-xl border-4 border flex items-center justify-center mx-auto mb-3">
                <Smartphone className="w-6 h-6 text-primary-400" />
              </div>
              <p className="text-sm font-medium text-muted">Tablette</p>
              <p className="text-xs text-muted">iPad, Android</p>
            </div>
            {/* Phone */}
            <div className="text-center">
              <div className="w-20 h-36 bg-background rounded-xl border-4 border flex items-center justify-center mx-auto mb-3">
                <Smartphone className="w-5 h-5 text-primary-400" />
              </div>
              <p className="text-sm font-medium text-muted">Mobile</p>
              <p className="text-xs text-muted">iOS, Android</p>
            </div>
          </div>
        </div>

        {/* Install steps */}
        <div className={`max-w-2xl mx-auto transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h3 className="text-center text-lg font-semibold text-foreground mb-6">Installation en 2 étapes</h3>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Cliquez sur "Installer l\'app"', desc: 'Le bouton apparaît dans la barre de navigation de votre navigateur.' },
              { step: '2', title: 'Confirmez l\'installation', desc: 'DrawRun s\'ajoute à votre écran d\'accueil et fonctionne comme une app native.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-surface border border-surface rounded-xl">
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="text-sm text-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
