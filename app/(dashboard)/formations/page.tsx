'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  Card,
  Badge,
  SimpleGrid,
  Center,
  Stack,
  Flex,
  ActionIcon,
  Menu,
  Select,
  Pagination,
  Loader,
  Alert,
  Box,
  Divider,
  Paper,
  Grid,
  Tooltip,
  Skeleton,
  Table,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import {
  MagnifyingGlass,
  Plus,
  GraduationCap,
  Clock,
  Users,
  DotsThreeVertical,
  Eye,
  PencilSimple,
  Trash,
  Tag,
  Warning,
  CheckCircle,
  BookOpen,
  Calendar,
  Certificate,
  ChartBar,
  ArrowsClockwise,
  FunnelSimple,
  List,
  SquaresFour,
} from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { formationsService, commonService } from '@/lib/services';
import { Formation, FormationFilters } from '@/lib/types';
import { useDebounce } from '@/hooks/useApi';
import { formatDuration } from '@/lib/utils/duration.utils';

// Fonction pour obtenir le nom de la catégorie
const getCategoryName = (categorie: any): string => {
  if (!categorie) return '';
  if (typeof categorie === 'string') return categorie;
  if (typeof categorie === 'object' && categorie.nomCategorie) return categorie.nomCategorie;
  return '';
};

// Couleurs par catégorie
const categoryColors: Record<string, string> = {
  'Bureautique': 'blue',
  'Informatique': 'violet',
  'Management': 'orange',
  'Sécurité': 'red',
  'Langues': 'green',
  'Communication': 'cyan',
  'Finance': 'yellow',
  'RH': 'pink',
};

// Couleurs par type de formation
const typeColors: Record<string, string> = {
  'Présentiel': 'blue',
  'Distanciel': 'green',
  'E-learning': 'purple',
  'Mixte': 'orange',
};

export default function FormationsPage() {
  const router = useRouter();
  
  // États
  const [formations, setFormations] = useState<Formation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  
  // États pour les listes dynamiques
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [typesFormation, setTypesFormation] = useState<{ value: string; label: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(true);
  
  // États pour les statistiques globales
  const [globalStats, setGlobalStats] = useState({
    totalFormations: 0,
    totalActives: 0,
    totalInactives: 0,
    totalCategories: 0
  });
  
  // Filtres et pagination
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>(''); // Changé de showInactive à statusFilter
  const [createdAtDebut, setCreatedAtDebut] = useState<Date | null>(null);
  const [createdAtFin, setCreatedAtFin] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(24); // Plus de cartes par page

  const debouncedSearch = useDebounce(search, 500);

  // Charger les formations
  const loadFormations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Construire les filtres selon le statusFilter
      const filters: any = {
        search: debouncedSearch,
        categorieId: categoryFilter ? parseInt(categoryFilter) : undefined,
        typeFormation: typeFilter || undefined,
        createdAtDebut: createdAtDebut ? (createdAtDebut instanceof Date ? createdAtDebut.toISOString().split('T')[0] : createdAtDebut) : undefined,
        createdAtFin: createdAtFin ? (createdAtFin instanceof Date ? createdAtFin.toISOString().split('T')[0] : createdAtFin) : undefined,
        page,
        limit,
        sortBy: 'nomFormation',
        order: 'asc',
      };

      // Nettoyer les valeurs undefined pour que axios les envoie correctement
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      );

      // Gérer le filtre de statut comme pour les collaborateurs
      if (statusFilter === 'actif') {
        // Envoyer comme chaîne pour que axios le transmette correctement
        cleanFilters.actif = 'true' as any;
      } else if (statusFilter === 'inactif') {
        // Envoyer comme chaîne pour que axios le transmette correctement
        cleanFilters.actif = 'false' as any;
      }
      // Pour '' (tous), ne rien envoyer - le backend affichera les actifs par défaut
      // Si on veut vraiment tous (actifs + inactifs), il faudrait un filtre explicite

      const response = await formationsService.getFormations(cleanFilters);
      
      if (response.data) {
        setFormations(response.data);
        setTotal(response.meta?.total || response.total || 0);
        setTotalPages(response.meta?.totalPages || Math.ceil((response.meta?.total || response.total || 0) / limit));
        
        // Si c'est le premier chargement sans filtre, utiliser ces stats pour les globales
        if (statusFilter === '' && !categoryFilter && !typeFilter && !debouncedSearch && !createdAtDebut && !createdAtFin && page === 1) {
          // Puisque sans filtre on récupère tout, on peut utiliser le total de la méta
          const totalFromMeta = response.meta?.total || response.total || response.data.length;
          // Et toutes les formations visibles sont actives (car par défaut on ne voit que les actives)
          const activesCount = totalFromMeta; // Car par défaut, on ne montre que les actives

          console.log('Mise à jour des stats depuis la réponse principale:', {
            total: totalFromMeta,
            actives: activesCount,
            dataLength: response.data.length
          });

          setGlobalStats(prev => ({
            ...prev,
            totalFormations: totalFromMeta,
            totalActives: activesCount,
            totalInactives: 0 // On ne connaît pas le nombre d'inactives sans les récupérer
          }));
        }
      } else {
        setFormations([]);
        setTotal(0);
        setTotalPages(0);
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des formations:', err);
      setError(err.message || 'Erreur lors du chargement des formations');
      setFormations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les formations au montage et quand les filtres changent
  useEffect(() => {
    loadFormations();
  }, [debouncedSearch, categoryFilter, typeFilter, statusFilter, createdAtDebut, createdAtFin, page]);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryFilter, typeFilter, statusFilter, createdAtDebut, createdAtFin]);

  const handleViewDetails = (id: number) => {
    router.push(`/formations/${id}`);
  };

  const handleEdit = (id: number) => {
    router.push(`/formations/${id}/edit`);
  };

  const handleDelete = async (id: number, nom: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la formation "${nom}" ?`)) {
      return;
    }
    
    try {
      await formationsService.deleteFormation(id);
      notifications.show({
        title: 'Succès',
        message: 'Formation supprimée avec succès',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
      loadFormations();
    } catch (err: any) {
      notifications.show({
        title: 'Erreur',
        message: err.message || 'Erreur lors de la suppression',
        color: 'red',
        icon: <Warning size={20} />,
      });
    }
  };

  const handleRefresh = () => {
    loadFormations();
    loadGlobalStats();
  };

  // Charger les statistiques globales
  const loadGlobalStats = async () => {
    try {
      // D'abord, récupérer les formations actives (comportement par défaut)
      const activeResponse = await formationsService.getFormations({ 
        limit: 1,
        page: 1
        // Sans paramètre, on récupère seulement les actives
      });
      
      // Ensuite, récupérer SEULEMENT les inactives
      const inactiveResponse = await formationsService.getFormations({ 
        limit: 1,
        page: 1,
        actif: 'false' as any // Récupérer seulement les inactives
      });
      
      const totalActives = activeResponse.meta?.total || 0;
      const totalInactives = inactiveResponse.meta?.total || 0;
      const totalAll = totalActives + totalInactives;
      
      console.log('Stats calculées:', {
        actives: totalActives,
        inactives: totalInactives,
        total: totalAll
      });
      
      setGlobalStats(prev => ({
        totalFormations: totalAll,
        totalActives: totalActives,
        totalInactives: totalInactives,
        totalCategories: prev.totalCategories // Garder le nombre de catégories
      }));
      
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  // Charger les catégories
  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const cats = await commonService.getCategoriesFormation();
      if (Array.isArray(cats) && cats.length > 0) {
        const categoriesList = cats.map(c => ({
          value: c.id.toString(),
          label: c.nomCategorie,
        }));
        setCategories([
          { value: '', label: 'Toutes les catégories' },
          ...categoriesList
        ]);
        
        // Mettre à jour les stats avec le bon nombre de catégories
        setGlobalStats(prev => ({
          ...prev,
          totalCategories: categoriesList.length
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Charger les types de formation
  const loadTypesFormation = async () => {
    setLoadingTypes(true);
    try {
      const types = await commonService.getTypesFormation();
      if (Array.isArray(types) && types.length > 0) {
        const typesList = types.map(t => ({
          value: t,
          label: t,
        }));
        setTypesFormation([
          { value: '', label: 'Tous les types' },
          ...typesList
        ]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des types:', error);
    } finally {
      setLoadingTypes(false);
    }
  };

  // Charger les catégories et types au montage
  useEffect(() => {
    loadCategories();
    loadTypesFormation();
    // Charger aussi les stats au démarrage avec un délai plus long
    setTimeout(() => {
      console.log('Chargement des stats globales...');
      loadGlobalStats();
    }, 1500); // Délai plus long pour s'assurer que l'API est prête
  }, []);

  return (
    <Container size="xl">
      {/* En-tête */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Flex justify="space-between" align="center" mb="md">
          <div>
            <Group align="center" gap="sm">
              <GraduationCap size={32} color="#228BE6" />
              <Title order={1}>Catalogue des Formations</Title>
            </Group>
            <Text size="lg" c="dimmed" mt="xs">
              Gérez et consultez l'ensemble de vos formations
            </Text>
          </div>
          <Group>
            <Tooltip label={viewMode === 'cards' ? 'Affichage liste' : 'Affichage cartes'}>
              <ActionIcon
                variant="light"
                size="lg"
                onClick={() => setViewMode(viewMode === 'cards' ? 'list' : 'cards')}
              >
                {viewMode === 'cards' ? <List size={20} /> : <SquaresFour size={20} />}
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Rafraîchir">
              <ActionIcon 
                variant="light" 
                size="lg" 
                onClick={() => {
                  handleRefresh();
                  loadCategories();
                  loadTypesFormation();
                  loadGlobalStats();
                }}
              >
                <ArrowsClockwise size={20} />
              </ActionIcon>
            </Tooltip>
            <Button
              leftSection={<Plus size={16} />}
              onClick={() => router.push('/formations/new')}
              size="md"
            >
              Nouvelle formation
            </Button>
          </Group>
        </Flex>

        {/* Statistiques rapides */}
        <Grid mt="lg">
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    {(categoryFilter || typeFilter || debouncedSearch || createdAtDebut || createdAtFin) ? 'Résultats filtrés' : 'Total Formations'}
                  </Text>
                  <Text size="xl" fw={700}>{total}</Text>
                </div>
                <BookOpen size={24} color="#228BE6" />
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    {(categoryFilter || typeFilter || debouncedSearch || createdAtDebut || createdAtFin) ? 'Résultats' : 'Formations Actives'}
                  </Text>
                  <Text size="xl" fw={700} c="green">
                    {(categoryFilter || typeFilter || debouncedSearch || createdAtDebut || createdAtFin) ? total : globalStats.totalActives}
                  </Text>
                </div>
                <CheckCircle size={24} color="#40C057" />
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Catégories
                  </Text>
                  <Text size="xl" fw={700}>
                    {globalStats.totalCategories}
                  </Text>
                </div>
                <Tag size={24} color="#7950F2" />
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Page Actuelle
                  </Text>
                  <Text size="xl" fw={700}>
                    {page} / {totalPages || 1}
                  </Text>
                </div>
                <ChartBar size={24} color="#FD7E14" />
              </Group>
            </Paper>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Filtres */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Group align="center" mb="md">
          <FunnelSimple size={20} />
          <Text fw={600}>Filtres et Recherche</Text>
        </Group>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <TextInput
              placeholder="Rechercher par nom ou code..."
              leftSection={<MagnifyingGlass size={16} />}
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Select
              placeholder={loadingCategories ? "Chargement..." : "Catégorie"}
              data={categories}
              value={categoryFilter}
              onChange={(value) => setCategoryFilter(value || '')}
              clearable
              disabled={loadingCategories}
              searchable
              nothingFoundMessage="Aucune catégorie trouvée"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Select
              placeholder={loadingTypes ? "Chargement..." : "Type de formation"}
              data={typesFormation}
              value={typeFilter}
              onChange={(value) => setTypeFilter(value || '')}
              clearable
              disabled={loadingTypes}
              searchable
              nothingFoundMessage="Aucun type trouvé"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 2 }}>
            <Select
              placeholder="Statut"
              data={[
                { value: '', label: 'Toutes' },
                { value: 'actif', label: 'Actives seulement' },
                { value: 'inactif', label: 'Inactives seulement' },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || '')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <DateInput
              placeholder="Date de création (début)"
              leftSection={<Calendar size={16} />}
              value={createdAtDebut}
              onChange={setCreatedAtDebut}
              clearable
              valueFormat="DD/MM/YYYY"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <DateInput
              placeholder="Date de création (fin)"
              leftSection={<Calendar size={16} />}
              value={createdAtFin}
              onChange={setCreatedAtFin}
              clearable
              valueFormat="DD/MM/YYYY"
            />
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Liste des formations */}
      {isLoading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
          {[...Array(8)].map((_, index) => (
            <Card key={index} shadow="sm" padding="lg" radius="md" withBorder>
              <Skeleton height={30} mb="md" />
              <Skeleton height={20} mb="xs" />
              <Skeleton height={20} mb="xs" />
              <Skeleton height={40} mt="md" />
            </Card>
          ))}
        </SimpleGrid>
      ) : error ? (
        <Alert icon={<Warning size={16} />} color="red" variant="light">
          {error}
        </Alert>
      ) : formations.length > 0 ? (
        <>
          {viewMode === 'cards' ? (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="xl" mb="xl">
            {formations.map((formation) => (
              <Paper
                key={formation.id}
                radius="lg"
                withBorder
                p={0}
                style={{
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  borderColor: formation.actif ? 'var(--mantine-color-gray-3)' : 'var(--mantine-color-red-2)',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                {/* Bande colorée en haut */}
                <Box
                  style={{
                    height: '4px',
                    background: `linear-gradient(135deg, 
                      var(--mantine-color-${categoryColors[getCategoryName(formation.categorie)] || 'blue'}-5) 0%, 
                      var(--mantine-color-${categoryColors[getCategoryName(formation.categorie)] || 'blue'}-7) 100%)`,
                  }}
                />

                {/* Header avec statut et menu */}
                <Flex justify="space-between" align="center" p="md" pb={0}>
                  <Badge
                    size="sm"
                    variant="dot"
                    color={formation.actif ? 'green' : 'red'}
                  >
                    {formation.actif ? 'Active' : 'Inactive'}
                  </Badge>
                  <Menu withinPortal position="bottom-end" shadow="md">
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray" size="sm">
                        <DotsThreeVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<Eye size={14} />}
                        onClick={() => handleViewDetails(formation.id)}
                      >
                        Voir détails
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<PencilSimple size={14} />}
                        onClick={() => handleEdit(formation.id)}
                      >
                        Modifier
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item
                        color="red"
                        leftSection={<Trash size={14} />}
                        onClick={() => handleDelete(formation.id, formation.nomFormation || formation.titre || '')}
                      >
                        Supprimer
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Flex>

                {/* Contenu principal */}
                <Box p="md" pt="xs">
                  {/* Titre */}
                  <Box mb="md">
                    <Text fw={600} size="md" lineClamp={2} style={{ minHeight: '48px' }}>
                      {formation.nomFormation || formation.titre}
                    </Text>
                  </Box>

                  {/* Badges catégorie et type */}
                  <Flex gap="xs" wrap="wrap" mb="md" style={{ minHeight: '28px' }}>
                    {getCategoryName(formation.categorie) && (
                      <Badge
                        variant="light"
                        color={categoryColors[getCategoryName(formation.categorie)] || 'gray'}
                        size="sm"
                        radius="sm"
                      >
                        {getCategoryName(formation.categorie)}
                      </Badge>
                    )}
                    {formation.typeFormation && (
                      <Badge
                        variant="outline"
                        color={typeColors[formation.typeFormation] || 'gray'}
                        size="sm"
                        radius="sm"
                      >
                        {formation.typeFormation}
                      </Badge>
                    )}
                  </Flex>

                  {/* Section métriques */}
                  <Box
                    style={{
                      background: 'var(--mantine-color-gray-0)',
                      borderRadius: 'var(--mantine-radius-md)',
                      padding: '12px',
                      marginBottom: '12px',
                    }}
                  >
                    <Grid gutter="md">
                      <Grid.Col span={4}>
                        <Stack gap={4} align="center">
                          <Clock size={18} style={{ color: 'var(--mantine-color-blue-6)' }} />
                          <Text size="xs" c="dimmed">Durée</Text>
                          <Text size="sm" fw={600}>
                            {formatDuration(formation.dureePrevue, formation.uniteDuree)}
                          </Text>
                        </Stack>
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <Stack gap={4} align="center">
                          <Calendar size={18} style={{ color: 'var(--mantine-color-green-6)' }} />
                          <Text size="xs" c="dimmed">Sessions</Text>
                          <Text size="sm" fw={600}>
                            {formation.nombreSessions || formation._count?.sessions || 0}
                          </Text>
                        </Stack>
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <Stack gap={4} align="center">
                          <Users size={18} style={{ color: 'var(--mantine-color-violet-6)' }} />
                          <Text size="xs" c="dimmed">Inscrits</Text>
                          <Text size="sm" fw={600}>
                            {formation.nombreParticipants || 0}
                          </Text>
                        </Stack>
                      </Grid.Col>
                    </Grid>
                  </Box>

                  {/* Bouton d'action principal */}
                  <Button
                    fullWidth
                    variant="light"
                    color={categoryColors[getCategoryName(formation.categorie)] || 'blue'}
                    onClick={() => handleViewDetails(formation.id)}
                    size="sm"
                  >
                    Voir les détails
                  </Button>
                </Box>
              </Paper>
            ))}
          </SimpleGrid>
          ) : (
            // Vue liste
            <Paper shadow="xs" p="md" radius="md" mb="xl">
              <Table highlightOnHover verticalSpacing="md">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Formation</Table.Th>
                    <Table.Th>Catégorie / Type</Table.Th>
                    <Table.Th style={{ textAlign: 'center' }}>Durée</Table.Th>
                    <Table.Th style={{ textAlign: 'center' }}>Sessions</Table.Th>
                    <Table.Th style={{ textAlign: 'center' }}>Participants</Table.Th>
                    <Table.Th style={{ textAlign: 'center' }}>Statut</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {formations.map((formation) => (
                    <Table.Tr
                      key={formation.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleViewDetails(formation.id)}
                    >
                      <Table.Td>
                        <Box
                          style={{
                            borderLeft: `4px solid var(--mantine-color-${categoryColors[getCategoryName(formation.categorie)] || 'blue'}-5)`,
                            paddingLeft: '12px',
                          }}
                        >
                          <Text size="sm" fw={600} lineClamp={2}>
                            {formation.nomFormation || formation.titre}
                          </Text>
                        </Box>
                      </Table.Td>

                      <Table.Td>
                        <Stack gap={4}>
                          {getCategoryName(formation.categorie) && (
                            <Badge
                              variant="light"
                              color={categoryColors[getCategoryName(formation.categorie)] || 'gray'}
                              size="sm"
                            >
                              {getCategoryName(formation.categorie)}
                            </Badge>
                          )}
                          {formation.typeFormation && (
                            <Badge
                              variant="outline"
                              color={typeColors[formation.typeFormation] || 'gray'}
                              size="xs"
                            >
                              {formation.typeFormation}
                            </Badge>
                          )}
                        </Stack>
                      </Table.Td>

                      <Table.Td style={{ textAlign: 'center' }}>
                        <Group gap={4} justify="center">
                          <Clock size={16} color="var(--mantine-color-blue-6)" />
                          <Text size="sm" fw={500}>
                            {formatDuration(formation.dureePrevue, formation.uniteDuree)}
                          </Text>
                        </Group>
                      </Table.Td>

                      <Table.Td style={{ textAlign: 'center' }}>
                        <Group gap={4} justify="center">
                          <Calendar size={16} color="var(--mantine-color-green-6)" />
                          <Text size="sm" fw={500}>
                            {formation.nombreSessions || formation._count?.sessions || 0}
                          </Text>
                        </Group>
                      </Table.Td>

                      <Table.Td style={{ textAlign: 'center' }}>
                        <Group gap={4} justify="center">
                          <Users size={16} color="var(--mantine-color-violet-6)" />
                          <Text size="sm" fw={500}>
                            {formation.nombreParticipants || 0}
                          </Text>
                        </Group>
                      </Table.Td>

                      <Table.Td style={{ textAlign: 'center' }}>
                        <Badge
                          size="sm"
                          variant="dot"
                          color={formation.actif ? 'green' : 'red'}
                        >
                          {formation.actif ? 'Active' : 'Inactive'}
                        </Badge>
                      </Table.Td>

                      <Table.Td style={{ textAlign: 'right' }}>
                        <Group gap="xs" justify="flex-end">
                          <Tooltip label="Voir détails">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(formation.id);
                              }}
                            >
                              <Eye size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Modifier">
                            <ActionIcon
                              variant="light"
                              color="gray"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(formation.id);
                              }}
                            >
                              <PencilSimple size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Supprimer">
                            <ActionIcon
                              variant="light"
                              color="red"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(formation.id, formation.nomFormation || formation.titre || '');
                              }}
                            >
                              <Trash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              {formations.length === 0 && (
                <Center h={200}>
                  <Stack align="center">
                    <List size={48} color="#868E96" />
                    <Text size="lg" fw={500} c="dimmed">
                      Aucune formation à afficher
                    </Text>
                  </Stack>
                </Center>
              )}
            </Paper>
          )}

          {/* Pagination */}
          <Paper shadow="xs" p="lg" radius="md">
            <Group justify="space-between" align="center">
              <Text size="sm" c="dimmed">
                Affichage de {((page - 1) * limit) + 1} à {Math.min(page * limit, total)} sur {total} formations
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
          </Paper>
        </>
      ) : (
        <Paper shadow="xs" p="xl" radius="md">
          <Center py="xl">
            <Stack align="center">
              <GraduationCap size={48} color="#868E96" />
              <Text size="lg" fw={500} c="dimmed">Aucune formation trouvée</Text>
              <Text size="sm" c="dimmed">
                Essayez de modifier vos critères de recherche
              </Text>
              <Button
                leftSection={<Plus size={16} />}
                onClick={() => router.push('/formations/new')}
                mt="md"
              >
                Créer une formation
              </Button>
            </Stack>
          </Center>
        </Paper>
      )}
    </Container>
  );
}