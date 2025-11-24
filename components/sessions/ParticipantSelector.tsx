'use client';

import { useState, useEffect } from 'react';
import { MultiSelect, Loader, Text, Group, Avatar, Badge } from '@mantine/core';
import { UsersThree, MagnifyingGlass } from '@phosphor-icons/react';
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
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    loadCollaborateurs();
  }, []);

  const loadCollaborateurs = async () => {
    try {
      setLoading(true);
      const data = await collaborateursService.getCollaborateurs({
        limit: 1000, // Charger tous les collaborateurs (actifs et inactifs)
        includeInactive: true, // Inclure les collaborateurs inactifs
      });
      setCollaborateurs(data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des collaborateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectData = collaborateurs.map((collab) => ({
    value: String(collab.id),
    label: collab.nomComplet,
    description: collab.departement
      ? typeof collab.departement === 'string'
        ? collab.departement
        : collab.departement.nomDepartement
      : undefined,
    email: collab.email || undefined,
    actif: collab.actif !== false, // Par défaut true si non défini
  }));

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
        clearable
        disabled={disabled || loading || isAtCapacity}
        error={error}
        leftSection={loading ? <Loader size="xs" /> : <MagnifyingGlass size={16} />}
        maxDropdownHeight={300}
        limit={1000}
        nothingFoundMessage={
          searchValue
            ? 'Aucun collaborateur trouvé'
            : 'Aucun collaborateur disponible'
        }
        renderOption={({ option }) => (
          <Group gap="sm" wrap="nowrap">
            <Avatar size="sm" radius="xl" color={option.actif ? 'blue' : 'gray'}>
              {option.label?.charAt(0)}
            </Avatar>
            <div style={{ flex: 1 }}>
              <Group gap="xs">
                <Text size="sm">{option.label}</Text>
                {!option.actif && (
                  <Badge size="xs" color="gray" variant="light">
                    Inactif
                  </Badge>
                )}
              </Group>
              {option.description && (
                <Text size="xs" c="dimmed">
                  {option.description}
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
