'use client';

import { useState, useEffect, useRef } from 'react';
import { MultiSelect, Loader, Text, Group, Avatar, Badge } from '@mantine/core';
import { UsersThree } from '@phosphor-icons/react/dist/ssr/UsersThree';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { Collaborateur } from '@/lib/types';
import { collaborateursService } from '@/lib/services/collaborateurs.service';

interface ParticipantSelectorProps {
  value: number[];
  onChange: (value: number[]) => void;
  maxCapacity?: number;
  error?: string;
  disabled?: boolean;
  label?: string;
  description?: string;
  placeholder?: string;
}

interface CollabOption {
  value: string;
  label: string;
  description?: string;
  email?: string;
  actif: boolean;
}

const toOption = (collab: Collaborateur): CollabOption => ({
  value: String(collab.id),
  label: collab.nomComplet,
  description: collab.departement
    ? typeof collab.departement === 'string'
      ? collab.departement
      : collab.departement.nomDepartement
    : undefined,
  email: collab.email || undefined,
  actif: collab.actif !== false, // Par défaut true si non défini
});

export function ParticipantSelector({
  value,
  onChange,
  maxCapacity,
  error,
  disabled = false,
  label = 'Participants',
  description,
  placeholder = 'Rechercher et sélectionner des collaborateurs...'
}: ParticipantSelectorProps) {
  const [defaultOptions, setDefaultOptions] = useState<CollabOption[]>([]);
  const [searchResults, setSearchResults] = useState<CollabOption[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  // Conserve les libellés des collaborateurs sélectionnés pour qu'ils restent
  // des options valides même lorsqu'ils n'apparaissent plus dans la recherche courante
  const selectedOptionsRef = useRef<Map<string, CollabOption>>(new Map());

  // Chargement initial : une petite liste par défaut (50) au lieu de tous les collaborateurs
  useEffect(() => {
    const loadDefaults = async () => {
      try {
        setLoading(true);
        const data = await collaborateursService.getCollaborateurs({
          limit: 50,
          includeInactive: true, // Inclure les collaborateurs inactifs
        });
        setDefaultOptions((data.data || []).map(toOption));
      } catch (err) {
        console.error('Erreur lors du chargement des collaborateurs:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDefaults();
  }, []);

  // Recherche serveur avec debounce 300ms
  useEffect(() => {
    const q = searchValue.trim();
    if (q.length < 2) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const data = await collaborateursService.searchCollaborateurs(q, {
          includeInactive: true,
          limit: 50,
        });
        setSearchResults((Array.isArray(data) ? data : []).map(toOption));
      } catch (err) {
        console.error('Erreur lors de la recherche de collaborateurs:', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [searchValue]);

  // Options courantes : résultats de recherche si une recherche est active, sinon liste par défaut
  const currentOptions = searchResults ?? defaultOptions;

  // Mémoriser les libellés des sélectionnés visibles dans les options courantes
  const optionsById = new Map(currentOptions.map((o) => [o.value, o]));
  value.forEach((id) => {
    const key = String(id);
    const known = optionsById.get(key);
    if (known) {
      selectedOptionsRef.current.set(key, known);
    }
  });

  // Fusionner : options courantes + sélectionnés absents des résultats (pour garder leurs libellés)
  const selectData: CollabOption[] = [...currentOptions];
  value.forEach((id) => {
    const key = String(id);
    if (!optionsById.has(key)) {
      const remembered = selectedOptionsRef.current.get(key);
      selectData.push(
        remembered || { value: key, label: `Collaborateur #${key}`, actif: true }
      );
    }
  });

  const selectedCount = value.length;
  const isAtCapacity = maxCapacity ? selectedCount >= maxCapacity : false;

  const descriptionText = description ||
    (maxCapacity
      ? `Sélectionnez jusqu'à ${maxCapacity} participants`
      : 'Sélectionnez les collaborateurs à inscrire');

  return (
    <div>
      <MultiSelect
        label={
          <Group justify="space-between">
            <Text size="sm" fw={500}>
              {label}
            </Text>
            {selectedCount > 0 && (
              <Badge size="sm" variant="filled" color="blue">
                {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
                {maxCapacity ? ` / ${maxCapacity}` : ''}
              </Badge>
            )}
          </Group>
        }
        description={descriptionText}
        placeholder={loading ? 'Chargement...' : placeholder}
        data={selectData}
        value={value.map(String)}
        onChange={(values) => onChange(values.map(Number))}
        searchable
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        // Filtrage effectué côté serveur : ne pas re-filtrer côté client
        filter={({ options }) => options}
        clearable
        disabled={disabled || loading || isAtCapacity}
        error={error}
        leftSection={loading || searching ? <Loader size="xs" /> : <MagnifyingGlass size={16} />}
        maxDropdownHeight={300}
        limit={50}
        nothingFoundMessage={
          searchValue
            ? 'Aucun collaborateur trouvé'
            : 'Aucun collaborateur disponible'
        }
        renderOption={({ option }) => (
          <Group gap="sm" wrap="nowrap">
            <Avatar size="sm" radius="xl" color={(option as any).actif ? 'blue' : 'gray'}>
              {option.label?.charAt(0)}
            </Avatar>
            <div style={{ flex: 1 }}>
              <Group gap="xs">
                <Text size="sm">{option.label}</Text>
                {!(option as any).actif && (
                  <Badge size="xs" color="gray" variant="light">
                    Inactif
                  </Badge>
                )}
              </Group>
              {(option as any).description && (
                <Text size="xs" c="dimmed">
                  {(option as any).description}
                </Text>
              )}
            </div>
          </Group>
        )}
        styles={{
          pill: {
            maxWidth: '200px',
          },
        }}
      />

      {isAtCapacity && !disabled && (
        <Text size="xs" c="orange" mt={4}>
          Capacité maximale atteinte ({maxCapacity} participants)
        </Text>
      )}

      {selectedCount > 0 && !isAtCapacity && maxCapacity && (
        <Text size="xs" c="dimmed" mt={4}>
          {maxCapacity - selectedCount} place{maxCapacity - selectedCount > 1 ? 's' : ''} restante{maxCapacity - selectedCount > 1 ? 's' : ''}
        </Text>
      )}
    </div>
  );
}
