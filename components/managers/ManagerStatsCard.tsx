'use client';

import {
  Card,
  Group,
  Text,
  Avatar,
  Badge,
  Stack,
  Progress,
  Divider,
  ThemeIcon,
  SimpleGrid,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  Users,
  GraduationCap,
  CheckCircle,
  Clock,
  Eye,
  Buildings,
} from '@phosphor-icons/react';
import { ManagerStats } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface ManagerStatsCardProps {
  manager: ManagerStats;
  onViewDetails?: (managerId: number) => void;
}

export function ManagerStatsCard({ manager, onViewDetails }: ManagerStatsCardProps) {
  const router = useRouter();

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(manager.id);
    } else {
      router.push(`/managers/${manager.id}`);
    }
  };

  // Calculer le taux de complétion des formations
  const totalFormations = manager.formationsEnCours + manager.formationsTerminees + manager.formationsPlanifiees;
  const tauxCompletion = totalFormations > 0
    ? Math.round((manager.formationsTerminees / totalFormations) * 100)
    : 0;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        {/* En-tête avec info manager */}
        <Group justify="space-between" wrap="nowrap">
          <Group gap="md">
            <Avatar
              size="lg"
              radius="xl"
              color="blue"
            >
              {manager.nomComplet.split(' ').map(n => n[0]).join('').toUpperCase()}
            </Avatar>

            <div style={{ flex: 1, minWidth: 0 }}>
              <Group gap="xs">
                <Text size="md" fw={600} lineClamp={1}>
                  {manager.nomComplet}
                </Text>
                {!manager.actif && (
                  <Badge size="sm" color="red" variant="light">
                    Inactif
                  </Badge>
                )}
              </Group>

              {manager.matricule && (
                <Text size="xs" c="dimmed" mt={2}>
                  {manager.matricule}
                </Text>
              )}

              {manager.departementNom && (
                <Group gap={4} mt={4}>
                  <Buildings size={12} color="var(--mantine-color-dimmed)" />
                  <Text size="xs" c="dimmed">
                    {manager.departementNom}
                  </Text>
                </Group>
              )}
            </div>
          </Group>

          <Tooltip label="Voir les détails de l'équipe">
            <ActionIcon
              variant="light"
              size="lg"
              color="blue"
              onClick={handleViewDetails}
            >
              <Eye size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Divider />

        {/* Statistiques de l'équipe */}
        <SimpleGrid cols={2} spacing="xs">
          {/* Effectif total */}
          <Card padding="sm" radius="sm" withBorder>
            <Group gap="xs">
              <ThemeIcon size="md" radius="md" variant="light" color="blue">
                <Users size={16} />
              </ThemeIcon>
              <div style={{ flex: 1 }}>
                <Text size="xs" c="dimmed" fw={500}>
                  Équipe
                </Text>
                <Text size="lg" fw={700}>
                  {manager.nombreSubordonnesTotal}
                </Text>
                <Text size="xs" c="dimmed">
                  {manager.nombreSubordonnesDirects} direct{manager.nombreSubordonnesDirects > 1 ? 's' : ''}
                </Text>
              </div>
            </Group>
          </Card>

          {/* Heures de formation */}
          <Card padding="sm" radius="sm" withBorder>
            <Group gap="xs">
              <ThemeIcon size="md" radius="md" variant="light" color="orange">
                <Clock size={16} />
              </ThemeIcon>
              <div style={{ flex: 1 }}>
                <Text size="xs" c="dimmed" fw={500}>
                  Heures
                </Text>
                <Text size="lg" fw={700}>
                  {Math.round(manager.totalHeuresFormation)}h
                </Text>
                <Text size="xs" c="dimmed">
                  Formations
                </Text>
              </div>
            </Group>
          </Card>
        </SimpleGrid>

        {/* Formations de l'équipe */}
        <Stack gap="xs">
          <Text size="sm" fw={600}>
            Formations de l'équipe
          </Text>

          <Group gap="xs" grow>
            <Tooltip label="Formations en cours">
              <Badge
                size="lg"
                variant="light"
                color="blue"
                leftSection={<GraduationCap size={14} />}
                fullWidth
              >
                {manager.formationsEnCours} en cours
              </Badge>
            </Tooltip>

            <Tooltip label="Formations terminées">
              <Badge
                size="lg"
                variant="light"
                color="green"
                leftSection={<CheckCircle size={14} />}
                fullWidth
              >
                {manager.formationsTerminees} terminées
              </Badge>
            </Tooltip>
          </Group>

          {totalFormations > 0 && (
            <div>
              <Group justify="space-between" mb={4}>
                <Text size="xs" c="dimmed">
                  Taux de complétion
                </Text>
                <Text size="xs" fw={600}>
                  {tauxCompletion}%
                </Text>
              </Group>
              <Progress
                value={tauxCompletion}
                size="sm"
                radius="xl"
                color={tauxCompletion >= 75 ? 'green' : tauxCompletion >= 50 ? 'orange' : 'red'}
                animated
              />
            </div>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}
