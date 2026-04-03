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
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Buildings } from '@phosphor-icons/react/dist/ssr/Buildings';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ManagerEquipePage() {
  const router = useRouter();

  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const loadMembers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.statutFormation = statusFilter;

      const response = await api.get('/manager/team', { params });
      // Backend returns a flat array
      const data = Array.isArray(response.data) ? response.data : [];
      setMembers(data);
    } catch (err: any) {
      console.error('Erreur lors du chargement de l\'equipe:', err);
      setError(err.message || 'Erreur lors du chargement de l\'equipe');
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadMembers(), 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleViewDetails = (id: number) => {
    router.push(`/manager/equipe/${id}`);
  };

  const total = members.length;
  const directs = members.filter((m) => m.isDirect).length;
  const actifs = members.filter((m) => m.actif).length;

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
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total</Text>
                  <Text size="xl" fw={700}>{total}</Text>
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
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Directs</Text>
                  <Text size="xl" fw={700} c="blue">{directs}</Text>
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
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Actifs</Text>
                  <Text size="xl" fw={700} c="green">{actifs}</Text>
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
                { value: 'en_cours', label: 'En formation' },
                { value: 'complete', label: 'Formations terminees' },
                { value: 'sans_formation', label: 'Sans formation' },
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
          <Table.ScrollContainer minWidth={900}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Collaborateur</Table.Th>
                  <Table.Th>Matricule</Table.Th>
                  <Table.Th>Departement</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Formations</Table.Th>
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
                            .map((n: string) => n[0])
                            .join('')
                            .slice(0, 2) || 'NA'}
                        </Avatar>
                        <Text size="sm" fw={500}>
                          {member.nomComplet}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">{member.matricule || '-'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Buildings size={14} color="#868E96" />
                        <Text size="sm">
                          {member.departement?.nomDepartement || 'Non assigne'}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="light"
                        color={member.isDirect ? 'blue' : 'gray'}
                        size="sm"
                      >
                        {member.isDirect ? 'Direct' : 'Indirect'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <GraduationCap size={14} color="#868E96" />
                        <Text size="sm">
                          {member.formationsEnCours > 0 && (
                            <Badge size="xs" variant="light" color="yellow" mr={4}>
                              {member.formationsEnCours} en cours
                            </Badge>
                          )}
                          {member.formationsTerminees > 0 && (
                            <Badge size="xs" variant="light" color="green">
                              {member.formationsTerminees} terminees
                            </Badge>
                          )}
                          {member.nombreFormations === 0 && (
                            <Text size="xs" c="dimmed">Aucune</Text>
                          )}
                        </Text>
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
        ) : (
          <Center py="xl">
            <Stack align="center">
              <Users size={48} color="#868E96" />
              <Text size="lg" fw={500} c="dimmed">Aucun collaborateur trouve</Text>
              <Text size="sm" c="dimmed">Essayez de modifier vos criteres de recherche</Text>
            </Stack>
          </Center>
        )}
      </Paper>
    </Container>
  );
}
