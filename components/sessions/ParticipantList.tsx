'use client';

import { useState } from 'react';
import {
  Table,
  Avatar,
  Group,
  Text,
  Badge,
  ActionIcon,
  Checkbox,
  Menu,
  Button,
  Paper,
  Stack,
  Tooltip,
} from '@mantine/core';
import {
  DotsThree,
  User,
  Trash,
  Check,
  X,
  Minus,
  CheckCircle,
  XCircle,
  Clock,
} from '@phosphor-icons/react';
import { CollectiveSessionParticipant } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface ParticipantListProps {
  participants: CollectiveSessionParticipant[];
  onMarkPresence?: (collaborateurId: number, present: boolean) => Promise<void>;
  onRemoveParticipant?: (collaborateurId: number) => Promise<void>;
  onUpdateParticipant?: (collaborateurId: number, data: any) => Promise<void>;
  readonly?: boolean;
  showPresence?: boolean;
  compact?: boolean;
}

export function ParticipantList({
  participants,
  onMarkPresence,
  onRemoveParticipant,
  onUpdateParticipant,
  readonly = false,
  showPresence = true,
  compact = false,
}: ParticipantListProps) {
  const router = useRouter();
  const [loadingActions, setLoadingActions] = useState<{ [key: number]: boolean }>({});

  const getStatutBadge = (statut: string) => {
    const config = {
      inscrit: { color: 'blue', icon: Clock, label: 'Inscrit' },
      complete: { color: 'green', icon: CheckCircle, label: 'Terminé' },
      desinscrit: { color: 'red', icon: XCircle, label: 'Désinscrit' },
    };

    const { color, icon: Icon, label } = config[statut] || config.inscrit;

    return (
      <Badge
        size="sm"
        color={color}
        variant="light"
        leftSection={<Icon size={12} />}
      >
        {label}
      </Badge>
    );
  };

  const getPresenceBadge = (presence: boolean | null | undefined) => {
    if (presence === true) {
      return (
        <Badge size="sm" color="green" variant="filled" leftSection={<Check size={12} />}>
          Présent
        </Badge>
      );
    }
    if (presence === false) {
      return (
        <Badge size="sm" color="red" variant="filled" leftSection={<X size={12} />}>
          Absent
        </Badge>
      );
    }
    return (
      <Badge size="sm" color="gray" variant="light" leftSection={<Minus size={12} />}>
        Non marqué
      </Badge>
    );
  };

  const handleMarkPresence = async (collaborateurId: number, present: boolean) => {
    if (!onMarkPresence || readonly) return;

    setLoadingActions({ ...loadingActions, [collaborateurId]: true });
    try {
      await onMarkPresence(collaborateurId, present);
    } finally {
      setLoadingActions({ ...loadingActions, [collaborateurId]: false });
    }
  };

  const handleRemove = async (collaborateurId: number) => {
    if (!onRemoveParticipant || readonly) return;

    if (window.confirm('Êtes-vous sûr de vouloir retirer ce participant ?')) {
      setLoadingActions({ ...loadingActions, [collaborateurId]: true });
      try {
        await onRemoveParticipant(collaborateurId);
      } finally {
        setLoadingActions({ ...loadingActions, [collaborateurId]: false });
      }
    }
  };

  if (participants.length === 0) {
    return (
      <Paper p="xl" withBorder>
        <Stack align="center" gap="md">
          <User size={48} weight="light" color="gray" />
          <Text c="dimmed" ta="center">
            Aucun participant inscrit pour le moment
          </Text>
        </Stack>
      </Paper>
    );
  }

  if (compact) {
    return (
      <Stack gap="xs">
        {participants.map((participant) => (
          <Paper key={participant.id} p="sm" withBorder>
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm" style={{ flex: 1 }}>
                <Avatar size="sm" radius="xl" color="blue">
                  {participant.collaborateur?.nomComplet?.charAt(0)}
                </Avatar>
                <div>
                  <Text size="sm" fw={500}>
                    {participant.collaborateur?.nomComplet}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {participant.collaborateur?.departement?.nomDepartement || '-'}
                  </Text>
                </div>
              </Group>
              <Group gap="xs">
                {getStatutBadge(participant.statutIndividuel)}
                {showPresence && getPresenceBadge(participant.presence)}
              </Group>
            </Group>
          </Paper>
        ))}
      </Stack>
    );
  }

  return (
    <Paper withBorder>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Participant</Table.Th>
            <Table.Th>Département</Table.Th>
            <Table.Th>Statut</Table.Th>
            {showPresence && <Table.Th>Présence</Table.Th>}
            <Table.Th>Date inscription</Table.Th>
            {!readonly && <Table.Th style={{ width: 80 }}>Actions</Table.Th>}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {participants.map((participant) => (
            <Table.Tr key={participant.id}>
              <Table.Td>
                <Group gap="sm">
                  <Avatar size="sm" radius="xl" color="blue">
                    {participant.collaborateur?.nomComplet?.charAt(0)}
                  </Avatar>
                  <div>
                    <Text
                      size="sm"
                      fw={500}
                      style={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/collaborateurs/${participant.collaborateurId}`)}
                    >
                      {participant.collaborateur?.nomComplet}
                    </Text>
                    {participant.collaborateur?.matricule && (
                      <Text size="xs" c="dimmed">
                        {participant.collaborateur.matricule}
                      </Text>
                    )}
                  </div>
                </Group>
              </Table.Td>
              <Table.Td>
                <Text size="sm">
                  {participant.collaborateur?.departement?.nomDepartement || '-'}
                </Text>
              </Table.Td>
              <Table.Td>{getStatutBadge(participant.statutIndividuel)}</Table.Td>
              {showPresence && (
                <Table.Td>
                  {readonly ? (
                    getPresenceBadge(participant.presence)
                  ) : (
                    <Group gap="xs">
                      <Tooltip label="Marquer présent">
                        <ActionIcon
                          size="sm"
                          variant={participant.presence === true ? 'filled' : 'light'}
                          color="green"
                          onClick={() => handleMarkPresence(participant.collaborateurId, true)}
                          loading={loadingActions[participant.collaborateurId]}
                        >
                          <Check size={14} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Marquer absent">
                        <ActionIcon
                          size="sm"
                          variant={participant.presence === false ? 'filled' : 'light'}
                          color="red"
                          onClick={() => handleMarkPresence(participant.collaborateurId, false)}
                          loading={loadingActions[participant.collaborateurId]}
                        >
                          <X size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  )}
                </Table.Td>
              )}
              <Table.Td>
                <Text size="sm" c="dimmed">
                  {new Date(participant.dateInscription).toLocaleDateString('fr-FR')}
                </Text>
              </Table.Td>
              {!readonly && (
                <Table.Td>
                  <Menu position="bottom-end" shadow="md">
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray">
                        <DotsThree size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<User size={14} />}
                        onClick={() => router.push(`/collaborateurs/${participant.collaborateurId}`)}
                      >
                        Voir le profil
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item
                        leftSection={<Trash size={14} />}
                        color="red"
                        onClick={() => handleRemove(participant.collaborateurId)}
                      >
                        Retirer du groupe
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              )}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
