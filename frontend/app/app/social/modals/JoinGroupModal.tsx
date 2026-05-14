'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { api } from '@/lib/api';
import { X, Users2 } from 'lucide-react';
import { toast } from 'sonner';

interface JoinGroupModalProps {
  initialCode?: string;
  onClose: () => void;
  onJoined: () => void;
}

export default function JoinGroupModal({ initialCode = '', onClose, onJoined }: JoinGroupModalProps) {
  const [inviteCode, setInviteCode] = useState(initialCode);

  const handleJoin = async () => {
    if (!inviteCode) return;
    try {
      await api.joinGroup(inviteCode);
      toast.success('Rejoint');
      onJoined();
      onClose();
    } catch {
      toast.error('Erreur');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
      <div className="bg-card rounded-t-2xl sm:rounded-2xl w-full max-w-md border border-border shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-bold">Rejoindre un groupe</h3>
            <p className="text-xs sm:text-sm text-muted mt-0.5">Entrez le code d&apos;invitation partagé par l&apos;admin</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-border transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <Input
            label="Code d'invitation"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="XXXXXXXX"
          />
        </div>
        <div className="px-5 py-4 border-t border-border flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1 rounded-xl">Annuler</Button>
          <Button onClick={handleJoin} disabled={!inviteCode} className="flex-1 rounded-xl" leftIcon={<Users2 className="w-4 h-4" />}>Rejoindre</Button>
        </div>
      </div>
    </div>
  );
}
