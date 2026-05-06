'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Brain, TrendingUp, Target, Clock, Heart, Award, BarChart3, CheckCircle, AlertTriangle } from 'lucide-react';

export default function CoachingAdaptatifGuide() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-green-50/30">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="p-2 rounded-xl hover:bg-neutral-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Coaching Adaptatif</h1>
              <p className="text-xs text-muted">Plans personnalisés dynamiques</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-neutral-900 mb-4">
            Un plan qui s'adapte à{' '}
            <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
              votre forme
            </span>
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Contrairement aux plans statiques, le coaching adaptatif de DrawRun ajuste chaque semaine
            en fonction de votre fatigue, de vos performances réelles et de votre récupération.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <Brain className="w-6 h-6 text-green-500" />
            Comment fonctionne l'adaptation
          </h3>

          <div className="space-y-8">
            {[
              {
                step: '1',
                title: 'Évaluation initiale',
                icon: Target,
                content: 'Au démarrage, vous renseignez votre objectif (5K, 10K, Semi, Marathon), votre niveau actuel, votre VMA/VDOT si connu, vos jours d\'entraînement disponibles et votre expérience. Le moteur génère un plan de base basé sur les principes de périodisation.',
              },
              {
                step: '2',
                title: 'Feedback après chaque séance',
                icon: Heart,
                content: 'Après chaque entraînement, vous pouvez soumettre un feedback : difficulté perçue (RPE), douleur, notes. Le système compare la performance réelle (allure, FC, TSS) avec ce qui était prévu.',
              },
              {
                step: '3',
                title: 'Ajustement automatique',
                icon: TrendingUp,
                content: 'Chaque semaine, l\'algorithme analyse : votre charge aiguë (ATL), votre charge chronique (CTL), votre balance (TSB), votre ACWR, et vos feedbacks. Si vous êtes fatigué, la semaine suivante est allégée. Si vous progressez bien, l\'intensité augmente progressivement.',
              },
              {
                step: '4',
                title: 'Tests de performance',
                icon: Award,
                content: 'Des tests VMA/VDOT sont planifiés régulièrement (toutes les 4-6 semaines). Les résultats recalibrent votre VDOT et donc toutes les allures d\'entraînement. Votre plan évolue avec votre niveau réel.',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <item.icon className="w-5 h-5 text-green-500" />
                    {item.title}
                  </h4>
                  <p className="text-neutral-600 leading-relaxed">{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Algorithm details */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-green-500" />
            Logique d'adaptation
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Si vous progressez bien
              </h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• Augmentation progressive du volume (+5-10%/semaine)</li>
                <li>• Introduction de séances plus intenses</li>
                <li>• Allures cibles ajustées selon le nouveau VDOT</li>
              </ul>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <h4 className="font-semibold text-amber-700 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Si vous êtes fatigué
              </h4>
              <ul className="space-y-1 text-sm text-amber-700">
                <li>• Réduction du volume de 10-20%</li>
                <li>• Remplacement des séances intenses par de l'endurance</li>
                <li>• Semaine de récupération insérée si ACWR &gt; 1.3</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-neutral-50 rounded-xl">
            <p className="text-sm text-neutral-600">
              <strong>Phases typiques :</strong> Base (endurance) → Développement (seuil) → Spécifique (allure course) → Tapering (fraîcheur) → Compétition.
              Chaque phase dure 3-6 semaines selon l'objectif et le niveau.
            </p>
          </div>
        </div>

        {/* Scientific basis */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-4">Références scientifiques</h3>
          <ul className="space-y-3 text-sm text-neutral-600">
            <li className="p-3 bg-neutral-50 rounded-lg">
              <strong>McNamara, B.P. & Stearne, J. (2010).</strong> — The effects of a training program on running performance. <em>Journal of Strength and Conditioning Research</em>.
            </li>
            <li className="p-3 bg-neutral-50 rounded-lg">
              <strong>Seiler, S. (2010).</strong> — What is best practice for training intensity and duration distribution in endurance athletes? <em>International Journal of Sports Physiology and Performance</em>, 5(3), 276-291.
            </li>
            <li className="p-3 bg-neutral-50 rounded-lg">
              <strong>Bourdon, P.C. et al. (2017).</strong> — Monitoring athlete training loads: consensus statement. <em>International Journal of Sports Physiology and Performance</em>, 12(S2), S2-161.
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl p-8 text-white text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-3">Commencez votre plan adaptatif</h3>
          <p className="text-white/80 mb-6">Répondez à quelques questions et recevez un plan personnalisé en quelques secondes.</p>
          <button
            onClick={() => router.push('/login?mode=register')}
            className="px-8 py-3 bg-white text-green-600 font-semibold rounded-xl hover:bg-neutral-100 transition-colors"
          >
            Créer un compte gratuit
          </button>
        </div>
      </div>
    </div>
  );
}
