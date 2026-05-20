/* eslint-disable react/no-unescaped-entities */
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Activity, Zap, TrendingUp, Heart, Target, BookOpen, Layers, Brain, BarChart3, Gauge } from 'lucide-react';

const metrics = [
  {
    icon: Target,
    name: 'VDOT',
    fullName: 'VO2max Derived Training Pace',
    color: 'from-blue-500 to-cyan-500',
    description: 'Le VDOT est un indice de performance développé par Jack Daniels et Jimmy Gilbert dans leur ouvrage "Daniels\' Running Formula" (6e édition, 2021). Il estime votre VO2max à partir d\'une performance de course et en déduit des allures d\'entraînement précises.',
    formula: 'VDOT = f(VO2max, %utilisation, temps de course)',
    details: [
      'Calculé à partir de la vitesse de course et de la durée',
      '5 zones d\'entraînement : Easy (E), Marathon (M), Threshold (T), Interval (I), Repetition (R)',
      'Prédiction de performances sur 5K, 10K, Semi et Marathon',
      'Algorithme basé sur les tables VDOT V6.4 de Jack Daniels',
    ],
    reference: 'Daniels, J. (2021). Daniels\' Running Formula, 6th Edition. Human Kinetics.',
  },
  {
    icon: Zap,
    name: 'TSS',
    fullName: 'Training Stress Score',
    color: 'from-orange-500 to-red-500',
    description: 'Le TSS quantifie la charge d\'entraînement totale d\'une session. Développé par Dr. Andrew Coggan pour le cyclisme, il a été adapté pour la course à pied en utilisant la fréquence cardiaque comme proxy de l\'intensité.',
    formula: 'TSS = (sec × NP × IF × hrDrift) / (FTP × 3600) × 100',
    details: [
      '1 heure à l\'intensité seuil (IF=1.0) = 100 TSS',
      'Adapté pour la course à pied via le TRIMP et la FC moyenne',
      'Permet de comparer des séances de durées et intensités différentes',
      'Base du calcul PMC (CTL/ATL/TSB)',
    ],
    reference: 'Coggan, A. (2006). Training and Racing with a Power Meter. VeloPress.',
  },
  {
    icon: TrendingUp,
    name: 'TRIMP',
    fullName: 'Training Impulse',
    color: 'from-purple-500 to-pink-500',
    description: 'Le TRIMP (Training Impulse) de Eric Banister mesure la dose d\'entraînement en combinant durée et intensité relative via la réserve de fréquence cardiaque. C\'est la méthode la plus validée scientifiquement pour quantifier la charge interne.',
    formula: 'TRIMP = durée × ΔHRratio × e^(k × ΔHRratio) × sexe',
    details: [
      'ΔHRratio = (FCmoy - FCrepos) / (FCmax - FCrepos)',
      'Facteur exponentiel k : 1.92 pour les hommes, 1.67 pour les femmes',
      'Différencie les efforts légers des efforts intenses de manière non-linéaire',
      'Corrélation forte avec l\'accumulation de fatigue',
    ],
    reference: 'Banister, E.W. (1991). Modeling elite athletic performance. Physiological Testing of Elite Athletes.',
  },
  {
    icon: Heart,
    name: 'PMC',
    fullName: 'Performance Management Chart',
    color: 'from-green-500 to-emerald-500',
    description: 'Le PMC modélise la forme physique (CTL), la fatigue (ATL) et la fraîcheur (TSB) à partir des TSS quotidiens. C\'est l\'outil central pour planifier le tapering et éviter le surentraînement.',
    formula: 'CTL(t) = CTL(t-1) × e^(-1/42) + TSS × (1 - e^(-1/42))',
    details: [
      'CTL (Chronic Training Load) : moyenne pondérée sur 42 jours (tau=42)',
      'ATL (Acute Training Load) : moyenne pondérée sur 7 jours (tau=7)',
      'TSB (Training Stress Balance) = CTL - ATL',
      'TSB positif = frais, TSB négatif = fatigué',
      'TSB optimal pour compétition : entre +10 et +25',
    ],
    reference: 'Banister, E.W. et al. (1975). A systems model of training for athletic performance.',
  },
  {
    icon: BarChart3,
    name: 'ACWR',
    fullName: 'Acute:Chronic Workload Ratio',
    color: 'from-yellow-500 to-orange-500',
    description: 'L\'ACWR compare la charge des 7 derniers jours à la moyenne des 28 derniers jours. C\'est l\'indicateur clé pour prévenir les blessures liées à une augmentation trop rapide de la charge.',
    formula: 'ACWR = Charge_7j / Moyenne_Charge_28j',
    details: [
      'Zone optimale : 0.8 - 1.3 (sweet spot)',
      'Zone de risque : 1.3 - 1.5 (augmentation trop rapide)',
      'Zone dangereuse : > 1.5 (risque de blessure élevé)',
      'Zone de sous-entraînement : < 0.8 (perte de forme)',
    ],
    reference: 'Gabbett, T.J. (2016). The training—injury prevention paradox. British Journal of Sports Medicine, 50(5), 273-280.',
  },
  {
    icon: Brain,
    name: 'Monotonie & Strain',
    fullName: 'Training Monotony & Strain',
    color: 'from-indigo-500 to-blue-500',
    description: 'La monotonie mesure la variabilité de vos charges d\'entraînement quotidiennes. Un entraînement trop monotone (toujours la même intensité) augmente le risque de surentraînement, même si la charge totale est modérée.',
    formula: 'Monotonie = moyenne_charge / écart_type_charge',
    details: [
      'Monotonie < 2.0 : bonne variabilité',
      'Monotonie 2.0 - 5.0 : attention, risque modéré',
      'Monotonie > 5.0 : danger de surentraînement',
      'Strain = CTL × Monotonie (charge globale × régularité)',
    ],
    reference: 'Foster, C. (1998). Monitoring training in athletes with reference to overtraining syndrome.',
  },
];

export default function ScienceEngineGuide() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50/30">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-xl hover:bg-surface transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">ScienceEngine™</h1>
              <p className="text-xs text-muted">15+ métriques scientifiques</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* Hero */}
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-foreground mb-4">
            La science derrière chaque{' '}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              donnée
            </span>
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            DrawRun intègre les algorithmes les plus validés de la littérature scientifique en physiologie de l'exercice.
            Chaque métrique est calculée côté serveur selon les formules de référence.
          </p>
        </div>

        {/* Architecture */}
        <div className="bg-surface rounded-3xl border border-surface shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Layers className="w-6 h-6 text-primary" />
            Architecture de calcul
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-2xl">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mb-3">
                <span className="text-white font-bold">1</span>
              </div>
              <h4 className="font-semibold mb-2">Collecte</h4>
              <p className="text-sm text-muted">Données GPS, FC, allure, dénivelé importées depuis Strava, Garmin, Suunto ou saisie manuelle.</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl">
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center mb-3">
                <span className="text-white font-bold">2</span>
              </div>
              <h4 className="font-semibold mb-2">Calcul serveur</h4>
              <p className="text-sm text-muted">TSS, TRIMP, VDOT, PMC calculés par les algorithmes backend (Node.js) selon les formules scientifiques.</p>
            </div>
            <div className="p-4 bg-green-50 rounded-2xl">
              <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center mb-3">
                <span className="text-white font-bold">3</span>
              </div>
              <h4 className="font-semibold mb-2">Analyse</h4>
              <p className="text-sm text-muted">Recommandations, zones d'entraînement et prédictions générées à partir de l'historique complet.</p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        {metrics.map((metric, index) => (
          <div key={index} className="bg-surface rounded-3xl border border-surface shadow-sm overflow-hidden">
            <div className={`bg-gradient-to-r ${metric.color} p-6 text-white`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-surface/20 rounded-xl flex items-center justify-center">
                  <metric.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{metric.name}</h3>
                  <p className="text-white/80 text-sm">{metric.fullName}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-muted leading-relaxed">{metric.description}</p>
              
              <div className="p-4 bg-background rounded-xl border border-surface">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Formule</p>
                <code className="text-sm font-mono text-primary">{metric.formula}</code>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted" />
                  Détails
                </h4>
                <ul className="space-y-2">
                  {metric.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700">
                  <strong>Référence :</strong> {metric.reference}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-8 text-white text-center">
          <Gauge className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-3">Prêt à utiliser la science ?</h3>
          <p className="text-white/80 mb-6">Créez un compte pour bénéficier de toutes ces métriques appliquées à vos données.</p>
          <button
            onClick={() => router.push('/login?mode=register')}
            className="px-8 py-3 bg-surface text-primary font-semibold rounded-xl hover:bg-surface transition-colors"
          >
            Créer un compte gratuit
          </button>
        </div>
      </div>
    </div>
  );
}
