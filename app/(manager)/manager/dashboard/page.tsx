'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Container,
  Title,
  Text,
  Grid,
  Card,
  Group,
  Badge,
  Button,
  Stack,
  Paper,
  Skeleton,
  SimpleGrid,
  ThemeIcon,
  Table,
  Alert,
  Center,
  RingProgress,
  Divider,
} from '@mantine/core';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle';
import { ArrowClockwise } from '@phosphor-icons/react/dist/ssr/ArrowClockwise';
import { ChartLine } from '@phosphor-icons/react/dist/ssr/ChartLine';
import { Calendar } from '@phosphor-icons/react/dist/ssr/Calendar';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr/ArrowUpRight';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { managerPortalService } from '@/lib/services/manager-portal.service';
import { useAuth } from '@/contexts/AuthContext';

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

export default function ManagerDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);

  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const [summaryData, chartsData] = await Promise.all([
        managerPortalService.getDashboardSummary(),
        managerPortalService.getDashboardCharts(),
      ]);

      setSummary(summaryData);
      setCharts(chartsData);
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les donnees du dashboard',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => loadData(false), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  const kpiCards = summary
    ? [
        {
          title: 'Collaborateurs',
          value: summary.kpis?.totalCollaborateurs || 0,
          subtitle: `${summary.kpis?.collaborateursDirects || 0} directs`,
          icon: Users,
          color: 'blue',
        },
        {
          title: 'Formations en cours',
          value: summary.kpis?.formationsEnCours || 0,
          subtitle: 'Actuellement',
          icon: GraduationCap,
          color: 'violet',
        },
        {
          title: 'Completees ce mois',
          value: summary.kpis?.formationsCompletesMois || 0,
          subtitle: 'Ce mois-ci',
          icon: CheckCircle,
          color: 'green',
        },
        {
          title: 'Obligatoires',
          value: `${summary.kpis?.tauxCompletionObligatoires || 0}%`,
          subtitle: 'Taux de completion',
          icon: WarningCircle,
          color:
            (summary.kpis?.tauxCompletionObligatoires || 0) >= 80
              ? 'green'
              : (summary.kpis?.tauxCompletionObligatoires || 0) >= 50
                ? 'orange'
                : 'red',
          progress: summary.kpis?.tauxCompletionObligatoires || 0,
        },
      ]
    : [];

  if (loading) {
    return (
      <Container size="xl">
        <Stack gap="xl">
          <div>
            <Title order={1}>Tableau de bord</Title>
            <Text size="lg" c="dimmed">
              Chargement des donnees...
            </Text>
          </div>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
            {[...Array(4)].map((_, i) => (
              <Card key={i} shadow="sm" radius="md" withBorder>
                <Skeleton height={120} />
              </Card>
            ))}
          </SimpleGrid>
          <Grid>
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Skeleton height={300} radius="md" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Skeleton height={300} radius="md" />
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Stack gap="lg" mb="xl">
        <Group justify="space-between">
          <div>
            <Title order={1}>
              Bonjour{summary?.manager?.nomComplet ? `, ${summary.manager.nomComplet}` : ''}
            </Title>
            <Text size="lg" c="dimmed">
              Tableau de bord de votre equipe
            </Text>
          </div>
          <Button
            variant="light"
            size="sm"
            onClick={() => loadData(false)}
            loading={refreshing}
            leftSection={<ArrowClockwise size={16} />}
          >
            Actualiser
          </Button>
        </Group>
      </Stack>

      {/* KPI Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="xl">
        {kpiCards.map((kpi, index) => (
          <Card key={index} shadow="sm" radius="md" withBorder p="md">
            <Group justify="space-between" mb="xs">
              <ThemeIcon size={32} radius="md" variant="light" color={kpi.color}>
                <kpi.icon size={18} weight="duotone" />
              </ThemeIcon>
              {kpi.progress !== undefined && (
                <RingProgress
                  size={40}
                  thickness={3}
                  roundCaps
                  sections={[{ value: kpi.progress, color: kpi.color }]}
                />
              )}
            </Group>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              {kpi.title}
            </Text>
            <Text size="xl" fw={700}>
              {kpi.value}
            </Text>
            <Text size="xs" c="dimmed">
              {kpi.subtitle}
            </Text>
          </Card>
        ))}
      </SimpleGrid>

      <Divider my="xl" />

      {/* Charts Section */}
      <Grid gutter="lg" mb="lg">
        {/* Formations par mois */}
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper shadow="sm" radius="md" p="lg" withBorder h="100%">
            <Group gap="xs" mb="md">
              <ThemeIcon size={36} radius="md" variant="light" color="blue">
                <ChartLine size={20} weight="duotone" />
              </ThemeIcon>
              <div>
                <Title order={3}>Formations par mois</Title>
                <Text size="sm" c="dimmed">
                  12 derniers mois
                </Text>
              </div>
            </Group>
            {charts?.formationsParMois && charts.formationsParMois.length > 0 ? (
              <Stack gap="md">
                <SimpleGrid cols={Math.min(charts.formationsParMois.length, 12)} spacing="xs">
                  {charts.formationsParMois.map((item: any, idx: number) => {
                    const maxCount = Math.max(
                      ...charts.formationsParMois.map((d: any) => d.count),
                      1
                    );
                    const barHeight = Math.min((item.count / maxCount) * 100, 100);

                    return (
                      <div key={idx}>
                        <div
                          style={{
                            height: 100,
                            position: 'relative',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            backgroundColor: 'var(--mantine-color-default-border)',
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              width: '100%',
                              height: `${barHeight}%`,
                              backgroundColor: 'var(--mantine-color-blue-5)',
                              transition: 'height 0.3s ease',
                            }}
                          />
                        </div>
                        <Text size="xs" ta="center" mt={4}>
                          {item.mois?.split(' ')[0] || ''}
                        </Text>
                        <Text size="xs" ta="center" fw={600}>
                          {item.count}
                        </Text>
                      </div>
                    );
                  })}
                </SimpleGrid>
              </Stack>
            ) : (
              <Center h={200}>
                <Text c="dimmed">Aucune donnee disponible</Text>
              </Center>
            )}
          </Paper>
        </Grid.Col>

        {/* Repartition par statut */}
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper shadow="sm" radius="md" p="lg" withBorder h="100%">
            <Group gap="xs" mb="md">
              <ThemeIcon size={36} radius="md" variant="light" color="teal">
                <ChartLine size={20} weight="duotone" />
              </ThemeIcon>
              <div>
                <Title order={3}>Repartition par statut</Title>
                <Text size="sm" c="dimmed">
                  Sessions de l'equipe
                </Text>
              </div>
            </Group>
            {charts?.repartitionStatut && charts.repartitionStatut.length > 0 ? (
              <Stack gap="sm">
                {charts.repartitionStatut.map((item: any, idx: number) => {
                  const total = charts.repartitionStatut.reduce(
                    (sum: number, s: any) => sum + s.count,
                    0
                  );
                  const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;

                  return (
                    <div key={idx}>
                      <Group justify="space-between" mb={4}>
                        <Group gap="xs">
                          <Badge
                            size="sm"
                            variant="light"
                            color={item.color || statusColors[item.statut] || 'gray'}
                          >
                            {statusLabels[item.statut] || item.statut}
                          </Badge>
                        </Group>
                        <Group gap="xs">
                          <Text size="sm" fw={600}>
                            {item.count}
                          </Text>
                          <Text size="xs" c="dimmed">
                            ({percentage}%)
                          </Text>
                        </Group>
                      </Group>
                      <div
                        style={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'var(--mantine-color-default-border)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${percentage}%`,
                            backgroundColor: `var(--mantine-color-${item.color || statusColors[item.statut] || 'gray'}-5)`,
                            borderRadius: 4,
                            transition: 'width 0.5s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </Stack>
            ) : (
              <Center h={200}>
                <Text c="dimmed">Aucune donnee disponible</Text>
              </Center>
            )}
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Prochaines formations */}
      {summary?.prochainessFormations && summary.prochainessFormations.length > 0 && (
        <Paper shadow="sm" radius="md" p="lg" withBorder mb="xl">
          <Group justify="space-between" mb="md">
            <Group gap="xs">
              <ThemeIcon size={36} radius="md" variant="light" color="indigo">
                <Calendar size={20} weight="duotone" />
              </ThemeIcon>
              <div>
                <Title order={3}>Prochaines formations</Title>
                <Text size="sm" c="dimmed">
                  30 prochains jours
                </Text>
              </div>
            </Group>
            <Button
              variant="subtle"
              size="sm"
              rightSection={<ArrowUpRight size={14} />}
              onClick={() => router.push('/manager/formations')}
            >
              Voir toutes
            </Button>
          </Group>
          <Table.ScrollContainer minWidth={700}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Formation</Table.Th>
                  <Table.Th>Collaborateur</Table.Th>
                  <Table.Th>Date debut</Table.Th>
                  <Table.Th>Date fin</Table.Th>
                  <Table.Th>Statut</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {summary.prochainessFormations.slice(0, 10).map((session: any) => (
                  <Table.Tr key={session.id}>
                    <Table.Td>
                      <Text size="sm" fw={500} lineClamp={1}>
                        {session.formation}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{session.collaborateur}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {session.dateDebut
                          ? new Date(session.dateDebut).toLocaleDateString('fr-FR')
                          : '-'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {session.dateFin
                          ? new Date(session.dateFin).toLocaleDateString('fr-FR')
                          : '-'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={statusColors[session.statut] || 'gray'}
                        variant="light"
                        size="sm"
                      >
                        {statusLabels[session.statut] || session.statut}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      )}

      {/* Alertes */}
      {summary?.alertes && summary.alertes.length > 0 && (
        <Paper shadow="sm" radius="md" p="lg" withBorder>
          <Group gap="xs" mb="md">
            <ThemeIcon size={36} radius="md" variant="light" color="orange">
              <Warning size={20} weight="duotone" />
            </ThemeIcon>
            <div>
              <Title order={3}>Alertes</Title>
              <Text size="sm" c="dimmed">
                Points d'attention
              </Text>
            </div>
          </Group>
          <Stack gap="md">
            {summary.alertes.map((alerte: any, idx: number) => (
              <Alert
                key={idx}
                icon={<WarningCircle size={16} />}
                color={
                  alerte.severity === 'error'
                    ? 'red'
                    : alerte.severity === 'warning'
                      ? 'orange'
                      : 'blue'
                }
                variant="light"
              >
                <Group justify="space-between">
                  <Text fw={500} size="sm">
                    {alerte.message}
                  </Text>
                  {alerte.count > 0 && (
                    <Badge
                      size="lg"
                      color={
                        alerte.severity === 'error'
                          ? 'red'
                          : alerte.severity === 'warning'
                            ? 'orange'
                            : 'blue'
                      }
                      variant="filled"
                    >
                      {alerte.count}
                    </Badge>
                  )}
                </Group>
              </Alert>
            ))}
          </Stack>
        </Paper>
      )}
    </Container>
  );
}
