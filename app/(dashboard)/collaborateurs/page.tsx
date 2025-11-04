'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  Table,
  Badge,
  ActionIcon,
  Center,
  Stack,
  Paper,
  Flex,
  Menu,
  Pagination,
  Loader,
  Alert,
  Avatar,
  Select,
  Grid,
  Card,
  Tooltip,
  ThemeIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  MagnifyingGlass,
  Plus,
  Eye,
  PencilSimple,
  Download,
  Upload,
  DotsThreeVertical,
  Users,
  Building,
  GraduationCap,
  CheckCircle,
  Warning,
  ArrowsClockwise,
  FunnelSimple,
  User,
  UserMinus,
} from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { collaborateursService, commonService } from '@/lib/services';
import { Collaborateur, CollaborateurFilters } from '@/lib/types';
import { useDebounce } from '@/hooks/useApi';

export default function CollaborateursPage() {
  const router = useRouter();
  
  // États
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [departements, setDepartements] = useState<{ value: string; label: string }[]>([]);
  
  // Filtres et pagination
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  
  const debouncedSearch = useDebounce(search, 500);

  // Charger les collaborateurs
  const loadCollaborateurs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Construire les filtres en fonction du backend
      const filters: any = {
        page,
        limit,
      };
      
      // Ajouter la recherche seulement si elle n'est pas vide
      if (debouncedSearch && debouncedSearch.trim()) {
        filters.search = debouncedSearch.trim();
      }
      
      // Ajouter le filtre département
      if (departmentFilter) {
        filters.departementId = parseInt(departmentFilter);
      }
      
      // Gérer le filtre de statut avec le nouveau paramètre actif
      if (statusFilter === 'actif') {
        // Envoyer comme chaîne pour que axios le transmette correctement
        filters.actif = 'true' as any;
      } else if (statusFilter === 'inactif') {
        // Envoyer comme chaîne pour que axios le transmette correctement  
        filters.actif = 'false' as any;
      }
      // Pour 'tous', on n'envoie pas de paramètre actif
      
      const response = await collaborateursService.getCollaborateurs(filters);
      
      if (response.data) {
        setCollaborateurs(response.data);
        setTotal(response.meta?.total || response.total || 0);
        setTotalPages(response.meta?.totalPages || Math.ceil((response.meta?.total || response.total || 0) / limit));
        
        // Utiliser les stats globales du backend si disponibles
        if (response.stats) {
          setGlobalStats(response.stats);
        }
      } else {
        setCollaborateurs([]);
        setTotal(0);
        setTotalPages(0);
        setGlobalStats(null);
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des collaborateurs:', err);
      setError(err.message || 'Erreur lors du chargement des collaborateurs');
      setCollaborateurs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les départements au montage
  useEffect(() => {
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
    loadDepartements();
  }, []);

  // Charger les collaborateurs au montage et quand les filtres changent
  useEffect(() => {
    loadCollaborateurs();
  }, [debouncedSearch, departmentFilter, statusFilter, page]);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, departmentFilter, statusFilter]);

  const handleViewDetails = (id: number) => {
    router.push(`/collaborateurs/${id}`);
  };

  const handleEdit = (id: number) => {
    router.push(`/collaborateurs/${id}/edit`);
  };

  const handleExport = async () => {
    try {
      const blob = await collaborateursService.exportCollaborateurs();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `collaborateurs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      notifications.show({
        title: 'Succès',
        message: 'Export réussi',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
    } catch (err: any) {
      notifications.show({
        title: 'Erreur',
        message: 'Erreur lors de l\'export',
        color: 'red',
        icon: <Warning size={20} />,
      });
    }
  };

  const handleRefresh = () => {
    loadCollaborateurs();
  };

  // Utiliser les statistiques globales du backend ou calculer localement
  const stats = globalStats ? {
    total: globalStats.total || (globalStats.totalActifs + globalStats.totalInactifs) || total,
    actifs: globalStats.totalActifs || 0,
    inactifs: globalStats.totalInactifs || 0,
    departements: globalStats.totalDepartements || 0,
  } : {
    total: total,
    actifs: collaborateurs.filter(c => c.actif).length,
    inactifs: collaborateurs.filter(c => !c.actif).length,
    departements: [...new Set(collaborateurs.map(c => c.departement?.nomDepartement).filter(Boolean))].length,
  };

  const rows = collaborateurs.map((collaborateur) => (
    <Table.Tr key={collaborateur.id}>
      <Table.Td>
        <Group gap="sm">
          <Avatar size={36} radius="xl" color="blue">
            {collaborateur.nomComplet?.split(' ').map(n => n[0]).join('') || 'NA'}
          </Avatar>
          <div>
            <Group gap="xs">
              <Text size="sm" fw={500}>
                {collaborateur.nomComplet}
              </Text>
              {!collaborateur.idExterne && (
                <Tooltip label="ID Orange Learning manquant - À ajouter dès que disponible">
                  <Badge color="orange" variant="light" size="xs">
                    ID Orange Learning manquant
                  </Badge>
                </Tooltip>
              )}
            </Group>
            <Text size="xs" c="dimmed">
              {collaborateur.matricule || collaborateur.idExterne || 'Aucun identifiant'}
            </Text>
          </div>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Building size={14} color="#868E96" />
          <Text size="sm">{collaborateur.departement?.nomDepartement || 'Non assigné'}</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{collaborateur.manager?.nomComplet || '-'}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <GraduationCap size={14} color="#868E96" />
          <Text size="sm">{collaborateur._count?.sessions || 0}</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Badge
          color={collaborateur.actif ? 'green' : 'red'}
          variant="light"
          size="sm"
        >
          {collaborateur.actif ? 'Actif' : 'Inactif'}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" justify="flex-end">
          <Tooltip label="Voir détails">
            <ActionIcon
              variant="subtle"
              onClick={() => handleViewDetails(collaborateur.id)}
            >
              <Eye size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Modifier">
            <ActionIcon
              variant="subtle"
              onClick={() => handleEdit(collaborateur.id)}
            >
              <PencilSimple size={16} />
            </ActionIcon>
          </Tooltip>
          <Menu withinPortal position="bottom-end" shadow="sm">
            <Menu.Target>
              <ActionIcon variant="subtle">
                <DotsThreeVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<Eye size={14} />}
                onClick={() => handleViewDetails(collaborateur.id)}
              >
                Voir détails
              </Menu.Item>
              <Menu.Item
                leftSection={<PencilSimple size={14} />}
                onClick={() => handleEdit(collaborateur.id)}
              >
                Modifier
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<GraduationCap size={14} />}
                onClick={() => router.push(`/sessions/new?collaborateurId=${collaborateur.id}`)}
              >
                Inscrire à une formation
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl">
      {/* En-tête */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Flex justify="space-between" align="center" mb="md">
          <div>
            <Group align="center" gap="sm">
              <Users size={32} color="#228BE6" />
              <Title order={1}>Collaborateurs</Title>
            </Group>
            <Text size="lg" c="dimmed" mt="xs">
              Gérez vos collaborateurs et leurs formations
            </Text>
          </div>
          <Group>
            <Tooltip label="Rafraîchir">
              <ActionIcon variant="light" size="lg" onClick={handleRefresh}>
                <ArrowsClockwise size={20} />
              </ActionIcon>
            </Tooltip>
            <Button
              leftSection={<Upload size={16} />}
              variant="light"
              onClick={() => router.push('/collaborateurs/import')}
            >
              Importer
            </Button>
            <Button
              leftSection={<Download size={16} />}
              variant="light"
              onClick={handleExport}
            >
              Exporter
            </Button>
            <Button
              leftSection={<Plus size={16} />}
              onClick={() => router.push('/collaborateurs/new')}
            >
              Nouveau
            </Button>
          </Group>
        </Flex>

        {/* Statistiques rapides */}
        <Grid mt="lg">
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Total
                  </Text>
                  <Text size="xl" fw={700}>{stats.total}</Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                  <Users size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Actifs
                  </Text>
                  <Text size="xl" fw={700} c="green">{stats.actifs}</Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="green">
                  <User size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Inactifs
                  </Text>
                  <Text size="xl" fw={700} c="red">{stats.inactifs}</Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="red">
                  <UserMinus size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Départements
                  </Text>
                  <Text size="xl" fw={700}>{stats.departements}</Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                  <Building size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Filtres */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Group align="center" mb="md">
          <FunnelSimple size={20} />
          <Text fw={600}>Filtres et Recherche</Text>
        </Group>
        <Grid align="flex-end">
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label=" "
              placeholder="Rechercher par nom, prénom, matricule..."
              leftSection={<MagnifyingGlass size={16} />}
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Select
              placeholder="Tous les départements"
              data={departements}
              value={departmentFilter}
              onChange={(value) => setDepartmentFilter(value || '')}
              clearable
              searchable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Select
              placeholder="Tous les statuts"
              data={[
                { value: '', label: 'Tous' },
                { value: 'actif', label: 'Actifs seulement' },
                { value: 'inactif', label: 'Inactifs seulement' },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || '')}
            />
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Table des collaborateurs */}
      <Paper shadow="xs" radius="md" withBorder>
        {isLoading ? (
          <Center h={400}>
            <Loader size="lg" variant="bars" />
          </Center>
        ) : error ? (
          <Alert icon={<Warning size={16} />} color="red" variant="light" m="lg">
            {error}
          </Alert>
        ) : collaborateurs.length > 0 ? (
          <>
            <Table.ScrollContainer minWidth={800}>
              <Table verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Collaborateur / Matricule</Table.Th>
                    <Table.Th>Département</Table.Th>
                    <Table.Th>Manager</Table.Th>
                    <Table.Th>Formations</Table.Th>
                    <Table.Th>Statut</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {/* Pagination */}
            <Group justify="space-between" p="lg">
              <Text size="sm" c="dimmed">
                Affichage de {((page - 1) * limit) + 1} à {Math.min(page * limit, total)} sur {total} collaborateurs
              </Text>
              <Pagination
                value={page}
                onChange={setPage}
                total={totalPages}
                siblings={1}
                boundaries={1}
                size="md"
              />
            </Group>
          </>
        ) : (
          <Center py="xl">
            <Stack align="center">
              <Users size={48} color="#868E96" />
              <Text size="lg" fw={500} c="dimmed">Aucun collaborateur trouvé</Text>
              <Text size="sm" c="dimmed">
                Essayez de modifier vos critères de recherche
              </Text>
              <Button
                leftSection={<Plus size={16} />}
                onClick={() => router.push('/collaborateurs/new')}
                mt="md"
              >
                Ajouter un collaborateur
              </Button>
            </Stack>
          </Center>
        )}
      </Paper>
    </Container>
  );
}