'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Paper,
  Grid,
  Card,
  Progress,
  Stack,
  Badge,
  ThemeIcon,
  Alert,
  Loader,
  Center,
  Select,
  SegmentedControl,
  Table,
  Tabs,
  RingProgress,
  SimpleGrid,
  Box,
  Flex,
  ActionIcon,
  Tooltip,
  Button,
  Modal,
  NumberInput,
  ScrollArea,
  Indicator,
  HoverCard,
  TextInput,
  Pagination,
  Collapse,
  Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import {
  CurrencyEur,
  TrendUp,
  TrendDown,
  Warning,
  Info,
  Buildings,
  BookOpen,
  Calendar,
  ChartBar,
  ChartPie,
  ChartLineUp,
  Users,
  Clock,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Equals,
  ArrowsClockwise,
  GridFour,
  CalendarBlank,
  WarningCircle,
  ListNumbers,
  Lightning,
  Target,
  Eye,
  MagnifyingGlass,
  CaretDown,
  CaretUp,
} from '@phosphor-icons/react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
} from 'recharts';
import { budgetAnalyticsService, DashboardComplet, PivotBudget, AnalysePeriode, FormationSansTarif } from '@/lib/services/budget-analytics.service';

const COLORS = ['#4C6EF5', '#15AABF', '#82C91E', '#FAB005', '#FA5252', '#BE4BDB', '#FD7E14', '#74C0FC'];
const LIGHT_COLORS = ['#A5C7FF', '#6DD4E0', '#B0E157', '#FFD43B', '#FF8787', '#E599F7', '#FFB366', '#B3DFFC'];
const QUARTER_COLORS = { Q1: '#4C6EF5', Q2: '#15AABF', Q3: '#82C91E', Q4: '#FAB005' };
const SEMESTER_COLORS = { S1: '#BE4BDB', S2: '#FD7E14' };

export default function BudgetAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardComplet | null>(null);
  const [pivot, setPivot] = useState<PivotBudget | null>(null);
  const [periodes, setPeriodes] = useState<{ trimestres: AnalysePeriode[], semestres: AnalysePeriode[] }>({ trimestres: [], semestres: [] });
  const [formationsSansTarif, setFormationsSansTarif] = useState<FormationSansTarif[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [viewPeriode, setViewPeriode] = useState<'trimestre' | 'semestre'>('trimestre');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriode, setSelectedPeriode] = useState<string>('Q1');
  
  // Modals
  const [tarifModalOpened, { open: openTarifModal, close: closeTarifModal }] = useDisclosure(false);
  const [selectedFormation, setSelectedFormation] = useState<FormationSansTarif | null>(null);
  const [tarifValue, setTarifValue] = useState<number>(0);
  
  // Pagination et filtres pour formations sans tarif
  const [formationsPage, setFormationsPage] = useState(1);
  const [formationsSearch, setFormationsSearch] = useState('');
  const formationsPerPage = 10;

  useEffect(() => {
    loadAllData();
  }, [selectedYear]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Charger toutes les données en parallèle
      const [dashboardData, pivotData, periodesData, formationsData] = await Promise.all([
        budgetAnalyticsService.getDashboardComplet(parseInt(selectedYear)),
        budgetAnalyticsService.getPivot(parseInt(selectedYear)),
        budgetAnalyticsService.getAllAnalysesPeriodes(parseInt(selectedYear)),
        budgetAnalyticsService.getFormationsSansTarif(),
      ]);
      
      setDashboard(dashboardData);
      setPivot(pivotData);
      setPeriodes(periodesData);
      setFormationsSansTarif(formationsData);
      
    } catch (error: any) {
      console.error('Erreur chargement analytics:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les données analytics',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
    notifications.show({
      title: 'Actualisé',
      message: 'Les données ont été mises à jour',
      color: 'green',
    });
  };

  const handleUpdateTarif = async () => {
    if (!selectedFormation || tarifValue <= 0) return;
    
    try {
      const result = await budgetAnalyticsService.updateTarifFormation(
        selectedFormation.id,
        tarifValue
      );
      
      notifications.show({
        title: 'Succès',
        message: `Tarif mis à jour: ${result.sessionsImpactees} sessions impactées`,
        color: 'green',
      });
      
      closeTarifModal();
      loadAllData();
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de mettre à jour le tarif',
        color: 'red',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'ok': return 'green';
      case 'attention': return 'orange';
      case 'critique': return 'red';
      default: return 'gray';
    }
  };

  const getAlertIcon = (niveau: string) => {
    switch (niveau) {
      case 'critique': return <WarningCircle size={20} weight="bold" />;
      case 'attention': return <Warning size={20} />;
      default: return <Info size={20} />;
    }
  };

  if (loading) {
    return (
      <Center h={600}>
        <Loader size="xl" />
      </Center>
    );
  }

  if (!dashboard) {
    return (
      <Container size="xl" py="lg">
        <Alert icon={<Warning size={20} />} color="orange">
          Aucune donnée disponible pour l'année {selectedYear}
        </Alert>
      </Container>
    );
  }

  const { consommationGlobale, top5Departements, top3Categories, alertes, formationsSansTarif: nbFormationsSansTarif } = dashboard;
  
  // Préparer les données pour les graphiques
  const monthlyData = (consommationGlobale?.consommationMensuelle || []).map(m => ({
    mois: `Mois ${m.mois}`,
    montant: m.montant,
    sessions: m.nombreSessions,
  }));

  // Données pour l'analyse périodique
  const periodeData = viewPeriode === 'trimestre' ? periodes.trimestres : periodes.semestres;
  const currentPeriodeData = periodeData.find(p => p.periode === selectedPeriode);

  // Données du tableau pivot pour heatmap
  const pivotHeatmapData = pivot?.pivot.map(row => {
    const categories = Object.entries(row.categories).map(([cat, data]: [string, any]) => ({
      categorie: cat,
      montant: data.montant,
      sessions: data.sessions,
    }));
    return {
      departement: row.departement,
      total: row.total,
      categories,
    };
  }) || [];

  return (
    <Container size="xl" py="lg">
      <Flex justify="space-between" align="center" mb="xl">
        <div>
          <Title order={2}>Analytics Budgetaires Avances</Title>
          <Text c="dimmed" size="sm">Vue complete avec tous les KPIs disponibles</Text>
        </div>
        <Group>
          <Select
            value={selectedYear}
            onChange={(value) => setSelectedYear(value || new Date().getFullYear().toString())}
            data={[
              { value: '2020', label: '2020' },
              { value: '2021', label: '2021' },
              { value: '2022', label: '2022' },
              { value: '2023', label: '2023' },
              { value: '2024', label: '2024' },
              { value: '2025', label: '2025' },
            ]}
            style={{ width: 120 }}
          />
          <Tooltip label="Actualiser les données">
            <ActionIcon 
              variant="light" 
              size="lg" 
              onClick={handleRefresh}
              loading={refreshing}
            >
              <ArrowsClockwise size={20} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Flex>

      {/* Alertes du dashboard */}
      {alertes && alertes.length > 0 && (
        <Stack gap="sm" mb="xl">
          {alertes.map((alerte, index) => (
            <Alert
              key={index}
              icon={getAlertIcon(alerte.niveau)}
              color={alerte.niveau === 'critique' ? 'red' : alerte.niveau === 'attention' ? 'orange' : 'blue'}
            >
              <Group justify="space-between">
                <div>
                  <Text fw={600}>{alerte.message}</Text>
                  {alerte.action && <Text size="sm" c="dimmed">{alerte.action}</Text>}
                </div>
                {alerte.niveau === 'info' && nbFormationsSansTarif > 0 && (
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<Eye size={14} />}
                    onClick={() => {
                      const element = document.getElementById('formations-sans-tarif');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Voir les formations
                  </Button>
                )}
              </Group>
            </Alert>
          ))}
        </Stack>
      )}

      {/* KPIs principaux avec indicateurs avancés */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, lg: 2.4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text fw={500} size="sm" c="dimmed">Budget Total</Text>
              <ThemeIcon color="blue" variant="light" size="lg">
                <CurrencyEur size={20} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl">{formatCurrency(consommationGlobale.budgetTotal)}</Text>
            <Text size="xs" c="dimmed" mt="xs">
              Formation: {formatCurrency(consommationGlobale.budgetFormation)}
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 2.4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text fw={500} size="sm" c="dimmed">Consommation</Text>
              <ThemeIcon color={getStatusColor(consommationGlobale.statut)} variant="light" size="lg">
                <ChartBar size={20} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl">{formatCurrency(consommationGlobale.totalConsomme)}</Text>
            <Progress 
              value={consommationGlobale.pourcentageConsommation} 
              color={getStatusColor(consommationGlobale.statut)}
              size="sm"
              mt="xs"
            />
            <Group justify="space-between" mt={5}>
              <Text size="xs" c="dimmed">
                {formatPercentage(consommationGlobale.pourcentageConsommation)}
              </Text>
              <Badge color={getStatusColor(consommationGlobale.statut)} variant="light" size="sm">
                {consommationGlobale.statut}
              </Badge>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 2.4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text fw={500} size="sm" c="dimmed">Sessions</Text>
              <ThemeIcon color="teal" variant="light" size="lg">
                <Lightning size={20} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl">{consommationGlobale.nombreSessionsImputees}</Text>
            <Text size="xs" c="dimmed" mt="xs">
              Coût moyen: {formatCurrency(consommationGlobale.coutMoyenSession)}
            </Text>
            <Badge size="xs" variant="dot" color="teal" mt={5}>
              Sessions terminées
            </Badge>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 2.4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text fw={500} size="sm" c="dimmed">Top Département</Text>
              <ThemeIcon color="violet" variant="light" size="lg">
                <Buildings size={20} />
              </ThemeIcon>
            </Group>
            {top5Departements[0] && (
              <>
                <Text fw={700} size="lg" lineClamp={1}>{top5Departements[0].departementNom}</Text>
                <Text size="sm" c="dimmed">
                  {formatCurrency(top5Departements[0].totalConsomme)}
                </Text>
                <Badge size="xs" variant="light" color="violet" mt={5}>
                  {top5Departements[0].nombreSessions} sessions
                </Badge>
              </>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 2.4 }}>
          <Indicator 
            processing 
            color="red" 
            disabled={nbFormationsSansTarif === 0}
            label={nbFormationsSansTarif}
            size={16}
          >
            <Card shadow="sm" padding="lg" radius="md" withBorder w="100%">
              <Group justify="space-between" mb="xs">
                <Text fw={500} size="sm" c="dimmed">Sans Tarif</Text>
                <ThemeIcon color="orange" variant="light" size="lg">
                  <WarningCircle size={20} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl">{nbFormationsSansTarif}</Text>
              <Text size="xs" c="dimmed" mt="xs">
                Formations à définir
              </Text>
              {nbFormationsSansTarif > 0 && (
                <Badge size="xs" variant="filled" color="orange" mt={5}>
                  Action requise
                </Badge>
              )}
            </Card>
          </Indicator>
        </Grid.Col>
      </Grid>

      {/* Tabs avec analyses avancées */}
      <Tabs defaultValue="pivot" mb="xl">
        <Tabs.List>
          <Tabs.Tab value="pivot" leftSection={<GridFour size={16} />}>
            Matrice Pivot
          </Tabs.Tab>
          <Tabs.Tab value="periode" leftSection={<CalendarBlank size={16} />}>
            Analyse Périodique
          </Tabs.Tab>
          <Tabs.Tab value="departements" leftSection={<Buildings size={16} />}>
            Départements Détaillés
          </Tabs.Tab>
          <Tabs.Tab value="categories" leftSection={<BookOpen size={16} />}>
            Catégories
          </Tabs.Tab>
          <Tabs.Tab value="evolution" leftSection={<ChartLineUp size={16} />}>
            Évolution
          </Tabs.Tab>
        </Tabs.List>

        {/* Tab 1: Matrice Pivot */}
        <Tabs.Panel value="pivot" pt="md">
          <Paper shadow="xs" p="md" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <div>
                <Title order={4}>Tableau Croisé Département × Catégorie</Title>
                <Text size="sm" c="dimmed">
                  Utilisez les barres de défilement ou les flèches pour naviguer dans le tableau
                </Text>
              </div>
              <Stack gap="xs" align="flex-end">
                <Badge variant="light" color="blue" size="lg">
                  Total: {pivot && formatCurrency(pivot.totalGeneral)}
                </Badge>
                {pivot && (
                  <Group gap="xs">
                    <Badge variant="dot" color="violet">
                      {pivot.pivot.length} départements
                    </Badge>
                    <Badge variant="dot" color="teal">
                      {Object.keys(pivot.pivot[0]?.categories || {}).length} catégories
                    </Badge>
                  </Group>
                )}
              </Stack>
            </Group>
            
            {pivot && (
              <Box style={{ position: 'relative' }}>
                {/* Indicateurs de scroll */}
                <Group justify="space-between" mb="xs">
                  <Text size="xs" c="dimmed">
                    <CaretDown size={12} style={{ transform: 'rotate(90deg)', display: 'inline' }} /> 
                    Faire défiler horizontalement pour voir toutes les catégories
                  </Text>
                  <Text size="xs" c="dimmed">
                    <CaretDown size={12} style={{ display: 'inline' }} />
                    Faire défiler verticalement pour voir tous les départements
                  </Text>
                </Group>
                
                {/* Table avec double scroll */}
                <ScrollArea 
                  h={500} 
                  type="always"
                  scrollbarSize={10}
                  offsetScrollbars
                >
                  <ScrollArea.Autosize 
                    maw="100%" 
                    type="always"
                    scrollbarSize={10}
                    offsetScrollbars
                  >
                    <Table 
                      highlightOnHover 
                      striped 
                      withTableBorder
                      withColumnBorders
                      stickyHeader
                      style={{ minWidth: 'max-content' }}
                    >
                      <Table.Thead style={{ backgroundColor: 'var(--mantine-color-gray-0)', position: 'sticky', top: 0, zIndex: 10 }}>
                        <Table.Tr>
                          <Table.Th 
                            style={{ 
                              position: 'sticky', 
                              left: 0, 
                              backgroundColor: 'var(--mantine-color-gray-0)',
                              zIndex: 11,
                              minWidth: 150,
                              borderRight: '2px solid var(--mantine-color-gray-3)'
                            }}
                          >
                            <Group gap="xs">
                              <Buildings size={16} />
                              Département
                            </Group>
                          </Table.Th>
                          {Object.keys(pivot.pivot[0]?.categories || {}).map((cat, idx) => (
                            <Table.Th 
                              key={cat} 
                              style={{ 
                                textAlign: 'center',
                                minWidth: 120,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <Tooltip label={cat}>
                                <Text size="xs" lineClamp={1}>
                                  {cat}
                                </Text>
                              </Tooltip>
                            </Table.Th>
                          ))}
                          <Table.Th 
                            style={{ 
                              textAlign: 'right',
                              minWidth: 120,
                              backgroundColor: 'var(--mantine-color-blue-0)',
                              fontWeight: 700
                            }}
                          >
                            Total Dept.
                          </Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {pivot.pivot.map((row, rowIdx) => (
                          <Table.Tr key={row.departement}>
                            <Table.Td 
                              fw={600}
                              style={{ 
                                position: 'sticky', 
                                left: 0, 
                                backgroundColor: 'white',
                                borderRight: '2px solid var(--mantine-color-gray-3)',
                                minWidth: 150
                              }}
                            >
                              <Tooltip label={row.departement}>
                                <Text size="sm" lineClamp={1}>
                                  {row.departement}
                                </Text>
                              </Tooltip>
                            </Table.Td>
                            {Object.entries(row.categories).map(([cat, data]) => (
                              <Table.Td 
                                key={cat} 
                                style={{ 
                                  textAlign: 'center',
                                  minWidth: 120,
                                  backgroundColor: data.montant > 0 ? 
                                    `rgba(76, 110, 245, ${Math.min(data.montant / 50000, 0.2)})` : 
                                    'transparent'
                                }}
                              >
                                {data.montant > 0 ? (
                                  <HoverCard width={250} shadow="md" withArrow>
                                    <HoverCard.Target>
                                      <Badge 
                                        variant="light" 
                                        color={data.montant > 10000 ? 'red' : data.montant > 5000 ? 'orange' : 'blue'}
                                        style={{ cursor: 'pointer' }}
                                        size="sm"
                                      >
                                        {data.montant >= 1000 ? 
                                          `${(data.montant / 1000).toFixed(1)}k€` : 
                                          `${data.montant}€`
                                        }
                                      </Badge>
                                    </HoverCard.Target>
                                    <HoverCard.Dropdown>
                                      <Stack gap="xs">
                                        <Group justify="space-between">
                                          <Text size="sm" fw={600}>Détails</Text>
                                          <Badge size="xs" variant="filled" color="blue">
                                            {formatPercentage((data.montant / pivot.totalGeneral) * 100)}
                                          </Badge>
                                        </Group>
                                        <Text size="xs" c="dimmed">Département: {row.departement}</Text>
                                        <Text size="xs" c="dimmed">Catégorie: {cat}</Text>
                                        <Group gap="xs">
                                          <Badge variant="light" size="sm">
                                            {data.sessions} sessions
                                          </Badge>
                                          <Badge variant="light" color="teal" size="sm">
                                            {formatCurrency(data.montant)}
                                          </Badge>
                                        </Group>
                                      </Stack>
                                    </HoverCard.Dropdown>
                                  </HoverCard>
                                ) : (
                                  <Text size="xs" c="dimmed">-</Text>
                                )}
                              </Table.Td>
                            ))}
                            <Table.Td 
                              style={{ 
                                textAlign: 'right',
                                minWidth: 120,
                                backgroundColor: 'var(--mantine-color-blue-0)',
                                fontWeight: 600
                              }}
                            >
                              <Badge variant="filled" color="blue" size="sm">
                                {row.total >= 1000 ? 
                                  `${(row.total / 1000).toFixed(0)}k€` : 
                                  `${row.total}€`
                                }
                              </Badge>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                        <Table.Tr 
                          style={{ 
                            borderTop: '3px solid var(--mantine-color-gray-4)',
                            backgroundColor: 'var(--mantine-color-gray-0)'
                          }}
                        >
                          <Table.Td 
                            fw={700}
                            style={{ 
                              position: 'sticky', 
                              left: 0,
                              backgroundColor: 'var(--mantine-color-gray-0)',
                              borderRight: '2px solid var(--mantine-color-gray-3)'
                            }}
                          >
                            Total Cat.
                          </Table.Td>
                          {Object.entries(pivot.totauxCategories).map(([cat, total]) => (
                            <Table.Td 
                              key={cat} 
                              style={{ 
                                textAlign: 'center',
                                backgroundColor: 'var(--mantine-color-teal-0)',
                                fontWeight: 600
                              }}
                            >
                              <Badge variant="filled" color="teal" size="sm">
                                {total >= 1000 ? 
                                  `${(total / 1000).toFixed(0)}k€` : 
                                  `${total}€`
                                }
                              </Badge>
                            </Table.Td>
                          ))}
                          <Table.Td 
                            style={{ 
                              textAlign: 'right',
                              backgroundColor: 'var(--mantine-color-green-0)',
                              fontWeight: 700
                            }}
                          >
                            <Badge variant="filled" color="green" size="lg">
                              {formatCurrency(pivot.totalGeneral)}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      </Table.Tbody>
                    </Table>
                  </ScrollArea.Autosize>
                </ScrollArea>
                
                {/* Légende et statistiques */}
                <Card mt="md" padding="sm" withBorder>
                  <Group justify="space-between">
                    <div>
                      <Text size="sm" fw={600} mb="xs">Légende des couleurs:</Text>
                      <Group gap="xs">
                        <Badge variant="light" color="blue" size="sm">{'< 5k€'}</Badge>
                        <Badge variant="light" color="orange" size="sm">5k€ - 10k€</Badge>
                        <Badge variant="light" color="red" size="sm">{'>10k€'}</Badge>
                      </Group>
                    </div>
                    <div>
                      <Text size="sm" fw={600} mb="xs">Top cellule:</Text>
                      {(() => {
                        let maxCell = { dept: '', cat: '', montant: 0 };
                        pivot.pivot.forEach(row => {
                          Object.entries(row.categories).forEach(([cat, data]) => {
                            if (data.montant > maxCell.montant) {
                              maxCell = { dept: row.departement, cat, montant: data.montant };
                            }
                          });
                        });
                        return maxCell.montant > 0 ? (
                          <Badge variant="filled" color="violet">
                            {maxCell.dept} × {maxCell.cat}: {formatCurrency(maxCell.montant)}
                          </Badge>
                        ) : null;
                      })()}
                    </div>
                  </Group>
                </Card>
              </Box>
            )}
          </Paper>
        </Tabs.Panel>

        {/* Tab 2: Analyse Périodique */}
        <Tabs.Panel value="periode" pt="md">
          <Stack>
            <Paper shadow="xs" p="md" radius="md" withBorder>
              <Group justify="space-between" mb="md">
                <Title order={4}>Analyse par Période</Title>
                <Group>
                  <SegmentedControl
                    value={viewPeriode}
                    onChange={(value) => {
                      setViewPeriode(value as 'trimestre' | 'semestre');
                      setSelectedPeriode(value === 'trimestre' ? 'Q1' : 'S1');
                    }}
                    data={[
                      { label: 'Trimestres', value: 'trimestre' },
                      { label: 'Semestres', value: 'semestre' },
                    ]}
                  />
                  <Select
                    value={selectedPeriode}
                    onChange={(value) => setSelectedPeriode(value || 'Q1')}
                    data={viewPeriode === 'trimestre' 
                      ? ['Q1', 'Q2', 'Q3', 'Q4']
                      : ['S1', 'S2']
                    }
                    style={{ width: 100 }}
                  />
                </Group>
              </Group>

              {currentPeriodeData && (
                <Grid>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Card withBorder>
                      <Text size="sm" c="dimmed" fw={500}>Période {currentPeriodeData.periode}</Text>
                      <Text size="xl" fw={700} mt="xs">
                        {formatCurrency(currentPeriodeData.totalConsomme)}
                      </Text>
                      <Group gap="xs" mt="xs">
                        <Badge variant="light" color="blue">
                          {currentPeriodeData.nombreSessions} sessions
                        </Badge>
                        <Badge variant="light" color="teal">
                          Moy: {formatCurrency(currentPeriodeData.coutMoyen)}
                        </Badge>
                      </Group>
                    </Card>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 8 }}>
                    <Card withBorder>
                      <Text size="sm" fw={600} mb="xs">Répartition par Département</Text>
                      {currentPeriodeData.parDepartement.map((dept, idx) => (
                        <Group key={idx} justify="space-between" mb="xs">
                          <Group gap="xs">
                            <Box w={12} h={12} bg={COLORS[idx % COLORS.length]} style={{ borderRadius: 2 }} />
                            <Text size="sm">{dept.departement}</Text>
                          </Group>
                          <Group gap="xs">
                            <Badge variant="light" size="sm">
                              {formatPercentage(dept.pourcentage)}
                            </Badge>
                            <Text size="sm" fw={600}>
                              {formatCurrency(dept.montant)}
                            </Text>
                          </Group>
                        </Group>
                      ))}
                    </Card>
                  </Grid.Col>
                </Grid>
              )}

              {/* Graphique comparatif des périodes */}
              <Title order={5} mt="xl" mb="md">Comparaison des Périodes</Title>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={periodeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periode" />
                  <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`} />
                  <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ color: '#000' }}
                  />
                  <Bar 
                    dataKey="totalConsomme" 
                    fill="#4C6EF5"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* Tab 3: Départements Détaillés */}
        <Tabs.Panel value="departements" pt="md">
          <Stack>
            {/* Vue principale avec cards */}
            <Grid>
              {top5Departements.length > 0 ? (
                top5Departements.slice(0, 5).map((dept, index) => (
                  <Grid.Col key={index} span={{ base: 12, sm: 6, lg: 4 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                      <Group justify="space-between" mb="md">
                        <Badge size="lg" color={COLORS[index]} variant="filled">
                          #{index + 1}
                        </Badge>
                        <ThemeIcon size="lg" color={COLORS[index]} variant="light">
                          <Buildings size={20} />
                        </ThemeIcon>
                      </Group>
                      
                      <Stack gap="xs">
                        <Tooltip label={dept.departementNom} disabled={dept.departementNom.length <= 30}>
                          <Text size="sm" fw={600} lineClamp={2} style={{ minHeight: '2.4em' }}>
                            {dept.departementNom}
                          </Text>
                        </Tooltip>
                        
                        <Text size="xl" fw={700} c={COLORS[index]}>
                          {formatCurrency(dept.totalConsomme)}
                        </Text>
                        
                        <div style={{ marginBottom: 'var(--mantine-spacing-xs)' }}>
                          <Progress 
                            value={dept.pourcentageDuTotal || 0} 
                            color={COLORS[index]}
                            size="md"
                          />
                          <Text size="xs" c="dimmed" ta="center" mt={4}>
                            {(dept.pourcentageDuTotal || 0).toFixed(1)}% du total
                          </Text>
                        </div>
                        
                        <Group gap="xs">
                          <Badge variant="light" color="blue" size="sm">
                            {dept.nombreSessions} sessions
                          </Badge>
                          {dept.nombreCollaborateurs && dept.nombreCollaborateurs > 0 && (
                            <Badge variant="light" color="teal" size="sm">
                              {dept.nombreCollaborateurs} collab.
                            </Badge>
                          )}
                        </Group>
                        
                        {dept.topFormations && dept.topFormations.length > 0 && (
                          <>
                            <Divider my="xs" />
                            <div>
                              <Text size="xs" c="dimmed" fw={600} mb={4}>Top formations:</Text>
                              <Stack gap={4}>
                                {dept.topFormations.slice(0, 2).map((form, idx) => (
                                  <Paper key={idx} p={4} withBorder>
                                    <Group justify="space-between" gap={4}>
                                      <Text size="xs" lineClamp={1} style={{ flex: 1 }}>
                                        {form.formation}
                                      </Text>
                                      <Badge size="xs" variant="dot" color={COLORS[index]}>
                                        {form.nombreSessions}
                                      </Badge>
                                    </Group>
                                  </Paper>
                                ))}
                              </Stack>
                            </div>
                          </>
                        )}
                      </Stack>
                    </Card>
                  </Grid.Col>
                ))
              ) : (
                <Grid.Col span={12}>
                  <Alert icon={<Info size={20} />} color="blue">
                    Aucune donnée de département disponible pour cette année
                  </Alert>
                </Grid.Col>
              )}
            </Grid>
            
            {/* Graphique comparatif simple */}
            {top5Departements.length > 0 && (
              <Paper shadow="xs" p="md" radius="md" withBorder>
                <Title order={4} mb="md">Comparaison des Budgets</Title>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart 
                    data={top5Departements.slice(0, 5).map((dept, index) => ({
                      name: `#${index + 1}`,
                      budget: dept.totalConsomme,
                      fullName: dept.departementNom,
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                      tick={{ fontSize: 11 }}
                    />
                    <RechartsTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <Paper p="xs" shadow="md" withBorder style={{ backgroundColor: 'white' }}>
                              <Text size="xs" fw={600}>{data.fullName}</Text>
                              <Text size="sm" c="blue" fw={700} mt={4}>
                                {formatCurrency(data.budget)}
                              </Text>
                            </Paper>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="budget" 
                      radius={[8, 8, 0, 0]}
                      label={{
                        position: 'top' as const,
                        fontSize: 10,
                        formatter: (value: any) => `${(value / 1000).toFixed(0)}k€`
                      }}
                    >
                      {top5Departements.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            )}
          </Stack>
        </Tabs.Panel>

        {/* Tab 4: Catégories */}
        <Tabs.Panel value="categories" pt="md">
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper shadow="xs" p="md" radius="md" withBorder>
                <Title order={4} mb="md">Répartition par Catégorie</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={top3Categories.map(cat => ({
                        name: cat.categorieNom,
                        value: cat.totalConsomme,
                        percentage: (cat.totalConsomme / consommationGlobale.totalConsomme) * 100
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${formatPercentage(entry.percentage)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {top3Categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number, name: string) => [formatCurrency(value), name]}
                      labelStyle={{ color: '#000' }}
                      contentStyle={{ maxWidth: 250 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Légende des catégories */}
                <Stack gap="xs" mt="md">
                  {top3Categories.map((cat, index) => (
                    <Group key={index} gap="xs">
                      <Box w={12} h={12} bg={COLORS[index]} style={{ borderRadius: 2 }} />
                      <Tooltip label={cat.categorieNom} disabled={cat.categorieNom.length <= 30}>
                        <Text size="xs" lineClamp={1} style={{ flex: 1 }}>
                          {cat.categorieNom}
                        </Text>
                      </Tooltip>
                      <Badge size="xs" variant="light" color={COLORS[index]}>
                        {formatPercentage((cat.totalConsomme / consommationGlobale.totalConsomme) * 100)}
                      </Badge>
                    </Group>
                  ))}
                </Stack>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper shadow="xs" p="md" radius="md" withBorder>
                <Title order={4} mb="md">Métriques par Catégorie</Title>
                <Stack gap="sm">
                  {top3Categories.map((cat, index) => (
                    <Card key={index} padding="sm" withBorder>
                      <Group justify="space-between" mb="xs" wrap="nowrap">
                        <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                          <Box w={12} h={12} bg={COLORS[index]} style={{ borderRadius: 2, flexShrink: 0 }} />
                          <Tooltip label={cat.categorieNom} disabled={cat.categorieNom.length <= 25}>
                            <Text fw={600} size="sm" lineClamp={1} style={{ flex: 1 }}>
                              {cat.categorieNom}
                            </Text>
                          </Tooltip>
                        </Group>
                        <Text fw={700} style={{ flexShrink: 0 }}>{formatCurrency(cat.totalConsomme)}</Text>
                      </Group>
                      <Progress 
                        value={(cat.totalConsomme / consommationGlobale.totalConsomme) * 100}
                        color={COLORS[index]}
                        size="sm"
                        mb="xs"
                      />
                      <Group gap="xs">
                        <Badge size="xs" variant="light">
                          {cat.nombreSessions} sessions
                        </Badge>
                        {cat.coutMoyen && (
                          <Badge size="xs" variant="light" color="teal">
                            Moy: {formatCurrency(cat.coutMoyen)}
                          </Badge>
                        )}
                        {cat.pourcentageDuTotal && (
                          <Badge size="xs" variant="light" color="violet">
                            {formatPercentage(cat.pourcentageDuTotal)}
                          </Badge>
                        )}
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        {/* Tab 5: Évolution */}
        <Tabs.Panel value="evolution" pt="md">
          <Paper shadow="xs" p="md" radius="md" withBorder>
            <Title order={4} mb="md">Évolution Mensuelle Détaillée</Title>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis yAxisId="left" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`} />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip 
                  formatter={(value: number, name: string) => 
                    name === 'sessions' ? value : formatCurrency(value)
                  }
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="montant" 
                  stroke="#4C6EF5" 
                  fill="#4C6EF5" 
                  fillOpacity={0.6}
                  name="Montant"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#82C91E"
                  strokeWidth={2}
                  name="Sessions"
                  dot={{ fill: '#82C91E' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Paper>
        </Tabs.Panel>
      </Tabs>

      {/* Section Formations sans tarif - Version améliorée avec vue globale */}
      {formationsSansTarif.length > 0 && (
        <Paper shadow="xs" p="md" radius="md" withBorder id="formations-sans-tarif">
          <Group justify="space-between" mb="md">
            <div>
              <Title order={4}>Formations sans Tarif Défini</Title>
              <Text size="sm" c="dimmed">
                Ces formations nécessitent une définition de tarif pour le calcul budgétaire
              </Text>
            </div>
            <Group>
              <Badge color="orange" variant="filled" size="lg">
                {formationsSansTarif.length} formations
              </Badge>
              <Button
                size="sm"
                variant="light"
                color="orange"
                onClick={() => {
                  // Fonction pour définir tous les tarifs en batch
                  notifications.show({
                    title: 'Fonctionnalité à venir',
                    message: 'La mise à jour en masse sera bientôt disponible',
                    color: 'blue',
                  });
                }}
              >
                Définir tous les tarifs
              </Button>
            </Group>
          </Group>
          
          {/* Barre de recherche et statistiques */}
          <Grid mb="md">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                placeholder="Rechercher une formation..."
                leftSection={<MagnifyingGlass size={16} />}
                value={formationsSearch}
                onChange={(e) => {
                  setFormationsSearch(e.currentTarget.value);
                  setFormationsPage(1); // Reset to first page on search
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Group gap="xs">
                <Card padding="xs" withBorder>
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">Total sessions:</Text>
                    <Badge variant="light" color="blue">
                      {formationsSansTarif.reduce((acc, f) => acc + f.nombreSessions, 0)}
                    </Badge>
                  </Group>
                </Card>
                <Card padding="xs" withBorder>
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">Sessions terminées:</Text>
                    <Badge variant="light" color="orange">
                      {formationsSansTarif.reduce((acc, f) => acc + f.nombreSessionsTerminees, 0)}
                    </Badge>
                  </Group>
                </Card>
                <Card padding="xs" withBorder>
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">Impact potentiel:</Text>
                    <Badge variant="light" color="red">
                      {formatCurrency(formationsSansTarif.reduce((acc, f) => acc + (f.nombreSessionsTerminees * 1500), 0))}
                    </Badge>
                  </Group>
                </Card>
              </Group>
            </Grid.Col>
          </Grid>
          
          {/* Tableau avec pagination */}
          {(() => {
            // Filtrer les formations
            const filteredFormations = formationsSansTarif.filter(f => 
              formationsSearch === '' || 
              f.nomFormation.toLowerCase().includes(formationsSearch.toLowerCase()) ||
              f.codeFormation.toLowerCase().includes(formationsSearch.toLowerCase()) ||
              (f.categorie && f.categorie.toLowerCase().includes(formationsSearch.toLowerCase()))
            );
            
            // Calculer la pagination
            const totalPages = Math.ceil(filteredFormations.length / formationsPerPage);
            const startIndex = (formationsPage - 1) * formationsPerPage;
            const endIndex = startIndex + formationsPerPage;
            const paginatedFormations = filteredFormations.slice(startIndex, endIndex);
            
            return (
              <>
                <ScrollArea>
                  <Table highlightOnHover striped>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Code</Table.Th>
                        <Table.Th>Formation</Table.Th>
                        <Table.Th>Catégorie</Table.Th>
                        <Table.Th style={{ textAlign: 'center' }}>Sessions Total</Table.Th>
                        <Table.Th style={{ textAlign: 'center' }}>Terminées</Table.Th>
                        <Table.Th style={{ textAlign: 'center' }}>Impact €</Table.Th>
                        <Table.Th>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {paginatedFormations.length > 0 ? (
                        paginatedFormations.map((formation) => (
                          <Table.Tr key={formation.id}>
                            <Table.Td>
                              <Badge variant="light" color="gray">
                                {formation.codeFormation}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text fw={500} lineClamp={1}>
                                {formation.nomFormation}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge variant="light" color="blue">
                                {formation.categorie || 'Non catégorisé'}
                              </Badge>
                            </Table.Td>
                            <Table.Td style={{ textAlign: 'center' }}>
                              <Badge variant="dot" color="teal">
                                {formation.nombreSessions}
                              </Badge>
                            </Table.Td>
                            <Table.Td style={{ textAlign: 'center' }}>
                              <Badge 
                                variant={formation.nombreSessionsTerminees > 0 ? 'filled' : 'light'}
                                color={formation.nombreSessionsTerminees > 0 ? 'orange' : 'gray'}
                              >
                                {formation.nombreSessionsTerminees}
                              </Badge>
                            </Table.Td>
                            <Table.Td style={{ textAlign: 'center' }}>
                              {formation.nombreSessionsTerminees > 0 && (
                                <Tooltip label="Impact estimé si tarif = 1500€">
                                  <Badge variant="light" color="red" style={{ cursor: 'help' }}>
                                    ~{formatCurrency(formation.nombreSessionsTerminees * 1500)}
                                  </Badge>
                                </Tooltip>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                <Button
                                  size="xs"
                                  variant="light"
                                  leftSection={<CurrencyEur size={14} />}
                                  onClick={() => {
                                    setSelectedFormation(formation);
                                    setTarifValue(0);
                                    openTarifModal();
                                  }}
                                >
                                  Définir tarif
                                </Button>
                                {formation.nombreSessionsTerminees > 0 && (
                                  <Tooltip label="Sessions terminées à impacter">
                                    <ThemeIcon size="sm" variant="light" color="orange">
                                      <Warning size={14} />
                                    </ThemeIcon>
                                  </Tooltip>
                                )}
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))
                      ) : (
                        <Table.Tr>
                          <Table.Td colSpan={7} style={{ textAlign: 'center' }}>
                            <Text c="dimmed" py="xl">
                              {formationsSearch ? 'Aucune formation trouvée' : 'Aucune formation sans tarif'}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
                
                {/* Pagination et résumé */}
                {filteredFormations.length > formationsPerPage && (
                  <Group justify="space-between" mt="md">
                    <Text size="sm" c="dimmed">
                      Affichage {startIndex + 1}-{Math.min(endIndex, filteredFormations.length)} sur {filteredFormations.length} formations
                    </Text>
                    <Pagination
                      value={formationsPage}
                      onChange={setFormationsPage}
                      total={totalPages}
                      size="sm"
                    />
                  </Group>
                )}
                
                {/* Résumé des catégories */}
                <Card mt="md" padding="sm" withBorder>
                  <Text size="sm" fw={600} mb="xs">Répartition par catégorie:</Text>
                  <Group gap="xs">
                    {Object.entries(
                      filteredFormations.reduce((acc, f) => {
                        const cat = f.categorie || 'Non catégorisé';
                        acc[cat] = (acc[cat] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([cat, count], idx) => (
                      <Badge key={cat} variant="light" color={COLORS[idx % COLORS.length]}>
                        {cat}: {count}
                      </Badge>
                    ))}
                  </Group>
                </Card>
              </>
            );
          })()}
        </Paper>
      )}

      {/* Modal pour définir le tarif */}
      <Modal
        opened={tarifModalOpened}
        onClose={closeTarifModal}
        title="Définir le Tarif HT"
        size="sm"
      >
        {selectedFormation && (
          <Stack>
            <Text size="sm" c="dimmed">Formation:</Text>
            <Text fw={600}>{selectedFormation.nomFormation}</Text>
            
            <Alert icon={<Info size={20} />} color="blue">
              <Text size="sm">
                Cette formation a {selectedFormation.nombreSessionsTerminees} sessions terminées
                qui seront impactées par ce tarif.
              </Text>
            </Alert>
            
            <NumberInput
              label="Tarif HT (€)"
              value={tarifValue}
              onChange={(value) => setTarifValue(Number(value))}
              min={0}
              step={100}
              thousandSeparator=" "
              decimalSeparator=","
              required
            />

            <Group justify="flex-end">
              <Button variant="light" onClick={closeTarifModal}>
                Annuler
              </Button>
              <Button onClick={handleUpdateTarif} disabled={tarifValue <= 0}>
                Définir le tarif
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}