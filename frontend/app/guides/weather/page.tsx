/* eslint-disable react/no-unescaped-entities */
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, CloudSun, Thermometer, Wind, Droplets, Sun, CloudRain, Snowflake } from 'lucide-react';

export default function WeatherGuide() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-sky-50/30">
      <div className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="p-2 rounded-xl hover:bg-surface transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary flex items-center justify-center">
              <CloudSun className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Météo intégrée</h1>
              <p className="text-xs text-muted">Impact météo sur la performance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-foreground mb-4">
            La météo, un facteur{' '}
            <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
              de performance
            </span>
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            DrawRun récupère les conditions météo au moment de chaque activité et estime leur impact
            sur votre allure. Comprendre ces effets vous aide à contextualiser vos performances.
          </p>
        </div>

        {/* Data source */}
        <div className="bg-surface rounded-3xl border border-surface shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <CloudSun className="w-6 h-6 text-sky-500" />
            Source des données
          </h3>
          <p className="text-muted leading-relaxed">
            Les données météo proviennent de l'API <strong>Open-Meteo</strong> (open-source, gratuite, sans clé API).
            Pour chaque activité, DrawRun récupère les conditions au point GPS de départ et à l'heure de début.
          </p>
          <div className="mt-4 p-3 bg-sky-50 rounded-lg border border-sky-100">
            <p className="text-sm text-sky-700">
              <strong>Données collectées :</strong> température, humidité relative, vitesse du vent, précipitations, pression atmosphérique, indice UV.
            </p>
          </div>
        </div>

        {/* Temperature impact */}
        <div className="bg-surface rounded-3xl border border-surface shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Thermometer className="w-6 h-6 text-danger" />
            Impact de la température
          </h3>
          <p className="text-muted mb-4 leading-relaxed">
            La chaleur augmente la FC et réduit la performance. Les recherches montrent une dégradation progressive :
          </p>
          <div className="space-y-3">
            {[
              { range: '< 10°C', impact: 'Optimal pour la performance', color: 'text-primary', bg: 'bg-blue-50' },
              { range: '10-15°C', impact: 'Conditions idéales, aucun impact', color: 'text-success', bg: 'bg-green-50' },
              { range: '15-20°C', impact: 'Léger impact (+1-2% sur l\'allure)', color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { range: '20-25°C', impact: 'Impact modéré (+3-5% sur l\'allure)', color: 'text-orange-600', bg: 'bg-orange-50' },
              { range: '> 25°C', impact: 'Impact significatif (+5-10% sur l\'allure)', color: 'text-danger', bg: 'bg-red-50' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center justify-between p-3 ${item.bg} rounded-xl`}>
                <span className={`font-semibold text-sm ${item.color}`}>{item.range}</span>
                <span className={`text-sm ${item.color}`}>{item.impact}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Humidity */}
        <div className="bg-surface rounded-3xl border border-surface shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <Droplets className="w-6 h-6 text-primary" />
            Humidité et indice de chaleur
          </h3>
          <p className="text-muted leading-relaxed">
            Une humidité élevée réduit l'efficacité de la transpiration, augmentant la perception de l'effort.
            Au-dessus de 70% d'humidité combinée à &gt; 20°C, l'impact sur la performance est significatif.
            DrawRun calcule l'<strong>indice de chaleur</strong> (heat index) pour estimer la température ressentie.
          </p>
        </div>

        {/* Wind */}
        <div className="bg-surface rounded-3xl border border-surface shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <Wind className="w-6 h-6 text-sky-500" />
            Impact du vent
          </h3>
          <p className="text-muted leading-relaxed">
            Le vent de face augmente la résistance aérodynamique. À partir de 20 km/h, l'impact sur l'allure devient mesurable.
            DrawRun estime la pénalité en fonction de la vitesse et de la direction du vent par rapport à votre parcours.
          </p>
        </div>

        {/* Weather icons */}
        <div className="bg-surface rounded-3xl border border-surface shadow-sm p-8">
          <h3 className="text-2xl font-bold mb-4">Conditions détectées</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Sun, label: 'Ensoleillé', desc: 'Conditions idéales' },
              { icon: CloudSun, label: 'Partiellement nuageux', desc: 'Bonnes conditions' },
              { icon: CloudRain, label: 'Pluie', desc: 'Impact modéré' },
              { icon: Snowflake, label: 'Neige', desc: 'Impact significatif' },
            ].map((w, i) => (
              <div key={i} className="text-center p-4 bg-background rounded-xl">
                <w.icon className="w-8 h-8 mx-auto mb-2 text-sky-500" />
                <p className="font-semibold text-sm">{w.label}</p>
                <p className="text-xs text-muted">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary to-primary rounded-3xl p-8 text-foreground text-center">
          <CloudSun className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-3">Visualisez la météo de vos sorties</h3>
          <p className="text-foreground/80 mb-6">Importez vos activités et découvrez l'impact météo sur chaque performance.</p>
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
