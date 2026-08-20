'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  TextInput,
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
  Table,
  ThemeIcon,
  Progress,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { Plus } from '@phosphor-icons/react/dist/ssr/Plus';
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { DotsThreeVertical } from '@phosphor-icons/react/dist/ssr/DotsThreeVertical';
import { Eye } from '@phosphor-icons/react/dist/ssr/Eye';
import { PencilSimple } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { Trash } from '@phosphor-icons/react/dist/ssr/Trash';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { XCircle } from '@phosphor-icons/react/dist/ssr/XCircle';
import { BookOpen } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { Calendar } from '@phosphor-icons/react/dist/ssr/Calendar';
import { Certificate } from '@phosphor-icons/react/dist/ssr/Certificate';
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr/ShieldCheck';
import { ArrowsClockwise } from '@phosphor-icons/react/dist/ssr/ArrowsClockwise';
import { FunnelSimple } from '@phosphor-icons/react/dist/ssr/FunnelSimple';
import { List } from '@phosphor-icons/react/dist/ssr/List';
import { SquaresFour } from '@phosphor-icons/react/dist/ssr/SquaresFour';
import { Info } from '@phosphor-icons/react/dist/ssr/Info';
import { Building } from '@phosphor-icons/react/dist/ssr/Building';
import { useRouter } from 'next/navigation';
import { formationsService, commonService } from '@/lib/services';
import { Formation, FormationFilters, FormationsGlobalStats } from '@/lib/types';
import { useUrlFilters, useUrlSearch } from '@/hooks/useUrlFilters';
import { formatDuration } from '@/lib/utils/duration.utils';

// Fonction pour obtenir le nom de la catégorie
const getCategoryName = (categorie: any): string => {
  if (!categorie) return '';
  if (typeof categorie === 'string') return categorie;
  if (typeof categorie === 'object' && categorie.nomCategorie) return categorie.nomCategorie;
  return '';
};

// Couleurs par catégorie.
// Les clés doivent correspondre aux noms réels des catégories en base
// (cf. prisma/seed-categories.ts), sinon le badge tombe sur la couleur par défaut.
const categoryColors: Record<string, string> = {
  // Taxonomie cible (12 catégories)
  'Management - GRH': 'orange',
  'Technique - Métiers': 'indigo',
  'Informatique - Bureautique': 'violet',
  'Qualité - ISO - Sécurité': 'red',
  'Langues': 'green',
  'Finances - Comptabilité - Droit': 'yellow',
  'RSE': 'teal',
  'Soft Skills': 'cyan',
  'DEI': 'grape',
  'DATA - IA': 'blue',
  'Cybersécurité': 'red',
  'Sécurité - SST': 'orange',
  // Libellés historiques conservés pour les données non re-catégorisées
  'Bureautique': 'blue',
  'Informatique': 'violet',
  'Management': 'orange',
  'Sécurité': 'red',
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
  
  // Compteurs portant sur la TOTALITÉ de la population filtrée (endpoint
  // /formations/stats). Ils remplacent les compteurs qui étaient dérivés des
  // seules formations de la page courante et affichaient « sur cette page ».
  const [stats, setStats] = useState<FormationsGlobalStats | null>(null);
  // Compteurs du catalogue complet (sans aucun filtre), servant de référence
  // « sur X au catalogue » quand un filtre restreint la liste.
  const [catalogueStats, setCatalogueStats] = useState<FormationsGlobalStats | null>(null);

  // Filtres et pagination : l'URL est la source de vérité, pour que le bouton
  // retour du navigateur restitue la liste exactement telle qu'elle était.
  const {
    values: urlFilters,
    setValue: setUrlFilter,
    setValues: setUrlFilters,
    page,
    setPage,
  } = useUrlFilters('/formations', {
    search: '',
    categorie: '',
    type: '',
    statut: '',
    // Conserve le nom historique du paramètre : des liens entrants pointent
    // déjà vers /formations?filter=sansSession depuis le dashboard.
    filter: '',
  });

  const search = urlFilters.search;
  const categoryFilter = urlFilters.categorie;
  const typeFilter = urlFilters.type;
  const statusFilter = urlFilters.statut;
  const sansSession = urlFilters.filter === 'sansSession';

  const setCategoryFilter = (value: string) => setUrlFilter('categorie', value);
  const setTypeFilter = (value: string) => setUrlFilter('type', value);
  const setStatusFilter = (value: string) => setUrlFilter('statut', value);
  const setSansSession = (value: boolean) =>
    setUrlFilter('filter', value ? 'sansSession' : '');

  // Champ de recherche : état local debouncé, poussé dans l'URL (voir le hook)
  const [searchInput, setSearchInput] = useUrlSearch(search, (value) =>
    setUrlFilter('search', value),
  );

  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(24); // Plus de cartes par page

  // La valeur de l'URL est déjà debouncée par useUrlSearch
  const debouncedSearch = search;

  // Filtres courants, hors pagination : partagés tels quels entre la liste et
  // les compteurs globaux, pour que les deux portent sur la même population.
  const buildCurrentFilters = () => {
    const filters: any = {
      search: debouncedSearch,
      categorieId: categoryFilter ? parseInt(categoryFilter) : undefined,
      typeFormation: typeFilter || undefined,
    };

    // Filtre sans session
    if (sansSession) {
      filters.sansSession = 'true';
    }

    // Nettoyer les valeurs undefined pour que axios les envoie correctement
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
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

    return cleanFilters;
  };

  // Charger les formations
  const loadFormations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const cleanFilters: FormationFilters = {
        ...buildCurrentFilters(),
        page,
        limit,
        sortBy: 'nomFormation',
        order: 'asc',
      };

      const response = await formationsService.getFormations(cleanFilters);

      if (response.data) {
        setFormations(response.data);
        setTotal(response.meta?.total || (response as any).total || 0);
        setTotalPages(response.meta?.totalPages || Math.ceil((response.meta?.total || (response as any).total || 0) / limit));
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

  // Compteurs KPI sur la population filtrée complète (toutes pages confondues).
  const loadStats = async () => {
    try {
      setStats(await formationsService.getFormationsStats(buildCurrentFilters()));
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques de formations:', err);
      setStats(null);
    }
  };

  // Charger les formations au montage et quand les filtres changent
  useEffect(() => {
    loadFormations();
  }, [debouncedSearch, categoryFilter, typeFilter, statusFilter, sansSession, page]);

  // Les compteurs ne dépendent pas de la page : on ne les recharge que si un
  // filtre change réellement.
  useEffect(() => {
    loadStats();
  }, [debouncedSearch, categoryFilter, typeFilter, statusFilter, sansSession]);

  // Le retour en page 1 lors d'un changement de filtre est assuré par
  // useUrlFilters : plus besoin d'un effet dédié.

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
    loadStats();
    loadCatalogueStats();
  };

  // Compteurs du catalogue complet, indépendants des filtres courants.
  // Sert uniquement de référence « sur X au catalogue ».
  const loadCatalogueStats = async () => {
    try {
      setCatalogueStats(
        await formationsService.getFormationsStats({ includeInactive: 'true' } as any)
      );
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques du catalogue:', error);
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

  // Charger les catégories, types et stats au montage (en parallèle, sans délai
  // artificiel — l'ancien setTimeout de 1,5 s retardait l'affichage pour rien)
  useEffect(() => {
    loadCategories();
    loadTypesFormation();
    loadCatalogueStats();
  }, []);

  // Indique si un filtre actif restreint la liste (pour adapter les cartes de stats)
  // Note : reprend exactement la condition historique (statusFilter volontairement exclu)
  const isFiltered = Boolean(categoryFilter || typeFilter || debouncedSearch || sansSession);


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
          <Grid.Col span={{ base: 12, xs: 6, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    {isFiltered ? 'Résultats filtrés' : 'Total Formations'}
                  </Text>
                  <Text size="xl" fw={700}>{stats?.total ?? total}</Text>
                  <Text size="xs" c="dimmed">
                    {isFiltered && catalogueStats
                      ? `sur ${catalogueStats.total} au catalogue`
                      : 'au catalogue'}
                  </Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                  <BookOpen size={20} />
                </ThemeIcon>
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 6, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Formations Actives
                  </Text>
                  <Text size="xl" fw={700} c="green">
                    {stats?.actives ?? 0}
                  </Text>
                  <Progress
                    value={((stats?.actives ?? 0) / (stats?.total || 1)) * 100}
                    size="xs"
                    radius="xl"
                    mt={4}
                    color="green"
                  />
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="green">
                  <CheckCircle size={20} />
                </ThemeIcon>
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 6, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Obligatoires
                  </Text>
                  <Text size="xl" fw={700} c="orange">{stats?.obligatoires ?? 0}</Text>
                  <Text size="xs" c="dimmed">
                    {isFiltered ? 'sur les résultats filtrés' : 'au catalogue'}
                  </Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="orange">
                  <Warning size={20} />
                </ThemeIcon>
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 6, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Certifiantes
                  </Text>
                  <Text size="xl" fw={700} c="teal">{stats?.certifiantes ?? 0}</Text>
                  <Text size="xs" c="dimmed">
                    {isFiltered ? 'sur les résultats filtrés' : 'au catalogue'}
                  </Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="teal">
                  <Certificate size={20} />
                </ThemeIcon>
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
              aria-label="Rechercher une formation"
              placeholder="Rechercher par nom ou code..."
              leftSection={<MagnifyingGlass size={16} />}
              value={searchInput}
              onChange={(event) => setSearchInput(event.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 2 }}>
            <Select
              aria-label="Filtrer par catégorie"
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
          <Grid.Col span={{ base: 12, sm: 2 }}>
            <Select
              aria-label="Filtrer par type de formation"
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
              aria-label="Filtrer par statut"
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
        </Grid>
        <Text size="sm" c="dimmed" mt="md">
          Affichage : {formations.length} résultat{formations.length > 1 ? 's' : ''} sur cette page • Total : {total} formation{total > 1 ? 's' : ''}
        </Text>
      </Paper>

      {/* Bannière filtre sans session */}
      {sansSession && (
        <Alert
          icon={<Info size={16} />}
          color="blue"
          variant="light"
          mb="lg"
          withCloseButton
          onClose={() => {
            setSansSession(false);
            router.replace('/formations', { scroll: false });
          }}
        >
          <Text fw={500} size="sm">
            Filtre actif : formations sans aucune session
          </Text>
        </Alert>
      )}

      {/* Liste des formations */}
      {isLoading ? (
        <Center h={300}>
          <Loader size="lg" variant="bars" />
        </Center>
      ) : error ? (
        <Alert icon={<Warning size={16} />} color="red" variant="light">
          {error}
        </Alert>
      ) : formations.length > 0 ? (
        <>
          {viewMode === 'cards' ? (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg" mb="xl">
            {formations.map((formation) => (
              <Paper
                key={formation.id}
                radius="md"
                withBorder
                p="lg"
                style={{
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }}
                onClick={() => handleViewDetails(formation.id)}
              >
                {/* Header : statut, badges et menu */}
                <Group justify="space-between" mb="md">
                  <Group gap="xs">
                    <Badge
                      leftSection={formation.actif ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      color={formation.actif ? 'green' : 'red'}
                      variant="light"
                    >
                      {formation.actif ? 'Active' : 'Inactive'}
                    </Badge>
                    {formation.estObligatoire && (
                      <Badge leftSection={<Warning size={14} />} color="orange" variant="light">
                        Obligatoire
                      </Badge>
                    )}
                    {formation.estCertifiante && (
                      <Badge leftSection={<Certificate size={14} />} color="teal" variant="light">
                        Certifiante
                      </Badge>
                    )}
                    {formation.estSecurite && (
                      <Badge leftSection={<ShieldCheck size={14} />} color="red" variant="light">
                        Securite (SST)
                      </Badge>
                    )}
                  </Group>
                  <Menu withinPortal position="bottom-end" shadow="sm">
                    <Menu.Target>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DotsThreeVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<Eye size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(formation.id);
                        }}
                      >
                        Voir détails
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<PencilSimple size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(formation.id);
                        }}
                      >
                        Modifier
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item
                        color="red"
                        leftSection={<Trash size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(formation.id, formation.nomFormation || formation.titre || '');
                        }}
                      >
                        Supprimer
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>

                {/* Nom de la formation */}
                <Stack gap="xs" mb="md">
                  <Group gap="xs">
                    <GraduationCap size={20} color="#228BE6" />
                    <Text size="md" fw={600} lineClamp={2}>
                      {formation.nomFormation || formation.titre}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    {getCategoryName(formation.categorie) && (
                      <Badge
                        variant="dot"
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
                        size="sm"
                      >
                        {formation.typeFormation}
                      </Badge>
                    )}
                  </Group>
                </Stack>

                <Divider my="sm" />

                {/* Métriques */}
                <Stack gap="xs">
                  <Group gap="xs">
                    <Clock size={16} color="#868E96" />
                    <Text size="xs" c="dimmed">
                      {formatDuration(formation.dureePrevue, formation.uniteDuree)}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <Calendar size={16} color="#868E96" />
                    <Text size="xs" c="dimmed">
                      {formation.nombreSessions || formation._count?.sessions || 0} session(s)
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <Users size={16} color="#868E96" />
                    <Text size="xs" c="dimmed">
                      {formation.nombreParticipants || 0} participant(s)
                    </Text>
                  </Group>
                  {formation.organisme && (
                    <Group gap="xs">
                      <Building size={16} color="#868E96" />
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {formation.organisme.nomOrganisme}
                      </Text>
                    </Group>
                  )}
                </Stack>
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
                    <Table.Th>Organisme</Table.Th>
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
                        {formation.organisme ? (
                          <Text size="sm" c="dimmed">
                            {formation.organisme.nomOrganisme}
                          </Text>
                        ) : (
                          <Text size="xs" c="dimmed" fs="italic">
                            Non défini
                          </Text>
                        )}
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
                          <Group gap={4}>
                            {formation.estObligatoire && (
                              <Badge leftSection={<Warning size={10} />} color="orange" variant="light" size="xs">
                                Obligatoire
                              </Badge>
                            )}
                            {formation.estCertifiante && (
                              <Badge leftSection={<Certificate size={10} />} color="teal" variant="light" size="xs">
                                Certifiante
                              </Badge>
                            )}
                            {formation.estSecurite && (
                              <Badge leftSection={<ShieldCheck size={10} />} color="red" variant="light" size="xs">
                                Securite (SST)
                              </Badge>
                            )}
                          </Group>
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
                Page {page} sur {totalPages || 1} • Affichage de {((page - 1) * limit) + 1} à {Math.min(page * limit, total)} sur {total} formations
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