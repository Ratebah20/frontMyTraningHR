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
} from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { sessionsService, formationsService, collaborateursService } from '@/lib/services';
import { StatutUtils } from '@/lib/utils/statut.utils';
import { SessionFormationResponse, SessionFilters } from '@/lib/types';
import { useDebounce } from '@/hooks/useApi';

// Couleurs par statut
const statusColors: Record<string, string> = {
  'inscrit': 'blue',
  'INSCRIT': 'blue',
  'en_cours': 'yellow',
  'EN_COURS': 'yellow',
  'complete': 'green',
  'TERMINE': 'green',
  'COMPLETE': 'green',
  'annule': 'red',
  'ANNULE': 'red',
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
  'annule': 'Annulé',
  'ANNULE': 'Annulé',
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
  'annule': CalendarX,
  'ANNULE': CalendarX,
};

export default function SessionsPage() {
  const router = useRouter();
  
  // États
  const [sessions, setSessions] = useState<SessionFormationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtres et pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateDebut, setDateDebut] = useState<string>('');
  const [dateFin, setDateFin] = useState<string>('');
  const [formationFilter, setFormationFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  
  const debouncedSearch = useDebounce(search, 500);

  // Charger les sessions
  const loadSessions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const filters: SessionFilters = {
        search: debouncedSearch,
        statut: statusFilter || undefined,
        dateDebut: dateDebut || undefined,
        dateFin: dateFin || undefined,
        formationId: formationFilter ? parseInt(formationFilter) : undefined,
        departementId: departmentFilter ? parseInt(departmentFilter) : undefined,
        page,
        limit,
      };
      
      const response = await sessionsService.getPlanning(filters);
      
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

  // Charger les sessions au montage et quand les filtres changent
  useEffect(() => {
    loadSessions();
  }, [debouncedSearch, statusFilter, dateDebut, dateFin, formationFilter, departmentFilter, page]);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, dateDebut, dateFin, formationFilter, departmentFilter]);

  const handleViewDetails = (id: number) => {
    router.push(`/sessions/${id}`);
  };

  const handleEdit = (id: number) => {
    router.push(`/sessions/${id}/edit`);
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette session ?')) {
      return;
    }
    
    try {
      await sessionsService.cancelSession(id);
      notifications.show({
        title: 'Succès',
        message: 'Session annulée avec succès',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
      loadSessions();
    } catch (err: any) {
      notifications.show({
        title: 'Erreur',
        message: err.message || 'Erreur lors de l\'annulation',
        color: 'red',
        icon: <Warning size={20} />,
      });
    }
  };

  const handleRefresh = () => {
    loadSessions();
  };

  // Calculer les statistiques en utilisant StatutUtils
  const stats = {
    inscrites: sessions.filter(s => StatutUtils.isInscrit(s.statut)).length,
    enCours: sessions.filter(s => StatutUtils.isEnCours(s.statut)).length,
    terminees: sessions.filter(s => StatutUtils.isComplete(s.statut)).length,
    annulees: sessions.filter(s => StatutUtils.isAnnule(s.statut)).length,
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
              {total > 0 ? `${total} sessions de formation` : 'Suivez les inscriptions et sessions de formation'}
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
              onClick={() => router.push('/sessions/new')}
              size="md"
            >
              Nouvelle inscription
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
                    Inscrites
                  </Text>
                  <Text size="xl" fw={700} c="blue">{stats.inscrites}</Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                  <CalendarCheck size={20} />
                </ThemeIcon>
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    En cours
                  </Text>
                  <Text size="xl" fw={700} c="yellow">{stats.enCours}</Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="yellow">
                  <Hourglass size={20} />
                </ThemeIcon>
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Terminées
                  </Text>
                  <Text size="xl" fw={700} c="green">{stats.terminees}</Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="green">
                  <Certificate size={20} />
                </ThemeIcon>
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Annulées
                  </Text>
                  <Text size="xl" fw={700} c="red">{stats.annulees}</Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="red">
                  <CalendarX size={20} />
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
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 2 }}>
            <Select
              placeholder="Statut"
              data={[
                { value: '', label: 'Tous les statuts' },
                { value: 'inscrit', label: 'Inscrit' },
                { value: 'en_cours', label: 'En cours' },
                { value: 'complete', label: 'Terminé' },
                { value: 'annule', label: 'Annulé' },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || '')}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
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
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Button
              fullWidth
              variant="light"
              leftSection={<Calendar size={16} />}
              onClick={() => router.push('/sessions/calendar')}
            >
              Vue calendrier
            </Button>
          </Grid.Col>
        </Grid>
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
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" mb="xl">
            {sessions.map((session) => {
              // Déterminer l'icône selon le statut
              const StatusIcon = StatutUtils.isComplete(session.statut) ? CheckCircle :
                                StatutUtils.isEnCours(session.statut) ? Clock :
                                StatutUtils.isInscrit(session.statut) ? CalendarCheck :
                                StatutUtils.isAnnule(session.statut) ? XCircle : CalendarCheck;
              
              return (
                <Paper
                  key={session.id}
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
                >
                  {/* Header */}
                  <Group justify="space-between" mb="md">
                    <Badge
                      leftSection={<StatusIcon size={14} />}
                      color={StatutUtils.getStatusColor(session.statut)}
                      variant="light"
                    >
                      {StatutUtils.getStatusLabel(session.statut)}
                    </Badge>
                    <Menu withinPortal position="bottom-end" shadow="sm">
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray" size="sm">
                          <DotsThreeVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<Eye size={14} />}
                          onClick={() => handleViewDetails(session.id)}
                        >
                          Voir détails
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<PencilSimple size={14} />}
                          onClick={() => handleEdit(session.id)}
                        >
                          Modifier
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                          color="red"
                          leftSection={<XCircle size={14} />}
                          onClick={() => handleCancel(session.id)}
                        >
                          Annuler
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>

                  {/* Collaborateur */}
                  <Group gap="xs" mb="sm">
                    <Avatar size="sm" radius="xl" color="blue">
                      {session.collaborateur ? `${session.collaborateur.prenom?.[0] || ''}${session.collaborateur.nom?.[0] || ''}` : 'NA'}
                    </Avatar>
                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={500} lineClamp={1}>
                        {session.collaborateur ? `${session.collaborateur.prenom} ${session.collaborateur.nom}` : 'Collaborateur inconnu'}
                      </Text>
                      {session.collaborateur?.departement && (
                        <Text size="xs" c="dimmed">
                          {session.collaborateur.departement}
                        </Text>
                      )}
                    </div>
                  </Group>

                  <Divider my="sm" />

                  {/* Formation */}
                  <Stack gap="xs" mb="md">
                    <Group gap="xs">
                      <BookOpen size={16} color="#868E96" />
                      <Text size="sm" fw={500} lineClamp={2}>
                        {session.formation?.nom || 'Formation inconnue'}
                      </Text>
                    </Group>
                    {session.formation?.code && (
                      <Text size="xs" c="dimmed" ml={20}>
                        {session.formation.code}
                      </Text>
                    )}
                  </Stack>

                  {/* Dates */}
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
                    {(session.dureeHeures || session.formation?.dureeHeures) && (
                      <Group gap="xs">
                        <Clock size={16} color="#868E96" />
                        <Text size="xs" c="dimmed">
                          {session.dureeHeures || session.formation?.dureeHeures} heures
                        </Text>
                      </Group>
                    )}
                  </Stack>

                  {/* Catégorie de formation */}
                  {session.formation?.categorie && (
                    <Group gap="xs" mb="md">
                      <Building size={16} color="#868E96" />
                      <Text size="xs" c="dimmed">
                        {session.formation.categorie}
                      </Text>
                    </Group>
                  )}

                  {/* Note si complété */}
                  {StatutUtils.isComplete(session.statut) && session.note !== null && (
                    <Box>
                      <Text size="xs" c="dimmed" mb={4}>Note obtenue</Text>
                      <Progress
                        value={session.note}
                        color={session.note >= 80 ? 'green' : session.note >= 60 ? 'yellow' : 'red'}
                        size="sm"
                        radius="sm"
                      />
                      <Text size="xs" c="dimmed" mt={2} ta="right">
                        {session.note}/100
                      </Text>
                    </Box>
                  )}
                </Paper>
              );
            })}
          </SimpleGrid>

          {/* Pagination */}
          <Paper shadow="xs" p="lg" radius="md">
            <Group justify="space-between" align="center">
              <Text size="sm" c="dimmed">
                Affichage de {((page - 1) * limit) + 1} à {Math.min(page * limit, total)} sur {total} sessions
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