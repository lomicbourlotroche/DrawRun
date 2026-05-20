/* eslint-disable no-undef, unused-imports/no-unused-vars */
'use client';

import { useState } from 'react';
import { SPORTS, type SportType, type SportCategoryType } from '@/types/sports';
import {
  Footprints, Bike, Waves, Dumbbell, Snowflake, Droplets, Users,
  Mountain, CircleDot, Club, Compass, Heart, Timer, Zap, Wind, Check
} from 'lucide-react';

const CATEGORY_ICONS: Record<SportCategoryType, React.ComponentType<{ className?: string }>> = {
  endurance: Footprints,
  strength: Dumbbell,
  team: Users,
  racket: CircleDot,
  winter: Snowflake,
  water: Droplets,
  other: Compass,
};

const CATEGORY_LABELS: Record<SportCategoryType, string> = {
  endurance: 'Endurance',
  strength: 'Force & Fitness',
  team: 'Sports collectifs',
  racket: 'Sports de raquette',
  winter: 'Sports d\'hiver',
  water: 'Sports nautiques',
  other: 'Autres',
};

const CATEGORY_ORDER: SportCategoryType[] = ['endurance', 'strength', 'water', 'winter', 'racket', 'team', 'other'];

interface SportPickerProps {
  selectedSport: SportType;
  onSelect: (sport: SportType) => void;
  onClose?: () => void;
}

export function SportPicker({ selectedSport, onSelect, onClose }: SportPickerProps) {
  const [activeCategory, setActiveCategory] = useState<SportCategoryType>('endurance');

  const sportsInCategory = Object.values(SPORTS).filter(s => s.category === activeCategory);

  return (
    <div className="space-y-3">
      {/* Category Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORY_ORDER.map((cat) => {
          const Icon = CATEGORY_ICONS[cat];
          const count = Object.values(SPORTS).filter(s => s.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-peak text-foreground'
                  : 'bg-surface text-muted hover:bg-surface/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {CATEGORY_LABELS[cat]}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                activeCategory === cat ? 'bg-surface/20' : 'bg-background'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sports Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-1">
        {sportsInCategory.map((sport) => {
          const isSelected = selectedSport === sport.id;
          return (
            <button
              key={sport.id}
              onClick={() => {
                onSelect(sport.id);
                onClose?.();
              }}
              className={`flex items-center gap-2 p-3 rounded-lg text-left transition-all ${
                isSelected
                  ? 'bg-surface border border-peak/30'
                  : 'bg-background border border-transparent hover:bg-surface'
              }`}
            >
              <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-peak text-foreground' : 'bg-surface text-muted'
              }`}>
                {isSelected ? <Check className="w-4 h-4" /> : <SportIcon sport={sport.id} />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{sport.nameFr}</p>
                <p className="text-xs text-muted truncate">{sport.name}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SportIcon({ sport }: { sport: SportType }) {
  const iconClass = "w-4 h-4";
  switch (sport) {
    case 'run': case 'trail_run': case 'race_walk': return <Footprints className={iconClass} />;
    case 'bike': case 'mountain_bike': case 'gravel_bike': case 'indoor_cycling': case 'virtual_ride': return <Bike className={iconClass} />;
    case 'swim': case 'open_water_swim': return <Waves className={iconClass} />;
    case 'ski_alpine': case 'ski_touring': case 'ski_cross_country': case 'snowboard': return <Snowflake className={iconClass} />;
    case 'rowing': case 'kayak': case 'canoe': case 'stand_up_paddle': return <Droplets className={iconClass} />;
    case 'tennis': case 'badminton': case 'squash': return <CircleDot className={iconClass} />;
    case 'basketball': case 'football': case 'soccer': case 'rugby': case 'volleyball': case 'handball': return <Users className={iconClass} />;
    case 'golf': return <Club className={iconClass} />;
    case 'climbing': case 'via_ferrata': case 'mountaineering': return <Mountain className={iconClass} />;
    case 'land_sailing': return <Wind className={iconClass} />;
    case 'triathlon': case 'duathlon': case 'aquathlon': return <Zap className={iconClass} />;
    case 'crossfit': case 'weight_training': case 'strength_training': case 'cardio_training': case 'hiit': case 'circuit_training': return <Dumbbell className={iconClass} />;
    case 'pilates': case 'yoga': return <Heart className={iconClass} />;
    case 'walk': case 'hike': return <Compass className={iconClass} />;
    default: return <Timer className={iconClass} />;
  }
}
