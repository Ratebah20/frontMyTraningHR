'use client';

import { useState } from 'react';
import {
  Card,
  Group,
  Badge,
  Text,
  Stack,
  SegmentedControl,
  TextInput,
  Accordion,
  Alert,
} from '@mantine/core';
import { IconAlertTriangle, IconUser, IconUserPlus } from '@tabler/icons-react';
import type {
  CollaborateurProbleme,
  ResolutionCollaborateur,
  ActionResolutionCollaborateur,
} from '@/lib/types/import-preview.types';

interface Props {
  problemes: CollaborateurProbleme[];
  onResolutionsChange: (resolutions: Map<string, ResolutionCollaborateur>) => void;
}

export function CollaborateurConflictList({ problemes, onResolutionsChange }: Props) {
  // Filtrage défensif : ne garder que les NON_TROUVE (les INACTIF sont gérés ailleurs)
  const problemesNonTrouves = problemes.filter(p => p.type === 'NON_TROUVE');

  const [resolutions, setResolutions] = useState<Map<string, ResolutionCollaborateur>>(new Map());
  const [createData, setCreateData] = useState<Map<string, { nom: string; prenom: string }>>(new Map());

  const handleActionChange = (idExterne: string, action: ActionResolutionCollaborateur) => {
    const newResolutions = new Map(resolutions);
    const existingData = createData.get(idExterne) || { nom: '', prenom: '' };

    newResolutions.set(idExterne, {
      idExterne,
      action,
      ...(action === 'CREER' ? existingData : {}),
    });

    setResolutions(newResolutions);
    onResolutionsChange(newResolutions);
  };

  const handleCreateDataChange = (idExterne: string, field: 'nom' | 'prenom', value: string) => {
    const newCreateData = new Map(createData);
    const existing = newCreateData.get(idExterne) || { nom: '', prenom: '' };
    existing[field] = value;
    newCreateData.set(idExterne, existing);
    setCreateData(newCreateData);

    // Mettre a jour la resolution si l'action est CREER
    const currentResolution = resolutions.get(idExterne);
    if (currentResolution?.action === 'CREER') {
      const newResolutions = new Map(resolutions);
      newResolutions.set(idExterne, {
        ...currentResolution,
        nom: existing.nom,
        prenom: existing.prenom,
      });
      setResolutions(newResolutions);
      onResolutionsChange(newResolutions);
    }
  };

  // Options pour les collaborateurs non trouvés : Ignorer ou Créer
  const getActionOptions = () => {
    return [
      { label: 'Ignorer', value: 'IGNORER' },
      { label: 'Creer', value: 'CREER' },
    ];
  };

  const sessionsIgnoreesTotal = problemesNonTrouves.reduce(
    (sum, p) => {
      const resolution = resolutions.get(p.idExterne);
      if (!resolution || resolution.action === 'IGNORER') {
        return sum + p.nombreSessionsAffectees;
      }
      return sum;
    },
    0
  );

  // Ne rien afficher si pas de NON_TROUVE
  if (problemesNonTrouves.length === 0) {
    return null;
  }

  return (
    <Stack gap="md">
      <Alert
        color="orange"
        icon={<IconAlertTriangle size={20} />}
        title={`${problemesNonTrouves.length} collaborateur(s) non trouve(s)`}
      >
        <Text size="sm">
          Ces collaborateurs n'existent pas dans le systeme.
          Choisissez une action pour chacun (creer ou ignorer).
        </Text>
        {sessionsIgnoreesTotal > 0 && (
          <Text size="sm" fw={500} mt="xs" c="orange">
            {sessionsIgnoreesTotal} session(s) seront ignorees si non resolues.
          </Text>
        )}
      </Alert>

      <Accordion variant="separated">
        {problemesNonTrouves.map((prob) => {
          const currentAction = resolutions.get(prob.idExterne)?.action || 'IGNORER';
          const isResolved = currentAction !== 'IGNORER';

          return (
            <Accordion.Item
              key={prob.idExterne}
              value={prob.idExterne}
              style={{
                borderColor: isResolved ? 'var(--mantine-color-green-5)' : 'var(--mantine-color-orange-5)',
                borderWidth: 2,
              }}
            >
              <Accordion.Control>
                <Group justify="space-between" wrap="nowrap" style={{ flex: 1 }}>
                  <Group gap="xs" wrap="nowrap">
                    <IconUser size={18} color="var(--mantine-color-red-6)" />
                    <Badge color="red" size="sm" variant="light">
                      Non trouve
                    </Badge>
                    <Text fw={500} size="sm" truncate>
                      {prob.idExterne}
                    </Text>
                  </Group>
                  <Group gap="xs" wrap="nowrap">
                    <Badge size="sm" variant="outline" color="gray">
                      {prob.nombreSessionsAffectees} session(s)
                    </Badge>
                    {isResolved && (
                      <Badge size="sm" color="green" variant="filled">
                        Creer
                      </Badge>
                    )}
                  </Group>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="md">
                  <Group gap="xs">
                    <Text size="xs" c="dimmed">ID:</Text>
                    <Text size="xs" ff="monospace">{prob.idExterne}</Text>
                  </Group>

                  {prob.lignesExemples.length > 0 && (
                    <Group gap="xs">
                      <Text size="xs" c="dimmed">Lignes:</Text>
                      <Text size="xs">
                        {prob.lignesExemples.join(', ')}
                        {prob.lignesExemples.length < prob.nombreSessionsAffectees && '...'}
                      </Text>
                    </Group>
                  )}

                  <div>
                    <Text size="sm" fw={500} mb="xs">Action:</Text>
                    <SegmentedControl
                      value={currentAction}
                      onChange={(value) => handleActionChange(prob.idExterne, value as ActionResolutionCollaborateur)}
                      data={getActionOptions()}
                      fullWidth
                      color={currentAction === 'IGNORER' ? 'gray' : 'green'}
                    />
                  </div>

                  {currentAction === 'CREER' && (
                    <Card withBorder p="sm">
                      <Text size="sm" fw={500} mb="sm">
                        <IconUserPlus size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        Informations pour la creation
                      </Text>
                      <Group grow>
                        <TextInput
                          label="Nom"
                          placeholder="Nom de famille"
                          size="sm"
                          value={createData.get(prob.idExterne)?.nom || ''}
                          onChange={(e) => handleCreateDataChange(prob.idExterne, 'nom', e.target.value)}
                        />
                        <TextInput
                          label="Prenom"
                          placeholder="Prenom"
                          size="sm"
                          value={createData.get(prob.idExterne)?.prenom || ''}
                          onChange={(e) => handleCreateDataChange(prob.idExterne, 'prenom', e.target.value)}
                        />
                      </Group>
                      <Text size="xs" c="dimmed" mt="xs">
                        Les autres informations seront completees lors du prochain import RH.
                      </Text>
                    </Card>
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
    </Stack>
  );
}

export default CollaborateurConflictList;
