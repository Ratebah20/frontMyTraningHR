'use client';

import { useState, useEffect } from 'react';
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
  Badge,
  Table,
  Tabs,
  Button,
  Loader,
  Center,
  Alert,
  Avatar,
  Divider,
  RingProgress,
  Skeleton,
} from '@mantine/core';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { User } from '@phosphor-icons/react/dist/ssr/User';
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap';
import { ChartBar } from '@phosphor-icons/react/dist/ssr/ChartBar';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { Calendar } from '@phosphor-icons/react/dist/ssr/Calendar';
import { Buildings } from '@phosphor-icons/react/dist/ssr/Buildings';
import { IdentificationCard } from '@phosphor-icons/react/dist/ssr/IdentificationCard';
import { Hourglass } from '@phosphor-icons/react/dist/ssr/Hourglass';
import { notifications } from '@mantine/notifications';
import { useRouter, useParams } from 'next/navigation';
import { managerPortalService, ManagerTeamMemberDetail } from '@/lib/services/manager-portal.service';

// Status colors
const statusColors: Record<string, string> = {
  inscrit: 'blue',
  en_cours: 'yellow',
  complete: 'green',
  termine: 'green',
  annule: 'red',
};

const statusLabels: Record<string, string> = {
  inscrit: 'Inscrit',
  en_cours: 'En cours',
  complete: 'Termine',
  termine: 'Termine',
  annule: 'Annule',
};

export default function ManagerEquipeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string, 10);

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<ManagerTeamMemberDetail | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('formations');

  useEffect(() => {
    if (!id || isNaN(id)) return;
    loadMemberDetail();
  }, [id]);

  const loadMemberDetail = async () => {
    setLoading(true);
    try {
      const data = await managerPortalService.getTeamMemberDetail(id);
      setMember(data);
    } catch (error) {
      console.error('Erreur lors du chargement du collaborateur:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les details du collaborateur',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container size="xl">
        <Stack gap="xl">
          <Group>
            <Skeleton height={40} width={120} />
            <Skeleton height={30} width={250} />
          </Group>
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Skeleton height={250} radius="md" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Skeleton height={250} radius="md" />
            </Grid.Col>
          </Grid>
          <Skeleton height={400} radius="md" />
        </Stack>
      </Container>
    );
  }

  if (!member) {
    return (
      <Container size="xl">
        <Alert icon={<Warning size={16} />} color="red" variant="light">
          Collaborateur non trouve
        </Alert>
        <Button
          mt="md"
          variant="light"
          leftSection={<ArrowLeft size={16} />}
          onClick={() => router.push('/manager/equipe')}
        >
          Retour a l'equipe
        </Button>
      </Container>
    );
  }

  return (
    <Container size="xl">
      {/* Back button & header */}
      <Group mb="xl">
        <Button
          variant="light"
          leftSection={<ArrowLeft size={16} />}
          onClick={() => router.push('/manager/equipe')}
        >
          Retour
        </Button>
      </Group>

      {/* Collaborator info header */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Group justify="space-between" align="flex-start">
          <Group gap="lg">
            <Avatar size={64} radius="xl" color="blue">
              {member.nomComplet
                ?.split(' ')
                .map((n) => n[0])
                .join('') || 'NA'}
            </Avatar>
            <div>
              <Title order={2}>{member.nomComplet}</Title>
              <Group gap="xs" mt="xs">
                {member.matricule && (
                  <Badge variant="light" color="gray" leftSection={<IdentificationCard size={12} />}>
                    {member.matricule}
                  </Badge>
                )}
                {member.departement && (
                  <Badge variant="light" color="blue" leftSection={<Buildings size={12} />}>
                    {member.departement}
                  </Badge>
                )}
                {member.contrat && (
                  <Badge variant="light" color="violet">
                    {member.contrat}
                  </Badge>
                )}
                <Badge
                  color={member.actif ? 'green' : 'red'}
                  variant="light"
                >
                  {member.actif ? 'Actif' : 'Inactif'}
                </Badge>
                <Badge
                  color={member.managerDirect ? 'blue' : 'gray'}
                  variant="light"
                >
                  {member.managerDirect ? 'Subordonne direct' : 'Subordonne indirect'}
                </Badge>
              </Group>
            </div>
          </Group>
        </Group>

        {/* Stats cards */}
        <Grid mt="xl">
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Total formations
                  </Text>
                  <Text size="xl" fw={700}>
                    {member.stats?.totalFormations || 0}
                  </Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                  <GraduationCap size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Terminees
                  </Text>
                  <Text size="xl" fw={700} c="green">
                    {member.stats?.formationsTerminees || 0}
                  </Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="green">
                  <CheckCircle size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Heures totales
                  </Text>
                  <Text size="xl" fw={700} c="orange">
                    {member.stats?.totalHeures || 0}h
                  </Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="orange">
                  <Clock size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Taux completion
                  </Text>
                  <Text size="xl" fw={700}>
                    {member.stats?.tauxCompletion || 0}%
                  </Text>
                </div>
                <RingProgress
                  size={48}
                  thickness={4}
                  roundCaps
                  sections={[
                    {
                      value: member.stats?.tauxCompletion || 0,
                      color:
                        (member.stats?.tauxCompletion || 0) >= 80
                          ? 'green'
                          : (member.stats?.tauxCompletion || 0) >= 50
                            ? 'orange'
                            : 'red',
                    },
                  ]}
                />
              </Group>
            </Card>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="formations" leftSection={<GraduationCap size={16} />}>
            Formations
          </Tabs.Tab>
          <Tabs.Tab value="statistiques" leftSection={<ChartBar size={16} />}>
            Statistiques
          </Tabs.Tab>
        </Tabs.List>

        {/* Formations Tab */}
        <Tabs.Panel value="formations" pt="md">
          <Paper shadow="xs" radius="md" withBorder>
            {member.formations && member.formations.length > 0 ? (
              <Table.ScrollContainer minWidth={800}>
                <Table verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Formation</Table.Th>
                      <Table.Th>Categorie</Table.Th>
                      <Table.Th>Date debut</Table.Th>
                      <Table.Th>Date fin</Table.Th>
                      <Table.Th>Duree</Table.Th>
                      <Table.Th>Organisme</Table.Th>
                      <Table.Th>Statut</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {member.formations.map((formation) => (
                      <Table.Tr key={formation.id}>
                        <Table.Td>
                          <Text size="sm" fw={500} lineClamp={1}>
                            {formation.nomFormation}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light" color="gray" size="sm">
                            {formation.categorie || 'Non categorise'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {formation.dateDebut
                              ? new Date(formation.dateDebut).toLocaleDateString('fr-FR')
                              : '-'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {formation.dateFin
                              ? new Date(formation.dateFin).toLocaleDateString('fr-FR')
                              : '-'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Clock size={14} color="#868E96" />
                            <Text size="sm">{formation.dureeHeures || 0}h</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed" lineClamp={1}>
                            {formation.organisme || '-'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={statusColors[formation.statut] || 'gray'}
                            variant="light"
                            size="sm"
                          >
                            {statusLabels[formation.statut] || formation.statut}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            ) : (
              <Center py="xl">
                <Stack align="center">
                  <GraduationCap size={48} color="#868E96" />
                  <Text size="lg" fw={500} c="dimmed">
                    Aucune formation
                  </Text>
                  <Text size="sm" c="dimmed">
                    Ce collaborateur n'a pas encore de formations enregistrees
                  </Text>
                </Stack>
              </Center>
            )}
          </Paper>
        </Tabs.Panel>

        {/* Statistiques Tab */}
        <Tabs.Panel value="statistiques" pt="md">
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper shadow="sm" radius="md" p="lg" withBorder>
                <Group gap="xs" mb="md">
                  <ThemeIcon size={36} radius="md" variant="light" color="blue">
                    <Clock size={20} weight="duotone" />
                  </ThemeIcon>
                  <div>
                    <Title order={4}>Heures de formation</Title>
                    <Text size="sm" c="dimmed">
                      Recapitulatif
                    </Text>
                  </div>
                </Group>

                <Stack gap="md">
                  <Group justify="space-between">
                    <Text size="sm">Total heures</Text>
                    <Text size="sm" fw={700}>
                      {member.stats?.totalHeures || 0}h
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm">Formations terminees</Text>
                    <Text size="sm" fw={700} c="green">
                      {member.stats?.formationsTerminees || 0}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm">Formations en cours</Text>
                    <Text size="sm" fw={700} c="orange">
                      {member.stats?.formationsEnCours || 0}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm">Total formations</Text>
                    <Text size="sm" fw={700}>
                      {member.stats?.totalFormations || 0}
                    </Text>
                  </Group>
                </Stack>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper shadow="sm" radius="md" p="lg" withBorder>
                <Group gap="xs" mb="md">
                  <ThemeIcon size={36} radius="md" variant="light" color="green">
                    <CheckCircle size={20} weight="duotone" />
                  </ThemeIcon>
                  <div>
                    <Title order={4}>Taux de completion</Title>
                    <Text size="sm" c="dimmed">
                      Progression globale
                    </Text>
                  </div>
                </Group>

                <Center py="lg">
                  <RingProgress
                    size={160}
                    thickness={14}
                    roundCaps
                    sections={[
                      {
                        value: member.stats?.tauxCompletion || 0,
                        color:
                          (member.stats?.tauxCompletion || 0) >= 80
                            ? 'green'
                            : (member.stats?.tauxCompletion || 0) >= 50
                              ? 'orange'
                              : 'red',
                      },
                    ]}
                    label={
                      <div style={{ textAlign: 'center' }}>
                        <Text size="xl" fw={800}>
                          {member.stats?.tauxCompletion || 0}%
                        </Text>
                        <Text size="xs" c="dimmed">
                          completion
                        </Text>
                      </div>
                    }
                  />
                </Center>
              </Paper>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
