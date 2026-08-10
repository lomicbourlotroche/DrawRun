'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import {
  CloudSun,
  Thermometer,
  Droplets,
  Wind,
  AlertTriangle,
  Sun,
  CloudRain,
  CloudLightning,
  Snowflake,
} from '@/components/ui/icons';

export default function WeatherSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    const section = document.getElementById('weather');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="weather" className="py-20 lg:py-32 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div
            className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-full text-sm font-semibold text-primary mb-6">
              <CloudSun className="w-4 h-4" />
              Météo intégrée
            </span>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6">
              Conditions météo
              <br />
              <span className="bg-gradient-to-r from-primary to-warning bg-clip-text text-transparent">
                de chaque activité
              </span>
            </h2>

            <p className="text-lg text-foreground leading-relaxed mb-8 max-w-xl">
              Visualisez la température, l&apos;humidité, le vent et les conditions météo au moment de chaque sortie.
              L&apos;impact estimé sur votre allure vous aide à contextualiser vos performances.
            </p>

            {/* Features list */}
            <div className="space-y-4 mb-8">
              {[
                { icon: Thermometer, text: 'Température et humidité au départ' },
                { icon: Wind, text: "Vitesse du vent avec impact sur l'allure" },
                { icon: AlertTriangle, text: 'Alerte si conditions dégradées (+10% allure)' },
                { icon: CloudSun, text: 'Données Open-Meteo, mises en cache automatiquement' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Weather Card Preview */}
          <div
            className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
          >
            <Card variant="glass" className="max-w-md mx-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Sortie matin — 15 Mai</h3>
                    <p className="text-sm text-muted">06:30 • Paris, France</p>
                  </div>
                  <Sun className="w-10 h-10 text-warning" />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <Thermometer className="w-5 h-5 text-danger mx-auto mb-1" />
                    <p className="text-2xl font-bold text-white">18°C</p>
                    <p className="text-xs text-muted">Température</p>
                  </div>
                  <div className="text-center">
                    <Droplets className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-2xl font-bold text-white">65%</p>
                    <p className="text-xs text-muted">Humidité</p>
                  </div>
                  <div className="text-center">
                    <Wind className="w-5 h-5 text-muted mx-auto mb-1" />
                    <p className="text-2xl font-bold text-white">12</p>
                    <p className="text-xs text-muted">km/h</p>
                  </div>
                </div>

                <div className="p-3 bg-success/10 border border-success/30 rounded-xl">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-success shrink-0" />
                    <p className="text-sm text-success">Conditions idéales — aucun impact sur l&apos;allure</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Weather icons preview */}
            <div className="mt-6 flex justify-center gap-4">
              {[
                { icon: Sun, label: 'Ensoleillé' },
                { icon: CloudRain, label: 'Pluie' },
                { icon: CloudLightning, label: 'Orage' },
                { icon: Snowflake, label: 'Neige' },
              ].map((w, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-surface/5 border border-white/10 rounded-xl flex items-center justify-center">
                    <w.icon className="w-5 h-5 text-muted" />
                  </div>
                  <span className="text-xs text-muted">{w.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
