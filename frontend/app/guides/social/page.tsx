/* eslint-disable react/no-unescaped-entities */
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, UserPlus, Trophy, Heart, Check, Shield } from 'lucide-react';

export default function SocialGuide() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-indigo-50/30">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="p-2 rounded-xl hover:bg-neutral-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Social & Communauté</h1>
              <p className="text-xs text-muted">Entraînez-vous ensemble</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-neutral-900 mb-4">
            La motivation{' '}
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              collective
            </span>
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            DrawRun intègre des fonctionnalités sociales pour vous connecter avec d'autres athlètes,
            partager vos progrès et vous motiver mutuellement.
          </p>
        </div>

        {/* Friends */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-indigo-500" />
            Amis & Connaissances
          </h3>
          <p className="text-neutral-600 mb-4 leading-relaxed">
            Ajoutez des amis pour suivre leurs activités en temps réel. Recevez des notifications quand ils :
          </p>
          <ul className="space-y-2">
            {[
              'Terminent une nouvelle activité',
              'Battent un record personnel (PR)',
              'Complètent une semaine d\'entraînement',
              'Participent à un challenge',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-neutral-600">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Groups */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Shield className="w-6 h-6 text-indigo-500" />
            Groupes d'entraînement
          </h3>
          <p className="text-neutral-600 mb-4 leading-relaxed">
            Créez ou rejoignez des groupes privés avec votre club, vos collègues ou votre communauté :
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50 rounded-xl">
              <h4 className="font-semibold text-indigo-700 mb-2">Codes d'invitation</h4>
              <p className="text-sm text-indigo-600">Chaque groupe a un code unique à 6 caractères pour rejoindre facilement.</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <h4 className="font-semibold text-purple-700 mb-2">Planning de groupe</h4>
              <p className="text-sm text-purple-600">Partagez vos séances et coordonnez les entraînements collectifs.</p>
            </div>
          </div>
        </div>

        {/* Leaderboards */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-500" />
            Classements
          </h3>
          <p className="text-neutral-600 mb-4 leading-relaxed">
            Comparez vos statistiques avec vos amis ou votre groupe selon plusieurs catégories :
          </p>
          <div className="space-y-3">
            {[
              { label: 'Distance totale', icon: '📏', desc: 'Km parcourus sur la période' },
              { label: 'TSS total', icon: '⚡', desc: 'Charge d\'entraînement cumulée' },
              { label: 'Durée totale', icon: '⏱️', desc: 'Temps d\'activité cumulé' },
              { label: 'Nombre d\'activités', icon: '🏃', desc: 'Sessions complétées' },
              { label: 'Série en cours', icon: '🔥', desc: 'Jours consécutifs d\'activité' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs text-neutral-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Draws & comments */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <Heart className="w-6 h-6 text-red-500" />
            Draws & Commentaires
          </h3>
          <p className="text-neutral-600 leading-relaxed">
            Comme un « like » sur vos activités, les <strong>draws</strong> (tracés) permettent d'encourager
            les autres membres. Ajoutez un commentaire pour féliciter un PR ou donner un conseil.
          </p>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl p-8 text-white text-center">
          <Users className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-3">Rejoignez la communauté</h3>
          <p className="text-white/80 mb-6">Connectez-vous avec d'autres athlètes et motivez-vous mutuellement.</p>
          <button
            onClick={() => router.push('/login?mode=register')}
            className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-neutral-100 transition-colors"
          >
            Créer un compte gratuit
          </button>
        </div>
      </div>
    </div>
  );
}
