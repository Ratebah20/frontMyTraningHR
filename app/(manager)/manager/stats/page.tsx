'use client';

import { useState, useEffect, useCallback } from 'react';
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
  SimpleGrid,
  Skeleton,
  Badge,
  RingProgress,
  Center,
  Divider,
  Progress,
  Select,
  Button,
} from '@mantine/core';
import { ChartBar } from '@phosphor-icons/react/dist/ssr/ChartBar';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { ArrowClockwise } from '@phosphor-icons/react/dist/ssr/ArrowClockwise';
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap';
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr/ShieldCheck';
import { notifications } from '@mantine/notifications';
import api from '@/lib/api';

export default function ManagerStatsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const annees = Array.from({ length: 6 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { label: year.toString(), value: year.toString() };
  });

  const loadStats = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      try {
        const dateDebut = `${selectedYear}-01-01`;
        const dateFin = `${selectedYear}-12-31`;
        const response = await api.get('/manager/stats', { params: { dateDebut, dateFin } });
        setStats(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        notifications.show({
          title: 'Erreur',
          message: 'Impossible de charger les statistiques',
          color: 'red',
          icon: <Warning size={20} />,
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedYear]
  );

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <Container size="xl">
        <Stack gap="xl">
          <div>
            <Title order={1}>Statistiques de l'equipe</Title>
            <Text size="lg" c="dimmed">Chargement des donnees...</Text>
          </div>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {[...Array(3)].map((_, i) => (
              <Card key={i} shadow="sm" radius="md" withBorder>
                <Skeleton height={120} />
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    );
  }

  // Data from backend
  const heuresByMonth = stats?.heuresByMonth || [];
  const formationsByCategorie = stats?.formationsByCategorie || [];
  const topFormations = stats?.topFormations || [];
  const totalHeures = stats?.totalHeures || 0;
  const mandatoryComplianceRate = stats?.mandatoryComplianceRate || 0;

  return (
    <Container size="xl">
      <Stack gap="lg" mb="xl">
        <Group justify="space-between">
          <div>
            <Title order={1}>Statistiques de l'equipe</Title>
            <Text size="lg" c="dimmed">Annee {selectedYear}</Text>
          </div>
          <Group>
            <Select
              value={selectedYear}
              onChange={(v) => setSelectedYear(v || new Date().getFullYear().toString())}
              data={annees}
              w={100}
            />
            <Button
              variant="light"
              size="sm"
              onClick={() => loadStats(false)}
              loading={refreshing}
              leftSection={<ArrowClockwise size={16} />}
            >
              Actualiser
            </Button>
          </Group>
        </Group>
      </Stack>

      {/* KPI Cards - sans taux de complétion */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md" mb="xl">
        <Card shadow="sm" radius="md" withBorder p="md">
          <Group justify="space-between" mb="xs">
            <ThemeIcon size={32} radius="md" variant="light" color="orange">
              <Clock size={18} weight="duotone" />
            </ThemeIcon>
          </Group>
          <Text size="xs" c="dimmed" fw={600} tt="uppercase">Heures totales</Text>
          <Text size="xl" fw={700}>{Math.round(totalHeures)}h</Text>
          <Text size="xs" c="dimmed">Formation de l'equipe</Text>
        </Card>

        <Card shadow="sm" radius="md" withBorder p="md">
          <Group justify="space-between" mb="xs">
            <ThemeIcon size={32} radius="md" variant="light" color="violet">
              <ShieldCheck size={18} weight="duotone" />
            </ThemeIcon>
            <RingProgress
              size={40}
              thickness={3}
              roundCaps
              sections={[{
                value: mandatoryComplianceRate,
                color: mandatoryComplianceRate >= 80 ? 'green' : 'orange',
              }]}
            />
          </Group>
          <Text size="xs" c="dimmed" fw={600} tt="uppercase">Obligatoires</Text>
          <Text size="xl" fw={700}>{mandatoryComplianceRate}%</Text>
          <Text size="xs" c="dimmed">Compliance</Text>
        </Card>

        <Card shadow="sm" radius="md" withBorder p="md">
          <Group justify="space-between" mb="xs">
            <ThemeIcon size={32} radius="md" variant="light" color="blue">
              <GraduationCap size={18} weight="duotone" />
            </ThemeIcon>
          </Group>
          <Text size="xs" c="dimmed" fw={600} tt="uppercase">Top formation</Text>
          <Text size="lg" fw={700} lineClamp={1}>
            {topFormations[0]?.nom || '-'}
          </Text>
          <Text size="xs" c="dimmed">
            {topFormations[0]?.count || 0} sessions
          </Text>
        </Card>
      </SimpleGrid>

      <Divider my="xl" />

      {/* Charts */}
      <Grid gutter="lg" mb="xl">
        {/* Heures par mois */}
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper shadow="sm" radius="md" p="lg" withBorder h="100%">
            <Group gap="xs" mb="md">
              <ThemeIcon size={36} radius="md" variant="light" color="teal">
                <ChartBar size={20} weight="duotone" />
              </ThemeIcon>
              <div>
                <Title order={3}>Heures par mois</Title>
                <Text size="sm" c="dimmed">Evolution mensuelle - {selectedYear}</Text>
              </div>
            </Group>
            {heuresByMonth.length > 0 ? (
              <Stack gap="md">
                <SimpleGrid cols={Math.min(heuresByMonth.length, 12)} spacing="xs">
                  {heuresByMonth.map((item: any, idx: number) => {
                    const maxH = Math.max(...heuresByMonth.map((d: any) => d.heures), 1);
                    const barHeight = Math.min((item.heures / maxH) * 100, 100);
                    const monthLabel = item.month?.split('-')[1] || '';
                    const monthNames = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const label = monthNames[parseInt(monthLabel) - 1] || monthLabel;

                    return (
                      <div key={idx}>
                        <div style={{
                          height: 100,
                          position: 'relative',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          backgroundColor: 'var(--mantine-color-default-border)',
                        }}>
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            width: '100%',
                            height: `${barHeight}%`,
                            backgroundColor: 'var(--mantine-color-teal-5)',
                            transition: 'height 0.3s ease',
                          }} />
                        </div>
                        <Text size="xs" ta="center" mt={4}>{label}</Text>
                        <Text size="xs" ta="center" fw={600}>{Math.round(item.heures)}h</Text>
                      </div>
                    );
                  })}
                </SimpleGrid>
                <Text size="sm" ta="center" fw={600} c="teal">
                  Total: {Math.round(totalHeures)}h
                </Text>
              </Stack>
            ) : (
              <Center h={200}>
                <Text c="dimmed">Aucune donnee disponible</Text>
              </Center>
            )}
          </Paper>
        </Grid.Col>

        {/* Top formations */}
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper shadow="sm" radius="md" p="lg" withBorder h="100%">
            <Group gap="xs" mb="md">
              <ThemeIcon size={36} radius="md" variant="light" color="indigo">
                <GraduationCap size={20} weight="duotone" />
              </ThemeIcon>
              <div>
                <Title order={3}>Top formations</Title>
                <Text size="sm" c="dimmed">Les plus suivies</Text>
              </div>
            </Group>
            {topFormations.length > 0 ? (
              <Stack gap="sm">
                {topFormations.slice(0, 10).map((item: any, idx: number) => {
                  const maxCount = Math.max(...topFormations.map((t: any) => t.count), 1);
                  const percentage = Math.round((item.count / maxCount) * 100);
                  const colors = ['indigo', 'blue', 'violet', 'grape', 'pink', 'orange', 'teal', 'cyan', 'lime', 'yellow'];

                  return (
                    <div key={idx}>
                      <Group justify="space-between" mb={4}>
                        <Group gap="xs">
                          <Badge size="sm" variant="light" color={colors[idx % colors.length]}>
                            #{idx + 1}
                          </Badge>
                          <Text size="sm" fw={500} lineClamp={1}>{item.nom}</Text>
                        </Group>
                        <Text size="sm" fw={600}>{item.count}</Text>
                      </Group>
                      <Progress
                        value={percentage}
                        size="md"
                        radius="xl"
                        color={colors[idx % colors.length]}
                      />
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

      {/* Bottom row: Categories */}
      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper shadow="sm" radius="md" p="lg" withBorder h="100%">
            <Group gap="xs" mb="md">
              <ThemeIcon size={36} radius="md" variant="light" color="violet">
                <GraduationCap size={20} weight="duotone" />
              </ThemeIcon>
              <div>
                <Title order={3}>Repartition par categorie</Title>
                <Text size="sm" c="dimmed">Types de formations</Text>
              </div>
            </Group>
            {formationsByCategorie.length > 0 ? (
              <Stack gap="sm">
                {formationsByCategorie.map((item: any, idx: number) => {
                  const total = formationsByCategorie.reduce((s: number, c: any) => s + c.count, 0);
                  const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                  const colors = ['blue', 'violet', 'grape', 'pink', 'orange', 'teal', 'cyan', 'indigo'];

                  return (
                    <div key={idx}>
                      <Group justify="space-between" mb={4}>
                        <Text size="sm" fw={500} lineClamp={1} style={{ flex: 1 }}>
                          {item.categorie}
                        </Text>
                        <Group gap="xs">
                          <Text size="sm" fw={600}>{item.count}</Text>
                          <Text size="xs" c="dimmed">({percentage}%)</Text>
                        </Group>
                      </Group>
                      <Progress
                        value={percentage}
                        size="md"
                        radius="xl"
                        color={colors[idx % colors.length]}
                      />
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
    </Container>
  );
}
