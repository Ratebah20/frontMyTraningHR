'use client';

import { useState, useEffect } from 'react';
import {
  Stack,
  Card,
  Group,
  Text,
  Badge,
  Select,
  Radio,
  Checkbox,
  Collapse,
  Loader,
  Alert,
} from '@mantine/core';
import {
  CaretDown,
  CaretRight,
  Warning,
  MapPin,
  Trash,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import {
  TypeEntiteImport,
  ActionResolutionConflict,
} from '@/lib/types/import-preview.types';
import type {
  ConflictItem,
  ResolutionConflict,
  EntityOption,
} from '@/lib/types/import-preview.types';
import { importPreviewService } from '@/lib/services/import-preview.service';

interface ConflictResolutionListProps {
  conflicts: ConflictItem[];
  resolutions: Map<string, ResolutionConflict>;
  onResolutionChange: (conflict: ConflictItem, resolution: ResolutionConflict) => void;
}

export function ConflictResolutionList({
  conflicts,
  resolutions,
  onResolutionChange,
}: ConflictResolutionListProps) {
  return (
    <Stack gap="md">
      <Alert icon={<Warning size={16} />} color="orange" variant="light">
        <Text size="sm">
          Ces entites ont ete supprimees mais reapparaissent dans le fichier. Choisissez
          une action pour chaque conflit.
        </Text>
      </Alert>

      {conflicts.map((conflict) => (
        <ConflictResolutionItem
          key={`${conflict.typeEntite}:${conflict.valeurExcel}`}
          conflict={conflict}
          resolution={resolutions.get(`${conflict.typeEntite}:${conflict.valeurExcel}`)}
          onResolutionChange={onResolutionChange}
        />
      ))}
    </Stack>
  );
}

interface ConflictResolutionItemProps {
  conflict: ConflictItem;
  resolution?: ResolutionConflict;
  onResolutionChange: (conflict: ConflictItem, resolution: ResolutionConflict) => void;
}

function ConflictResolutionItem({
  conflict,
  resolution,
  onResolutionChange,
}: ConflictResolutionItemProps) {
  const [expanded, setExpanded] = useState(true);
  const [selectedAction, setSelectedAction] = useState<ActionResolutionConflict | null>(
    resolution?.action || null,
  );
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(
    resolution?.entiteCibleId?.toString() || null,
  );
  const [memoriser, setMemoriser] = useState(resolution?.memoriser ?? true);
  const [availableEntities, setAvailableEntities] = useState<EntityOption[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);

  // Charger les entites disponibles quand on selectionne MAPPER
  useEffect(() => {
    if (selectedAction === ActionResolutionConflict.MAPPER && availableEntities.length === 0) {
      loadEntities();
    }
  }, [selectedAction]);

  const loadEntities = async () => {
    setLoadingEntities(true);
    try {
      const entities = await importPreviewService.getAvailableEntities(
        conflict.typeEntite,
      );
      setAvailableEntities(entities);
    } catch (error) {
      console.error('Erreur chargement entites:', error);
    } finally {
      setLoadingEntities(false);
    }
  };

  const handleActionChange = (action: string) => {
    const actionEnum = action as ActionResolutionConflict;
    setSelectedAction(actionEnum);

    // Si pas MAPPER, on peut deja envoyer la resolution
    if (actionEnum !== ActionResolutionConflict.MAPPER) {
      const newResolution: ResolutionConflict = {
        typeEntite: conflict.typeEntite,
        valeurExcel: conflict.valeurExcel,
        action: actionEnum,
        memoriser,
      };
      onResolutionChange(conflict, newResolution);
    } else if (selectedEntityId) {
      // Si MAPPER et entite deja selectionnee
      const newResolution: ResolutionConflict = {
        typeEntite: conflict.typeEntite,
        valeurExcel: conflict.valeurExcel,
        action: actionEnum,
        entiteCibleId: parseInt(selectedEntityId),
        memoriser,
      };
      onResolutionChange(conflict, newResolution);
    }
  };

  const handleEntityChange = (entityId: string | null) => {
    setSelectedEntityId(entityId);
    if (selectedAction === ActionResolutionConflict.MAPPER && entityId) {
      const newResolution: ResolutionConflict = {
        typeEntite: conflict.typeEntite,
        valeurExcel: conflict.valeurExcel,
        action: ActionResolutionConflict.MAPPER,
        entiteCibleId: parseInt(entityId),
        memoriser,
      };
      onResolutionChange(conflict, newResolution);
    }
  };

  const handleMemoriserChange = (value: boolean) => {
    setMemoriser(value);
    if (resolution) {
      onResolutionChange(conflict, { ...resolution, memoriser: value });
    }
  };

  const getTypeLabel = (type: TypeEntiteImport) => {
    switch (type) {
      case TypeEntiteImport.DEPARTEMENT:
        return 'Departement';
      case TypeEntiteImport.ORGANISME:
        return 'Organisme';
      case TypeEntiteImport.CATEGORIE:
        return 'Categorie';
      default:
        return type;
    }
  };

  const isResolved =
    resolution &&
    (resolution.action === ActionResolutionConflict.IGNORER ||
      resolution.action === ActionResolutionConflict.RECREER ||
      (resolution.action === ActionResolutionConflict.MAPPER && resolution.entiteCibleId));

  return (
    <Card
      withBorder
      p="md"
      style={{
        borderColor: isResolved ? '#40C057' : '#FCC419',
        borderWidth: 2,
      }}
    >
      <Stack gap="sm">
        {/* En-tete du conflit */}
        <Group
          justify="space-between"
          onClick={() => setExpanded(!expanded)}
          style={{ cursor: 'pointer' }}
        >
          <Group>
            {expanded ? <CaretDown size={16} /> : <CaretRight size={16} />}
            <Badge color="orange" variant="light">
              {getTypeLabel(conflict.typeEntite)}
            </Badge>
            <Text fw={600}>{conflict.valeurExcel}</Text>
            {conflict.nombreOccurrences && (
              <Text size="sm" c="dimmed">
                ({conflict.nombreOccurrences} occurrences)
              </Text>
            )}
          </Group>
          {isResolved && (
            <Badge color="green" variant="filled">
              Resolu
            </Badge>
          )}
        </Group>

        {/* Details et options de resolution */}
        <Collapse in={expanded}>
          <Stack gap="md" mt="sm" pl="lg">
            <Text size="sm" c="dimmed">
              Cette entite a ete supprimee (actif = false) mais reapparait dans le fichier
              Excel.
              {conflict.entiteExistanteNom && (
                <>
                  {' '}
                  Ancienne valeur:{' '}
                  <Text span fw={500}>
                    {conflict.entiteExistanteNom}
                  </Text>
                </>
              )}
            </Text>

            {/* Options de resolution */}
            <Radio.Group
              value={selectedAction || ''}
              onChange={handleActionChange}
            >
              <Stack gap="xs">
                <Radio
                  value={ActionResolutionConflict.RECREER}
                  label={
                    <Group gap="xs">
                      <ArrowsClockwise size={16} />
                      <Text size="sm">Reactiver l&apos;entite existante</Text>
                    </Group>
                  }
                  description="Remet l'entite active (actif = true)"
                />

                <Radio
                  value={ActionResolutionConflict.MAPPER}
                  label={
                    <Group gap="xs">
                      <MapPin size={16} />
                      <Text size="sm">Mapper vers une autre entite</Text>
                    </Group>
                  }
                  description="Utiliser une entite existante a la place"
                />

                <Radio
                  value={ActionResolutionConflict.IGNORER}
                  label={
                    <Group gap="xs">
                      <Trash size={16} />
                      <Text size="sm">Ignorer</Text>
                    </Group>
                  }
                  description="Ne pas importer les lignes concernees"
                />
              </Stack>
            </Radio.Group>

            {/* Selection de l'entite cible pour MAPPER */}
            {selectedAction === ActionResolutionConflict.MAPPER && (
              <Select
                label="Entite cible"
                placeholder="Selectionnez l'entite de remplacement"
                data={availableEntities.map((e) => ({
                  value: e.id.toString(),
                  label: e.nom,
                }))}
                value={selectedEntityId}
                onChange={handleEntityChange}
                searchable
                clearable
                disabled={loadingEntities}
                rightSection={loadingEntities ? <Loader size="xs" /> : null}
              />
            )}

            {/* Option de memorisation */}
            {selectedAction && (
              <Checkbox
                label="Memoriser cette decision pour les prochains imports"
                checked={memoriser}
                onChange={(e) => handleMemoriserChange(e.currentTarget.checked)}
              />
            )}
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  );
}
