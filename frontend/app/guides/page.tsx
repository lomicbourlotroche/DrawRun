'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Activity, Calendar, Trophy, TrendingUp, Heart, CloudSun, Users, ArrowRight } from '@/components/ui/icons';

const guides = [
  {
    icon: Activity,
    title: 'ScienceEngine™',
    subtitle: '15+ métriques scientifiques',
    description: 'VDOT, TSS, TRIMP, PMC, ACWR — toutes les formules et références scientifiques derrière vos données.',
    href: '/guides/science-engine',
    gradient: 'from-blue-500 to-cyan-500',
    bgLight: 'bg-blue-50',
    textColor: 'text-primary',
  },
  {
    icon: Calendar,
    title: 'Coaching Adaptatif',
    subtitle: 'Plans personnalisés dynamiques',
    description: 'Comment votre plan s\'adapte chaque semaine selon votre forme, fatigue et feedback.',
    href: '/guides/coaching-adaptatif',
    gradient: 'from-green-500 to-emerald-500',
    bgLight: 'bg-green-50',
    textColor: 'text-success',
  },
  {
    icon: Trophy,
    title: 'Race Planning',
    subtitle: 'Stratégie de course',
    description: 'Splits km par km, zones FC, nutrition, ajustements terrain — tout pour préparer votre compétition.',
    href: '/guides/race-planning',
    gradient: 'from-amber-500 to-orange-500',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
  {
    icon: TrendingUp,
    title: 'PMC Avancé',
    subtitle: 'Performance Management Chart',
    description: 'CTL, ATL, TSB — le modèle mathématique pour suivre votre forme, fatigue et fraîcheur.',
    href: '/guides/pmc',
    gradient: 'from-purple-500 to-pink-500',
    bgLight: 'bg-purple-50',
    textColor: 'text-secondary',
  },
  {
    icon: Heart,
    title: 'Zones de Fréquence Cardiaque',
    subtitle: 'Personnalisées selon votre profil',
    description: 'Méthode Karvonen, formule Tanaka, zones VDOT — comment vos zones sont calculées.',
    href: '/guides/hr-zones',
    gradient: 'from-red-500 to-pink-500',
    bgLight: 'bg-red-50',
    textColor: 'text-danger',
  },
  {
    icon: CloudSun,
    title: 'Météo intégrée',
    subtitle: 'Impact sur la performance',
    description: 'Température, humidité, vent — comment les conditions météo affectent votre allure.',
    href: '/guides/weather',
    gradient: 'from-sky-500 to-blue-500',
    bgLight: 'bg-sky-50',
    textColor: 'text-sky-600',
  },
  {
    icon: Users,
    title: 'Social & Communauté',
    subtitle: 'Entraînez-vous ensemble',
    description: 'Amis, groupes, classements, draws — comment interagir avec la communauté DrawRun.',
    href: '/guides/social',
    gradient: 'from-indigo-500 to-purple-500',
    bgLight: 'bg-indigo-50',
    textColor: 'text-indigo-600',
  },
];

export default function GuidesIndex() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
      <div className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="p-2 rounded-xl hover:bg-surface transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold">Guides DrawRun</h1>
            <p className="text-xs text-muted">Comprendre la science derrière vos données</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-foreground mb-4">
            Guides &{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
              Documentation
            </span>
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Explorez les algorithmes, formules et méthodologies qui alimentent chaque fonctionnalité de DrawRun.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {guides.map((guide, index) => (
            <button
              key={index}
              onClick={() => router.push(guide.href)}
              className="text-left bg-surface rounded-2xl border border-surface shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
            >
              <div className={`bg-gradient-to-r ${guide.gradient} p-4 text-white`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface/20 rounded-xl flex items-center justify-center">
                    <guide.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">{guide.title}</h3>
                    <p className="text-xs text-white/80">{guide.subtitle}</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-muted mb-3">{guide.description}</p>
                <div className={`inline-flex items-center gap-1 text-sm font-semibold ${guide.textColor} group-hover:gap-2 transition-all`}>
                  Lire le guide
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
