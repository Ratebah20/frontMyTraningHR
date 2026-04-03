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
  Skeleton,
} from '@mantine/core';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap';
import { ChartBar } from '@phosphor-icons/react/dist/ssr/ChartBar';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { Calendar } from '@phosphor-icons/react/dist/ssr/Calendar';
import { Buildings } from '@phosphor-icons/react/dist/ssr/Buildings';
import { IdentificationCard } from '@phosphor-icons/react/dist/ssr/IdentificationCard';
import { Hourglass } from '@phosphor-icons/react/dist/ssr/Hourglass';
import { notifications } from '@mantine/notifications';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';

const statusColors: Record<string, string> = {
  inscrit: 'blue',
  en_cours: 'yellow',
  complete: 'green',
  termine: 'green',
  'Terminé': 'green',
  annule: 'red',
};

const statusLabels: Record<string, string> = {
  inscrit: 'Inscrit',
  en_cours: 'En cours',
  complete: 'Terminé',
  termine: 'Terminé',
  'Terminé': 'Terminé',
  annule: 'Annulé',
};

export default function ManagerEquipeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string, 10);

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string | null>('formations');

  useEffect(() => {
    if (!id || isNaN(id)) return;
    loadMemberDetail();
  }, [id]);

  const loadMemberDetail = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/manager/team/${id}`);
      setMember(response.data);
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
          Collaborateur non trouvé
        </Alert>
        <Button
          mt="md"
          variant="light"
          leftSection={<ArrowLeft size={16} />}
          onClick={() => router.push('/manager/equipe')}
        >
          Retour à l'équipe
        </Button>
      </Container>
    );
  }

  const formations = member.formations || [];
  const stats = member.stats || {};
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
                .map((n: string) => n[0])
                .join('')
                .slice(0, 2) || 'NA'}
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
                    {member.departement?.nomDepartement || 'Non assigné'}
                  </Badge>
                )}
                {member.contrat && (
                  <Badge variant="light" color="violet">
                    {member.contrat?.typeContrat || '-'}
                  </Badge>
                )}
                <Badge
                  color={member.actif ? 'green' : 'red'}
                  variant="light"
                >
                  {member.actif ? 'Actif' : 'Inactif'}
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
                    {stats.totalFormations || 0}
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
                    Terminées
                  </Text>
                  <Text size="xl" fw={700} c="green">
                    {stats.formationsTerminees || 0}
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
                    {stats.totalHeures || 0}h
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
                    En cours
                  </Text>
                  <Text size="xl" fw={700} c="yellow">
                    {stats.formationsEnCours || 0}
                  </Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="yellow">
                  <Hourglass size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="formations" leftSection={<GraduationCap size={16} />}>
            Formations ({formations.length})
          </Tabs.Tab>
          <Tabs.Tab value="statistiques" leftSection={<ChartBar size={16} />}>
            Statistiques
          </Tabs.Tab>
        </Tabs.List>

        {/* Formations Tab */}
        <Tabs.Panel value="formations" pt="md">
          <Paper shadow="xs" radius="md" withBorder>
            {formations.length > 0 ? (
              <Table.ScrollContainer minWidth={800}>
                <Table verticalSpacing="sm" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Formation</Table.Th>
                      <Table.Th>Date début</Table.Th>
                      <Table.Th>Date fin</Table.Th>
                      <Table.Th>Durée</Table.Th>
                      <Table.Th>Statut</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {formations.map((f: any, idx: number) => (
                      <Table.Tr key={f.id || idx}>
                        <Table.Td>
                          <Text size="sm" fw={500} lineClamp={1}>
                            {f.formation?.nomFormation || '-'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Calendar size={12} color="#868E96" />
                            <Text size="sm">
                              {f.dateDebut
                                ? new Date(f.dateDebut).toLocaleDateString('fr-FR')
                                : '-'}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {f.dateFin
                              ? new Date(f.dateFin).toLocaleDateString('fr-FR')
                              : '-'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Clock size={14} color="#868E96" />
                            <Text size="sm">{f.duree || 0} {f.uniteDuree || 'h'}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={statusColors[f.statut] || 'gray'}
                            variant="light"
                            size="sm"
                          >
                            {statusLabels[f.statut] || f.statut}
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
                    Ce collaborateur n'a pas encore de formations enregistrées
                  </Text>
                </Stack>
              </Center>
            )}
          </Paper>
        </Tabs.Panel>

        {/* Statistiques Tab */}
        <Tabs.Panel value="statistiques" pt="md">
          <Paper shadow="sm" radius="md" p="lg" withBorder>
            <Group gap="xs" mb="md">
              <ThemeIcon size={36} radius="md" variant="light" color="blue">
                <Clock size={20} weight="duotone" />
              </ThemeIcon>
              <div>
                <Title order={4}>Heures de formation</Title>
                <Text size="sm" c="dimmed">Récapitulatif</Text>
              </div>
            </Group>

            <Stack gap="md">
              <Group justify="space-between">
                <Text size="sm">Total heures</Text>
                <Text size="sm" fw={700}>
                  {stats.totalHeures || 0}h
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Formations terminées</Text>
                <Text size="sm" fw={700} c="green">
                  {stats.formationsTerminees || 0}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Formations en cours</Text>
                <Text size="sm" fw={700} c="orange">
                  {stats.formationsEnCours || 0}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Formations inscrites</Text>
                <Text size="sm" fw={700} c="blue">
                  {stats.formationsInscrites || 0}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Total formations</Text>
                <Text size="sm" fw={700}>
                  {stats.totalFormations || 0}
                </Text>
              </Group>
            </Stack>
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
