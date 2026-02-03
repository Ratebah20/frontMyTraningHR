'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Badge,
  Select,
  Switch,
  Alert,
  Tooltip,
  ScrollArea,
} from '@mantine/core';
import { Warning, Tag, Info } from '@phosphor-icons/react';
import {
  ActionResolutionCategorie,
  type CategorieNonMappee,
  type ResolutionCategorie,
} from '@/lib/types/import-preview.types';

interface CategorieConflictListProps {
  categories: CategorieNonMappee[];
  categoriesCibles: string[];
  onResolutionsChange: (resolutions: Map<string, ResolutionCategorie>) => void;
}

interface CategorieResolutionState {
  action: ActionResolutionCategorie;
  categorieCibleNom: string | null;
  memoriser: boolean;
}

export function CategorieConflictList({
  categories,
  categoriesCibles,
  onResolutionsChange,
}: CategorieConflictListProps) {
  const [resolutionStates, setResolutionStates] = useState<
    Map<string, CategorieResolutionState>
  >(new Map());

  // Initialiser les etats avec MAPPER par defaut si des categories cibles sont disponibles
  useEffect(() => {
    const initialStates = new Map<string, CategorieResolutionState>();
    categories.forEach((cat) => {
      initialStates.set(cat.categorieOL, {
        action: ActionResolutionCategorie.MAPPER,
        categorieCibleNom: null,
        memoriser: true,
      });
    });
    setResolutionStates(initialStates);
  }, [categories]);

  // Mettre a jour les resolutions quand les etats changent
  useEffect(() => {
    const resolutions = new Map<string, ResolutionCategorie>();
    resolutionStates.forEach((state, categorieOL) => {
      if (state.action !== ActionResolutionCategorie.IGNORER || state.categorieCibleNom) {
        resolutions.set(categorieOL, {
          categorieOL,
          action: state.action,
          categorieCibleNom: state.categorieCibleNom || undefined,
          memoriser: state.memoriser,
        });
      }
    });
    onResolutionsChange(resolutions);
  }, [resolutionStates, onResolutionsChange]);

  const handleActionChange = (categorieOL: string, action: ActionResolutionCategorie) => {
    setResolutionStates((prev) => {
      const newStates = new Map(prev);
      const current = newStates.get(categorieOL) || {
        action: ActionResolutionCategorie.MAPPER,
        categorieCibleNom: null,
        memoriser: true,
      };
      newStates.set(categorieOL, {
        ...current,
        action,
        // Reset la categorie cible si on change d'action
        categorieCibleNom:
          action === ActionResolutionCategorie.CREER ? categorieOL : null,
      });
      return newStates;
    });
  };

  const handleCategorieChange = (categorieOL: string, categorieCible: string | null) => {
    setResolutionStates((prev) => {
      const newStates = new Map(prev);
      const current = newStates.get(categorieOL) || {
        action: ActionResolutionCategorie.MAPPER,
        categorieCibleNom: null,
        memoriser: true,
      };
      newStates.set(categorieOL, { ...current, categorieCibleNom: categorieCible });
      return newStates;
    });
  };

  const handleMemoriserChange = (categorieOL: string, memoriser: boolean) => {
    setResolutionStates((prev) => {
      const newStates = new Map(prev);
      const current = newStates.get(categorieOL) || {
        action: ActionResolutionCategorie.MAPPER,
        categorieCibleNom: null,
        memoriser: true,
      };
      newStates.set(categorieOL, { ...current, memoriser });
      return newStates;
    });
  };

  const selectData = [
    { value: 'MAPPER', label: 'Mapper vers une categorie existante' },
    { value: 'CREER', label: 'Creer une nouvelle categorie' },
    { value: 'IGNORER', label: 'Ignorer (pas de categorie)' },
  ];

  const categoriesCiblesData = categoriesCibles.map((cat) => ({
    value: cat,
    label: cat,
  }));

  return (
    <Card withBorder p="md" radius="md">
      <Stack gap="md">
        <Group>
          <Tag size={20} color="#868E96" />
          <Text fw={600}>
            Categories OL non mappees ({categories.length})
          </Text>
        </Group>

        <Alert icon={<Info size={16} />} color="blue" variant="light">
          <Text size="sm">
            Les categories suivantes du fichier OLU ne correspondent pas a nos categories.
            Choisissez comment les mapper pour assigner une categorie aux nouvelles formations.
          </Text>
        </Alert>

        <ScrollArea h={Math.min(categories.length * 120, 400)}>
          <Stack gap="sm">
            {categories.map((cat) => {
              const state = resolutionStates.get(cat.categorieOL) || {
                action: ActionResolutionCategorie.MAPPER,
                categorieCibleNom: null,
                memoriser: true,
              };

              return (
                <Card key={cat.categorieOL} withBorder p="sm" radius="sm">
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Group gap="xs">
                        <Badge color="orange" variant="light" size="lg">
                          {cat.categorieOL}
                        </Badge>
                        <Tooltip label={cat.formationsExemples.join(', ')}>
                          <Text size="sm" c="dimmed">
                            ({cat.nombreFormationsAffectees} formation
                            {cat.nombreFormationsAffectees > 1 ? 's' : ''})
                          </Text>
                        </Tooltip>
                      </Group>
                      <Switch
                        label="Memoriser"
                        size="xs"
                        checked={state.memoriser}
                        onChange={(e) =>
                          handleMemoriserChange(cat.categorieOL, e.currentTarget.checked)
                        }
                      />
                    </Group>

                    <Group grow gap="sm">
                      <Select
                        size="xs"
                        label="Action"
                        data={selectData}
                        value={state.action}
                        onChange={(value) =>
                          handleActionChange(
                            cat.categorieOL,
                            value as ActionResolutionCategorie,
                          )
                        }
                      />

                      {state.action === ActionResolutionCategorie.MAPPER && (
                        <Select
                          size="xs"
                          label="Categorie cible"
                          placeholder="Choisir..."
                          data={categoriesCiblesData}
                          value={state.categorieCibleNom}
                          onChange={(value) =>
                            handleCategorieChange(cat.categorieOL, value)
                          }
                          searchable
                          required
                        />
                      )}

                      {state.action === ActionResolutionCategorie.CREER && (
                        <Text size="xs" c="dimmed" style={{ alignSelf: 'flex-end' }}>
                          Nouvelle categorie : "{cat.categorieOL}"
                        </Text>
                      )}
                    </Group>
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        </ScrollArea>

        {categories.length > 0 && (
          <Text size="xs" c="dimmed" ta="center">
            Les choix memorises seront appliques automatiquement lors des prochains imports
          </Text>
        )}
      </Stack>
    </Card>
  );
}
