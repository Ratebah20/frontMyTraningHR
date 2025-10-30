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
  Progress,
  ThemeIcon,
  Stack,
  Paper,
  Skeleton,
  Box,
  Alert,
  Center,
  SimpleGrid,
  RingProgress,
  Divider,
  Tooltip,
  Table,
  SegmentedControl,
} from '@mantine/core';
import { AreaChart, DonutChart, BarChart } from '@tremor/react';
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  CheckCircle,
  ArrowUpRight,
  Clock,
  Warning,
  ChartLine,
  TrendUp,
  WarningCircle,
  Info,
  ArrowClockwise,
  Buildings,
  BookOpen,
  UserPlus,
  Package,
  Tag,
} from '@phosphor-icons/react';
import { statsService } from '@/lib/services';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { PeriodSelector } from '@/components/PeriodSelector';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [alerts, setAlerts] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // États pour le sélecteur de période
  const [periode, setPeriode] = useState<'annee' | 'mois'>('annee');
  const [date, setDate] = useState(new Date().getFullYear().toString());

  // État pour le mode d'affichage de l'évolution des sessions
  const [evolutionViewMode, setEvolutionViewMode] = useState<'numbers' | 'percentages'>('numbers');

  // Charger les données du dashboard
  const loadDashboardData = useCallback(async (showLoader = true) => {
    console.log('🔄 Chargement dashboard avec:', { periode, date });
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const [summaryData, chartsData, alertsData] = await Promise.all([
        statsService.getDashboardSummary(periode, date),
        statsService.getDashboardCharts(periode, date),
        statsService.getDashboardAlerts(periode, date)
      ]);

      console.log('✅ Données chargées:', { summaryData, chartsData, alertsData });
      setSummary(summaryData);
      setCharts(chartsData);
      setAlerts(alertsData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ Erreur lors du chargement du dashboard:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les données du dashboard',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [periode, date]); // Dépend de periode et date

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]); // Recharger quand loadDashboardData change (donc quand periode ou date change)

  useEffect(() => {
    // Rafraîchissement automatique toutes les 5 minutes
    const interval = setInterval(() => loadDashboardData(false), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadDashboardData]); // Dépend de loadDashboardData pour toujours utiliser les valeurs actuelles

  // Formater la date de dernière mise à jour
  const formatLastUpdate = () => {
    if (!alerts?.derniereMAJ?.date) return "Jamais";
    const date = new Date(alerts.derniereMAJ.date);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Définition des 8 KPIs optimisés
  const kpiCards = summary ? [
    // Ligne 1 : Vue d'ensemble (2 KPIs)
    {
      title: "Total collaborateurs",
      value: summary.totalCollaborateurs || 0,
      subtitle: `${summary.collaborateursActifs || 0} actifs`,
      icon: Users,
      color: "blue",
    },
    {
      title: "Budget utilisé",
      value: `${summary.tauxBudget || 0}%`,
      subtitle: `${(summary.budgetUtilise / 1000).toFixed(0)}k€ / ${(summary.budgetPrevu / 1000).toFixed(0)}k€`,
      icon: Package,
      color: summary.tauxBudget > 90 ? "red" : summary.tauxBudget > 75 ? "orange" : "green",
      progress: summary.tauxBudget || 0,
    },

    // Ligne 2 : Sessions actives (3 KPIs)
    {
      title: "Sessions en cours",
      value: summary.sessionsEnCours || 0,
      subtitle: "Actuellement",
      icon: ChartLine,
      color: "green",
      highlight: true,
    },
    {
      title: "Sessions planifiées",
      value: summary.sessionsPlanifiees || 0,
      subtitle: "À venir",
      icon: Calendar,
      color: "blue",
    },
    {
      title: "Sessions terminées",
      value: summary.sessionsTerminees || 0,
      subtitle: periode === 'mois' ? 'Ce mois' : 'Cette année',
      icon: CheckCircle,
      color: "teal",
    },

    // Ligne 3 : Performance & Qualité (1 KPI)
    {
      title: "Formations obligatoires",
      value: `${summary.tauxObligatoires || 0}%`,
      subtitle: `${summary.formationsObligatoiresCompletees || 0}/${summary.formationsObligatoiresTotal || 0}`,
      icon: WarningCircle,
      color: summary.tauxObligatoires < 100 ? "red" : "green",
      progress: summary.tauxObligatoires || 0,
    },

    // Ligne 4 : Volumétrie (2 KPIs)
    {
      title: "Heures formation",
      value: summary.heuresFormationPeriode || 0,
      subtitle: periode === 'mois' ? 'Ce mois' : 'Cette année',
      icon: Clock,
      color: "orange",
    },
    {
      title: "Collaborateurs formés",
      value: summary.nombreDepartements || 0,
      subtitle: periode === 'mois' ? 'Ce mois' : 'Cette année',
      icon: Users,
      color: "pink",
    },
  ] : [];

  if (loading) {
    return (
      <Container size="xl">
        <Stack gap="xl">
          <div>
            <Title order={1}>Tableau de bord</Title>
            <Text size="lg" c="dimmed">Chargement des données...</Text>
          </div>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
            {[...Array(8)].map((_, i) => (
              <Card key={i} shadow="sm" radius="md" withBorder>
                <Skeleton height={120} />
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Stack gap="lg" mb="xl">
        <Group justify="space-between">
          <div>
            <Title order={1}>Tableau de bord</Title>
            <Text size="lg" c="dimmed">Vue d'ensemble avec 8 KPIs optimisés</Text>
          </div>
          <Group>
            {alerts?.derniereMAJ && (
              <Badge size="lg" variant="light" color="blue" leftSection={<Info size={14} />}>
                Dernière synchro : {formatLastUpdate()}
              </Badge>
            )}
            <Button
              variant="light"
              size="sm"
              onClick={() => loadDashboardData(false)}
              loading={refreshing}
              leftSection={<ArrowClockwise size={16} />}
            >
              Actualiser
            </Button>
          </Group>
        </Group>

        {/* Sélecteur de période */}
        <Paper shadow="sm" radius="md" p="md" withBorder>
          <PeriodSelector
            periode={periode}
            date={date}
            onChange={(newPeriode, newDate) => {
              setPeriode(newPeriode);
              setDate(newDate);
            }}
          />
        </Paper>
      </Stack>

      {/* 12 KPIs Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md" mb="xl">
        {kpiCards.map((kpi, index) => (
          <Card
            key={index}
            shadow="sm"
            radius="md"
            withBorder
            p="md"
          >
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

      {/* Section Analytics - Ligne 1 */}
      <Grid gutter="lg" mb="lg">
        {/* Évolution mensuelle */}
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper shadow="sm" radius="md" p="lg" withBorder h="100%">
            <Group justify="space-between" mb="md">
              <Group gap="xs">
                <ThemeIcon size={36} radius="md" variant="light" color="blue">
                  <ChartLine size={20} weight="duotone" />
                </ThemeIcon>
                <div>
                  <Title order={3}>Évolution des sessions</Title>
                  <Text size="sm" c="dimmed">12 derniers mois</Text>
                </div>
              </Group>
              <SegmentedControl
                size="xs"
                value={evolutionViewMode}
                onChange={(value) => setEvolutionViewMode(value as 'numbers' | 'percentages')}
                data={[
                  { label: 'Chiffres', value: 'numbers' },
                  { label: '%', value: 'percentages' },
                ]}
              />
            </Group>
            {charts?.evolutionMensuelle && charts.evolutionMensuelle.length > 0 ? (
              <Stack gap="md">
                {/* Graphique simplifié avec barres */}
                <SimpleGrid cols={12} spacing="xs">
                  {charts.evolutionMensuelle.map((item: any, idx: number) => {
                    // Calculer le pourcentage de variation par rapport au mois précédent
                    const previousSessions = idx > 0 ? charts.evolutionMensuelle[idx - 1].sessions : item.sessions;
                    const percentageChange = previousSessions !== 0
                      ? Math.round(((item.sessions - previousSessions) / previousSessions) * 100)
                      : 0;

                    const displayValue = evolutionViewMode === 'numbers' ? item.sessions : percentageChange;
                    const maxValue = evolutionViewMode === 'numbers'
                      ? Math.max(...charts.evolutionMensuelle.map((d: any) => d.sessions))
                      : Math.max(...charts.evolutionMensuelle.map((d: any, i: number) => {
                          const prev = i > 0 ? charts.evolutionMensuelle[i - 1].sessions : d.sessions;
                          return prev !== 0 ? Math.abs(((d.sessions - prev) / prev) * 100) : 0;
                        }));

                    const barHeight = evolutionViewMode === 'numbers'
                      ? Math.min((item.sessions / maxValue) * 100, 100)
                      : Math.min((Math.abs(percentageChange) / maxValue) * 100, 100);

                    const barColor = evolutionViewMode === 'numbers'
                      ? 'blue.5'
                      : percentageChange >= 0 ? 'green.5' : 'red.5';

                    return (
                      <div key={idx}>
                        <Tooltip
                          label={
                            evolutionViewMode === 'numbers'
                              ? `${item.month}: ${item.sessions} sessions`
                              : `${item.month}: ${percentageChange > 0 ? '+' : ''}${percentageChange}%`
                          }
                        >
                          <Box>
                            <Box
                              h={100}
                              style={{
                                position: 'relative',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                backgroundColor: 'var(--mantine-color-default-border)'
                              }}
                            >
                              <Box
                                bg={barColor}
                                style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  width: '100%',
                                  height: `${barHeight}%`,
                                  transition: 'height 0.3s ease, background-color 0.3s ease',
                                }}
                              />
                            </Box>
                            <Text size="xs" ta="center" mt={4}>
                              {item.month.split(' ')[0]}
                            </Text>
                            <Text size="xs" ta="center" fw={600}>
                              {evolutionViewMode === 'numbers'
                                ? displayValue
                                : `${displayValue > 0 ? '+' : ''}${displayValue}%`}
                            </Text>
                          </Box>
                        </Tooltip>
                      </div>
                    );
                  })}
                </SimpleGrid>
                <Group justify="space-between">
                  {evolutionViewMode === 'numbers' ? (
                    <>
                      <Text size="xs" c="dimmed">Min: {Math.min(...charts.evolutionMensuelle.map((d: any) => d.sessions))}</Text>
                      <Text size="xs" c="dimmed">Max: {Math.max(...charts.evolutionMensuelle.map((d: any) => d.sessions))}</Text>
                      <Text size="xs" c="dimmed">Moy: {Math.round(charts.evolutionMensuelle.reduce((sum: number, d: any) => sum + d.sessions, 0) / charts.evolutionMensuelle.length)}</Text>
                    </>
                  ) : (
                    <>
                      <Text size="xs" c="dimmed">Variation mensuelle moyenne</Text>
                      <Text size="xs" c="dimmed" fw={600}>
                        {Math.round(
                          charts.evolutionMensuelle.reduce((sum: number, d: any, i: number) => {
                            if (i === 0) return sum;
                            const prev = charts.evolutionMensuelle[i - 1].sessions;
                            return sum + (prev !== 0 ? ((d.sessions - prev) / prev) * 100 : 0);
                          }, 0) / (charts.evolutionMensuelle.length - 1)
                        )}%
                      </Text>
                    </>
                  )}
                </Group>
              </Stack>
            ) : (
              <Center h={200}>
                <Text c="dimmed">Aucune donnée disponible</Text>
              </Center>
            )}
          </Paper>
        </Grid.Col>

        {/* Alertes & Notifications */}
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper shadow="sm" radius="md" p="lg" withBorder h="100%">
            <Group justify="space-between" mb="md">
              <Group gap="xs">
                <ThemeIcon size={36} radius="md" variant="light" color="orange">
                  <Warning size={20} weight="duotone" />
                </ThemeIcon>
                <div>
                  <Title order={3}>Alertes & Notifications</Title>
                  <Text size="sm" c="dimmed">Points d'attention</Text>
                </div>
              </Group>
            </Group>
            <Stack gap="md">
              {alerts?.alertes && (
                <>
                  {alerts.alertes.collaborateursSansFormation > 0 && (
                    <Alert
                      icon={<WarningCircle size={16} />}
                      color="orange"
                      variant="light"
                      styles={{ root: { cursor: 'pointer' } }}
                      onClick={() => router.push('/collaborateurs')}
                    >
                      <Group justify="space-between">
                        <div>
                          <Text fw={500} size="sm">{alerts.alertes.collaborateursSansFormation} collaborateurs sans formation</Text>
                          <Text size="xs" c="dimmed">Cliquez pour voir la liste</Text>
                        </div>
                        <Badge size="lg" color="orange" variant="filled">
                          {alerts.alertes.collaborateursSansFormation}
                        </Badge>
                      </Group>
                    </Alert>
                  )}

                  {alerts.alertes.sessionsLongues > 0 && (
                    <Alert
                      icon={<Clock size={16} />}
                      color="yellow"
                      variant="light"
                    >
                      <Group justify="space-between">
                        <div>
                          <Text fw={500} size="sm">{alerts.alertes.sessionsLongues} sessions en cours depuis +30 jours</Text>
                          <Text size="xs" c="dimmed">Vérifier leur progression</Text>
                        </div>
                        <Badge size="lg" color="yellow" variant="filled">
                          {alerts.alertes.sessionsLongues}
                        </Badge>
                      </Group>
                    </Alert>
                  )}

                  {alerts.alertes.formationsSansSession > 0 && (
                    <Alert
                      icon={<Info size={16} />}
                      color="blue"
                      variant="light"
                    >
                      <Group justify="space-between">
                        <div>
                          <Text fw={500} size="sm">{alerts.alertes.formationsSansSession} formations sans sessions</Text>
                          <Text size="xs" c="dimmed">Formations jamais dispensées</Text>
                        </div>
                        <Badge size="lg" color="blue" variant="filled">
                          {alerts.alertes.formationsSansSession}
                        </Badge>
                      </Group>
                    </Alert>
                  )}

                  {alerts.alertes.nouvellesInscriptions > 0 && (
                    <Alert
                      icon={<CheckCircle size={16} />}
                      color="green"
                      variant="light"
                    >
                      <Group justify="space-between">
                        <div>
                          <Text fw={500} size="sm">{alerts.alertes.nouvellesInscriptions} nouvelles inscriptions</Text>
                          <Text size="xs" c="dimmed">Ces 30 derniers jours</Text>
                        </div>
                        <Badge size="lg" color="green" variant="filled">
                          {alerts.alertes.nouvellesInscriptions}
                        </Badge>
                      </Group>
                    </Alert>
                  )}

                  {!alerts.alertes.collaborateursSansFormation &&
                   !alerts.alertes.sessionsLongues &&
                   !alerts.alertes.formationsSansSession &&
                   !alerts.alertes.nouvellesInscriptions && (
                    <Center h={200}>
                      <Stack align="center" gap="xs">
                        <ThemeIcon size={60} radius="xl" variant="light" color="green">
                          <CheckCircle size={30} weight="duotone" />
                        </ThemeIcon>
                        <Text size="sm" c="dimmed">Aucune alerte</Text>
                      </Stack>
                    </Center>
                  )}
                </>
              )}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Section Analytics - Ligne 2 */}
      <Grid gutter="lg" mb="xl">
        {/* Répartition par département */}
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper shadow="sm" radius="md" p="lg" withBorder h="100%">
            <Group justify="space-between" mb="md">
              <Group gap="xs">
                <ThemeIcon size={36} radius="md" variant="light" color="teal">
                  <Buildings size={20} weight="duotone" />
                </ThemeIcon>
                <div>
                  <Title order={3}>Répartition par département</Title>
                  <Text size="sm" c="dimmed">Collaborateurs formés par service</Text>
                </div>
              </Group>
            </Group>
            {charts?.repartitionDepartements && charts.repartitionDepartements.departements && charts.repartitionDepartements.departements.length > 0 ? (
              <Stack gap="md">
                {/* Stats globales */}
                <Group justify="center" gap="xl">
                  <Stack align="center" gap={0}>
                    <Text size="2rem" fw={700} c="blue">
                      {charts.repartitionDepartements.totalGlobalFormes || 0}
                    </Text>
                    <Text size="xs" c="dimmed">Total formés</Text>
                  </Stack>
                  <Stack align="center" gap={0}>
                    <Text size="2rem" fw={700} c="teal">
                      {charts.repartitionDepartements.totalDepartements || 0}
                    </Text>
                    <Text size="xs" c="dimmed">Départements</Text>
                  </Stack>
                </Group>

                <Divider />

                {/* Liste des départements avec barres de progression */}
                <Stack gap="xs">
                  {charts.repartitionDepartements.departements.slice(0, 8).map((dept: any, idx: number) => {
                    const colors = ["blue", "violet", "grape", "pink", "orange", "teal", "cyan", "indigo"];

                    return (
                      <Box key={idx}>
                        <Group justify="space-between" mb={4}>
                          <Group gap="xs">
                            <Badge size="sm" variant="light" color={colors[idx % colors.length]}>
                              #{idx + 1}
                            </Badge>
                            <Text size="sm" fw={500}>
                              {dept.name}
                            </Text>
                          </Group>
                          <Group gap="xs">
                            <Text size="sm" fw={600}>
                              {dept.trained || 0}/{dept.total || 0}
                            </Text>
                            <Text size="xs" c="dimmed">
                              ({dept.value}%)
                            </Text>
                          </Group>
                        </Group>
                        <Progress
                          value={dept.value}
                          size="md"
                          radius="xl"
                          color={colors[idx % colors.length]}
                          animated
                        />
                      </Box>
                    );
                  })}
                </Stack>

                {charts.repartitionDepartements.totalDepartements > 8 && (
                  <Text size="xs" c="dimmed" ta="center">
                    +{charts.repartitionDepartements.totalDepartements - 8} autres départements
                  </Text>
                )}
              </Stack>
            ) : (
              <Center h={200}>
                <Text c="dimmed">Aucune donnée disponible</Text>
              </Center>
            )}
          </Paper>
        </Grid.Col>

        {/* Top formations */}
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper shadow="sm" radius="md" p="lg" withBorder h="100%">
            <Group justify="space-between" mb="md">
              <Group gap="xs">
                <ThemeIcon size={36} radius="md" variant="light" color="violet">
                  <BookOpen size={20} weight="duotone" />
                </ThemeIcon>
                <div>
                  <Title order={3}>Top 5 formations</Title>
                  <Text size="sm" c="dimmed">Les plus populaires</Text>
                </div>
              </Group>
              <Button
                variant="subtle"
                size="sm"
                rightSection={<ArrowUpRight size={14} />}
                onClick={() => router.push('/formations')}
              >
                Voir toutes
              </Button>
            </Group>
            {charts?.topFormations && charts.topFormations.length > 0 ? (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Formation</Table.Th>
                    <Table.Th>Catégorie</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Participants</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {charts.topFormations.map((formation: any, idx: number) => (
                    <Table.Tr key={idx}>
                      <Table.Td>
                        <Group gap="xs">
                          <Badge size="sm" variant="filled" color={["blue", "violet", "grape", "pink", "orange"][idx]}>
                            #{idx + 1}
                          </Badge>
                          <Text size="sm" fw={500} lineClamp={1}>
                            {formation.name}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="xs" variant="light" color="gray">
                          {formation.categorie || 'Non catégorisé'}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Group justify="flex-end" gap="xs">
                          <Text size="sm" fw={600}>
                            {formation.value}
                          </Text>
                          <Progress 
                            value={(formation.value / charts.topFormations[0].value) * 100} 
                            size="sm" 
                            style={{ width: 60 }}
                            color={["blue", "violet", "grape", "pink", "orange"][idx]}
                          />
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Center h={200}>
                <Text c="dimmed">Aucune formation disponible</Text>
              </Center>
            )}
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Sessions à venir */}
      {alerts?.sessionsAVenir && alerts.sessionsAVenir.length > 0 && (
        <Paper shadow="sm" radius="md" p="lg" withBorder>
          <Group justify="space-between" mb="md">
            <Group gap="xs">
              <ThemeIcon size={36} radius="md" variant="light" color="indigo">
                <Calendar size={20} weight="duotone" />
              </ThemeIcon>
              <div>
                <Title order={3}>Sessions à venir</Title>
                <Text size="sm" c="dimmed">Prochains 7 jours</Text>
              </div>
            </Group>
            <Button
              variant="subtle"
              size="sm"
              rightSection={<ArrowUpRight size={14} />}
              onClick={() => router.push('/sessions/calendar')}
            >
              Voir le calendrier
            </Button>
          </Group>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {alerts.sessionsAVenir.slice(0, 6).map((session: any) => (
              <Paper key={session.id} p="sm" withBorder radius="md">
                <Group justify="space-between" align="flex-start">
                  <div style={{ flex: 1 }}>
                    <Text fw={600} size="sm" lineClamp={1}>
                      {session.formation}
                    </Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      {session.collaborateur}
                    </Text>
                    <Group gap="xs" mt={4}>
                      <Badge size="xs" variant="light" color="blue">
                        {new Date(session.dateDebut).toLocaleDateString('fr-FR')}
                      </Badge>
                      {session.departement && (
                        <Badge size="xs" variant="light" color="gray">
                          {session.departement}
                        </Badge>
                      )}
                    </Group>
                  </div>
                  <Button 
                    size="xs" 
                    variant="subtle"
                    compact
                    onClick={() => router.push(`/sessions/${session.id}`)}
                  >
                    Voir
                  </Button>
                </Group>
              </Paper>
            ))}
          </SimpleGrid>
        </Paper>
      )}
    </Container>
  );
}