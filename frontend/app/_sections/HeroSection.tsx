'use client';

import Link from 'next/link';
import { Zap, TrendingUp } from '@/components/ui/icons';

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-4 py-20">
      {/* Layer 1: Dark base */}
      <div className="absolute inset-0 bg-background" />

      {/* Layer 2: Animated gradient orbs */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl animate-gradient-shift" />
        <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] bg-gradient-to-bl from-peak/15 to-transparent rounded-full blur-3xl animate-breathe" style={{ animationDelay: '1.5s' }} />
        <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-3xl animate-gradient-shift" style={{ animationDelay: '3s' }} />
      </div>

      {/* Layer 3: Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Decorative geometric shapes */}
      <div className="absolute top-20 right-20 w-32 h-32 border border-primary/10 rounded-full -z-10" />
      <div className="absolute bottom-20 left-20 w-48 h-48 border border-peak/10 rounded-full -z-10" />
      <div className="absolute top-1/3 left-[15%] w-16 h-16 border border-primary/10 rounded-full -z-10" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Badge */}
        <div className="animate-fade-in inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-8 animate-float">
          <Zap className="w-3 h-3" />
          Science Engine
        </div>

        {/* Headline */}
        <h1 className="animate-slide-up delay-100 text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight mb-6">
          Repoussez vos limites
          <br />
          avec{' '}
          <span className="bg-gradient-to-r from-primary to-peak bg-clip-text text-transparent">
            DrawRun
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-slide-up delay-200 text-lg md:text-xl text-muted max-w-2xl mx-auto leading-relaxed mb-10">
          Analyse scientifique, plans adaptatifs et suivi de performance pour les athlètes qui veulent aller plus loin.
        </p>

        {/* CTA Buttons */}
        <div className="animate-slide-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="bg-gradient-to-r from-primary to-peak text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
          >
            <TrendingUp className="w-5 h-5" />
            Commencer gratuitement
          </Link>
          <Link
            href="/guides"
            className="bg-surface/50 backdrop-blur-sm border border-border text-foreground font-semibold px-8 py-4 rounded-xl hover:bg-surface/80 transition-all inline-flex items-center gap-2"
          >
            Découvrir l&apos;app
          </Link>
        </div>

        {/* Stats Bar */}
        <div className="animate-fade-in delay-500 grid grid-cols-3 gap-8 max-w-lg mx-auto mt-16">
          {[
            { value: '15+', label: 'Métriques' },
            { value: '2500+', label: 'Athlètes' },
            { value: '99%', label: 'Précision' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">
                {stat.value}
              </div>
              <div className="text-sm text-muted mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
