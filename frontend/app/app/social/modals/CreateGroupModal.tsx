'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { api } from '@/lib/api';
import { X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { SOCIAL_ERRORS } from '@/constants/social';

interface CreateGroupModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateGroupModal({ onClose, onCreated }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name) return;
    setIsCreating(true);
    try {
      await api.createGroup({ name, description, isPrivate });
      toast.success('Groupe créé');
      onCreated();
      onClose();
    } catch {
      toast.error(SOCIAL_ERRORS.CREATE_GROUP);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ModalSheet open onClose={onClose} maxWidth="md" withBorder>
      <div role="dialog" aria-modal="true" aria-labelledby="create-group-title">
        <div className="px-5 pt-5 pb-3 border-b border-border flex items-center justify-between">
          <div>
            <h3 id="create-group-title" className="text-lg sm:text-xl font-bold">
              Créer un groupe
            </h3>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              Invitez vos amis à s&apos;entraîner ensemble
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="p-2 rounded-xl hover:bg-border transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <Input
            label="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mon groupe d'entraînement"
            aria-required="true"
          />
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wide mb-1 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du groupe..."
              rows={3}
              aria-label="Description du groupe"
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:border-primary outline-none resize-none"
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
            <div>
              <p className="font-medium text-sm">Groupe privé</p>
              <p className="text-xs text-muted">Code d&apos;invitation requis</p>
            </div>
            <button
              onClick={() => setIsPrivate(!isPrivate)}
              aria-label={isPrivate ? 'Passer en groupe public' : 'Passer en groupe privé'}
              className={`w-11 h-6 rounded-full transition-all relative ${
                isPrivate ? 'bg-primary' : 'bg-border'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                  isPrivate ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-border flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1 rounded-xl"
            aria-label="Annuler la création"
          >
            Annuler
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name || isCreating}
            className="flex-1 rounded-xl"
            leftIcon={<Sparkles className="w-4 h-4" />}
            aria-label="Créer le groupe"
          >
            {isCreating ? 'Création...' : 'Créer'}
          </Button>
        </div>
      </div>
    </ModalSheet>
  );
}
