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
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { ArrowClockwise } from '@phosphor-icons/react/dist/ssr/ArrowClockwise';
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap';
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr/ShieldCheck';
import { notifications } from '@mantine/notifications';
import { managerPortalService, ManagerTeamStats } from '@/lib/services/manager-portal.service';

export default function ManagerStatsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ManagerTeamStats | null>(null);

  // Period selector
  const [periode, setPeriode] = useState<'annee' | 'mois'>('annee');
  const [date, setDate] = useState(new Date().getFullYear().toString());

  // Generate years list
  const annees = Array.from({ length: 6 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { label: year.toString(), value: year.toString() };
  });

  const loadStats = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      try {
        const data = await managerPortalService.getTeamStats(periode, date);
        setStats(data);
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
    [periode, date]
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
              <Skeleton height={350} radius="md" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Skeleton height={350} radius="md" />
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
            <Title order={1}>Statistiques de l'equipe</Title>
            <Text size="lg" c="dimmed">
              {stats?.periode?.libelle || 'Indicateurs de performance'}
            </Text>
          </div>
          <Group>
            <Select
              value={date}
              onChange={(v) => setDate(v || new Date().getFullYear().toString())}
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

      {/* KPI Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="xl">
        <Card shadow="sm" radius="md" withBorder p="md">
          <Group justify="space-between" mb="xs">
            <ThemeIcon size={32} radius="md" variant="light" color="green">
              <CheckCircle size={18} weight="duotone" />
            </ThemeIcon>
            <RingProgress
              size={40}
              thickness={3}
              roundCaps
              sections={[
                {
                  value: stats?.kpis?.tauxCompletion || 0,
                  color:
                    (stats?.kpis?.tauxCompletion || 0) >= 80
                      ? 'green'
                      : (stats?.kpis?.tauxCompletion || 0) >= 50
                        ? 'orange'
                        : 'red',
                },
              ]}
            />
          </Group>
          <Text size="xs" c="dimmed" fw={600} tt="uppercase">
            Taux completion
          </Text>
          <Text size="xl" fw={700}>
            {stats?.kpis?.tauxCompletion || 0}%
          </Text>
          <Text size="xs" c="dimmed">
            Formations terminees
          </Text>
        </Card>

        <Card shadow="sm" radius="md" withBorder p="md">
          <Group justify="space-between" mb="xs">
            <ThemeIcon size={32} radius="md" variant="light" color="orange">
              <Clock size={18} weight="duotone" />
            </ThemeIcon>
          </Group>
          <Text size="xs" c="dimmed" fw={600} tt="uppercase">
            Heures totales
          </Text>
          <Text size="xl" fw={700}>
            {stats?.kpis?.totalHeures || 0}h
          </Text>
          <Text size="xs" c="dimmed">
            Formation de l'equipe
          </Text>
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
              sections={[
                {
                  value: stats?.kpis?.formationsObligatoiresCompliance || 0,
                  color:
                    (stats?.kpis?.formationsObligatoiresCompliance || 0) >= 80
                      ? 'green'
                      : 'orange',
                },
              ]}
            />
          </Group>
          <Text size="xs" c="dimmed" fw={600} tt="uppercase">
            Obligatoires
          </Text>
          <Text size="xl" fw={700}>
            {stats?.kpis?.formationsObligatoiresCompliance || 0}%
          </Text>
          <Text size="xs" c="dimmed">
            Compliance
          </Text>
        </Card>

        <Card shadow="sm" radius="md" withBorder p="md">
          <Group justify="space-between" mb="xs">
            <ThemeIcon size={32} radius="md" variant="light" color="blue">
              <Users size={18} weight="duotone" />
            </ThemeIcon>
          </Group>
          <Text size="xs" c="dimmed" fw={600} tt="uppercase">
            Collaborateurs formes
          </Text>
          <Text size="xl" fw={700}>
            {stats?.kpis?.collaborateursFormes || 0}
          </Text>
          <Text size="xs" c="dimmed">
            {stats?.kpis?.collaborateursNonFormes || 0} non formes
          </Text>
        </Card>
      </SimpleGrid>

      <Divider my="xl" />

      {/* Charts */}
      <Grid gutter="lg" mb="xl">
        {/* Heures par collaborateur */}
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper shadow="sm" radius="md" p="lg" withBorder h="100%">
            <Group gap="xs" mb="md">
              <ThemeIcon size={36} radius="md" variant="light" color="blue">
                <Users size={20} weight="duotone" />
              </ThemeIcon>
              <div>
                <Title order={3}>Heures par collaborateur</Title>
                <Text size="sm" c="dimmed">
                  Top collaborateurs
                </Text>
              </div>
            </Group>
            {stats?.heuresParCollaborateur && stats.heuresParCollaborateur.length > 0 ? (
              <Stack gap="sm">
                {stats.heuresParCollaborateur.slice(0, 10).map((item, idx) => {
                  const maxHeures = Math.max(
                    ...stats.heuresParCollaborateur.map((h) => h.heures),
                    1
                  );
                  const percentage = Math.round((item.heures / maxHeures) * 100);
                  const colors = [
                    'blue',
                    'violet',
                    'grape',
                    'pink',
                    'orange',
                    'teal',
                    'cyan',
                    'indigo',
                    'lime',
                    'yellow',
                  ];

                  return (
                    <div key={item.id}>
                      <Group justify="space-between" mb={4}>
                        <Group gap="xs">
                          <Badge size="sm" variant="light" color={colors[idx % colors.length]}>
                            #{idx + 1}
                          </Badge>
                          <Text size="sm" fw={500} lineClamp={1}>
                            {item.nom}
                          </Text>
                        </Group>
                        <Text size="sm" fw={600}>
                          {item.heures}h
                        </Text>
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

        {/* Evolution mensuelle */}
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper shadow="sm" radius="md" p="lg" withBorder h="100%">
            <Group gap="xs" mb="md">
              <ThemeIcon size={36} radius="md" variant="light" color="teal">
                <ChartBar size={20} weight="duotone" />
              </ThemeIcon>
              <div>
                <Title order={3}>Evolution mensuelle</Title>
                <Text size="sm" c="dimmed">
                  Formations et heures par mois
                </Text>
              </div>
            </Group>
            {stats?.evolutionMensuelle && stats.evolutionMensuelle.length > 0 ? (
              <Stack gap="md">
                <SimpleGrid
                  cols={Math.min(stats.evolutionMensuelle.length, 12)}
                  spacing="xs"
                >
                  {stats.evolutionMensuelle.map((item, idx) => {
                    const maxFormations = Math.max(
                      ...stats.evolutionMensuelle.map((d) => d.formations),
                      1
                    );
                    const barHeight = Math.min(
                      (item.formations / maxFormations) * 100,
                      100
                    );

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
                              backgroundColor: 'var(--mantine-color-teal-5)',
                              transition: 'height 0.3s ease',
                            }}
                          />
                        </div>
                        <Text size="xs" ta="center" mt={4}>
                          {item.mois?.split(' ')[0] || ''}
                        </Text>
                        <Text size="xs" ta="center" fw={600}>
                          {item.formations}
                        </Text>
                      </div>
                    );
                  })}
                </SimpleGrid>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Total:{' '}
                    {stats.evolutionMensuelle.reduce((sum, m) => sum + m.formations, 0)}{' '}
                    formations
                  </Text>
                  <Text size="xs" c="dimmed">
                    {stats.evolutionMensuelle.reduce((sum, m) => sum + m.heures, 0)}h
                    cumulees
                  </Text>
                </Group>
              </Stack>
            ) : (
              <Center h={200}>
                <Text c="dimmed">Aucune donnee disponible</Text>
              </Center>
            )}
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Bottom row: Categories + Mandatory */}
      <Grid gutter="lg">
        {/* Repartition par categorie */}
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper shadow="sm" radius="md" p="lg" withBorder h="100%">
            <Group gap="xs" mb="md">
              <ThemeIcon size={36} radius="md" variant="light" color="violet">
                <GraduationCap size={20} weight="duotone" />
              </ThemeIcon>
              <div>
                <Title order={3}>Repartition par categorie</Title>
                <Text size="sm" c="dimmed">
                  Types de formations
                </Text>
              </div>
            </Group>
            {stats?.repartitionCategorie && stats.repartitionCategorie.length > 0 ? (
              <Stack gap="sm">
                {stats.repartitionCategorie.map((item, idx) => {
                  const colors = [
                    'blue',
                    'violet',
                    'grape',
                    'pink',
                    'orange',
                    'teal',
                    'cyan',
                    'indigo',
                  ];

                  return (
                    <div key={idx}>
                      <Group justify="space-between" mb={4}>
                        <Text size="sm" fw={500}>
                          {item.categorie}
                        </Text>
                        <Group gap="xs">
                          <Text size="sm" fw={600}>
                            {item.count}
                          </Text>
                          <Text size="xs" c="dimmed">
                            ({item.pourcentage}%)
                          </Text>
                        </Group>
                      </Group>
                      <Progress
                        value={item.pourcentage}
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

        {/* Formations obligatoires compliance */}
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper shadow="sm" radius="md" p="lg" withBorder h="100%">
            <Group gap="xs" mb="md">
              <ThemeIcon size={36} radius="md" variant="light" color="orange">
                <ShieldCheck size={20} weight="duotone" />
              </ThemeIcon>
              <div>
                <Title order={3}>Formations obligatoires</Title>
                <Text size="sm" c="dimmed">
                  Taux de compliance par formation
                </Text>
              </div>
            </Group>
            {stats?.obligatoiresCompliance && stats.obligatoiresCompliance.length > 0 ? (
              <Stack gap="sm">
                {stats.obligatoiresCompliance.map((item, idx) => (
                  <div key={idx}>
                    <Group justify="space-between" mb={4}>
                      <Text size="sm" fw={500} lineClamp={1} style={{ flex: 1 }}>
                        {item.formation}
                      </Text>
                      <Group gap="xs">
                        <Text size="sm" fw={600}>
                          {item.formes}/{item.total}
                        </Text>
                        <Badge
                          size="sm"
                          variant="light"
                          color={
                            item.taux >= 80 ? 'green' : item.taux >= 50 ? 'orange' : 'red'
                          }
                        >
                          {item.taux}%
                        </Badge>
                      </Group>
                    </Group>
                    <Progress
                      value={item.taux}
                      size="md"
                      radius="xl"
                      color={item.taux >= 80 ? 'green' : item.taux >= 50 ? 'orange' : 'red'}
                    />
                  </div>
                ))}
              </Stack>
            ) : (
              <Center h={200}>
                <Stack align="center" gap="xs">
                  <ThemeIcon size={60} radius="xl" variant="light" color="green">
                    <CheckCircle size={30} weight="duotone" />
                  </ThemeIcon>
                  <Text size="sm" c="dimmed">
                    Aucune formation obligatoire
                  </Text>
                </Stack>
              </Center>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
