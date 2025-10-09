'use client';

import { useEffect, useState } from 'react';
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
  XCircle,
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

  // Charger les données du dashboard
  const loadDashboardData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const [summaryData, chartsData, alertsData] = await Promise.all([
        statsService.getDashboardSummary(periode, date),
        statsService.getDashboardCharts(),
        statsService.getDashboardAlerts()
      ]);
      
      setSummary(summaryData);
      setCharts(chartsData);
      setAlerts(alertsData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
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
  };

  useEffect(() => {
    loadDashboardData();
  }, [periode, date]); // Recharger quand la période change

  useEffect(() => {
    // Rafraîchissement automatique toutes les 5 minutes
    const interval = setInterval(() => loadDashboardData(false), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

  // Définition des 12 KPIs optimisés
  const kpiCards = summary ? [
    // Ligne 1 : Vue d'ensemble (4 KPIs)
    {
      title: "Total collaborateurs",
      value: summary.totalCollaborateurs || 0,
      subtitle: `${summary.collaborateursActifs || 0} actifs`,
      icon: Users,
      color: "blue",
    },
    {
      title: "Taux de participation",
      value: `${summary.tauxParticipation || 0}%`,
      subtitle: "Collaborateurs formés",
      icon: ChartLine,
      color: "teal",
      progress: summary.tauxParticipation || 0,
    },
    {
      title: "Budget utilisé",
      value: `${summary.tauxBudget || 0}%`,
      subtitle: `${(summary.budgetUtilise / 1000).toFixed(0)}k€ / ${(summary.budgetPrevu / 1000).toFixed(0)}k€`,
      icon: Package,
      color: summary.tauxBudget > 90 ? "red" : summary.tauxBudget > 75 ? "orange" : "green",
      progress: summary.tauxBudget || 0,
    },
    {
      title: "Taux d'assiduité",
      value: `${summary.tauxAssiduite || 0}%`,
      subtitle: "Sessions honorées",
      icon: CheckCircle,
      color: "cyan",
      progress: summary.tauxAssiduite || 0,
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

    // Ligne 3 : Performance & Qualité (3 KPIs)
    {
      title: "Formations obligatoires",
      value: `${summary.tauxObligatoires || 0}%`,
      subtitle: `${summary.formationsObligatoiresCompletees || 0}/${summary.formationsObligatoiresTotal || 0}`,
      icon: WarningCircle,
      color: summary.tauxObligatoires < 100 ? "red" : "green",
      progress: summary.tauxObligatoires || 0,
    },
    {
      title: "Taux annulation",
      value: `${summary.tauxAnnulation || 0}%`,
      subtitle: "À minimiser",
      icon: XCircle,
      color: summary.tauxAnnulation > 10 ? "red" : "gray",
      progress: summary.tauxAnnulation || 0,
    },
    {
      title: "Temps moyen complétion",
      value: `${summary.tempsMoyenCompletion || 0}j`,
      subtitle: "De début à fin",
      icon: Clock,
      color: "violet",
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
      title: "Départements actifs",
      value: summary.nombreDepartements || 0,
      subtitle: "Services",
      icon: Buildings,
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
            {[...Array(12)].map((_, i) => (
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
            <Text size="lg" c="dimmed">Vue d'ensemble avec 12 KPIs optimisés</Text>
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
            bg={kpi.highlight ? 'var(--mantine-color-blue-0)' : undefined}
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

      {/* Graphiques avec couleurs corrigées */}
      <Grid gutter="lg" mb="xl">
        {/* Évolution mensuelle */}
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Paper shadow="sm" radius="md" p="lg" withBorder bg="white">
            <Group justify="space-between" mb="md">
              <div>
                <Title order={3}>Évolution des sessions</Title>
                <Text size="sm" c="dimmed">12 derniers mois</Text>
              </div>
            </Group>
            {charts?.evolutionMensuelle && charts.evolutionMensuelle.length > 0 ? (
              <Stack gap="md">
                {/* Graphique simplifié avec barres */}
                <SimpleGrid cols={12} spacing="xs">
                  {charts.evolutionMensuelle.map((item: any, idx: number) => (
                    <div key={idx}>
                      <Tooltip label={`${item.month}: ${item.sessions} sessions`}>
                        <Box>
                          <Box
                            h={100}
                            bg="gray.1"
                            style={{ 
                              position: 'relative',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}
                          >
                            <Box
                              bg="blue.5"
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                width: '100%',
                                height: `${Math.min((item.sessions / Math.max(...charts.evolutionMensuelle.map((d: any) => d.sessions))) * 100, 100)}%`,
                                transition: 'height 0.3s ease',
                              }}
                            />
                          </Box>
                          <Text size="xs" ta="center" mt={4} c="dark">
                            {item.month.split(' ')[0]}
                          </Text>
                          <Text size="xs" ta="center" fw={600}>
                            {item.sessions}
                          </Text>
                        </Box>
                      </Tooltip>
                    </div>
                  ))}
                </SimpleGrid>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">Min: {Math.min(...charts.evolutionMensuelle.map((d: any) => d.sessions))}</Text>
                  <Text size="xs" c="dimmed">Max: {Math.max(...charts.evolutionMensuelle.map((d: any) => d.sessions))}</Text>
                  <Text size="xs" c="dimmed">Moy: {Math.round(charts.evolutionMensuelle.reduce((sum: number, d: any) => sum + d.sessions, 0) / charts.evolutionMensuelle.length)}</Text>
                </Group>
              </Stack>
            ) : (
              <Center h={200}>
                <Text c="dimmed">Aucune donnée disponible</Text>
              </Center>
            )}
          </Paper>
        </Grid.Col>

        {/* Répartition par département avec légende */}
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Paper shadow="sm" radius="md" p="lg" withBorder bg="white">
            <Group justify="space-between" mb="md">
              <div>
                <Title order={3}>Répartition par département</Title>
                <Text size="sm" c="dimmed">Collaborateurs formés par service</Text>
              </div>
            </Group>
            {charts?.repartitionDepartements && charts.repartitionDepartements.length > 0 ? (
              <Stack gap="md">
                {/* Stats globales */}
                <Group justify="center" gap="xl">
                  <Stack align="center" gap={0}>
                    <Text size="2rem" fw={700} c="blue">
                      {charts.repartitionDepartements.reduce((sum: number, d: any) => sum + d.value, 0)}
                    </Text>
                    <Text size="xs" c="dimmed">Total formés</Text>
                  </Stack>
                  <Stack align="center" gap={0}>
                    <Text size="2rem" fw={700} c="teal">
                      {charts.repartitionDepartements.length}
                    </Text>
                    <Text size="xs" c="dimmed">Départements</Text>
                  </Stack>
                </Group>
                
                <Divider />
                
                {/* Liste des départements avec barres de progression */}
                <Stack gap="xs">
                  {charts.repartitionDepartements.slice(0, 8).map((dept: any, idx: number) => {
                    const maxValue = Math.max(...charts.repartitionDepartements.map((d: any) => d.value));
                    const percentage = Math.round((dept.value / maxValue) * 100);
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
                              {dept.value}
                            </Text>
                            <Text size="xs" c="dimmed">
                              ({percentage}%)
                            </Text>
                          </Group>
                        </Group>
                        <Progress 
                          value={percentage} 
                          size="md" 
                          radius="xl"
                          color={colors[idx % colors.length]}
                          animated
                        />
                      </Box>
                    );
                  })}
                </Stack>
                
                {charts.repartitionDepartements.length > 8 && (
                  <Text size="xs" c="dimmed" ta="center">
                    +{charts.repartitionDepartements.length - 8} autres départements
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
      </Grid>

      {/* Top formations avec couleurs visibles */}
      <Grid gutter="lg" mb="xl">
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper shadow="sm" radius="md" p="lg" withBorder bg="white">
            <Group justify="space-between" mb="md">
              <div>
                <Title order={3}>Top 5 formations</Title>
                <Text size="sm" c="dimmed">Les plus populaires</Text>
              </div>
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
                    <Table.Th style={{ textAlign: 'right' }}>Inscriptions</Table.Th>
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

        {/* Alertes corrigées */}
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper shadow="sm" radius="md" p="lg" withBorder>
            <Group justify="space-between" mb="md">
              <div>
                <Title order={3}>Alertes & Notifications</Title>
                <Text size="sm" c="dimmed">Points d'attention</Text>
              </div>
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
                      <Text fw={500}>{alerts.alertes.collaborateursSansFormation} collaborateurs sans formation</Text>
                      <Text size="xs">Cliquez pour voir la liste</Text>
                    </Alert>
                  )}
                  
                  {alerts.alertes.sessionsLongues > 0 && (
                    <Alert 
                      icon={<Warning size={16} />} 
                      color="yellow"
                      variant="light"
                    >
                      <Text fw={500}>{alerts.alertes.sessionsLongues} sessions en cours depuis +30 jours</Text>
                      <Text size="xs">Vérifier leur progression</Text>
                    </Alert>
                  )}
                  
                  {alerts.alertes.formationsSansSession > 0 && (
                    <Alert 
                      icon={<Info size={16} />} 
                      color="blue"
                      variant="light"
                    >
                      <Text fw={500}>{alerts.alertes.formationsSansSession} formations sans sessions</Text>
                      <Text size="xs">Formations jamais dispensées</Text>
                    </Alert>
                  )}
                  
                  {alerts.alertes.nouvellesInscriptions > 0 && (
                    <Alert 
                      icon={<CheckCircle size={16} />} 
                      color="green"
                      variant="light"
                    >
                      <Text fw={500}>{alerts.alertes.nouvellesInscriptions} nouvelles inscriptions</Text>
                      <Text size="xs">Ces 30 derniers jours</Text>
                    </Alert>
                  )}
                </>
              )}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Sessions à venir */}
      {alerts?.sessionsAVenir && alerts.sessionsAVenir.length > 0 && (
        <Paper shadow="sm" radius="md" p="lg" withBorder>
          <Group justify="space-between" mb="md">
            <div>
              <Title order={3}>Sessions à venir</Title>
              <Text size="sm" c="dimmed">Prochains 7 jours</Text>
            </div>
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