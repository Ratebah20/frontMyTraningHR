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
  SimpleGrid,
  Loader,
  Center,
  Alert,
  Tabs,
  TextInput,
  Select,
  Button,
  ActionIcon,
  Tooltip,
  Badge,
  Divider,
  Table,
  Avatar,
} from '@mantine/core';
import {
  UsersFour,
  Users,
  ChartLine,
  Warning,
  ArrowsClockwise,
  MagnifyingGlass,
  FunnelSimple,
  TreeStructure,
  Table as TableIcon,
  SquaresFour,
  Eye,
  Buildings,
  GraduationCap,
  CheckCircle,
  Clock,
} from '@phosphor-icons/react';
import { managersService, commonService } from '@/lib/services';
import { ManagerListResponse, OrganizationHierarchy } from '@/lib/types';
import { OrganizationChart } from '@/components/managers/OrganizationChart';
import { ManagerStatsCard } from '@/components/managers/ManagerStatsCard';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';

export default function ManagersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [managersData, setManagersData] = useState<ManagerListResponse | null>(null);
  const [hierarchy, setHierarchy] = useState<OrganizationHierarchy | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [departements, setDepartements] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    loadData();
    loadDepartements();
  }, []);

  const loadDepartements = async () => {
    try {
      const deps = await commonService.getDepartements();
      const departmentsList = deps.map(d => ({
        value: d.id.toString(),
        label: d.nomDepartement,
      }));
      setDepartements([
        { value: '', label: 'Tous les départements' },
        ...departmentsList
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des départements:', error);
    }
  };

  const loadData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const [managers, org] = await Promise.all([
        managersService.getManagers(),
        managersService.getOrganizationHierarchy(),
      ]);

      setManagersData(managers);
      setHierarchy(org);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les données des managers',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadData(false);
  };

  // Filtrer les managers selon les critères
  const filteredManagers = managersData?.data.filter(manager => {
    const matchesSearch = searchQuery === '' ||
      manager.nomComplet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (manager.matricule && manager.matricule.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDepartment = departmentFilter === '' ||
      (manager.departementId && manager.departementId === parseInt(departmentFilter));

    return matchesSearch && matchesDepartment;
  }) || [];

  if (loading) {
    return (
      <Container size="xl">
        <Center h={400}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Chargement des données...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl">
      {/* En-tête */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Group justify="space-between" mb="md">
          <div>
            <Group align="center" gap="sm">
              <UsersFour size={32} color="#228BE6" />
              <Title order={1}>Gestion des Managers</Title>
            </Group>
            <Text size="lg" c="dimmed" mt="xs">
              Vue d'ensemble de la hiérarchie et des équipes
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

        {/* KPIs globaux */}
        {managersData && (
          <Grid mt="lg">
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Card withBorder p="md" radius="md" h={110}>
                <Stack justify="space-between" h="100%">
                  <Group justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                        Total Managers
                      </Text>
                      <Text size="xl" fw={700} mt={4}>{managersData.stats.totalManagers}</Text>
                    </div>
                    <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                      <UsersFour size={20} />
                    </ThemeIcon>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Card withBorder p="md" radius="md" h={110}>
                <Stack justify="space-between" h="100%">
                  <Group justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                        Avec Manager
                      </Text>
                      <Text size="xl" fw={700} mt={4}>{managersData.stats.totalSubordonnes}</Text>
                      <Text size="xs" c="dimmed" mt={2}>Collaborateurs dans des équipes</Text>
                    </div>
                    <ThemeIcon size="lg" radius="md" variant="light" color="teal">
                      <Users size={20} />
                    </ThemeIcon>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Card withBorder p="md" radius="md" h={110}>
                <Stack justify="space-between" h="100%">
                  <Group justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                        Taille Moyenne
                      </Text>
                      <Text size="xl" fw={700} mt={4}>{managersData.stats.moyenneEquipeSize}</Text>
                      <Text size="xs" c="dimmed" mt={2}>Collaborateurs par manager</Text>
                    </div>
                    <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                      <ChartLine size={20} />
                    </ThemeIcon>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        )}
      </Paper>

      {/* Contenu principal avec onglets */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab
            value="overview"
            leftSection={<SquaresFour size={16} />}
          >
            Vue d'ensemble
          </Tabs.Tab>
          <Tabs.Tab
            value="hierarchy"
            leftSection={<TreeStructure size={16} />}
          >
            Organigramme
          </Tabs.Tab>
        </Tabs.List>

        {/* Onglet Vue d'ensemble */}
        <Tabs.Panel value="overview" pt="md">
          <Stack gap="md">
            {/* Filtres et toggle vue */}
            <Paper shadow="xs" p="md" radius="md">
              <Group justify="space-between" mb="md">
                <Group>
                  <FunnelSimple size={20} />
                  <Text fw={600}>Filtres et Recherche</Text>
                </Group>

                {/* Toggle vue grille/liste */}
                <Group gap="xs">
                  <Tooltip label="Vue grille">
                    <ActionIcon
                      variant={viewMode === 'grid' ? 'filled' : 'subtle'}
                      onClick={() => setViewMode('grid')}
                      color="blue"
                    >
                      <SquaresFour size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Vue liste">
                    <ActionIcon
                      variant={viewMode === 'list' ? 'filled' : 'subtle'}
                      onClick={() => setViewMode('list')}
                      color="blue"
                    >
                      <TableIcon size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>

              <Grid align="flex-end">
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    placeholder="Rechercher par nom ou matricule..."
                    leftSection={<MagnifyingGlass size={16} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Select
                    placeholder="Filtrer par département"
                    data={departements}
                    value={departmentFilter}
                    onChange={(value) => setDepartmentFilter(value || '')}
                    clearable
                  />
                </Grid.Col>
              </Grid>
            </Paper>

            {/* Liste des managers */}
            {filteredManagers.length > 0 ? (
              <>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    {filteredManagers.length} manager{filteredManagers.length > 1 ? 's' : ''} trouvé{filteredManagers.length > 1 ? 's' : ''}
                  </Text>
                </Group>

                {/* Vue grille (catalogue) */}
                {viewMode === 'grid' && (
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                    {filteredManagers.map((manager) => (
                      <ManagerStatsCard
                        key={manager.id}
                        manager={manager}
                      />
                    ))}
                  </SimpleGrid>
                )}

                {/* Vue liste (tableau) */}
                {viewMode === 'list' && (
                  <Paper shadow="xs" radius="md" withBorder>
                    <Table.ScrollContainer minWidth={1000}>
                      <Table verticalSpacing="sm" highlightOnHover>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Manager</Table.Th>
                            <Table.Th>Département</Table.Th>
                            <Table.Th>Équipe</Table.Th>
                            <Table.Th>Formations Équipe</Table.Th>
                            <Table.Th>Heures</Table.Th>
                            <Table.Th>Statut</Table.Th>
                            <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {filteredManagers.map((manager) => {
                            const totalFormations = manager.formationsEnCours + manager.formationsTerminees + manager.formationsPlanifiees;
                            const tauxCompletion = totalFormations > 0
                              ? Math.round((manager.formationsTerminees / totalFormations) * 100)
                              : 0;

                            return (
                              <Table.Tr key={manager.id}>
                                <Table.Td>
                                  <Group gap="sm">
                                    <Avatar size={36} radius="xl" color="blue">
                                      {manager.nomComplet.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </Avatar>
                                    <div>
                                      <Text size="sm" fw={500}>{manager.nomComplet}</Text>
                                      {manager.matricule && (
                                        <Text size="xs" c="dimmed">{manager.matricule}</Text>
                                      )}
                                    </div>
                                  </Group>
                                </Table.Td>
                                <Table.Td>
                                  {manager.departementNom ? (
                                    <Group gap="xs">
                                      <Buildings size={14} color="var(--mantine-color-dimmed)" />
                                      <Text size="sm">{manager.departementNom}</Text>
                                    </Group>
                                  ) : (
                                    <Text size="sm" c="dimmed">-</Text>
                                  )}
                                </Table.Td>
                                <Table.Td>
                                  <Group gap="xs">
                                    <Badge variant="light" color="blue" leftSection={<Users size={12} />}>
                                      {manager.nombreSubordonnesTotal}
                                    </Badge>
                                    <Text size="xs" c="dimmed">
                                      ({manager.nombreSubordonnesDirects} directs)
                                    </Text>
                                  </Group>
                                </Table.Td>
                                <Table.Td>
                                  <Group gap="xs">
                                    <Tooltip label="En cours">
                                      <Badge size="sm" variant="light" color="blue" leftSection={<GraduationCap size={12} />}>
                                        {manager.formationsEnCours}
                                      </Badge>
                                    </Tooltip>
                                    <Tooltip label="Terminées">
                                      <Badge size="sm" variant="light" color="green" leftSection={<CheckCircle size={12} />}>
                                        {manager.formationsTerminees}
                                      </Badge>
                                    </Tooltip>
                                    {tauxCompletion > 0 && (
                                      <Text size="xs" c="dimmed">
                                        ({tauxCompletion}%)
                                      </Text>
                                    )}
                                  </Group>
                                </Table.Td>
                                <Table.Td>
                                  <Group gap="xs">
                                    <Clock size={14} color="var(--mantine-color-dimmed)" />
                                    <Text size="sm">{Math.round(manager.totalHeuresFormation)}h</Text>
                                  </Group>
                                </Table.Td>
                                <Table.Td>
                                  <Badge color={manager.actif ? 'green' : 'red'} variant="light">
                                    {manager.actif ? 'Actif' : 'Inactif'}
                                  </Badge>
                                </Table.Td>
                                <Table.Td>
                                  <Group gap="xs" justify="flex-end">
                                    <Tooltip label="Voir l'équipe">
                                      <ActionIcon
                                        variant="subtle"
                                        onClick={() => router.push(`/managers/${manager.id}`)}
                                      >
                                        <Eye size={16} />
                                      </ActionIcon>
                                    </Tooltip>
                                  </Group>
                                </Table.Td>
                              </Table.Tr>
                            );
                          })}
                        </Table.Tbody>
                      </Table>
                    </Table.ScrollContainer>
                  </Paper>
                )}
              </>
            ) : (
              <Paper shadow="sm" radius="md" p="xl">
                <Center>
                  <Stack align="center" gap="md">
                    <ThemeIcon size={60} radius="xl" variant="light" color="gray">
                      <UsersFour size={30} />
                    </ThemeIcon>
                    <div>
                      <Text size="lg" fw={500} ta="center">
                        Aucun manager trouvé
                      </Text>
                      <Text size="sm" c="dimmed" ta="center">
                        {searchQuery || departmentFilter
                          ? 'Essayez de modifier vos critères de recherche'
                          : 'Aucun collaborateur n\'a de subordonnés'}
                      </Text>
                    </div>
                  </Stack>
                </Center>
              </Paper>
            )}
          </Stack>
        </Tabs.Panel>

        {/* Onglet Organigramme */}
        <Tabs.Panel value="hierarchy" pt="md">
          <Stack gap="md">
            {hierarchy && (
              <>
                {/* Stats hiérarchie */}
                <Grid>
                  <Grid.Col span={{ base: 12, sm: 3 }}>
                    <Card withBorder p="sm" radius="md">
                      <Text size="xs" c="dimmed" fw={600}>Total Collaborateurs</Text>
                      <Text size="lg" fw={700}>{hierarchy.stats.totalCollaborateurs}</Text>
                    </Card>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 3 }}>
                    <Card withBorder p="sm" radius="md">
                      <Text size="xs" c="dimmed" fw={600}>Total Managers</Text>
                      <Text size="lg" fw={700}>{hierarchy.stats.totalManagers}</Text>
                    </Card>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 3 }}>
                    <Card withBorder p="sm" radius="md">
                      <Text size="xs" c="dimmed" fw={600}>Profondeur Max</Text>
                      <Text size="lg" fw={700}>{hierarchy.stats.profondeurMax}</Text>
                    </Card>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 3 }}>
                    <Card withBorder p="sm" radius="md">
                      <Text size="xs" c="dimmed" fw={600}>Moyenne par Manager</Text>
                      <Text size="lg" fw={700}>{hierarchy.stats.moyenneSubordonnesParManager}</Text>
                    </Card>
                  </Grid.Col>
                </Grid>

                {/* Organigramme */}
                <OrganizationChart data={hierarchy.roots} />
              </>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
