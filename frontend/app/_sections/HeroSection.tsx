'use client';

import { useEffect, useState } from 'react';
import { MetricCard } from '@/components/ui';
import { Activity, HeartPulse, TrendingUp, Zap, Monitor, Trophy, CloudSun, Bell, Share2, Users } from 'lucide-react';
import { useUserCounter } from '@/hooks/useUserCounter';

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const { count, isLoading, error } = useUserCounter(); // Compteur utilisateurs en temps réel

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-screen pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-50 via-white to-primary-50/30" />
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-success-400/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,theme(colors.primary.100/0.4),transparent)] rounded-full" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(color-mix(in srgb, var(--primary), transparent 97%)_1px,transparent_1px),linear-gradient(90deg,color-mix(in srgb, var(--primary), transparent 97%)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className={`transition-all duration-700 ease-smooth ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 border border-primary-200 rounded-full mb-8">
              <span className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-primary-700">
                v4.1 • Coaching adaptatif + Météo + Race Planning
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6 break-words">
              VOTRE PERFORMANCE
              <br />
              <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-secondary bg-clip-text text-transparent">
                SCIENTIFIQUE
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-muted leading-relaxed mb-8 max-w-xl">
              Coaching sportif propulsé par le moteur
              <span className="font-semibold text-foreground"> Jack Daniels VDOT</span>,
              des plans d&apos;entraînement adaptatifs,
              <span className="font-semibold text-foreground"> la météo en temps réel</span> et
              <span className="font-semibold text-foreground"> des stratégies de course</span> personnalisées.
              15+ métriques avancées pour optimiser chaque séance.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <a
                href="/login?mode=register"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-primary-600 text-foreground font-semibold rounded-xl shadow-button-primary hover:shadow-button-primary-hover hover:-translate-y-0.5 transition-all duration-200 text-base"
              >
                <TrendingUp className="w-5 h-5 flex-shrink-0" />
                Commencer gratuitement
              </a>
              <a
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-surface border-2 border-surface text-muted font-semibold rounded-xl hover:border-primary/30 hover:bg-primary-50 transition-all duration-200 text-base"
              >
                <Monitor className="w-5 h-5 flex-shrink-0" />
                Se connecter
              </a>
            </div>

            {/* New Features Pills */}
            <div className="flex flex-wrap gap-2 mb-8">
              {[
                { icon: Trophy, label: 'Race Planning', color: 'bg-warning-100 text-warning-700 border-warning-200' },
                { icon: CloudSun, label: 'Météo activités', color: 'bg-primary-100 text-primary-700 border-primary-200' },
                { icon: Bell, label: 'Notifications push', color: 'bg-danger-100 text-danger-700 border-danger-200' },
                { icon: Share2, label: 'Partage image', color: 'bg-success-100 text-success-700 border-success-200' },
              ].map((pill, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-xs font-semibold ${pill.color}`}
                >
                  <pill.icon className="w-3.5 h-3.5" />
                  {pill.label}
                </span>
              ))}
            </div>
          </div>

          {/* Right Content - Stats Grid */}
          <div className={`transition-all duration-700 delay-200 ease-smooth ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* NOUVEAU: Compteur d'utilisateurs en temps réel */}
              <div className="col-span-2 sm:col-span-2 p-4 bg-surface/60 backdrop-blur-sm border border-surface rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-muted">Utilisateurs actifs</span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-success-500">
                    <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
                    En temps réel
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                    <Users className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    {isLoading ? (
                      <div className="w-20 h-8 bg-border rounded-lg animate-pulse" />
                    ) : error ? (
                      <div className="text-danger-500 text-sm">{error}</div>
                    ) : (
                      <div className="text-4xl font-bold text-foreground tabular-nums">
                        {count.toLocaleString()}
                      </div>
                    )}
                    <div className="text-sm text-muted">athlètes connectés</div>
                  </div>
                </div>
              </div>

              <MetricCard
                label="Métriques avancées"
                value="15+"
                icon={<Activity className="w-5 h-5" />}
                color="primary"
                size="md"
              />
              <MetricCard
                label="Précision VDOT"
                value="99%"
                unit=""
                icon={<Zap className="w-5 h-5" />}
                color="success"
                size="md"
              />
              <MetricCard
                label="TSS Temps Réel"
                value="Live"
                icon={<TrendingUp className="w-5 h-5" />}
                color="recovery"
                size="md"
              />
              <MetricCard
                label="Santé Cardiaque"
                value="HRV"
                icon={<HeartPulse className="w-5 h-5" />}
                color="peak"
                size="md"
                className="col-span-2 sm:col-span-2"
              />
            </div>

            {/* Mini Feature Preview (ancien aperçu BPM) */}
            <div className="mt-6 p-4 bg-surface/60 backdrop-blur-sm border border-surface rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-muted">Aperçu en temps réel</span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-success-500">
                  <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
                  Connecté
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-12 bg-gradient-to-r from-primary-100 via-primary-200 to-primary-100 rounded-lg animate-gradient-shift bg-[length:200%_100%]"></div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">142</div>
                  <div className="text-xs text-muted">BPM</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats Bar */}
        <div className={`mt-16 lg:mt-24 transition-all duration-700 delay-300 ease-smooth ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            {[
              { value: '15+', label: 'Métriques scientifiques' },
              { value: '17', label: 'Algorithmes intégrés' },
              { value: '5', label: 'Nouvelles features v4.1' },
              { value: '100%', label: 'Open source' },
            ].map((stat, index) => (
              <div key={index} className="text-center lg:text-left">
                <div className="text-3xl lg:text-4xl font-bold text-foreground tabular-nums">
                  {stat.value}
                </div>
                <div className="text-sm text-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

