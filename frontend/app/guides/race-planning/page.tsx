'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, MapPin, Heart, Droplets, TrendingUp, AlertTriangle } from '@/components/ui/icons';

export default function RacePlanningGuide() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-amber-50/30">
      <div className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="p-2 rounded-xl hover:bg-surface transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Race Planning</h1>
              <p className="text-xs text-muted">Stratégie de course scientifique</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-foreground mb-4">
            Chaque kilomètre{' '}
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              planifié
            </span>
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Le Race Planning de DrawRun génère une stratégie de course complète : allure cible par kilomètre, zones de
            fréquence cardiaque, ravitaillements et ajustements selon le profil du terrain.
          </p>
        </div>

        {/* Splits */}
        <div className="bg-surface rounded-3xl border border-surface shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <MapPin className="w-6 h-6 text-amber-500" />
            Splits kilométriques
          </h3>
          <p className="text-muted mb-6 leading-relaxed">
            Pour chaque kilomètre de votre course, l&apos;algorithme calcule l&apos;allure cible optimale en fonction de
            votre VDOT, du profil du terrain et de la stratégie de course choisie (even pace, negative split, positive
            split).
          </p>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-sm text-amber-800">
              <strong>Stratégie par défaut :</strong> départ conservateur (5-10s/km plus lent que l&apos;allure cible),
              allure de croisière stabilisée à partir du km 3, et finish push si la forme le permet (TSB &gt; 0).
            </p>
          </div>
        </div>

        {/* HR zones */}
        <div className="bg-surface rounded-3xl border border-surface shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Heart className="w-6 h-6 text-danger" />
            Zones de fréquence cardiaque adaptatives
          </h3>
          <p className="text-muted mb-6 leading-relaxed">
            Votre FC cible n&apos;est pas constante pendant une course. Le système adapte les zones selon la phase :
          </p>
          <div className="space-y-3">
            {[
              { phase: 'Départ (km 1-3)', zone: 'Zone 2-3 (70-80% FCM)', desc: "Contenir l'excitation du départ" },
              { phase: 'Croisière (km 4-80%)', zone: 'Zone 3-4 (80-90% FCM)', desc: 'Allure cible, effort soutenu' },
              {
                phase: 'Fin de course (derniers 20%)',
                zone: 'Zone 4-5 (90-100% FCM)',
                desc: 'Push final si la réserve le permet',
              },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-background rounded-xl">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <p className="font-semibold text-sm">{item.phase}</p>
                  <p className="text-xs text-muted">
                    {item.zone} — {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nutrition */}
        <div className="bg-surface rounded-3xl border border-surface shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Droplets className="w-6 h-6 text-primary" />
            Stratégie nutritionnelle
          </h3>
          <p className="text-muted mb-6 leading-relaxed">
            Les ravitaillements sont planifiés automatiquement selon la durée estimée de la course :
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl">
              <h4 className="font-semibold text-blue-700 mb-2">Hydratation</h4>
              <p className="text-sm text-primary">
                200-300ml d&apos;eau toutes les 20-30 minutes (5-7 km). Ajusté selon la température.
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl">
              <h4 className="font-semibold text-orange-700 mb-2">Glucides</h4>
              <p className="text-sm text-orange-600">
                1 gel toutes les 30-45 minutes pour les courses &gt; 1h. 30-60g de glucides/heure.
              </p>
            </div>
          </div>
        </div>

        {/* Terrain */}
        <div className="bg-surface rounded-3xl border border-surface shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-success" />
            Ajustement selon le profil
          </h3>
          <div className="space-y-3">
            {[
              { profile: 'Plat', factor: '×1.00', desc: 'Aucun ajustement, allure constante' },
              { profile: 'Vallonné', factor: '×1.05', desc: '+5% sur les montées, -5% sur les descentes' },
              {
                profile: 'Montagneux',
                factor: '×1.15',
                desc: '+15% montées, attention aux descentes (impact musculaire)',
              },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-background rounded-xl">
                <div>
                  <p className="font-semibold">{item.profile}</p>
                  <p className="text-xs text-muted">{item.desc}</p>
                </div>
                <code className="text-sm font-mono bg-surface px-3 py-1 rounded-lg">{item.factor}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Warnings */}
        <div className="bg-surface rounded-3xl border border-surface shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Alertes automatiques
          </h3>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-start gap-2">
              <span className="text-danger mt-1">•</span>
              <span>
                <strong>Fatigue élevée (TSB &lt; -30) :</strong> le plan recommande de réduire l&apos;objectif de temps
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-1">•</span>
              <span>
                <strong>ACWR &gt; 1.5 :</strong> risque de blessure, stratégie conservatrice activée
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                <strong>Température &gt; 25°C :</strong> +3-5% sur l&apos;allure cible (dégradation thermique)
              </span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-8 text-white text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-3">Planifiez votre prochaine course</h3>
          <p className="text-white/80 mb-6">
            Obtenez une stratégie personnalisée basée sur votre niveau et votre objectif.
          </p>
          <button
            onClick={() => router.push('/login?mode=register')}
            className="px-8 py-3 bg-surface text-amber-600 font-semibold rounded-xl hover:bg-surface transition-colors"
          >
            Créer un compte gratuit
          </button>
        </div>
      </div>
    </div>
  );
}
