'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { X, Trophy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SOCIAL_ERRORS } from '@/constants/social';
import {
  CHALLENGE_MODES, CHALLENGE_TYPES, SPORT_TYPES, BADGE_ICONS, PRESET_CHALLENGES,
  getModeInfo, getTypeInfo,
  type ChallengeForm,
} from '../tabs/challenge-constants';

interface ChallengeWizardProps {
  onClose: () => void;
  onCreate: (_form: ChallengeForm) => Promise<void>;
  showPresets?: boolean;
  showPublicToggle?: boolean;
  title?: string;
}

export default function ChallengeWizard({
  onClose, onCreate, showPresets = true, showPublicToggle = true, title = 'Créer un défi',
}: ChallengeWizardProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ChallengeForm>({
    title: '', description: '', type: 'distance', target_value: '',
    end_date: '', challenge_mode: 'quota', weekly_target: '',
    weekly_increase_pct: '10', streak_days: '', frequency_per_week: '3',
    sport_type: 'any', badge_icon: '🏆', is_public: true,
  });
  const [isCreating, setIsCreating] = useState(false);

  const applyPreset = (preset: typeof PRESET_CHALLENGES[number]) => {
    setForm(p => ({
      ...p,
      title: preset.title,
      type: preset.type,
      target_value: String(preset.target_value),
      challenge_mode: preset.challenge_mode,
      badge_icon: preset.badge_icon,
      sport_type: preset.sport_type,
      weekly_target: 'weekly_target' in preset ? String((preset as {weekly_target?: number}).weekly_target ?? '') : '',
      weekly_increase_pct: 'weekly_increase_pct' in preset ? String((preset as {weekly_increase_pct?: number}).weekly_increase_pct ?? '10') : '10',
      streak_days: 'streak_days' in preset ? String((preset as {streak_days?: number}).streak_days ?? '') : '',
      frequency_per_week: 'frequency_per_week' in preset ? String((preset as {frequency_per_week?: number}).frequency_per_week ?? '3') : '3',
      end_date: new Date(Date.now() + preset.duration_days * 86400000).toISOString().split('T')[0],
    }));
    setStep(2);
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setIsCreating(true);
    try {
      await onCreate(form);
      onClose();
    } catch {
      toast.error(SOCIAL_ERRORS.CREATE_CHALLENGE);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  // Step labels for accessibility
  const getStepLabel = (currentStep: number): string => {
    if (showPresets) {
      if (currentStep === 1) return 'Étape 1 sur 3 — Choisir le mode';
      if (currentStep === 2) return 'Étape 2 sur 3 — Définir l\'objectif';
      return 'Étape 3 sur 3 — Personnaliser';
    }
    if (currentStep === 1) return 'Étape 1 sur 3 — Mode du défi';
    if (currentStep === 2) return 'Étape 2 sur 3 — Définir l\'objectif';
    return 'Étape 3 sur 3 — Personnaliser';
  };

  return (
    <ModalSheet open onClose={handleClose} dense>
      <div role="dialog" aria-modal="true" aria-labelledby="wizard-title">
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 id="wizard-title" className="font-bold text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-warning" />{title}
            </h3>
            <button onClick={handleClose} aria-label="Fermer" className="p-2 rounded-xl hover:bg-border transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all ${s <= step ? 'bg-primary' : 'bg-border'}`}
                aria-hidden="true"
              />
            ))}
          </div>
          <p className="text-xs text-muted mt-2" aria-live="polite">
            {getStepLabel(step)}
          </p>
        </div>
        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto space-y-4">
          {step === 1 && showPresets && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">⚡ Démarrage rapide</p>
                <div className="grid grid-cols-1 gap-2">
                  {PRESET_CHALLENGES.map(p => (
                    <button
                      key={p.title}
                      onClick={() => applyPreset(p)}
                      aria-label={`Sélectionner le présélectionné: ${p.title}`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                    >
                      <span className="text-2xl">{p.badge_icon}</span>
                      <div>
                        <p className="text-sm font-medium">{p.title}</p>
                        <p className="text-xs text-muted">{getModeInfo(p.challenge_mode).label} · {p.target_value} {getTypeInfo(p.type).unit}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-xs text-muted">ou créer sur mesure</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Mode du défi</p>
                <div className="grid grid-cols-1 gap-2">
                  {CHALLENGE_MODES.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setForm(p => ({ ...p, challenge_mode: m.id }))}
                      aria-label={`Sélectionner le mode: ${m.label}`}
                      aria-pressed={form.challenge_mode === m.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        form.challenge_mode === m.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <span className="text-xl">{m.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{m.label}</p>
                        <p className="text-xs text-muted">{m.desc}</p>
                      </div>
                      {form.challenge_mode === m.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {step === 1 && !showPresets && (
            <div className="space-y-2">
              <p className="text-xs text-muted uppercase font-medium tracking-wide">Mode du défi</p>
              {CHALLENGE_MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => setForm(p => ({ ...p, challenge_mode: m.id }))}
                  aria-label={`Sélectionner le mode: ${m.label}`}
                  aria-pressed={form.challenge_mode === m.id}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    form.challenge_mode === m.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'
                  }`}
                >
                  <span className="text-xl">{m.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-xs text-muted">{m.desc}</p>
                  </div>
                  {form.challenge_mode === m.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Sport</p>
                <div className="flex flex-wrap gap-2">
                  {SPORT_TYPES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setForm(p => ({ ...p, sport_type: s.id }))}
                      aria-label={`Sélectionner le sport: ${s.label}`}
                      aria-pressed={form.sport_type === s.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-all ${
                        form.sport_type === s.id ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:border-primary/30'
                      }`}
                    >
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Métrique</p>
                <div className="grid grid-cols-2 gap-2">
                  {CHALLENGE_TYPES.filter(t => (t.modes as readonly string[]).includes(form.challenge_mode)).map(t => (
                    <button
                      key={t.id}
                      onClick={() => setForm(p => ({ ...p, type: t.id }))}
                      aria-label={`Sélectionner la métrique: ${t.label}`}
                      aria-pressed={form.type === t.id}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                        form.type === t.id ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <span>{t.icon}</span>
                      <div className="text-left">
                        <p className="text-sm">{t.label}</p>
                        <p className="text-xs text-muted">{t.unit}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {form.challenge_mode !== 'streak' && form.challenge_mode !== 'frequency' && (
                <Input
                  label={`Objectif (${getTypeInfo(form.type).unit})`}
                  type="number"
                  value={form.target_value}
                  onChange={e => setForm(p => ({ ...p, target_value: e.target.value }))}
                  placeholder={form.type === 'distance' ? 'Ex: 100' : form.type === 'elevation' ? 'Ex: 2000' : 'Ex: 600'}
                  aria-required="true"
                />
              )}
              {form.challenge_mode === 'progressive' && (
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={`Départ sem. 1 (${getTypeInfo(form.type).unit})`}
                    type="number"
                    value={form.weekly_target}
                    onChange={e => setForm(p => ({ ...p, weekly_target: e.target.value }))}
                    placeholder="Ex: 20"
                  />
                  <Input
                    label="Augmentation/sem. (%)"
                    type="number"
                    value={form.weekly_increase_pct}
                    onChange={e => setForm(p => ({ ...p, weekly_increase_pct: e.target.value }))}
                    placeholder="Ex: 10"
                  />
                </div>
              )}
              {form.challenge_mode === 'streak' && (
                <Input
                  label="Jours consécutifs"
                  type="number"
                  value={form.streak_days}
                  onChange={e => setForm(p => ({ ...p, streak_days: e.target.value, target_value: e.target.value }))}
                  placeholder="Ex: 30"
                  aria-required="true"
                />
              )}
              {form.challenge_mode === 'frequency' && (
                <Input
                  label="Sorties par semaine"
                  type="number"
                  value={form.frequency_per_week}
                  onChange={e => setForm(p => ({ ...p, frequency_per_week: e.target.value }))}
                  placeholder="Ex: 3"
                  aria-required="true"
                />
              )}
              <Input
                label="Date de fin"
                type="date"
                value={form.end_date}
                onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                aria-required={form.challenge_mode !== 'streak' && form.challenge_mode !== 'frequency'}
              />
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <Input
                label="Nom du défi *"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Ex: 100km en juin"
                aria-required="true"
              />
              <div>
                <label className="text-xs font-medium text-muted uppercase tracking-wide mb-1 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Décrivez votre défi..."
                  rows={3}
                  aria-label="Description du défi"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:border-primary outline-none resize-none"
                />
              </div>
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Badge</p>
                <div className="flex flex-wrap gap-2">
                  {BADGE_ICONS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setForm(p => ({ ...p, badge_icon: icon }))}
                      aria-label={`Sélectionner le badge: ${icon}`}
                      aria-pressed={form.badge_icon === icon}
                      className={`w-10 h-10 text-xl rounded-xl border transition-all ${
                        form.badge_icon === icon ? 'border-primary bg-primary/10 scale-110' : 'border-border hover:border-primary/30'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              {showPublicToggle && (
                <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                  <div>
                    <p className="text-sm font-medium">Défi public</p>
                    <p className="text-xs text-muted">Visible et rejoignable par tous</p>
                  </div>
                  <button
                    onClick={() => setForm(p => ({ ...p, is_public: !p.is_public }))}
                    aria-label={form.is_public ? 'Passer en défi privé' : 'Passer en défi public'}
                    aria-pressed={form.is_public}
                    className={`w-12 h-6 rounded-full transition-all relative ${
                      form.is_public ? 'bg-primary' : 'bg-border'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                        form.is_public ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              )}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                <p className="text-sm font-semibold">{form.badge_icon} {form.title || 'Mon défi'}</p>
                <p className="text-xs text-muted">{getModeInfo(form.challenge_mode).icon} {getModeInfo(form.challenge_mode).label} · {getTypeInfo(form.type).icon} {form.target_value || '?'} {getTypeInfo(form.type).unit}</p>
                {form.end_date && <p className="text-xs text-muted">⏳ Jusqu&apos;au {new Date(form.end_date).toLocaleDateString('fr-FR')}</p>}
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-border flex gap-3">
          {step > 1 && (
            <Button variant="secondary" onClick={() => setStep(s => s - 1)} className="rounded-xl" aria-label="Retour à l'étape précédente">
              ← Retour
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              className="flex-1 rounded-xl"
              disabled={step === 2 && !form.target_value && form.challenge_mode !== 'frequency'}
              aria-label="Passer à l'étape suivante"
            >
              Suivant →
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={isCreating || !form.title.trim()}
              className="flex-1 rounded-xl"
              aria-label="Créer le défi"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : '🏆 Créer le défi'}
            </Button>
          )}
        </div>
      </div>
    </ModalSheet>
  );
}
