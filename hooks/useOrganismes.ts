import { useState, useEffect, useCallback } from 'react';
import { organismesService, CreateOrganismeDto, UpdateOrganismeDto } from '@/lib/services';
import { OrganismeFormation } from '@/lib/types';
import { useApi } from './useApi';

/**
 * Hook pour récupérer la liste des organismes
 */
export function useOrganismes(includeInactive = false) {
  const [organismes, setOrganismes] = useState<OrganismeFormation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrganismes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await organismesService.getOrganismes(includeInactive);
      setOrganismes(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    fetchOrganismes();
  }, [fetchOrganismes]);

  return {
    organismes,
    isLoading,
    error,
    refetch: fetchOrganismes,
  };
}

/**
 * Hook pour récupérer un organisme par ID
 */
export function useOrganisme(id: number) {
  return useApi(() => organismesService.getOrganisme(id), {
    autoFetch: true,
  });
}

/**
 * Hook pour créer un organisme
 */
export function useCreateOrganisme() {
  const {
    isLoading,
    error,
    execute,
    reset,
  } = useApi(organismesService.createOrganisme);

  const createOrganisme = useCallback(
    async (data: CreateOrganismeDto) => {
      return execute(data);
    },
    [execute]
  );

  return {
    createOrganisme,
    isLoading,
    error,
    reset,
  };
}

/**
 * Hook pour mettre à jour un organisme
 */
export function useUpdateOrganisme() {
  const {
    isLoading,
    error,
    execute,
    reset,
  } = useApi((id: number, data: UpdateOrganismeDto) =>
    organismesService.updateOrganisme(id, data)
  );

  const updateOrganisme = useCallback(
    async (id: number, data: UpdateOrganismeDto) => {
      return execute(id, data);
    },
    [execute]
  );

  return {
    updateOrganisme,
    isLoading,
    error,
    reset,
  };
}

/**
 * Hook pour supprimer (désactiver) un organisme
 */
export function useDeleteOrganisme() {
  const {
    isLoading,
    error,
    execute,
    reset,
  } = useApi(organismesService.deleteOrganisme);

  const deleteOrganisme = useCallback(
    async (id: number) => {
      return execute(id);
    },
    [execute]
  );

  return {
    deleteOrganisme,
    isLoading,
    error,
    reset,
  };
}

/**
 * Hook pour récupérer les statistiques des organismes
 */
export function useOrganismesStatistics() {
  return useApi(organismesService.getStatistics, {
    autoFetch: true,
  });
}
