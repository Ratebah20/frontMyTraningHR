'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Loader,
  Alert,
  Select,
  Grid,
  Tooltip,
  ActionIcon,
  Pagination,
} from '@mantine/core';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { ArrowsClockwise } from '@phosphor-icons/react/dist/ssr/ArrowsClockwise';
import { FunnelSimple } from '@phosphor-icons/react/dist/ssr/FunnelSimple';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { Calendar } from '@phosphor-icons/react/dist/ssr/Calendar';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const PAGE_SIZE = 20;

const statusColors: Record<string, string> = {
  inscrit: 'blue',
  en_cours: 'yellow',
  complete: 'green',
  termine: 'green',
  'Terminé': 'green',
  annule: 'red',
};

const statusLabels: Record<string, string> = {
  inscrit: 'Inscrit',
  en_cours: 'En cours',
  complete: 'Terminé',
  termine: 'Terminé',
  'Terminé': 'Terminé',
  annule: 'Annulé',
};

export default function ManagerFormationsPage() {
  const router = useRouter();

  const [allFormations, setAllFormations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [anneeFilter, setAnneeFilter] = useState<string>(new Date().getFullYear().toString());
  const [page, setPage] = useState(1);

  const annees = Array.from({ length: 6 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { label: year.toString(), value: year.toString() };
  });

  const loadFormations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: any = {};
      if (statusFilter) params.statut = statusFilter;
      if (anneeFilter) {
        params.dateDebut = `${anneeFilter}-01-01`;
        params.dateFin = `${anneeFilter}-12-31`;
      }

      const response = await api.get('/manager/formations', { params });
      const data = Array.isArray(response.data) ? response.data : [];
      setAllFormations(data);
    } catch (err: any) {
      console.error('Erreur lors du chargement des formations:', err);
      setError(err.message || 'Erreur lors du chargement des formations');
      setAllFormations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadFormations(), 300);
    return () => clearTimeout(timer);
  }, [statusFilter, anneeFilter]);

  // Client-side search + pagination
  const filtered = useMemo(() => {
    if (!search.trim()) return allFormations;
    const s = search.toLowerCase().trim();
    return allFormations.filter((f: any) =>
      (f.collaborateur?.nomComplet || '').toLowerCase().includes(s) ||
      (f.formation?.nomFormation || '').toLowerCase().includes(s) ||
      (f.organisme || '').toLowerCase().includes(s)
    );
  }, [allFormations, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedFormations = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, anneeFilter]);

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
              {filtered.length} session(s) de formation
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
          <Grid.Col span={{ base: 12, sm: 5 }}>
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
        ) : filtered.length > 0 ? (
          <>
            <Table.ScrollContainer minWidth={1000}>
              <Table verticalSpacing="sm" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Collaborateur</Table.Th>
                    <Table.Th>Formation</Table.Th>
                    <Table.Th>Dates</Table.Th>
                    <Table.Th>Duree</Table.Th>
                    <Table.Th>Organisme</Table.Th>
                    <Table.Th>Statut</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedFormations.map((f, idx) => (
                    <Table.Tr
                      key={f.id || idx}
                      style={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/manager/equipe/${f.collaborateur?.id}`)}
                    >
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {f.collaborateur?.nomComplet || '-'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500} lineClamp={1}>
                          {f.formation?.nomFormation || '-'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={2}>
                          <Group gap="xs">
                            <Calendar size={12} color="#868E96" />
                            <Text size="xs">
                              {f.dateDebut
                                ? new Date(f.dateDebut).toLocaleDateString('fr-FR')
                                : '-'}
                            </Text>
                          </Group>
                          {f.dateFin && (
                            <Text size="xs" c="dimmed">
                              au {new Date(f.dateFin).toLocaleDateString('fr-FR')}
                            </Text>
                          )}
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Clock size={14} color="#868E96" />
                          <Text size="sm">{f.duree || 0} {f.uniteDuree || 'h'}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed" lineClamp={1}>
                          {f.organisme || '-'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={statusColors[f.statut] || 'gray'}
                          variant="light"
                          size="sm"
                        >
                          {statusLabels[f.statut] || f.statut}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {totalPages > 1 && (
              <Group justify="space-between" p="md">
                <Text size="sm" c="dimmed">
                  {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length}
                </Text>
                <Pagination
                  value={page}
                  onChange={setPage}
                  total={totalPages}
                  size="sm"
                />
              </Group>
            )}
          </>
        ) : (
          <Center py="xl">
            <Stack align="center">
              <GraduationCap size={48} color="#868E96" />
              <Text size="lg" fw={500} c="dimmed">Aucune formation trouvee</Text>
              <Text size="sm" c="dimmed">Essayez de modifier vos criteres de recherche</Text>
            </Stack>
          </Center>
        )}
      </Paper>
    </Container>
  );
}
