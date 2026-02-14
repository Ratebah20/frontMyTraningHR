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
  ActionIcon,
  Center,
  Stack,
  Paper,
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
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { Eye } from '@phosphor-icons/react/dist/ssr/Eye';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { ArrowsClockwise } from '@phosphor-icons/react/dist/ssr/ArrowsClockwise';
import { FunnelSimple } from '@phosphor-icons/react/dist/ssr/FunnelSimple';
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Buildings } from '@phosphor-icons/react/dist/ssr/Buildings';
import { useRouter } from 'next/navigation';
import { managerPortalService, ManagerTeamMember } from '@/lib/services/manager-portal.service';
import { useDebounce } from '@/hooks/useApi';

export default function ManagerEquipePage() {
  const router = useRouter();

  const [members, setMembers] = useState<ManagerTeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);

  const debouncedSearch = useDebounce(search, 500);

  const loadMembers = async () => {
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

      if (statusFilter === 'actif') {
        filters.actif = true;
      } else if (statusFilter === 'inactif') {
        filters.actif = false;
      }

      const response = await managerPortalService.getTeamMembers(filters);

      if (response.data) {
        setMembers(response.data);
        setTotal(response.meta?.total || 0);
        setTotalPages(response.meta?.totalPages || 1);
      } else {
        setMembers([]);
        setTotal(0);
        setTotalPages(0);
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement de l\'equipe:', err);
      setError(err.message || 'Erreur lors du chargement de l\'equipe');
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [debouncedSearch, statusFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const handleViewDetails = (id: number) => {
    router.push(`/manager/equipe/${id}`);
  };

  // Stats computed from data
  const stats = {
    total: total,
    actifs: members.filter((m) => m.actif).length,
    directs: members.filter((m) => m.managerDirect).length,
  };

  return (
    <Container size="xl">
      {/* Header */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Group justify="space-between" mb="md">
          <div>
            <Group align="center" gap="sm">
              <Users size={32} color="#228BE6" />
              <Title order={1}>Mon equipe</Title>
            </Group>
            <Text size="lg" c="dimmed" mt="xs">
              Consultez les informations de vos collaborateurs
            </Text>
          </div>
          <Tooltip label="Rafraichir">
            <ActionIcon variant="light" size="lg" onClick={loadMembers}>
              <ArrowsClockwise size={20} />
            </ActionIcon>
          </Tooltip>
        </Group>

        {/* Quick stats */}
        <Grid mt="lg">
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Total
                  </Text>
                  <Text size="xl" fw={700}>
                    {total}
                  </Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                  <Users size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Directs
                  </Text>
                  <Text size="xl" fw={700} c="blue">
                    {stats.directs}
                  </Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="teal">
                  <Users size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Actifs
                  </Text>
                  <Text size="xl" fw={700} c="green">
                    {stats.actifs}
                  </Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="green">
                  <CheckCircle size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Filters */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Group align="center" mb="md">
          <FunnelSimple size={20} />
          <Text fw={600}>Filtres et Recherche</Text>
        </Group>
        <Grid align="flex-end">
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <TextInput
              placeholder="Rechercher par nom, matricule..."
              leftSection={<MagnifyingGlass size={16} />}
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
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
        ) : members.length > 0 ? (
          <>
            <Table.ScrollContainer minWidth={900}>
              <Table verticalSpacing="sm" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Collaborateur</Table.Th>
                    <Table.Th>Matricule</Table.Th>
                    <Table.Th>Departement</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Formations en cours</Table.Th>
                    <Table.Th>Statut</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {members.map((member) => (
                    <Table.Tr
                      key={member.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleViewDetails(member.id)}
                    >
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar size={36} radius="xl" color="blue">
                            {member.nomComplet
                              ?.split(' ')
                              .map((n) => n[0])
                              .join('') || 'NA'}
                          </Avatar>
                          <Text size="sm" fw={500}>
                            {member.nomComplet}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {member.matricule || '-'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Buildings size={14} color="#868E96" />
                          <Text size="sm">{member.departement || 'Non assigne'}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          variant="light"
                          color={member.managerDirect ? 'blue' : 'gray'}
                          size="sm"
                        >
                          {member.managerDirect ? 'Direct' : 'Indirect'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <GraduationCap size={14} color="#868E96" />
                          <Text size="sm">{member.formationsEnCours || 0}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={member.actif ? 'green' : 'red'}
                          variant="light"
                          size="sm"
                        >
                          {member.actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" justify="flex-end">
                          <Tooltip label="Voir details">
                            <ActionIcon
                              variant="subtle"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(member.id);
                              }}
                            >
                              <Eye size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
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
                {total} collaborateurs
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
              <Text size="lg" fw={500} c="dimmed">
                Aucun collaborateur trouve
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
