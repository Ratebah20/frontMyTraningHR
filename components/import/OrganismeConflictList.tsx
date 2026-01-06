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
import { IconAlertTriangle, IconBuilding, IconPlus } from '@tabler/icons-react';
import type {
  OrganismeNonTrouve,
  ResolutionOrganisme,
  ActionResolutionOrganisme,
} from '@/lib/types/import-preview.types';

interface Props {
  organismes: OrganismeNonTrouve[];
  onResolutionsChange: (resolutions: Map<string, ResolutionOrganisme>) => void;
}

export function OrganismeConflictList({ organismes, onResolutionsChange }: Props) {
  const [resolutions, setResolutions] = useState<Map<string, ResolutionOrganisme>>(new Map());
  const [customNames, setCustomNames] = useState<Map<string, string>>(new Map());

  const handleActionChange = (emailFormateur: string, action: ActionResolutionOrganisme) => {
    const newResolutions = new Map(resolutions);
    const customName = customNames.get(emailFormateur);

    newResolutions.set(emailFormateur, {
      emailFormateur,
      action,
      ...(action === 'CREER' && customName ? { nomOrganisme: customName } : {}),
    });

    setResolutions(newResolutions);
    onResolutionsChange(newResolutions);
  };

  const handleCustomNameChange = (emailFormateur: string, value: string) => {
    const newCustomNames = new Map(customNames);
    newCustomNames.set(emailFormateur, value);
    setCustomNames(newCustomNames);

    // Mettre a jour la resolution si l'action est CREER
    const currentResolution = resolutions.get(emailFormateur);
    if (currentResolution?.action === 'CREER') {
      const newResolutions = new Map(resolutions);
      newResolutions.set(emailFormateur, {
        ...currentResolution,
        nomOrganisme: value || undefined,
      });
      setResolutions(newResolutions);
      onResolutionsChange(newResolutions);
    }
  };

  const actionOptions = [
    { label: 'Ignorer', value: 'IGNORER' },
    { label: 'Creer', value: 'CREER' },
  ];

  const sessionsIgnoreesTotal = organismes.reduce(
    (sum, org) => {
      const resolution = resolutions.get(org.emailFormateur);
      if (!resolution || resolution.action === 'IGNORER') {
        return sum + org.nombreSessionsAffectees;
      }
      return sum;
    },
    0
  );

  if (organismes.length === 0) {
    return null;
  }

  return (
    <Stack gap="md">
      <Alert
        color="orange"
        icon={<IconAlertTriangle size={20} />}
        title={`${organismes.length} organisme(s) non trouve(s)`}
      >
        <Text size="sm">
          Ces organismes n'existent pas dans le systeme.
          Choisissez une action pour chacun (creer ou ignorer).
        </Text>
        {sessionsIgnoreesTotal > 0 && (
          <Text size="sm" fw={500} mt="xs" c="orange">
            {sessionsIgnoreesTotal} session(s) seront sans organisme si non resolues.
          </Text>
        )}
      </Alert>

      <Accordion variant="separated">
        {organismes.map((org) => {
          const currentAction = resolutions.get(org.emailFormateur)?.action || 'IGNORER';
          const isResolved = currentAction !== 'IGNORER';

          return (
            <Accordion.Item
              key={org.emailFormateur}
              value={org.emailFormateur}
              style={{
                borderColor: isResolved ? 'var(--mantine-color-green-5)' : 'var(--mantine-color-orange-5)',
                borderWidth: 2,
              }}
            >
              <Accordion.Control>
                <Group justify="space-between" wrap="nowrap" style={{ flex: 1 }}>
                  <Group gap="xs" wrap="nowrap">
                    <IconBuilding size={18} color="var(--mantine-color-orange-6)" />
                    <Badge color="orange" size="sm" variant="light">
                      Non trouve
                    </Badge>
                    <Text fw={500} size="sm" truncate>
                      {org.nomOrganisme}
                    </Text>
                  </Group>
                  <Group gap="xs" wrap="nowrap">
                    <Badge size="sm" variant="outline" color="gray">
                      {org.nombreSessionsAffectees} session(s)
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
                    <Text size="xs" c="dimmed">Email formateur:</Text>
                    <Text size="xs" ff="monospace">{org.emailFormateur}</Text>
                  </Group>

                  <Group gap="xs">
                    <Text size="xs" c="dimmed">Nom genere:</Text>
                    <Text size="xs">{org.nomOrganisme}</Text>
                  </Group>

                  {org.lignesExemples.length > 0 && (
                    <Group gap="xs">
                      <Text size="xs" c="dimmed">Lignes:</Text>
                      <Text size="xs">
                        {org.lignesExemples.join(', ')}
                        {org.lignesExemples.length < org.nombreSessionsAffectees && '...'}
                      </Text>
                    </Group>
                  )}

                  <div>
                    <Text size="sm" fw={500} mb="xs">Action:</Text>
                    <SegmentedControl
                      value={currentAction}
                      onChange={(value) => handleActionChange(org.emailFormateur, value as ActionResolutionOrganisme)}
                      data={actionOptions}
                      fullWidth
                      color={currentAction === 'IGNORER' ? 'gray' : 'green'}
                    />
                  </div>

                  {currentAction === 'CREER' && (
                    <Card withBorder p="sm">
                      <Text size="sm" fw={500} mb="sm">
                        <IconPlus size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        Personnaliser le nom (optionnel)
                      </Text>
                      <TextInput
                        placeholder={org.nomOrganisme}
                        size="sm"
                        value={customNames.get(org.emailFormateur) || ''}
                        onChange={(e) => handleCustomNameChange(org.emailFormateur, e.target.value)}
                      />
                      <Text size="xs" c="dimmed" mt="xs">
                        Laissez vide pour utiliser le nom par defaut: {org.nomOrganisme}
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

export default OrganismeConflictList;
