/* eslint-disable unused-imports/no-unused-vars, react-hooks/exhaustive-deps, react/no-unescaped-entities, @next/next/no-img-element */
'use client';

/**
 * ============================================================
 * SHARE SETTINGS PANEL
 * ============================================================
 * Panneau de controle de partage pour les activites.
 * Permet a l'utilisateur de configurer :
 * - Partage avec les amis (feed social)
 * - Partage avec des groupes specifices
 * - Champs de donnees exposes (distance, temps, FC, carte, etc.)
 * - Previsualisation de l'image de partage
 *
 * @module components/features/activities/ShareSettingsPanel
 */

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { activitiesApi } from '@/lib/api';
import { shareApi, type ShareImageSize } from '@/lib/api/share.api';
import { useGroups } from '@/hooks/useSocial';
import type { Group, Activity } from '@/types';

interface ShareSettingsPanelProps {
  activityId: number;
  onSave?: () => void;
  activityData?: Partial<Activity>;
  showPreview?: boolean;
}

interface ShareSettings {
  share_to_friends: boolean;
  share_to_groups: number[] | null;
  shared_data_fields: string[];
}

const IMAGE_SIZES: { id: ShareImageSize; label: string; width: number; height: number }[] = [
  { id: 'small', label: 'Petit (512x512)', width: 512, height: 512 },
  { id: 'medium', label: 'Moyen (1080x1080)', width: 1080, height: 1080 },
  { id: 'large', label: 'Grand (2048x2048)', width: 2048, height: 2048 },
];

const ALLOWED_FIELDS = [
  { id: 'distance', label: 'Distance', icon: '📏' },
  { id: 'time', label: 'Duree', icon: '⏱️' },
  { id: 'pace', label: 'Allure/Vitesse', icon: '🏃' },
  { id: 'elevation', label: 'Denivele', icon: '⛰️' },
  { id: 'map', label: 'Carte', icon: '🗺️' },
  { id: 'hr', label: 'Frequence cardiaque', icon: '❤️' },
  { id: 'power', label: 'Puissance', icon: '⚡' },
  { id: 'cadence', label: 'Cadence', icon: '🔄' },
  { id: 'splits', label: 'Splits', icon: '📊' },
  { id: 'calories', label: 'Calories', icon: '🔥' },
];

export function ShareSettingsPanel({ 
  activityId, 
  onSave, 
  activityData,
  showPreview = true 
}: ShareSettingsPanelProps) {
  const [settings, setSettings] = useState<ShareSettings>({
    share_to_friends: true,
    share_to_groups: null,
    shared_data_fields: ['distance', 'time', 'pace', 'elevation', 'map'],
  });
  const [originalSettings, setOriginalSettings] = useState<ShareSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<ShareImageSize>('medium');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [shareStats, setShareStats] = useState<any>(null);

  const { groups, isLoading: groupsLoading } = useGroups();

  // Charger les parametres existants, la previsualisation et les stats
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Charger les parametres de partage
        const settingsData = await activitiesApi.getActivityShareSettings(activityId);
        const normalizedSettings = {
          share_to_friends: settingsData.share_to_friends,
          share_to_groups: settingsData.share_to_groups,
          shared_data_fields: settingsData.shared_data_fields || ['distance', 'time', 'pace', 'elevation', 'map'],
        };
        setSettings(normalizedSettings);
        setOriginalSettings(normalizedSettings);

        // Charger les stats de partage
        try {
          const stats = await shareApi.getShareStats(activityId);
          setShareStats(stats);
        } catch {
          // Stats non disponibles, on continue
        }

        // Charger la previsualisation si demande
        if (showPreview) {
          await loadPreview();
        }
      } catch (err) {
        setError('Impossible de charger les parametres de partage');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [activityId, showPreview]);

  // Fonction pour charger la previsualisation
  const loadPreview = useCallback(async () => {
    if (!showPreview) return;
    
    try {
      setIsLoadingPreview(true);
      const imageUrl = await shareApi.getActivityShareImage(activityId, previewSize, true);
      setPreviewImage(imageUrl);
    } catch (err) {
      setError('Impossible de generer la previsualisation');
    } finally {
      setIsLoadingPreview(false);
    }
  }, [activityId, previewSize, showPreview]);

  // Recharger la previsualisation quand la taille change
  useEffect(() => {
    if (showPreview && activityId) {
      loadPreview();
    }
    
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewSize, activityId, showPreview, loadPreview, previewImage]);

  // Detecter les changements
  useEffect(() => {
    if (!originalSettings) return;
    const changed =
      settings.share_to_friends !== originalSettings.share_to_friends ||
      JSON.stringify(settings.share_to_groups) !== JSON.stringify(originalSettings.share_to_groups) ||
      JSON.stringify(settings.shared_data_fields.sort()) !== JSON.stringify(originalSettings.shared_data_fields.sort());
    setHasChanges(changed);
  }, [settings, originalSettings]);

  const handleToggleFriends = () => {
    setSettings(prev => ({ ...prev, share_to_friends: !prev.share_to_friends }));
  };

  const handleToggleField = (fieldId: string) => {
    setSettings(prev => {
      const currentFields = prev.shared_data_fields;
      const newFields = currentFields.includes(fieldId)
        ? currentFields.filter(f => f !== fieldId)
        : [...currentFields, fieldId];
      return { ...prev, shared_data_fields: newFields };
    });
  };

  const handleGroupChange = (groupId: number, checked: boolean) => {
    setSettings(prev => {
      let newGroups = prev.share_to_groups;
      if (checked) {
        if (newGroups === null) newGroups = [groupId];
        else if (!newGroups.includes(groupId)) newGroups = [...newGroups, groupId];
      } else {
        if (newGroups) {
          newGroups = newGroups.filter(id => id !== groupId);
          if (newGroups.length === 0) newGroups = null;
        }
      }
      return { ...prev, share_to_groups: newGroups };
    });
  };

  const handleShareToAllGroups = (shareToAll: boolean) => {
    setSettings(prev => ({
      ...prev,
      share_to_groups: shareToAll ? [] : null,
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await activitiesApi.updateActivityShareSettings(activityId, {
        share_to_friends: settings.share_to_friends,
        share_to_groups: settings.share_to_groups,
        shared_data_fields: settings.shared_data_fields,
      });
      setOriginalSettings(settings);
      setHasChanges(false);
      onSave?.();
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  // Actions de partage
  const handleDownloadImage = async (size: ShareImageSize) => {
    try {
      await shareApi.downloadShareImage(activityId, size);
      await shareApi.logShareEvent(activityId, {
        share_type: 'image',
        platform: 'download',
      });
    } catch (err) {
      setError('Impossible de telecharger image');
    }
  };

  const handleShareLink = async () => {
    try {
      await shareApi.copyActivityLink(activityId);
      // Show success feedback
      const btn = document.getElementById('copy-link-btn');
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = 'Copie !';
        setTimeout(() => { btn.textContent = originalText; }, 2000);
      }
    } catch (err) {
      setError('Impossible de copier le lien');
    }
  };

  const handleShareSocial = async () => {
    if (!activityData) return;
    
    try {
      const success = await shareApi.shareActivity(
        activityId,
        activityData.name || 'Mon activite',
        {
          distance: activityData.distance,
          duration: activityData.moving_time || activityData.elapsed_time,
        }
      );
      
      if (!success) {
        // Native share not available or cancelled, fall back to modal
        await shareApi.openShareModal(
          activityId,
          activityData.name || 'Mon activite',
          {
            distance: activityData.distance,
            duration: activityData.moving_time || activityData.elapsed_time,
          },
          previewSize
        );
      }
    } catch (err) {
      setError('Impossible de partager activite');
    }
  };

  const handleOpenPreviewModal = async () => {
    if (!activityData) return;
    
    try {
      await shareApi.openShareModal(
        activityId,
        activityData.name || 'Mon activite',
        {
          distance: activityData.distance,
          duration: activityData.moving_time || activityData.elapsed_time,
        },
        previewSize
      );
    } catch (err) {
      setError('Impossible ouvrir previsualisation');
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-background rounded w-1/3"></div>
          <div className="h-10 bg-background rounded"></div>
          <div className="h-4 bg-background rounded w-1/2"></div>
          <div className="grid grid-cols-2 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-background rounded"></div>
            ))}
          </div>
          {showPreview && (
            <div className="h-48 bg-background rounded"></div>
          )}
        </div>
      </Card>
    );
  }

  const shareToAllGroups = settings.share_to_groups !== null && settings.share_to_groups.length === 0;
  const shareToSpecificGroups = settings.share_to_groups !== null && settings.share_to_groups.length > 0;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Parametres de partage</h3>

      {error && (
        <div className="mb-4 p-3 bg-danger/5 border border-danger/20 rounded-md text-danger text-sm">
          {error}
        </div>
      )}

      {/* Statistiques de partage */}
      {shareStats && shareStats.total_shares > 0 && (
        <div className="mb-6 p-4 bg-surface rounded-lg border border-border">
          <h4 className="font-medium mb-2">Statistiques de partage</h4>
          <p className="text-sm text-muted">
            Total: <span className="font-semibold text-primary">{shareStats.total_shares}</span> partages
            {shareStats.shares_by_type && shareStats.shares_by_type.length > 0 && (
              <>
                {' - '}
                {shareStats.shares_by_type.map((s) => (
                  <span key={`${s.share_type}-${s.platform}`} className="mr-2">
                    {s.count} {s.share_type}
                    {s.platform && ` (${s.platform})`}
                  </span>
                ))}
              </>
            )}
          </p>
        </div>
      )}

      {/* Previsualisation de l'image de partage */}
      {showPreview && (
        <div className="mb-6">
          <h4 className="font-medium mb-3">Previsualisation de l'image de partage</h4>
          
          {/* Selecteur de taille */}
          <div className="mb-3 flex gap-2">
            {IMAGE_SIZES.map((s) => (
              <Button
                key={s.id}
                variant={previewSize === s.id ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setPreviewSize(s.id)}
              >
                {s.label}
              </Button>
            ))}
          </div>

          {/* Image de previsualisation */}
          <div className="border rounded-lg p-2 bg-surface">
            {isLoadingPreview ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : previewImage ? (
              <div className="relative">
                <img 
                  src={previewImage} 
                  alt="Previsualisation du partage"
                  className="w-full max-w-md mx-auto rounded-md"
                />
                <div className="flex gap-2 mt-3 justify-center">
                  <Button
                    size="sm"
                    onClick={() => handleDownloadImage(previewSize)}
                  >
                    Telecharger
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenPreviewModal}
                  >
                    Partager
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted">
                <p>Previsualisation non disponible</p>
                <Button size="sm" onClick={() => loadPreview()} className="mt-2">
                  Charger previsualisation
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions de partage rapides */}
      <div className="mb-6 p-4 bg-surface rounded-lg border border-border">
        <h4 className="font-medium mb-3">Actions rapides</h4>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleShareLink}
            id="copy-link-btn"
          >
            Copy Link
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleShareSocial}
          >
            Share
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownloadImage(previewSize)}
          >
            Download Image
          </Button>
        </div>
      </div>

      {/* Partage avec les amis */}
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.share_to_friends}
            onChange={handleToggleFriends}
            className="w-5 h-5 rounded border-border text-primary focus:ring-primary/50"
          />
          <div>
            <span className="font-medium">Partager avec mes amis</span>
            <p className="text-sm text-muted">
              Visible dans le fil actualite de vos amis
            </p>
          </div>
        </label>
      </div>

      {/* Partage avec les groupes */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Partage avec les groupes</h4>

        <div className="space-y-2 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="groupShare"
              checked={settings.share_to_groups === null}
              onChange={() => setSettings(prev => ({ ...prev, share_to_groups: null }))}
              className="w-4 h-4"
            />
            <span className="text-sm">Ne pas partager avec les groupes</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="groupShare"
              checked={shareToAllGroups}
              onChange={() => handleShareToAllGroups(true)}
              className="w-4 h-4"
            />
            <span className="text-sm">Partager avec tous mes groupes</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="groupShare"
              checked={shareToSpecificGroups}
              onChange={() => setSettings(prev => ({ ...prev, share_to_groups: [] }))}
              className="w-4 h-4"
            />
            <span className="text-sm">Selectionner des groupes specifiques</span>
          </label>
        </div>

        {shareToSpecificGroups && (
          <div className="ml-6 mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
            {groupsLoading ? (
              <div className="text-sm text-muted">Chargement...</div>
            ) : groups.length === 0 ? (
              <div className="text-sm text-muted">Vous nest membre daucun groupe</div>
            ) : (
              groups.map((group: Group) => (
                <label key={group.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.share_to_groups?.includes(group.id) || false}
                    onChange={(e) => handleGroupChange(group.id, e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">{group.name}</span>
                </label>
              ))
            )}
          </div>
        )}
      </div>

      {/* Champs partages */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Donnees visibles par les autres</h4>
        <p className="text-sm text-muted mb-3">
          Selectionnez les informations que vos amis pourront voir
        </p>

        <div className="grid grid-cols-2 gap-2">
          {ALLOWED_FIELDS.map(field => (
            <label
              key={field.id}
              className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                settings.shared_data_fields.includes(field.id)
                  ? 'bg-primary/5 border-primary/20'
                  : 'bg-surface border-border'
              }`}
            >
              <input
                type="checkbox"
                checked={settings.shared_data_fields.includes(field.id)}
                onChange={() => handleToggleField(field.id)}
                className="w-4 h-4 rounded"
              />
              <span className="text-lg">{field.icon}</span>
              <span className="text-sm">{field.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Bouton sauvegarder */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          variant={hasChanges ? 'primary' : 'secondary'}
        >
          {isSaving ? 'Sauvegarde...' : hasChanges ? 'Sauvegarder' : 'A jour'}
        </Button>
      </div>
    </Card>
  );
}
