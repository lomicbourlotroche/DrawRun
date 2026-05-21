'use client';

import { useState, type ReactNode } from 'react';
import { Card } from '@/components/ui';
import { Star, User, TrendingUp, Heart, Medal } from 'lucide-react';

// Données de témoignages (à remplacer par des données réelles de l'API)
const testimonials = [
  {
    id: 1,
    quote: 'DrawRun a transformé mon entraînement. Le coaching adaptatif m\'a permis de battre mon record sur 10km en seulement 8 semaines.',
    author: 'Thomas Dupont',
    role: 'Coureur - Marathonien',
    rating: 5,
    date: '2025-01-15',
    avatar: 'TD',
    sport: 'Running',
    improvement: '+15%',
  },
  {
    id: 2,
    quote: 'Les plans basés sur le VDOT sont incroyablement précis. J\'ai enfin compris comment structurer mes séances.',
    author: 'Claire Martin',
    role: 'Cycliste - Gran Fondo',
    rating: 5,
    date: '2025-01-20',
    avatar: 'CM',
    sport: 'Cycling',
    improvement: '+20%',
  },
  {
    id: 3,
    quote: 'La gestion de la fatigue et la PMC m\'ont évité le surentraînement. Indispensable pour les athlètes sérieux.',
    author: 'Marc Bernard',
    role: 'Triathlète',
    rating: 5,
    date: '2025-01-25',
    avatar: 'MB',
    sport: 'Triathlon',
    improvement: '+25%',
  },
  {
    id: 4,
    quote: 'L\'intégration avec Garmin et Strava est parfaite. Plus besoin de saisir mes activités manuellement.',
    author: 'Sophie Leroy',
    role: 'Coureuse - Trail',
    rating: 5,
    date: '2025-02-01',
    avatar: 'SL',
    sport: 'Trail Running',
    improvement: 'Gain de temps',
  },
];

// Icônes par sport
const sportIcons: Record<string, ReactNode> = {
  Running: <TrendingUp className="w-4 h-4" />,
  Cycling: <Medal className="w-4 h-4" />,
  Triathlon: <Heart className="w-4 h-4" />,
  'Trail Running': <Heart className="w-4 h-4" />,
};

// Couleurs par sport
const sportColors: Record<string, string> = {
  Running: 'from-orange-500 to-red-500',
  Cycling: 'from-blue-500 to-cyan-500',
  Triathlon: 'from-purple-500 to-pink-500',
  'Trail Running': 'from-green-500 to-emerald-500',
};

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Rotation automatique des témoignages (optionnel)
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  //   }, 5000);
  //   return () => clearInterval(interval);
  // }, []);

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">
            TÉMOIGNAGES
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
            Ils font confiance à DrawRun
          </h2>
          <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">
            Des athlètes de tous niveaux utilisent DrawRun pour optimiser leurs performances.
          </p>
        </div>

        {/* Grid de témoignages */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((testimonial) => {
            const icon = sportIcons[testimonial.sport] || <User className="w-4 h-4" />;
            const gradient = sportColors[testimonial.sport] || 'from-primary-500 to-secondary-500';

            return (
              <Card
                key={testimonial.id}
                variant="glass"
                padding="lg"
                className="h-full flex flex-col transition-all duration-300 hover:shadow-lg"
              >
                {/* Header avec sport et note */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${gradient} text-white text-xs font-semibold`}>
                    {icon}
                    {testimonial.sport}
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < (testimonial.rating || 0) ? 'text-warning fill-warning' : 'text-muted'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Citation */}
                <p className="text-sm text-muted leading-relaxed mb-6 flex-1 italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                {/* Auteur et amélioration */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center font-semibold text-primary text-sm">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{testimonial.author}</p>
                      <p className="text-xs text-muted">{testimonial.role}</p>
                    </div>
                  </div>
                  {testimonial.improvement && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-success/10 rounded-full">
                      <TrendingUp className="w-3.5 h-3.5 text-success" />
                      <span className="text-xs font-semibold text-success">{testimonial.improvement}</span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Pagination dots */}
        <div className="flex justify-center mt-10">
          <div className="flex gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Aller au témoignage ${index + 1}`}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${currentIndex === index ? 'bg-primary w-6' : 'bg-muted/30 hover:bg-muted/50'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
