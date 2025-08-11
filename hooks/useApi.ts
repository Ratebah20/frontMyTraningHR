import { useState, useEffect, useCallback } from 'react';
import { AxiosError } from 'axios';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  autoFetch?: boolean;
}

interface UseApiReturn<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

export function useApi<T = any>(
  apiCall: (...args: any[]) => Promise<T>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...args: any[]): Promise<T> => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await apiCall(...args);
        setData(result);
        
        if (options.onSuccess) {
          options.onSuccess(result);
        }
        
        return result;
      } catch (err) {
        const error = err as AxiosError;
        const errorMessage = error.response?.data?.message || error.message || 'Une erreur est survenue';
        const errorObj = new Error(errorMessage);
        
        setError(errorObj);
        
        if (options.onError) {
          options.onError(errorObj);
        }
        
        throw errorObj;
      } finally {
        setIsLoading(false);
      }
    },
    [apiCall, options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  // Auto-fetch si demandé
  useEffect(() => {
    if (options.autoFetch) {
      execute();
    }
  }, []);

  return {
    data,
    error,
    isLoading,
    execute,
    reset,
  };
}

// Hook pour gérer la pagination
export function usePagination(initialPage: number = 1, initialLimit: number = 10) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrevious = page > 1;

  const nextPage = useCallback(() => {
    if (hasNext) {
      setPage(p => p + 1);
    }
  }, [hasNext]);

  const previousPage = useCallback(() => {
    if (hasPrevious) {
      setPage(p => p - 1);
    }
  }, [hasPrevious]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  }, []);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrevious,
    setTotal,
    nextPage,
    previousPage,
    goToPage,
    changeLimit,
  };
}

// Hook pour gérer les filtres
export function useFilters<T extends Record<string, any>>(initialFilters: T) {
  const [filters, setFilters] = useState<T>(initialFilters);

  const updateFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<T>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const clearFilter = useCallback(<K extends keyof T>(key: K) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    clearFilter,
  };
}

// Hook pour gérer le débounce
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}