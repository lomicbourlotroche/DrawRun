'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button, Avatar, Skeleton, GlassCard } from '@/components/ui';
import { api } from '@/lib/api';
import type { Group } from '@/types';
import CreateGroupModal from '../modals/CreateGroupModal';
import JoinGroupModal from '../modals/JoinGroupModal';
import { Users2, Search, Copy, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';

export default function GroupsTab() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [preJoinCode, setPreJoinCode] = useState('');

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const [myGroups, pubGroups] = await Promise.all([
        api.getGroups(),
        api.getPublicGroups(),
      ]);
      setGroups(myGroups || []);
      setPublicGroups(pubGroups || []);
    } catch {
      /* silent */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const handleLeave = async (groupId: number) => {
    try {
      await api.leaveGroup(groupId);
      toast.success('Quitté');
      loadGroups();
    } catch {
      toast.error('Erreur');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copié');
  };

  const handleSearch = async () => {
    try {
      const results = await api.getPublicGroups(searchQuery);
      setPublicGroups(results || []);
    } catch {
      /* silent */
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 md:space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
    );
  }

  const hasContent = groups.length > 0 || publicGroups.length > 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1 rounded-xl min-h-[44px]" onClick={() => { setPreJoinCode(''); setShowJoin(true); }}>
          <Users2 className="w-4 h-4 mr-2" />
          Rejoindre
        </Button>
        <Button className="flex-1 rounded-xl min-h-[44px]" onClick={() => setShowCreate(true)}>
          <Sparkles className="w-4 h-4 mr-2" />
          Créer
        </Button>
      </div>

      {/* My Groups */}
      {groups.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users2 className="w-4 h-4 text-primary" />
            Mes groupes
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {groups.map((group) => (
              <Link key={group.id} href={`/app/social/groups/${group.id}`} className="block">
                <GlassCard padding="md" hover>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center shrink-0">
                        <Users2 className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-base md:text-lg truncate">{group.name}</h4>
                        {group.description && (
                          <p className="text-xs md:text-sm text-muted mt-1 line-clamp-2">{group.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{group.member_count ?? 0} membres</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${group.is_private ? 'bg-peak/10 text-peak' : 'bg-success/10 text-success'}`}>
                            {group.is_private ? 'Privé' : 'Public'}
                          </span>
                          {group.role === 'admin' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Admin</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {group.invite_code && (
                        <Button size="sm" variant="ghost" className="rounded-xl min-h-[36px] min-w-[36px] p-0" onClick={(e) => { e.preventDefault(); copyCode(group.invite_code || ''); }}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                      {group.role !== 'admin' && (
                        <Button size="sm" variant="ghost" className="rounded-xl text-muted hover:text-danger min-h-[36px] min-w-[36px] p-0" onClick={(e) => { e.preventDefault(); handleLeave(group.id); }}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Discover Public Groups */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          Découvrir des groupes
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm min-h-[44px]"
          />
          <Button variant="secondary" size="sm" onClick={handleSearch} className="min-h-[44px]">Rechercher</Button>
        </div>
        {publicGroups.length > 0 ? (
          <div className="grid gap-2 md:grid-cols-2">
            {publicGroups.filter(g => !groups.find(mg => mg.id === g.id)).slice(0, 5).map((group) => (
              <GlassCard key={group.id} padding="sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                      <Users2 className="w-4 h-5 text-success" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-sm truncate">{group.name}</h4>
                      <p className="text-xs text-muted">{group.member_count ?? 0} membres</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => { setPreJoinCode(group.invite_code || ''); setShowJoin(true); }} className="rounded-xl shrink-0 min-h-[36px]">
                    Rejoindre
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted">Aucun groupe public trouvé</p>
          </div>
        )}
      </div>

      {/* Empty State */}
      {!hasContent && (
        <div className="text-center py-12 md:py-16">
          <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
            <Users2 className="w-8 h-8 md:w-12 md:h-12 text-primary/50" />
          </div>
          <p className="font-semibold text-base md:text-lg">Aucun groupe</p>
          <p className="text-sm text-muted mt-2">Créez ou rejoignez un groupe pour commencer</p>
        </div>
      )}

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={loadGroups} />}
      {showJoin && <JoinGroupModal initialCode={preJoinCode} onClose={() => setShowJoin(false)} onJoined={loadGroups} />}
    </div>
  );
}
