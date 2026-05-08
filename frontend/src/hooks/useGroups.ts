'use client';

/**
 * ============================================================
 * USE GROUPS HOOK
 * ============================================================
 * Hook React pour récupérer la liste des groupes de l'utilisateur.
 *
 * @module hooks/useGroups
 */

import { useState, useEffect } from 'react';
import { socialApi } from '@/lib/api';
import type { Group } from '@/types';

interface UseGroupsReturn {
  groups: Group[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGroups(): UseGroupsReturn {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await socialApi.getGroups();
      setGroups(data || []);
    } catch (err) {
      setError('Impossible de charger les groupes');
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return {
    groups,
    isLoading,
    error,
    refetch: fetchGroups,
  };
}
