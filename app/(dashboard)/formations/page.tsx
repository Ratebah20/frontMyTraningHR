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
} from '@mantine/core';
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
} from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { formationsService } from '@/lib/services';
import { Formation, FormationFilters } from '@/lib/types';
import { useDebounce } from '@/hooks/useApi';

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
  
  // Filtres et pagination
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showInactive, setShowInactive] = useState(false);
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
      const filters: FormationFilters = {
        search: debouncedSearch,
        categorieId: categoryFilter ? parseInt(categoryFilter) : undefined,
        typeFormation: typeFilter || undefined,
        includeInactive: showInactive,
        page,
        limit,
        sortBy: 'nomFormation',
        order: 'asc',
      };
      
      const response = await formationsService.getFormations(filters);
      
      if (response.data) {
        setFormations(response.data);
        setTotal(response.meta?.total || response.total || 0);
        setTotalPages(response.meta?.totalPages || Math.ceil((response.meta?.total || response.total || 0) / limit));
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
  }, [debouncedSearch, categoryFilter, typeFilter, showInactive, page]);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryFilter, typeFilter, showInactive]);

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
  };

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
            <Tooltip label="Rafraîchir">
              <ActionIcon variant="light" size="lg" onClick={handleRefresh}>
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
                    Total Formations
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
                    Formations Actives
                  </Text>
                  <Text size="xl" fw={700} c="green">
                    {formations.filter(f => f.actif).length}
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
                    {[...new Set(formations.map(f => getCategoryName(f.categorie)))].filter(c => c).length}
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
              placeholder="Catégorie"
              data={[
                { value: '', label: 'Toutes les catégories' },
                { value: '1', label: 'Bureautique' },
                { value: '2', label: 'Informatique' },
                { value: '3', label: 'Management' },
                { value: '4', label: 'Sécurité' },
                { value: '5', label: 'Langues' },
              ]}
              value={categoryFilter}
              onChange={(value) => setCategoryFilter(value || '')}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Select
              placeholder="Type de formation"
              data={[
                { value: '', label: 'Tous les types' },
                { value: 'Présentiel', label: 'Présentiel' },
                { value: 'Distanciel', label: 'Distanciel' },
                { value: 'E-learning', label: 'E-learning' },
                { value: 'Mixte', label: 'Mixte' },
              ]}
              value={typeFilter}
              onChange={(value) => setTypeFilter(value || '')}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 2 }}>
            <Button
              variant={showInactive ? 'filled' : 'light'}
              onClick={() => setShowInactive(!showInactive)}
              fullWidth
            >
              {showInactive ? 'Toutes' : 'Actives seulement'}
            </Button>
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
                  {/* Titre et code */}
                  <Box mb="md">
                    <Text fw={600} size="md" lineClamp={2} style={{ minHeight: '48px' }}>
                      {formation.nomFormation || formation.titre}
                    </Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      {formation.codeFormation}
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
                            {formation.dureePrevue || 0}{formation.uniteDuree?.toLowerCase() === 'heures' ? 'h' : formation.uniteDuree || 'h'}
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