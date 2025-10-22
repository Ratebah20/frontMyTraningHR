'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Stack,
  Paper,
  Grid,
  Card,
  ThemeIcon,
  Loader,
  Center,
  Button,
  ActionIcon,
  Tooltip,
  Badge,
  Table,
  Avatar,
  Divider,
  Alert,
  SimpleGrid,
} from '@mantine/core';
import {
  UsersFour,
  Users,
  GraduationCap,
  CheckCircle,
  Clock,
  Warning,
  ArrowsClockwise,
  ArrowLeft,
  User,
  Buildings,
  Eye,
} from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { managersService } from '@/lib/services';
import { TeamDetails } from '@/lib/types';
import { notifications } from '@mantine/notifications';
import { ManagerSelector } from '@/components/managers/ManagerSelector';

export default function ManagerTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const managerId = parseInt(resolvedParams.id);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teamData, setTeamData] = useState<TeamDetails | null>(null);
  const [selectorOpened, setSelectorOpened] = useState(false);
  const [selectedCollaborateur, setSelectedCollaborateur] = useState<{ id: number; nom: string; managerId?: number } | null>(null);

  useEffect(() => {
    loadTeamData();
  }, [managerId]);

  const loadTeamData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await managersService.getManagerTeam(managerId);
      setTeamData(data);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'équipe:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les données de l\'équipe',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadTeamData(false);
  };

  const handleAssignManager = (collaborateur: { id: number; nom: string; managerId?: number }) => {
    setSelectedCollaborateur(collaborateur);
    setSelectorOpened(true);
  };

  const handleManagerAssigned = () => {
    loadTeamData(false);
  };

  if (loading) {
    return (
      <Container size="xl">
        <Center h={400}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Chargement de l'équipe...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  if (!teamData) {
    return (
      <Container size="xl">
        <Alert icon={<Warning size={20} />} color="red">
          Manager introuvable
        </Alert>
      </Container>
    );
  }

  // Séparer les membres directs et indirects
  const membresDirects = teamData.membres.filter(m => m.isDirect);
  const membresIndirects = teamData.membres.filter(m => !m.isDirect);

  return (
    <Container size="xl">
      {/* En-tête */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Group justify="space-between" mb="md">
          <div>
            <Group align="center" gap="sm">
              <ActionIcon variant="subtle" onClick={() => router.back()}>
                <ArrowLeft size={20} />
              </ActionIcon>
              <div>
                <Group gap="sm">
                  <Avatar size="lg" radius="xl" color="blue">
                    {teamData.manager.nomComplet.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </Avatar>
                  <div>
                    <Title order={1}>{teamData.manager.nomComplet}</Title>
                    <Group gap="xs" mt={4}>
                      {teamData.manager.matricule && (
                        <Text size="sm" c="dimmed">
                          {teamData.manager.matricule}
                        </Text>
                      )}
                      {teamData.manager.departement && (
                        <Badge variant="light" color="blue" leftSection={<Buildings size={12} />}>
                          {teamData.manager.departement.nomDepartement}
                        </Badge>
                      )}
                    </Group>
                  </div>
                </Group>
              </div>
            </Group>
            <Text size="md" c="dimmed" mt="sm">
              Équipe de {teamData.stats.nombreTotal} collaborateur{teamData.stats.nombreTotal > 1 ? 's' : ''}
            </Text>
          </div>
          <Group>
            <Tooltip label="Rafraîchir">
              <ActionIcon variant="light" size="lg" onClick={handleRefresh} loading={refreshing}>
                <ArrowsClockwise size={20} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* KPIs de l'équipe */}
        <Grid mt="lg">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Équipe Totale
                  </Text>
                  <Text size="xl" fw={700}>{teamData.stats.nombreTotal}</Text>
                  <Text size="xs" c="dimmed">
                    {teamData.stats.nombreDirects} directs, {teamData.stats.nombreIndirects} indirects
                  </Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                  <Users size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Formations en Cours
                  </Text>
                  <Text size="xl" fw={700}>{teamData.stats.formationsEnCours}</Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="orange">
                  <GraduationCap size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Formations Terminées
                  </Text>
                  <Text size="xl" fw={700}>{teamData.stats.formationsTerminees}</Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="green">
                  <CheckCircle size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Heures Totales
                  </Text>
                  <Text size="xl" fw={700}>{Math.round(teamData.stats.totalHeures)}h</Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                  <Clock size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Tableau des membres de l'équipe */}
      <Stack gap="lg">
        {/* Subordonnés directs */}
        <Paper shadow="xs" radius="md" withBorder>
          <Group p="lg" justify="space-between">
            <div>
              <Title order={3}>Subordonnés Directs</Title>
              <Text size="sm" c="dimmed">{membresDirects.length} membre{membresDirects.length > 1 ? 's' : ''}</Text>
            </div>
          </Group>

          {membresDirects.length > 0 ? (
            <Table.ScrollContainer minWidth={800}>
              <Table verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Collaborateur</Table.Th>
                    <Table.Th>Département</Table.Th>
                    <Table.Th>Formations</Table.Th>
                    <Table.Th>Statut</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {membresDirects.map((membre) => (
                    <Table.Tr key={membre.id}>
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar size={36} radius="xl" color="blue">
                            {membre.nomComplet.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <div>
                            <Text size="sm" fw={500}>{membre.nomComplet}</Text>
                            <Text size="xs" c="dimmed">{membre.matricule || membre.idExterne}</Text>
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {membre.departement?.nomDepartement || '-'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="blue">
                          {membre.nombreFormations} formations
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={membre.actif ? 'green' : 'red'} variant="light">
                          {membre.actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" justify="flex-end">
                          <Tooltip label="Voir détails">
                            <ActionIcon
                              variant="subtle"
                              onClick={() => router.push(`/collaborateurs/${membre.id}`)}
                            >
                              <Eye size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Changer manager">
                            <ActionIcon
                              variant="subtle"
                              onClick={() => handleAssignManager({
                                id: membre.id,
                                nom: membre.nomComplet,
                                managerId: membre.manager?.id
                              })}
                            >
                              <UsersFour size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          ) : (
            <Center p="xl">
              <Text c="dimmed">Aucun subordonné direct</Text>
            </Center>
          )}
        </Paper>

        {/* Subordonnés indirects */}
        {membresIndirects.length > 0 && (
          <Paper shadow="xs" radius="md" withBorder>
            <Group p="lg" justify="space-between">
              <div>
                <Title order={3}>Subordonnés Indirects</Title>
                <Text size="sm" c="dimmed">{membresIndirects.length} membre{membresIndirects.length > 1 ? 's' : ''}</Text>
              </div>
            </Group>

            <Table.ScrollContainer minWidth={800}>
              <Table verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Collaborateur</Table.Th>
                    <Table.Th>Manager Direct</Table.Th>
                    <Table.Th>Niveau</Table.Th>
                    <Table.Th>Département</Table.Th>
                    <Table.Th>Formations</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {membresIndirects.map((membre) => (
                    <Table.Tr key={membre.id}>
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar size={32} radius="xl" color="violet">
                            {membre.nomComplet.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <div>
                            <Text size="sm" fw={500}>{membre.nomComplet}</Text>
                            <Text size="xs" c="dimmed">{membre.matricule || membre.idExterne}</Text>
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{membre.manager?.nomComplet || '-'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="gray">
                          Niveau {membre.level}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {membre.departement?.nomDepartement || '-'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="blue">
                          {membre.nombreFormations}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
        )}
      </Stack>

      {/* Modal de sélection de manager */}
      {selectedCollaborateur && (
        <ManagerSelector
          opened={selectorOpened}
          onClose={() => {
            setSelectorOpened(false);
            setSelectedCollaborateur(null);
          }}
          collaborateurId={selectedCollaborateur.id}
          collaborateurNom={selectedCollaborateur.nom}
          currentManagerId={selectedCollaborateur.managerId}
          onSuccess={handleManagerAssigned}
        />
      )}
    </Container>
  );
}
