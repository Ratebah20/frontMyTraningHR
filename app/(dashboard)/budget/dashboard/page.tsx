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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
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
  Users,
  Clock,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Equals,
  ArrowsClockwise,
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
} from 'recharts';
import { budgetSimpleService, BudgetDashboard } from '@/lib/services/budget-simple.service';

const COLORS = ['#4C6EF5', '#15AABF', '#82C91E', '#FAB005', '#FA5252', '#BE4BDB', '#FD7E14', '#74C0FC'];

export default function BudgetDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [consommationData, setConsommationData] = useState<any>(null);
  const [departementData, setDepartementData] = useState<any[]>([]);
  const [categorieData, setCategorieData] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [viewType, setViewType] = useState<'trimestre' | 'semestre'>('trimestre');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [selectedYear]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      // Charger les données de consommation
      const consommation = await budgetSimpleService.getConsommation(parseInt(selectedYear));
      console.log('Consommation data:', consommation);
      setConsommationData(consommation);
      
      // Charger les analyses par département et catégorie en parallèle
      const [deptData, catData] = await Promise.all([
        budgetSimpleService.getAnalyseParDepartement(parseInt(selectedYear)).catch(() => []),
        budgetSimpleService.getAnalyseParCategorie(parseInt(selectedYear)).catch(() => [])
      ]);
      
      setDepartementData(deptData);
      setCategorieData(catData);
      
    } catch (error: any) {
      console.error('Erreur dashboard:', error);
      
      if (error.response?.status === 404) {
        notifications.show({
          title: 'Information',
          message: `Aucun budget défini pour l'année ${selectedYear}`,
          color: 'blue',
        });
      } else {
        notifications.show({
          title: 'Erreur',
          message: error.response?.data?.message || 'Impossible de charger le tableau de bord',
          color: 'red',
        });
      }
      setConsommationData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
    notifications.show({
      title: 'Actualisé',
      message: 'Les données ont été mises à jour',
      color: 'green',
    });
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

  const getEvolutionIcon = (evolution: number) => {
    if (evolution > 0) return <ArrowUp size={16} weight="bold" />;
    if (evolution < 0) return <ArrowDown size={16} weight="bold" />;
    return <Equals size={16} weight="bold" />;
  };

  const getEvolutionColor = (evolution: number) => {
    if (evolution > 10) return 'red';
    if (evolution > 0) return 'orange';
    if (evolution < 0) return 'green';
    return 'gray';
  };

  if (loading) {
    return (
      <Center h={600}>
        <Loader size="xl" />
      </Center>
    );
  }

  if (!consommationData) {
    return (
      <Container size="xl" py="lg">
        <Flex justify="space-between" align="center" mb="xl">
          <div>
            <Title order={2}>Tableau de Bord Budgétaire</Title>
            <Text c="dimmed" size="sm">Analyse complète du budget</Text>
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
        
        <Alert icon={<Warning size={20} />} color="orange">
          <Text fw={600} mb="xs">Aucune donnée disponible pour l'année {selectedYear}</Text>
          <Text size="sm" c="dimmed">
            Cela peut être dû à :
          </Text>
          <ul style={{ marginTop: 8, marginBottom: 0 }}>
            <li>Aucun budget n'est défini pour cette année</li>
            <li>Aucune session avec tarif n'existe pour calculer la consommation</li>
            <li>Un problème de connexion avec le serveur</li>
          </ul>
          <Text size="sm" mt="xs">
            Essayez de sélectionner une autre année ou vérifiez que des budgets sont bien créés dans la page "Vue d'ensemble".
          </Text>
        </Alert>
      </Container>
    );
  }

  const consommation = consommationData;
  const topDepartements = departementData;
  const repartitionCategories = categorieData;

  // Préparer les données pour les graphiques
  const monthlyData = (consommation?.consommationMensuelle || []).map(m => ({
    mois: `Mois ${m.mois}`,
    montant: m.montant,
    sessions: m.nombreSessions,
  }));

  const categoryChartData = repartitionCategories.map(cat => ({
    name: cat.nomCategorie,
    value: cat.budgetConsomme,
    sessions: cat.nombreSessions,
  }));

  const departmentChartData = topDepartements.slice(0, 5).map(dept => ({
    name: dept.nomDepartement,
    budget: dept.budgetConsomme,
    moyenne: dept.moyenneParCollaborateur,
  }));

  return (
    <Container size="xl" py="lg">
      <Flex justify="space-between" align="center" mb="xl">
        <div>
          <Title order={2}>Tableau de Bord Budgétaire</Title>
          <Text c="dimmed" size="sm">Analyse complète du budget {selectedYear}</Text>
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

      {/* Alerte statut */}
      {consommation.statut !== 'ok' && (
        <Alert
          icon={<Warning size={20} />}
          color={consommation.statut === 'critique' ? 'red' : 'orange'}
          mb="xl"
        >
          Budget en statut {consommation.statut}: {formatPercentage(consommation.pourcentageConsommation)} consommé
        </Alert>
      )}

      {/* KPIs principaux */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text fw={500} size="sm" c="dimmed">Consommation Totale</Text>
              <ThemeIcon color={getStatusColor(consommation.statut)} variant="light" size="lg">
                <CurrencyEur size={20} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl">{formatCurrency(consommation.totalConsomme)}</Text>
            <Progress 
              value={consommation.pourcentageConsommation} 
              color={getStatusColor(consommation.statut)}
              size="sm"
              mt="xs"
            />
            <Group justify="space-between" mt={5}>
              <Text size="xs" c="dimmed">
                {formatPercentage(consommation.pourcentageConsommation)} du budget
              </Text>
              <Badge color={getStatusColor(consommation.statut)} variant="light" size="sm">
                {consommation.statut}
              </Badge>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text fw={500} size="sm" c="dimmed">Budget Restant</Text>
              <ThemeIcon color="teal" variant="light" size="lg">
                <ChartBar size={20} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl">{formatCurrency(consommation.totalRestant)}</Text>
            <Text size="xs" c="dimmed" mt="xs">
              {consommation.nombreSessionsImputees} sessions imputées
            </Text>
            <Text size="sm" fw={600}>
              Coût moyen: {formatCurrency(consommation.coutMoyenSession)}
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text fw={500} size="sm" c="dimmed">Taux d'Engagement</Text>
              <ThemeIcon color="orange" variant="light" size="lg">
                <Clock size={20} />
              </ThemeIcon>
            </Group>
            <Group align="flex-end" gap="xs">
              <Text fw={700} size="xl">{consommation.nombreSessionsImputees}</Text>
              <RingProgress
                size={60}
                thickness={6}
                sections={[
                  { value: consommation.pourcentageConsommation, color: 'orange' },
                ]}
              />
            </Group>
            <Text size="xs" c="dimmed" mt="xs">
              Sessions planifiées
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text fw={500} size="sm" c="dimmed">Métriques Clés</Text>
              <ThemeIcon color="violet" variant="light" size="lg">
                <ChartPie size={20} />
              </ThemeIcon>
            </Group>
            <Stack gap={4}>
              <Group justify="space-between">
                <Text size="xs">Sessions imputées</Text>
                <Badge variant="light" color="green" size="sm">
                  {consommation.nombreSessionsImputees}
                </Badge>
              </Group>
              <Group justify="space-between">
                <Text size="xs">Coût moyen/session</Text>
                <Text size="xs" fw={600}>
                  {formatCurrency(consommation.coutMoyenSession)}
                </Text>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Graphiques et analyses */}
      <Tabs defaultValue="evolution" mb="xl">
        <Tabs.List>
          <Tabs.Tab value="evolution" leftSection={<TrendUp size={16} />}>
            Évolution Mensuelle
          </Tabs.Tab>
          <Tabs.Tab value="departements" leftSection={<Buildings size={16} />}>
            Par Département
          </Tabs.Tab>
          <Tabs.Tab value="categories" leftSection={<BookOpen size={16} />}>
            Par Catégorie
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="evolution" pt="md">
          <Paper shadow="xs" p="md" radius="md" withBorder>
            <Title order={4} mb="md">Évolution de la Consommation</Title>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`} />
                <RechartsTooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#000' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="montant" 
                  stroke="#4C6EF5" 
                  fill="#4C6EF5" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="departements" pt="md">
          <Grid>
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Paper shadow="xs" p="md" radius="md" withBorder>
                <Title order={4} mb="md">Top 5 Départements</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`} />
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelStyle={{ color: '#000' }}
                    />
                    <Bar dataKey="budget" fill="#15AABF" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Paper shadow="xs" p="md" radius="md" withBorder h="100%">
                <Title order={4} mb="md">Détails Départements</Title>
                <Stack gap="sm">
                  {topDepartements.slice(0, 3).map((dept, index) => (
                    <Card key={dept.departementId} padding="sm" withBorder>
                      <Group justify="space-between" mb="xs">
                        <Badge color={COLORS[index]} variant="light">
                          {dept.nomDepartement}
                        </Badge>
                        <Text size="sm" fw={600}>
                          {formatCurrency(dept.budgetConsomme)}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <Badge size="xs" variant="dot" color="blue">
                          {dept.nombreSessions} sessions
                        </Badge>
                        <Badge size="xs" variant="dot" color="teal">
                          {dept.nombreCollaborateurs} collaborateurs
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed" mt="xs">
                        Moyenne: {formatCurrency(dept.moyenneParCollaborateur)}/pers
                      </Text>
                    </Card>
                  ))}
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="categories" pt="md">
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper shadow="xs" p="md" radius="md" withBorder>
                <Title order={4} mb="md">Répartition par Catégorie</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${consommation.totalConsomme > 0 ? formatPercentage(entry.value / consommation.totalConsomme * 100) : '0%'}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelStyle={{ color: '#000' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper shadow="xs" p="md" radius="md" withBorder>
                <Title order={4} mb="md">Détails Catégories</Title>
                <Table highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Catégorie</Table.Th>
                      <Table.Th>Budget</Table.Th>
                      <Table.Th>Sessions</Table.Th>
                      <Table.Th>%</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {repartitionCategories.map((cat, index) => (
                      <Table.Tr key={cat.categorieId}>
                        <Table.Td>
                          <Group gap="xs">
                            <Box w={12} h={12} bg={COLORS[index % COLORS.length]} style={{ borderRadius: 2 }} />
                            <Text size="sm">{cat.nomCategorie}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={600}>{formatCurrency(cat.budgetConsomme)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light" size="sm">{cat.nombreSessions}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{formatPercentage(cat.pourcentageDuTotal)}</Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>
      </Tabs>

    </Container>
  );
}