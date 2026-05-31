'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { 
  TrendingUp, 
  Heart, 
  Clock, 
  ArrowRight, 
  LineChart,
  Target,
  Zap
} from '@/components/ui/icons';

export default function WebAppSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    const section = document.getElementById('webapp');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="webapp" className="relative py-20 lg:py-32 bg-background overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-surface/10 border border-white/20 rounded-full text-sm font-semibold text-foreground mb-8">
              <Zap className="w-4 h-4" />
              Disponible maintenant
            </span>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight mb-6">
              Votre Performance,
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Accessible Partout
              </span>
            </h2>
            
            <p className="text-lg text-foreground leading-relaxed mb-8 max-w-xl">
              Analysez vos activités, suivez votre PMC, visualisez vos zones d&apos;entraînement,
              planifiez vos courses et suivez la météo — tout depuis votre navigateur.
              <span className="text-foreground font-semibold"> Accessible partout, installable en un clic.</span>
            </p>

            {/* Features List */}
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              {[
                { icon: LineChart, label: 'Graphique PMC' },
                { icon: Heart, label: 'Zones FC' },
                { icon: Clock, label: 'Historique' },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-3 bg-surface/5 border border-white/10 rounded-xl"
                  >
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </div>
                );
              })}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                glow
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="bg-surface text-foreground hover:bg-surface"
              >
                Créer un compte
              </Button>
              <Button 
                variant="glass" 
                size="lg"
              >
                Se connecter
              </Button>
            </div>
          </div>

          {/* Right Content - Dashboard Preview */}
          <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <div className="relative">
              {/* Glass Card */}
              <div className="bg-surface/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
                {/* Window Controls */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-danger" />
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <div className="ml-4 text-sm text-muted">drawrun.app/dashboard</div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-surface/50 rounded-xl p-4">
                    <div className="text-xs text-muted mb-1">CTL</div>
                    <div className="text-2xl font-bold text-primary">45</div>
                    <div className="text-xs text-success mt-1">↑ +3</div>
                  </div>
                  <div className="bg-surface/50 rounded-xl p-4">
                    <div className="text-xs text-muted mb-1">ATL</div>
                    <div className="text-2xl font-bold text-warning">38</div>
                    <div className="text-xs text-muted mt-1">→ stable</div>
                  </div>
                  <div className="bg-surface/50 rounded-xl p-4">
                    <div className="text-xs text-muted mb-1">TSB</div>
                    <div className="text-2xl font-bold text-success">+7</div>
                    <div className="text-xs text-success mt-1">✓ Optimal</div>
                  </div>
                </div>

                {/* Chart Area */}
                <div className="bg-surface/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground">PMC 30 jours</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-primary">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Fitness
                      </span>
                      <span className="flex items-center gap-1 text-warning">
                        <span className="w-2 h-2 rounded-full bg-warning" />
                        Fatigue
                      </span>
                    </div>
                  </div>
                  <svg viewBox="0 0 300 80" className="w-full h-20">
                    <defs>
                      <linearGradient id="fitnessGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M0,60 Q30,55 60,50 T120,45 T180,35 T240,30 T300,25" 
                      fill="none" 
                      stroke="var(--primary)" 
                      strokeWidth="2"
                    />
                    <path 
                      d="M0,60 Q30,55 60,50 T120,45 T180,35 T240,30 T300,25 L300,80 L0,80 Z" 
                      fill="url(#fitnessGradient)" 
                    />
                    <path 
                      d="M0,65 Q30,62 60,60 T120,58 T180,55 T240,52 T300,50" 
                      fill="none" 
                      stroke="var(--warning)" 
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  </svg>
                </div>

                {/* Bottom Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-success" />
                      <span className="text-sm text-foreground">Objectif: Marathon</span>
                    </div>
                  </div>
                  <span className="text-sm text-primary font-medium">Voir tout →</span>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-success text-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-float">
                En forme!
              </div>
              <div className="absolute -bottom-4 -left-4 bg-surface text-foreground text-xs font-semibold px-4 py-2 rounded-xl shadow-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span>+12% cette semaine</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


