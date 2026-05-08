'use client';

/**
 * ============================================================
 * SHARE SETTINGS PANEL
 * ============================================================
 * Panneau de contrôle de partage pour les activités.
 * Permet à l'utilisateur de configurer :
 * - Partage avec les amis (feed social)
 * - Partage avec des groupes spécifiques
 * - Champs de données exposés (distance, temps, FC, carte, etc.)
 *
 * @module components/features/activities/ShareSettingsPanel
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { activitiesApi } from '@/lib/api';
import { useGroups } from '@/hooks/useGroups';
import type { Group } from '@/types';

interface ShareSettingsPanelProps {
  activityId: number;
  onSave?: () => void;
}

interface ShareSettings {
  share_to_friends: boolean;
  share_to_groups: number[] | null;
  shared_data_fields: string[];
}

const ALLOWED_FIELDS = [
  { id: 'distance', label: 'Distance', icon: '📏' },
  { id: 'time', label: 'Durée', icon: '⏱️' },
  { id: 'pace', label: 'Allure/Vitesse', icon: '🏃' },
  { id: 'elevation', label: 'Dénivelé', icon: '⛰️' },
  { id: 'map', label: 'Carte', icon: '🗺️' },
  { id: 'hr', label: 'Fréquence cardiaque', icon: '❤️' },
  { id: 'power', label: 'Puissance', icon: '⚡' },
  { id: 'cadence', label: 'Cadence', icon: '🔄' },
  { id: 'splits', label: 'Splits', icon: '📊' },
  { id: 'calories', label: 'Calories', icon: '🔥' },
];

export function ShareSettingsPanel({ activityId, onSave }: ShareSettingsPanelProps) {
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

  const { groups, isLoading: groupsLoading } = useGroups();

  // Charger les paramètres existants
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await activitiesApi.getActivityShareSettings(activityId);
        const normalizedSettings = {
          share_to_friends: data.share_to_friends,
          share_to_groups: data.share_to_groups,
          shared_data_fields: data.shared_data_fields || ['distance', 'time', 'pace', 'elevation', 'map'],
        };
        setSettings(normalizedSettings);
        setOriginalSettings(normalizedSettings);
      } catch (err) {
        setError('Impossible de charger les paramètres de partage');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [activityId]);

  // Détecter les changements
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

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-2 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const shareToAllGroups = settings.share_to_groups !== null && settings.share_to_groups.length === 0;
  const shareToSpecificGroups = settings.share_to_groups !== null && settings.share_to_groups.length > 0;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Paramètres de partage</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Partage avec les amis */}
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.share_to_friends}
            onChange={handleToggleFriends}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <span className="font-medium">Partager avec mes amis</span>
            <p className="text-sm text-gray-500">
              Visible dans le fil d&apos;actualité de vos amis
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
            <span className="text-sm">Sélectionner des groupes spécifiques</span>
          </label>
        </div>

        {shareToSpecificGroups && (
          <div className="ml-6 mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
            {groupsLoading ? (
              <div className="text-sm text-gray-500">Chargement...</div>
            ) : groups.length === 0 ? (
              <div className="text-sm text-gray-500">Vous n&apos;êtes membre d&apos;aucun groupe</div>
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

      {/* Champs partagés */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Données visibles par les autres</h4>
        <p className="text-sm text-gray-500 mb-3">
          Sélectionnez les informations que vos amis pourront voir
        </p>

        <div className="grid grid-cols-2 gap-2">
          {ALLOWED_FIELDS.map(field => (
            <label
              key={field.id}
              className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                settings.shared_data_fields.includes(field.id)
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200'
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
          {isSaving ? 'Sauvegarde...' : hasChanges ? 'Sauvegarder' : 'À jour'}
        </Button>
      </div>
    </Card>
  );
}
