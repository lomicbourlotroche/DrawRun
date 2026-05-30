'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, BarChart3, Activity, Heart, Target, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export default function PMCGuide() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-purple-50/30">
      <div className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="p-2 rounded-xl hover:bg-surface transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">PMC Avancé</h1>
              <p className="text-xs text-muted">Performance Management Chart</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-foreground mb-4">
            Modéliser votre{' '}
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              forme physique
            </span>
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Le PMC (Performance Management Chart) est le modèle mathématique le plus utilisé pour suivre
            la forme, la fatigue et la fraîcheur d&apos;un athlète à partir de la charge d&apos;entraînement.
          </p>
        </div>

        {/* Three components */}
        <div className="bg-surface rounded-3xl border border-surface shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-purple-500" />
            Les 3 composantes du PMC
          </h3>

          <div className="space-y-6">
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-lg font-bold text-blue-700">CTL — Chronic Training Load</h4>
              </div>
              <p className="text-sm text-primary mb-3">Votre <strong>forme physique</strong> à long terme. C&apos;est une moyenne exponentielle pondérée des TSS des 42 derniers jours (tau = 42).</p>
              <div className="p-3 bg-surface rounded-lg">
                <code className="text-xs font-mono text-primary">CTL(t) = CTL(t-1) × e^(-1/42) + TSS × (1 - e^(-1/42))</code>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-primary">
                <li>• Monte lentement (il faut des semaines de cohérence)</li>
                <li>• Descend lentement (la forme se perd progressivement)</li>
                <li>• Un CTL de 80+ est typique d&apos;un marathonien bien entraîné</li>
              </ul>
            </div>

            <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-danger rounded-lg flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-lg font-bold text-red-700">ATL — Acute Training Load</h4>
              </div>
              <p className="text-sm text-danger mb-3">Votre <strong>fatigue</strong> récente. Moyenne exponentielle pondérée des TSS des 7 derniers jours (tau = 7).</p>
              <div className="p-3 bg-surface rounded-lg">
                <code className="text-xs font-mono text-danger">ATL(t) = ATL(t-1) × e^(-1/7) + TSS × (1 - e^(-1/7))</code>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-danger">
                <li>• Monte rapidement après une séance intense</li>
                <li>• Descend rapidement après 2-3 jours de repos</li>
                <li>• Un ATL élevé = fatigue accumulée récente</li>
              </ul>
            </div>

            <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-success rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-lg font-bold text-green-700">TSB — Training Stress Balance</h4>
              </div>
              <p className="text-sm text-success mb-3">Votre <strong>fraîcheur</strong>. C&apos;est la différence entre forme et fatigue : TSB = CTL - ATL.</p>
              <div className="p-3 bg-surface rounded-lg">
                <code className="text-xs font-mono text-success">TSB(t) = CTL(t) - ATL(t)</code>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-success">
                <li>• <strong>TSB &gt; +25</strong> : très frais, mais forme potentiellement basse</li>
                <li>• <strong>TSB +10 à +25</strong> : zone idéale pour la compétition</li>
                <li>• <strong>TSB 0 à +10</strong> : bon pour les entraînements intenses</li>
                <li>• <strong>TSB &lt; 0</strong> : fatigué, risque de sous-performance</li>
                <li>• <strong>TSB &lt; -30</strong> : surentraînement, repos impératif</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How to use */}
        <div className="bg-surface rounded-3xl border border-surface shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Clock className="w-6 h-6 text-purple-500" />
            Comment utiliser le PMC
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-background rounded-xl">
              <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Planifier le tapering</h4>
                <p className="text-sm text-muted">Réduisez progressivement la charge 7-14 jours avant la compétition pour amener le TSB dans la zone +10 à +25.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-background rounded-xl">
              <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Éviter le surentraînement</h4>
                <p className="text-sm text-muted">Si le TSB descend sous -30 pendant plus de 3 jours, insérez une semaine de récupération.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-background rounded-xl">
              <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Suivre la progression</h4>
                <p className="text-sm text-muted">Un CTL qui monte régulièrement sur 8-12 semaines indique une base aérobie en construction.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-background rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Attention au CTL trop haut</h4>
                <p className="text-sm text-muted">Un CTL &gt; 120 sans période de récupération augmente le risque de blessure et de surentraînement.</p>
              </div>
            </div>
          </div>
        </div>

        {/* References */}
        <div className="bg-surface rounded-3xl border border-surface shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-4">Références scientifiques</h3>
          <ul className="space-y-3 text-sm text-muted">
            <li className="p-3 bg-background rounded-lg">
              <strong>Impellizzeri, F.M. et al. (2004).</strong> — Use of RPE-based training load in soccer. <em>Medicine & Science in Sports & Exercise</em>, 36(6), 1042-1047.
            </li>
            <li className="p-3 bg-background rounded-lg">
              <strong>Charkoudian, N. et al. (1999).</strong> — Influence of training status on maximal accumulated oxygen deficit. <em>Journal of Applied Physiology</em>.
            </li>
            <li className="p-3 bg-background rounded-lg">
              <strong>Busso, T. (2003).</strong> — Variable dose-response relationship and long-term performance. <em>European Journal of Applied Physiology</em>, 89(2), 166-173.
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-8 text-white text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-3">Visualisez votre PMC</h3>
          <p className="text-white/80 mb-6">Importez vos activités et suivez votre forme, fatigue et fraîcheur en temps réel.</p>
          <button
            onClick={() => router.push('/login?mode=register')}
            className="px-8 py-3 bg-surface text-secondary font-semibold rounded-xl hover:bg-surface transition-colors"
          >
            Créer un compte gratuit
          </button>
        </div>
      </div>
    </div>
  );
}
