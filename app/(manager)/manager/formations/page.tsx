'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  TextInput,
  Table,
  Badge,
  Center,
  Stack,
  Paper,
  Pagination,
  Loader,
  Alert,
  Select,
  Grid,
  Card,
  ThemeIcon,
  Tooltip,
  ActionIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { ArrowsClockwise } from '@phosphor-icons/react/dist/ssr/ArrowsClockwise';
import { FunnelSimple } from '@phosphor-icons/react/dist/ssr/FunnelSimple';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { Calendar } from '@phosphor-icons/react/dist/ssr/Calendar';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Hourglass } from '@phosphor-icons/react/dist/ssr/Hourglass';
import { Buildings } from '@phosphor-icons/react/dist/ssr/Buildings';
import { useRouter } from 'next/navigation';
import { managerPortalService, ManagerTeamFormation } from '@/lib/services/manager-portal.service';
import { useDebounce } from '@/hooks/useApi';

// Status colors
const statusColors: Record<string, string> = {
  inscrit: 'blue',
  en_cours: 'yellow',
  complete: 'green',
  termine: 'green',
  annule: 'red',
};

const statusLabels: Record<string, string> = {
  inscrit: 'Inscrit',
  en_cours: 'En cours',
  complete: 'Termine',
  termine: 'Termine',
  annule: 'Annule',
};

export default function ManagerFormationsPage() {
  const router = useRouter();

  const [formations, setFormations] = useState<ManagerTeamFormation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [anneeFilter, setAnneeFilter] = useState<string>(new Date().getFullYear().toString());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);

  const debouncedSearch = useDebounce(search, 500);

  // Generate years list
  const annees = Array.from({ length: 6 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { label: year.toString(), value: year.toString() };
  });

  const loadFormations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filters: any = {
        page,
        limit,
      };

      if (debouncedSearch && debouncedSearch.trim()) {
        filters.search = debouncedSearch.trim();
      }

      if (statusFilter) {
        filters.statut = statusFilter;
      }

      if (anneeFilter) {
        filters.annee = parseInt(anneeFilter);
      }

      const response = await managerPortalService.getTeamFormations(filters);

      if (response.data) {
        setFormations(response.data);
        setTotal(response.meta?.total || 0);
        setTotalPages(response.meta?.totalPages || 1);
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

  useEffect(() => {
    loadFormations();
  }, [debouncedSearch, statusFilter, anneeFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, anneeFilter]);

  return (
    <Container size="xl">
      {/* Header */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Group justify="space-between" mb="md">
          <div>
            <Group align="center" gap="sm">
              <GraduationCap size={32} color="#228BE6" />
              <Title order={1}>Formations de l'equipe</Title>
            </Group>
            <Text size="lg" c="dimmed" mt="xs">
              Toutes les sessions de formation de vos collaborateurs
            </Text>
          </div>
          <Tooltip label="Rafraichir">
            <ActionIcon variant="light" size="lg" onClick={loadFormations}>
              <ArrowsClockwise size={20} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Paper>

      {/* Filters */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Group align="center" mb="md">
          <FunnelSimple size={20} />
          <Text fw={600}>Filtres et Recherche</Text>
        </Group>
        <Grid align="flex-end">
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <TextInput
              placeholder="Rechercher collaborateur ou formation..."
              leftSection={<MagnifyingGlass size={16} />}
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Select
              placeholder="Statut"
              data={[
                { value: '', label: 'Tous les statuts' },
                { value: 'inscrit', label: 'Inscrit' },
                { value: 'en_cours', label: 'En cours' },
                { value: 'complete', label: 'Termine' },
                { value: 'annule', label: 'Annule' },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || '')}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 2 }}>
            <Select
              placeholder="Annee"
              data={annees}
              value={anneeFilter}
              onChange={(value) => setAnneeFilter(value || new Date().getFullYear().toString())}
            />
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Table */}
      <Paper shadow="xs" radius="md" withBorder>
        {isLoading ? (
          <Center h={400}>
            <Loader size="lg" variant="bars" />
          </Center>
        ) : error ? (
          <Alert icon={<Warning size={16} />} color="red" variant="light" m="lg">
            {error}
          </Alert>
        ) : formations.length > 0 ? (
          <>
            <Table.ScrollContainer minWidth={1000}>
              <Table verticalSpacing="sm" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Collaborateur</Table.Th>
                    <Table.Th>Formation</Table.Th>
                    <Table.Th>Categorie</Table.Th>
                    <Table.Th>Dates</Table.Th>
                    <Table.Th>Duree</Table.Th>
                    <Table.Th>Organisme</Table.Th>
                    <Table.Th>Statut</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {formations.map((formation) => (
                    <Table.Tr
                      key={formation.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/manager/equipe/${formation.collaborateurId}`)}
                    >
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {formation.collaborateur}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500} lineClamp={1}>
                          {formation.formation}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="gray" size="sm">
                          {formation.categorie || 'Non categorise'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={2}>
                          <Group gap="xs">
                            <Calendar size={12} color="#868E96" />
                            <Text size="xs">
                              {formation.dateDebut
                                ? new Date(formation.dateDebut).toLocaleDateString('fr-FR')
                                : '-'}
                            </Text>
                          </Group>
                          {formation.dateFin && (
                            <Text size="xs" c="dimmed">
                              au {new Date(formation.dateFin).toLocaleDateString('fr-FR')}
                            </Text>
                          )}
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Clock size={14} color="#868E96" />
                          <Text size="sm">{formation.dureeHeures || 0}h</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed" lineClamp={1}>
                          {formation.organisme || '-'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={statusColors[formation.statut] || 'gray'}
                          variant="light"
                          size="sm"
                        >
                          {statusLabels[formation.statut] || formation.statut}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {/* Pagination */}
            <Group justify="space-between" p="lg">
              <Text size="sm" c="dimmed">
                Affichage de {(page - 1) * limit + 1} a {Math.min(page * limit, total)} sur{' '}
                {total} formations
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
              <GraduationCap size={48} color="#868E96" />
              <Text size="lg" fw={500} c="dimmed">
                Aucune formation trouvee
              </Text>
              <Text size="sm" c="dimmed">
                Essayez de modifier vos criteres de recherche
              </Text>
            </Stack>
          </Center>
        )}
      </Paper>
    </Container>
  );
}
