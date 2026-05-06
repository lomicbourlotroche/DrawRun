'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, Activity, Zap, Target, Clock, Thermometer, TrendingUp } from 'lucide-react';

export default function HRZonesGuide() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-red-50/30">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="p-2 rounded-xl hover:bg-neutral-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Zones de Fréquence Cardiaque</h1>
              <p className="text-xs text-muted">Personnalisées selon votre profil</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-neutral-900 mb-4">
            Des zones basées sur{' '}
            <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
              votre physiologie
            </span>
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Les zones de fréquence cardiaque de DrawRun ne sont pas génériques. Elles sont calculées
            à partir de votre FCM réelle (ou estimée), votre FC de repos, et votre VDOT.
          </p>
        </div>

        {/* FCM calculation */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Thermometer className="w-6 h-6 text-red-500" />
            Calcul de la FC Max (FCM)
          </h3>
          <p className="text-neutral-600 mb-4 leading-relaxed">
            DrawRun utilise la formule de <strong>Tanaka et al. (2001)</strong>, la plus précise pour la population générale :
          </p>
          <div className="p-4 bg-red-50 rounded-xl border border-red-100">
            <code className="text-sm font-mono text-red-600">FCM = 208 - (0.7 × âge)</code>
          </div>
          <p className="text-sm text-neutral-500 mt-3">
            Cette formule est plus précise que la formule historique « 220 - âge » qui sous-estime la FCM chez les jeunes et la surestime chez les seniors.
          </p>
        </div>

        {/* Karvonen zones */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Activity className="w-6 h-6 text-red-500" />
            Méthode Karvonen (réserve de FC)
          </h3>
          <p className="text-neutral-600 mb-4 leading-relaxed">
            DrawRun utilise la <strong>méthode Karvonen</strong> qui tient compte de la FC de repos pour des zones plus précises :
          </p>
          <div className="p-4 bg-red-50 rounded-xl border border-red-100 mb-6">
            <code className="text-sm font-mono text-red-600">FC cible = FCrepos + (FCM - FCrepos) × %intensité</code>
          </div>

          <div className="space-y-3">
            {[
              { zone: 1, name: 'Récupération', range: '50-60%', color: '#94A3B8', desc: 'Récupération active, marche rapide' },
              { zone: 2, name: 'Endurance fondamentale', range: '60-70%', color: '#22C55E', desc: 'Sorties longues, base aérobie' },
              { zone: 3, name: 'Tempo', range: '70-80%', color: '#3B82F6', desc: 'Allure semi-marathon, endurance active' },
              { zone: 4, name: 'Seuil lactique', range: '80-90%', color: '#F59E0B', desc: 'Allure 10K, seuil anaérobie' },
              { zone: 5, name: 'VO2max', range: '90-100%', color: '#EF4444', desc: 'Intervalles courts, allure 5K' },
            ].map((z) => (
              <div key={z.zone} className="flex items-center gap-4 p-3 bg-neutral-50 rounded-xl">
                <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: z.color }} />
                <div className="flex-1">
                  <p className="font-semibold text-sm">Zone {z.zone} — {z.name}</p>
                  <p className="text-xs text-neutral-500">{z.desc}</p>
                </div>
                <code className="text-sm font-mono text-neutral-600">{z.range}</code>
              </div>
            ))}
          </div>
        </div>

        {/* VDOT zones */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Target className="w-6 h-6 text-red-500" />
            Zones d'allure Jack Daniels (VDOT)
          </h3>
          <p className="text-neutral-600 mb-4 leading-relaxed">
            En complément des zones FC, DrawRun calcule les <strong>5 allures d'entraînement</strong> basées sur votre VDOT :
          </p>
          <div className="space-y-3">
            {[
              { zone: 'E', name: 'Easy', percent: '59-74% VMA', desc: 'Endurance fondamentale, récupération' },
              { zone: 'M', name: 'Marathon', percent: '~84% VMA', desc: 'Allure marathon' },
              { zone: 'T', name: 'Threshold', percent: '~88% VMA', desc: 'Seuil lactique, tempo runs' },
              { zone: 'I', name: 'Interval', percent: '~98% VMA', desc: 'VO2max, intervalles 3-5 min' },
              { zone: 'R', name: 'Repetition', percent: '~115% VMA', desc: 'Vitesse pure, sprints courts' },
            ].map((z) => (
              <div key={z.zone} className="flex items-center gap-4 p-3 bg-neutral-50 rounded-xl">
                <div className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {z.zone}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{z.name}</p>
                  <p className="text-xs text-neutral-500">{z.desc}</p>
                </div>
                <code className="text-xs font-mono text-neutral-600">{z.percent}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Cardiac drift */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-red-500" />
            Dérive cardiaque
          </h3>
          <p className="text-neutral-600 leading-relaxed">
            Pendant un effort prolongé, la FC augmente progressivement même si l'allure reste constante. C'est la <strong>dérive cardiaque</strong> (cardiac drift).
            DrawRun la prend en compte dans ses analyses : une dérive &gt; 10% indique une déshydratation ou une fatigue importante.
          </p>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-3xl p-8 text-white text-center">
          <Heart className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-3">Calculez vos zones personnelles</h3>
          <p className="text-white/80 mb-6">Entrez votre âge et FC de repos pour obtenir vos 5 zones personnalisées.</p>
          <button
            onClick={() => router.push('/vdot-calculator')}
            className="px-8 py-3 bg-white text-red-600 font-semibold rounded-xl hover:bg-neutral-100 transition-colors"
          >
            Calculer mes zones
          </button>
        </div>
      </div>
    </div>
  );
}
