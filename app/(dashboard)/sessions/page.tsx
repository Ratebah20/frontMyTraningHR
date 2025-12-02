'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Card,
  SimpleGrid,
  Center,
  Stack,
  Flex,
  ActionIcon,
  Menu,
  Select,
  TextInput,
  Pagination,
  Loader,
  Alert,
  Box,
  Paper,
  Grid,
  Tooltip,
  Badge,
  Timeline,
  Avatar,
  ThemeIcon,
  Progress,
  Divider,
  Modal,
  Table,
} from '@mantine/core';
// import { DatePickerInput } from '@mantine/dates'; // Module non installé
import { notifications } from '@mantine/notifications';
import {
  Plus,
  Calendar,
  Users,
  Clock,
  MagnifyingGlass,
  DotsThreeVertical,
  Eye,
  PencilSimple,
  XCircle,
  Warning,
  CheckCircle,
  BookOpen,
  ChartBar,
  ArrowsClockwise,
  FunnelSimple,
  MapPin,
  Certificate,
  CalendarCheck,
  CalendarX,
  UserCheck,
  Building,
  Hourglass,
  List,
  CalendarBlank,
  SortAscending,
  SortDescending,
} from '@phosphor-icons/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sessionsService, formationsService, collaborateursService } from '@/lib/services';
import { SessionsUnifiedService } from '@/lib/services/sessions-unified.service';
import { StatutUtils } from '@/lib/utils/statut.utils';
import { formatDuration } from '@/lib/utils/duration.utils';
import { SessionFormationResponse, SessionFilters, GroupedSession, UnifiedSession } from '@/lib/types';
import { useDebounce } from '@/hooks/useApi';
import { SessionTypeBadge } from '@/components/sessions/SessionTypeBadge';
import { CapacityIndicator } from '@/components/sessions/CapacityIndicator';

// Couleurs par statut
const statusColors: Record<string, string> = {
  'inscrit': 'blue',
  'INSCRIT': 'blue',
  'en_cours': 'yellow',
  'EN_COURS': 'yellow',
  'complete': 'green',
  'TERMINE': 'green',
  'COMPLETE': 'green',
  'Terminé': 'green',
  'terminé': 'green',
  'annule': 'red',
  'ANNULE': 'red',
  'Annulé': 'red',
  'annulé': 'red',
};

// Labels des statuts
const statusLabels: Record<string, string> = {
  'inscrit': 'Inscrit',
  'INSCRIT': 'Inscrit',
  'en_cours': 'En cours',
  'EN_COURS': 'En cours',
  'complete': 'Terminé',
  'TERMINE': 'Terminé',
  'COMPLETE': 'Terminé',
  'Terminé': 'Terminé',
  'terminé': 'Terminé',
  'annule': 'Annulé',
  'ANNULE': 'Annulé',
  'Annulé': 'Annulé',
  'annulé': 'Annulé',
};

// Icônes par statut
const statusIcons: Record<string, any> = {
  'inscrit': CalendarCheck,
  'INSCRIT': CalendarCheck,
  'en_cours': Hourglass,
  'EN_COURS': Hourglass,
  'complete': Certificate,
  'TERMINE': Certificate,
  'COMPLETE': Certificate,
  'Terminé': Certificate,
  'terminé': Certificate,
  'annule': CalendarX,
  'ANNULE': CalendarX,
  'Annulé': CalendarX,
  'annulé': CalendarX,
};

export default function SessionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // États
  const [sessions, setSessions] = useState<any[]>([]); // Can be GroupedSession[] or UnifiedSession[]
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>(() => {
    // Récupérer le mode de vue depuis localStorage au chargement
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sessions-view-mode');
      return saved === 'list' ? 'list' : 'cards';
    }
    return 'cards';
  });

  // Statistiques globales
  const [globalStats, setGlobalStats] = useState({
    total: 0,
    inscrites: 0,
    enCours: 0,
    terminees: 0,
    sessionsGroupees: 0,
  });

  // Filtres et pagination - lecture depuis l'URL (source unique de vérité)
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || '';
  const typeFilter = searchParams.get('type') || '';
  const dateDebut = searchParams.get('dateDebut') || '';
  const dateFin = searchParams.get('dateFin') || '';
  const formationFilter = searchParams.get('formation') || '';
  const departmentFilter = searchParams.get('department') || '';
  const organismeFilter = searchParams.get('organisme') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const sortBy = searchParams.get('sortBy') || 'dateDebut';
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);

  // Fonction pour mettre à jour l'URL avec les nouveaux paramètres
  const updateUrlParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || (key === 'page' && value === '1')) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Réinitialiser la page à 1 si on change un filtre (sauf si on change la page elle-même)
    if (!('page' in updates) && params.get('page')) {
      params.delete('page');
    }

    const newUrl = params.toString() ? `/sessions?${params.toString()}` : '/sessions';
    router.push(newUrl, { scroll: false });
  };

  // Setters pour les filtres (mettent à jour l'URL)
  const setSearch = (value: string) => updateUrlParams({ search: value });
  const setStatusFilter = (value: string) => updateUrlParams({ status: value });
  const setTypeFilter = (value: string) => updateUrlParams({ type: value });
  const setDateDebut = (value: string) => updateUrlParams({ dateDebut: value });
  const setDateFin = (value: string) => updateUrlParams({ dateFin: value });
  const setFormationFilter = (value: string) => updateUrlParams({ formation: value });
  const setDepartmentFilter = (value: string) => updateUrlParams({ department: value });
  const setOrganismeFilter = (value: string) => updateUrlParams({ organisme: value });
  const setSortBy = (value: string) => updateUrlParams({ sortBy: value });
  const setSortOrder = (value: 'asc' | 'desc') => updateUrlParams({ sortOrder: value });

  // Liste des organismes pour le filtre
  const [organismes, setOrganismes] = useState<{ value: string; label: string }[]>([]);
  const [loadingOrganismes, setLoadingOrganismes] = useState(false);

  // Debounce pour la recherche - état local temporaire
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearchInput = useDebounce(searchInput, 500);

  // Synchroniser le debounced search avec l'URL
  useEffect(() => {
    if (debouncedSearchInput !== search) {
      setSearch(debouncedSearchInput);
    }
  }, [debouncedSearchInput]);

  // Synchroniser l'input avec l'URL quand on revient sur la page
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Charger les statistiques globales
  const loadGlobalStats = async () => {
    try {
      const stats = await sessionsService.getGlobalStats();

      // Récupérer le nombre de sessions groupées (groupes de 2+ sessions)
      const groupedCount = await sessionsService.getGroupedSessionsCount();

      setGlobalStats({
        total: stats.total,
        inscrites: stats.inscrites,
        enCours: stats.enCours,
        terminees: stats.terminees,
        sessionsGroupees: groupedCount.count,
      });
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  };

  // Charger les organismes pour le filtre
  const loadOrganismes = async () => {
    setLoadingOrganismes(true);
    try {
      const response = await sessionsService.getOrganismes();
      const organismesData = response.map((org: any) => ({
        value: org.id.toString(),
        label: org.nomOrganisme,
      }));
      setOrganismes(organismesData);
    } catch (err) {
      console.error('Erreur lors du chargement des organismes:', err);
    } finally {
      setLoadingOrganismes(false);
    }
  };

  // Charger les sessions
  const loadSessions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filters: any = {
        search: search,
        statut: statusFilter || undefined,
        type: typeFilter || 'all', // 'individuelle', 'collective', or 'all'
        dateDebut: dateDebut || undefined,
        dateFin: dateFin || undefined,
        formationId: formationFilter ? parseInt(formationFilter) : undefined,
        departementId: departmentFilter ? parseInt(departmentFilter) : undefined,
        organismeId: organismeFilter ? parseInt(organismeFilter) : undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      };

      // Use unified service for all types or collective only
      // Use grouped service for individual only (to preserve grouping)
      let response;
      if (typeFilter === 'individuelle') {
        // Show grouped individual sessions only
        response = await sessionsService.getGroupedSessions(filters);
      } else if (typeFilter === 'collective') {
        // Show collective sessions only
        response = await SessionsUnifiedService.findAll(filters);
      } else {
        // Show all types (both individual and collective)
        response = await SessionsUnifiedService.findAll(filters);
      }

      // Le backend retourne toujours un objet avec data et meta
      if (response && response.data) {
        setSessions(response.data);
        setTotal(response.meta?.totalItems || 0);
        setTotalPages(response.meta?.totalPages || 1);
      } else {
        setSessions([]);
        setTotal(0);
        setTotalPages(0);
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des sessions:', err);
      setError(err.message || 'Erreur lors du chargement des sessions');
      setSessions([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Sauvegarder le mode de vue dans localStorage
  useEffect(() => {
    localStorage.setItem('sessions-view-mode', viewMode);
  }, [viewMode]);

  // Fonction pour changer de page
  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage.toString() });
  };

  // Charger les données au montage
  useEffect(() => {
    loadGlobalStats();
    loadOrganismes();
  }, []);

  // Charger les sessions au montage et quand les filtres changent
  useEffect(() => {
    loadSessions();
    loadGlobalStats(); // Rafraîchir aussi les stats pour avoir des données à jour
  }, [search, statusFilter, typeFilter, dateDebut, dateFin, formationFilter, departmentFilter, organismeFilter, page, sortBy, sortOrder]);

  const handleViewDetails = (session: any) => {
    // Validation: vérifier que les champs nécessaires existent
    if (!session) {
      console.error('Session invalide:', session);
      return;
    }

    // Si c'est une session collective, utiliser l'ID avec le paramètre type
    if (session.type === 'collective') {
      if (!session.id || session.id <= 0) {
        console.error('ID de session collective invalide:', session.id);
        return;
      }
      router.push(`/sessions/${session.id}?type=collective`);
    } else {
      // Session individuelle
      // Si c'est une session solo (un seul participant), aller directement à la page détail
      if (session.stats?.total === 1 && session.participants?.[0]?.sessionId) {
        router.push(`/sessions/${session.participants[0].sessionId}`);
      } else if (session.groupKey) {
        // Sinon, c'est une session groupée avec plusieurs participants
        router.push(`/sessions/grouped/${encodeURIComponent(session.groupKey)}`);
      } else {
        console.error('GroupKey manquant pour session individuelle:', session);
      }
    }
  };

  const handleViewFormation = (formationId: number) => {
    router.push(`/formations/${formationId}`);
  };

  const handleEditSession = (session: any) => {
    // Gérer les sessions collectives
    if (session.type === 'collective') {
      router.push(`/sessions/${session.id}/edit?type=collective`);
      return;
    }

    // Gérer les sessions individuelles groupées
    if (session.participants && session.participants.length === 1) {
      // Si une seule session, éditer directement
      const participant = session.participants[0] as GroupedSessionParticipant;
      if (participant.sessionId) {
        router.push(`/sessions/${participant.sessionId}/edit`);
      }
    } else if (session.groupKey) {
      // Sinon, aller à la vue groupée pour choisir quelle session éditer
      router.push(`/sessions/grouped/${encodeURIComponent(session.groupKey)}`);
    }
  };

  const handleRefresh = () => {
    loadSessions();
    loadGlobalStats();
  };

  // Synchroniser les statuts des sessions passées
  const handleSyncPastStatus = async () => {
    setIsSyncing(true);
    try {
      // Appeler les deux endpoints de synchronisation
      const [indivResult, collectResult] = await Promise.all([
        sessionsService.syncPastStatus(),
        sessionsService.syncPastCollectiveStatus(),
      ]);

      const totalUpdated = (indivResult?.updated || 0) + (collectResult?.updated || 0);

      if (totalUpdated > 0) {
        notifications.show({
          title: 'Synchronisation réussie',
          message: `${totalUpdated} session(s) mise(s) à jour en "terminé"`,
          color: 'green',
          icon: <CheckCircle size={16} />,
        });
        // Rafraîchir les données
        loadSessions();
        loadGlobalStats();
      } else {
        notifications.show({
          title: 'Aucune mise à jour',
          message: 'Toutes les sessions passées sont déjà marquées comme terminées',
          color: 'blue',
          icon: <CheckCircle size={16} />,
        });
      }
    } catch (err: any) {
      console.error('Erreur lors de la synchronisation:', err);
      notifications.show({
        title: 'Erreur de synchronisation',
        message: err.message || 'Une erreur est survenue',
        color: 'red',
        icon: <Warning size={16} />,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Fonction pour obtenir le statut dominant d'une session groupée
  const getDominantStatus = (stats: any) => {
    // Si pas de stats (session collective ou autre), retourner un statut par défaut
    if (!stats || !stats.total) {
      return { color: 'blue', label: 'Session active', icon: CalendarCheck };
    }

    if (stats.complete > stats.total / 2) return { color: 'green', label: 'Majoritairement terminé', icon: Certificate };
    if (stats.enCours > 0) return { color: 'yellow', label: 'En cours', icon: Hourglass };
    if (stats.inscrit > 0) return { color: 'blue', label: 'Inscriptions ouvertes', icon: CalendarCheck };
    if (stats.annule === stats.total) return { color: 'red', label: 'Annulée', icon: CalendarX };
    return { color: 'gray', label: 'Non défini', icon: CalendarCheck };
  };

  // Fonction pour obtenir le nombre de participants de manière standardisée
  const getParticipantCount = (session: any): number => {
    // Pour les sessions collectives, utiliser nombreParticipants
    if (session.type === 'collective') {
      return session.nombreParticipants ?? 0;
    }
    // Pour les sessions individuelles groupées, utiliser stats.total
    return session.stats?.total ?? 0;
  };

  // Fonction pour formater l'affichage du nombre de participants
  const formatParticipantCount = (session: any): string => {
    const count = getParticipantCount(session);
    return `${count} participant${count > 1 ? 's' : ''}`;
  };

  return (
    <Container size="xl">
      {/* En-tête */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Flex justify="space-between" align="center" mb="md">
          <div>
            <Group align="center" gap="sm">
              <Calendar size={32} color="#228BE6" />
              <Title order={1}>Gestion des Sessions</Title>
            </Group>
            <Text size="lg" c="dimmed" mt="xs">
              Vue d'ensemble de toutes les sessions de formation
            </Text>
          </div>
          <Group>
            <Tooltip label="Basculer l'affichage">
              <ActionIcon
                variant="light"
                size="lg"
                onClick={() => setViewMode(viewMode === 'cards' ? 'list' : 'cards')}
              >
                {viewMode === 'cards' ? <List size={20} /> : <CalendarBlank size={20} />}
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Rafraîchir">
              <ActionIcon variant="light" size="lg" onClick={handleRefresh}>
                <ArrowsClockwise size={20} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Mettre à jour automatiquement les sessions passées en 'terminé'">
              <Button
                variant="light"
                color="green"
                leftSection={isSyncing ? <Loader size={16} /> : <CheckCircle size={16} />}
                onClick={handleSyncPastStatus}
                loading={isSyncing}
                size="md"
              >
                Sync. statuts
              </Button>
            </Tooltip>
            <Button
              leftSection={<Plus size={16} />}
              onClick={() => router.push('/sessions/new')}
              size="md"
            >
              Nouvelle inscription
            </Button>
          </Group>
        </Flex>

        {/* Statistiques globales (de toute la base de données) */}
        <Grid mt="lg">
          <Grid.Col span={{ base: 12, xs: 6, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Inscrites
                  </Text>
                  <Text size="xl" fw={700} c="blue">{globalStats.inscrites}</Text>
                  <Text size="xs" c="dimmed">
                    sur {globalStats.total} sessions
                  </Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                  <CalendarCheck size={20} />
                </ThemeIcon>
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 6, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    En cours
                  </Text>
                  <Text size="xl" fw={700} c="yellow">{globalStats.enCours}</Text>
                  <Text size="xs" c="dimmed">
                    formations actives
                  </Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="yellow">
                  <Hourglass size={20} />
                </ThemeIcon>
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 6, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Terminées
                  </Text>
                  <Text size="xl" fw={700} c="green">{globalStats.terminees}</Text>
                  <Progress 
                    value={(globalStats.terminees / (globalStats.total || 1)) * 100} 
                    size="xs" 
                    radius="xl" 
                    mt={4}
                    color="green"
                  />
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="green">
                  <Certificate size={20} />
                </ThemeIcon>
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 6, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Groupées
                  </Text>
                  <Text size="xl" fw={700} c="violet">{globalStats.sessionsGroupees}</Text>
                  <Text size="xs" c="dimmed">
                    sessions groupées
                  </Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                  <Users size={20} />
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
              placeholder="Rechercher un collaborateur ou une formation..."
              leftSection={<MagnifyingGlass size={16} />}
              value={searchInput}
              onChange={(event) => setSearchInput(event.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 2 }}>
            <Select
              placeholder="Type"
              data={[
                { value: '', label: 'Tous les types' },
                { value: 'individuelle', label: 'Individuelle' },
                { value: 'collective', label: 'Collective' },
              ]}
              value={typeFilter}
              onChange={(value) => setTypeFilter(value || '')}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 2 }}>
            <Select
              placeholder="Statut"
              data={[
                { value: '', label: 'Tous les statuts' },
                { value: 'inscrit', label: 'Inscrit' },
                { value: 'planifie', label: 'Planifié' },
                { value: 'en_cours', label: 'En cours' },
                { value: 'complete', label: 'Terminé' },
                { value: 'annule', label: 'Annulé' },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || '')}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 2 }}>
            <Select
              placeholder={loadingOrganismes ? "Chargement..." : "Organisme"}
              data={organismes}
              value={organismeFilter}
              onChange={(value) => setOrganismeFilter(value || '')}
              clearable
              disabled={loadingOrganismes}
              searchable
              nothingFoundMessage="Aucun organisme trouvé"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 2 }}>
            <Group grow>
              <TextInput
                type="date"
                placeholder="Date début"
                value={dateDebut}
                onChange={(event) => setDateDebut(event.currentTarget.value)}
              />
              <TextInput
                type="date"
                placeholder="Date fin"
                value={dateFin}
                onChange={(event) => setDateFin(event.currentTarget.value)}
              />
            </Group>
          </Grid.Col>
        </Grid>

        {/* Tri */}
        <Group mt="md" gap="sm">
          <Group gap="xs">
            {sortOrder === 'desc' ? <SortDescending size={18} /> : <SortAscending size={18} />}
            <Text size="sm" fw={500}>Trier par :</Text>
          </Group>
          <Select
            size="sm"
            w={180}
            data={[
              { value: 'dateDebut', label: 'Date de début' },
              { value: 'dateFin', label: 'Date de fin' },
              { value: 'formationNom', label: 'Nom de formation' },
              { value: 'dureeHeures', label: 'Durée' },
              { value: 'coutTotal', label: 'Coût' },
            ]}
            value={sortBy}
            onChange={(value) => setSortBy(value || 'dateDebut')}
          />
          <ActionIcon
            variant="light"
            size="lg"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            title={sortOrder === 'asc' ? 'Tri croissant' : 'Tri décroissant'}
          >
            {sortOrder === 'desc' ? <SortDescending size={18} /> : <SortAscending size={18} />}
          </ActionIcon>
        </Group>
        <Text size="sm" c="dimmed" mt="md">
          Affichage : {sessions.length} résultats sur cette page • Total : {globalStats.total} sessions
        </Text>
      </Paper>

      {/* Liste des sessions */}
      {isLoading ? (
        <Center h={300}>
          <Loader size="lg" variant="bars" />
        </Center>
      ) : error ? (
        <Alert icon={<Warning size={16} />} color="red" variant="light">
          {error}
        </Alert>
      ) : sessions.length > 0 ? (
        <>
          {viewMode === 'cards' ? (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" mb="xl">
              {sessions.map((session) => {
                const statusInfo = getDominantStatus(session.stats);
                const StatusIcon = statusInfo.icon;

                return (
                  <Paper
                    key={session.type === 'collective' ? `collective-${session.id}` : `grouped-${session.groupKey}`}
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
                    onClick={() => handleViewDetails(session)}
                  >
                    {/* Header */}
                    <Group justify="space-between" mb="md">
                      <Group gap="xs">
                        {session.type && <SessionTypeBadge type={session.type} />}
                        <Badge
                          leftSection={<StatusIcon size={14} />}
                          color={statusInfo.color}
                          variant="light"
                        >
                          {statusInfo.label}
                        </Badge>
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
                              handleViewDetails(session);
                            }}
                          >
                            Voir les participants
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<BookOpen size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewFormation(session.formationId);
                            }}
                          >
                            Voir la formation
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            leftSection={<PencilSimple size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditSession(session);
                            }}
                            color="blue"
                          >
                            Modifier{session.participants && session.participants.length > 1 ? ' les sessions' : ' la session'}
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>

                    {/* Nom de la formation */}
                    <Stack gap="xs" mb="md">
                      <Group gap="xs">
                        <BookOpen size={20} color="#228BE6" />
                        <Text size="md" fw={600} lineClamp={2}>
                          {session.formationNom}
                        </Text>
                      </Group>
                      {session.categorie && (
                        <Badge variant="dot" color="gray" size="sm">
                          {session.categorie}
                        </Badge>
                      )}
                    </Stack>

                    <Divider my="sm" />

                    {/* Participants */}
                    <Group gap="xs" mb="md">
                      <Users size={18} color="#868E96" />
                      <div style={{ flex: 1 }}>
                        <Text size="sm" fw={500}>
                          {formatParticipantCount(session)}
                        </Text>
                        {session.type === 'collective' && session.capaciteMax && (
                          <CapacityIndicator
                            current={getParticipantCount(session)}
                            max={session.capaciteMax}
                          />
                        )}
                        {session.stats && (
                          <Group gap="xs" mt={2}>
                            {session.stats.inscrit > 0 && (
                              <Badge size="xs" color="blue" variant="light">
                                {session.stats.inscrit} inscrit{session.stats.inscrit > 1 ? 's' : ''}
                              </Badge>
                            )}
                            {session.stats.enCours > 0 && (
                              <Badge size="xs" color="yellow" variant="light">
                                {session.stats.enCours} en cours
                              </Badge>
                            )}
                            {session.stats.complete > 0 && (
                              <Badge size="xs" color="green" variant="light">
                                {session.stats.complete} terminé{session.stats.complete > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </Group>
                        )}
                      </div>
                    </Group>

                    {/* Info collective session */}
                    {session.type === 'collective' && (
                      <>
                        {session.titre && (
                          <Group gap="xs" mb="xs">
                            <Text size="xs" c="dimmed">Titre : {session.titre}</Text>
                          </Group>
                        )}
                        {session.modalite && (
                          <Group gap="xs" mb="xs">
                            <Badge size="sm" variant="light" color="grape">
                              {session.modalite === 'presentiel' ? 'Présentiel' :
                               session.modalite === 'distanciel' ? 'Distanciel' : 'Hybride'}
                            </Badge>
                          </Group>
                        )}
                        {session.lieu && (
                          <Group gap="xs" mb="xs">
                            <MapPin size={14} color="#868E96" />
                            <Text size="xs" c="dimmed">{session.lieu}</Text>
                          </Group>
                        )}
                      </>
                    )}

                    {/* Dates */}
                    {(session.dateDebut || session.dateFin) && (
                      <Stack gap="xs" mb="md">
                        <Group gap="xs">
                          <Calendar size={16} color="#868E96" />
                          <Text size="xs" c="dimmed">
                            {session.dateDebut
                              ? `Du ${new Date(session.dateDebut).toLocaleDateString('fr-FR')}`
                              : 'Date non définie'}
                            {session.dateFin && ` au ${new Date(session.dateFin).toLocaleDateString('fr-FR')}`}
                          </Text>
                        </Group>
                      </Stack>
                    )}

                    {/* Durée */}
                    {session.dureeHeures && (
                      <Group gap="xs" mb="md">
                        <Clock size={16} color="#868E96" />
                        <Text size="xs" c="dimmed">
                          {formatDuration(session.dureeHeures)}
                        </Text>
                      </Group>
                    )}

                    {/* Organisme */}
                    {session.organisme && (
                      <Group gap="xs" mb="md">
                        <Building size={16} color="#868E96" />
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {typeof session.organisme === 'string' ? session.organisme : session.organisme.nomOrganisme}
                        </Text>
                      </Group>
                    )}

                    {/* Coût */}
                    {session.coutTotal && (
                      <Box mt="md" pt="md" style={{ borderTop: '1px solid #E9ECEF' }}>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">Coût total estimé</Text>
                          <Text size="sm" fw={600} c="blue">
                            {Number(session.coutTotal).toLocaleString('fr-FR')} €
                          </Text>
                        </Group>
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </SimpleGrid>
          ) : (
            // Vue liste
            <Paper shadow="xs" p="md" radius="md" mb="xl">
              <Table highlightOnHover verticalSpacing="md">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Formation</Table.Th>
                    <Table.Th>Organisme</Table.Th>
                    <Table.Th>Dates</Table.Th>
                    <Table.Th style={{ textAlign: 'center' }}>Participants</Table.Th>
                    <Table.Th style={{ textAlign: 'center' }}>Statuts</Table.Th>
                    <Table.Th style={{ textAlign: 'center' }}>Durée</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Coût</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {sessions.map((session) => {
                    const statusInfo = getDominantStatus(session.stats);
                    const StatusIcon = statusInfo.icon;

                    return (
                      <Table.Tr
                        key={session.type === 'collective' ? `collective-${session.id}` : `grouped-${session.groupKey}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleViewDetails(session)}
                      >
                        <Table.Td>
                          <div>
                            <Group gap="xs" mb={4}>
                              <BookOpen size={16} color="#228BE6" />
                              <Text size="sm" fw={600} lineClamp={1}>
                                {session.formationNom || session.formation?.nomFormation}
                              </Text>
                            </Group>
                            <Group gap="xs" mt={4}>
                              {session.type && <SessionTypeBadge type={session.type} size="xs" />}
                              {session.categorie && (
                                <Badge variant="dot" color="gray" size="xs">
                                  {session.categorie}
                                </Badge>
                              )}
                              {session.type === 'collective' && session.modalite && (
                                <Badge variant="light" color="grape" size="xs">
                                  {session.modalite === 'presentiel' ? 'Présentiel' :
                                   session.modalite === 'distanciel' ? 'Distanciel' : 'Hybride'}
                                </Badge>
                              )}
                            </Group>
                          </div>
                        </Table.Td>

                        <Table.Td>
                          {session.organismeNom || session.organisme?.nomOrganisme ? (
                            <Text size="sm" c="dimmed">
                              {session.organismeNom || session.organisme?.nomOrganisme}
                            </Text>
                          ) : (
                            <Text size="xs" c="dimmed" fs="italic">
                              Non défini
                            </Text>
                          )}
                        </Table.Td>

                        <Table.Td>
                          {session.dateDebut || session.dateFin ? (
                            <div>
                              <Group gap={4}>
                                <Calendar size={14} color="#868E96" />
                                <Text size="xs">
                                  {session.dateDebut
                                    ? new Date(session.dateDebut).toLocaleDateString('fr-FR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                      })
                                    : '-'}
                                </Text>
                              </Group>
                              {session.dateFin && (
                                <Text size="xs" c="dimmed" mt={2}>
                                  au {new Date(session.dateFin).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })}
                                </Text>
                              )}
                            </div>
                          ) : (
                            <Text size="xs" c="dimmed">
                              Non planifiée
                            </Text>
                          )}
                        </Table.Td>

                        <Table.Td>
                          <Stack gap={4} align="center">
                            <Group gap="xs">
                              <Users size={16} color="#868E96" />
                              <Text size="sm" fw={600}>
                                {getParticipantCount(session)}
                              </Text>
                            </Group>
                            {session.type === 'collective' && session.capaciteMax && (
                              <CapacityIndicator
                                current={getParticipantCount(session)}
                                max={session.capaciteMax}
                                size="xs"
                              />
                            )}
                            {session.lieu && (
                              <Group gap={2}>
                                <MapPin size={12} color="#868E96" />
                                <Text size="xs" c="dimmed" lineClamp={1}>
                                  {session.lieu}
                                </Text>
                              </Group>
                            )}
                          </Stack>
                        </Table.Td>

                        <Table.Td>
                          <Stack gap={4} align="center">
                            <Badge
                              leftSection={<StatusIcon size={12} />}
                              color={statusInfo.color}
                              variant="light"
                              size="sm"
                            >
                              {statusInfo.label}
                            </Badge>
                            <Group gap={4} justify="center">
                              {session.stats && session.stats.inscrit > 0 && (
                                <Tooltip label={`${session.stats.inscrit} inscrit(s)`}>
                                  <Badge size="xs" color="blue" variant="dot">
                                    {session.stats.inscrit}
                                  </Badge>
                                </Tooltip>
                              )}
                              {session.stats && session.stats.enCours > 0 && (
                                <Tooltip label={`${session.stats.enCours} en cours`}>
                                  <Badge size="xs" color="yellow" variant="dot">
                                    {session.stats.enCours}
                                  </Badge>
                                </Tooltip>
                              )}
                              {session.stats && session.stats.complete > 0 && (
                                <Tooltip label={`${session.stats.complete} terminé(s)`}>
                                  <Badge size="xs" color="green" variant="dot">
                                    {session.stats.complete}
                                  </Badge>
                                </Tooltip>
                              )}
                              {session.stats && session.stats.annule > 0 && (
                                <Tooltip label={`${session.stats.annule} annulé(s)`}>
                                  <Badge size="xs" color="red" variant="dot">
                                    {session.stats.annule}
                                  </Badge>
                                </Tooltip>
                              )}
                            </Group>
                          </Stack>
                        </Table.Td>

                        <Table.Td style={{ textAlign: 'center' }}>
                          {session.dureeHeures ? (
                            <Group gap={4} justify="center">
                              <Clock size={14} color="#868E96" />
                              <Text size="sm">{formatDuration(session.dureeHeures)}</Text>
                            </Group>
                          ) : (
                            <Text size="xs" c="dimmed">
                              -
                            </Text>
                          )}
                        </Table.Td>

                        <Table.Td style={{ textAlign: 'right' }}>
                          {session.coutTotal ? (
                            <Text size="sm" fw={600} c="blue">
                              {Number(session.coutTotal).toLocaleString('fr-FR')} €
                            </Text>
                          ) : (
                            <Text size="xs" c="dimmed">
                              -
                            </Text>
                          )}
                        </Table.Td>

                        <Table.Td style={{ textAlign: 'right' }}>
                          <Group gap="xs" justify="flex-end">
                            <Tooltip label="Voir les participants">
                              <ActionIcon
                                variant="light"
                                color="blue"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetails(session);
                                }}
                              >
                                <Eye size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Voir la formation">
                              <ActionIcon
                                variant="light"
                                color="gray"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewFormation(session.formationId);
                                }}
                              >
                                <BookOpen size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label={session.participants && session.participants.length > 1 ? "Modifier les sessions" : "Modifier la session"}>
                              <ActionIcon
                                variant="light"
                                color="blue"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditSession(session);
                                }}
                              >
                                <PencilSimple size={16} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>

              {sessions.length === 0 && (
                <Center h={200}>
                  <Stack align="center">
                    <List size={48} color="#868E96" />
                    <Text size="lg" fw={500} c="dimmed">
                      Aucune session à afficher
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
                Page {page} sur {totalPages} • Affichage de {((page - 1) * limit) + 1} à {Math.min(page * limit, total)} sur {total} résultats filtrés
              </Text>
              <Pagination
                value={page}
                onChange={handlePageChange}
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
              <Calendar size={48} color="#868E96" />
              <Text size="lg" fw={500} c="dimmed">Aucune session trouvée</Text>
              <Text size="sm" c="dimmed">
                Essayez de modifier vos critères de recherche
              </Text>
              <Button
                leftSection={<Plus size={16} />}
                onClick={() => router.push('/sessions/new')}
                mt="md"
              >
                Créer une inscription
              </Button>
            </Stack>
          </Center>
        </Paper>
      )}
    </Container>
  );
}