'use client';

import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  Card,
  Badge,
  Stack,
  ActionIcon,
  Menu,
  Loader,
  Alert,
  Table,
  Paper,
  Grid,
  Tooltip,
  Skeleton,
  Switch,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  MagnifyingGlass,
  Plus,
  DotsThreeVertical,
  PencilSimple,
  Trash,
  Buildings,
  ChartBar,
  Eye,
} from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useOrganismes, useDeleteOrganisme } from '@/hooks/useOrganismes';
import { OrganismeFormation } from '@/lib/types';
import { modals } from '@mantine/modals';

export default function OrganismesPage() {
  const router = useRouter();
  const [includeInactive, setIncludeInactive] = useState(false);
  const [search, setSearch] = useState('');

  const { organismes, isLoading, error, refetch } = useOrganismes(includeInactive);
  const { deleteOrganisme, isLoading: isDeleting } = useDeleteOrganisme();

  // Filtrer par recherche
  const filteredOrganismes = organismes.filter((org) =>
    org.nomOrganisme.toLowerCase().includes(search.toLowerCase()) ||
    org.typeOrganisme?.toLowerCase().includes(search.toLowerCase()) ||
    org.contact?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (organisme: OrganismeFormation) => {
    modals.openConfirmModal({
      title: 'Désactiver l\'organisme',
      children: (
        <Text size="sm">
          Êtes-vous sûr de vouloir désactiver "{organisme.nomOrganisme}" ?
          <br />
          <br />
          Cet organisme a {organisme._count?.formations || 0} formation(s) et {organisme._count?.sessions || 0} session(s) associées.
        </Text>
      ),
      labels: { confirm: 'Désactiver', cancel: 'Annuler' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          const result = await deleteOrganisme(organisme.id);
          notifications.show({
            title: 'Succès',
            message: result.message,
            color: 'green',
          });
          refetch();
        } catch (err: any) {
          notifications.show({
            title: 'Erreur',
            message: err.message || 'Erreur lors de la désactivation',
            color: 'red',
          });
        }
      },
    });
  };

  const stats = {
    total: organismes.length,
    actifs: organismes.filter(o => o.actif).length,
    totalFormations: organismes.reduce((sum, o) => sum + (o._count?.formations || 0), 0),
    totalSessions: organismes.reduce((sum, o) => sum + (o._count?.sessions || 0), 0),
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* En-tête */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Group gap="sm" mb="xs">
              <Buildings size={32} weight="duotone" />
              <Title order={2}>Organismes de formation</Title>
            </Group>
            <Text c="dimmed" size="sm">
              Gérez les organismes de formation et leurs statistiques
            </Text>
          </div>
          <Button
            leftSection={<Plus size={20} />}
            onClick={() => router.push('/organismes/new')}
          >
            Nouvel organisme
          </Button>
        </Group>

        {/* Statistiques */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card padding="md" radius="md" withBorder>
              <Text size="sm" c="dimmed" mb={4}>Total organismes</Text>
              <Text size="xl" fw={700}>{stats.total}</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card padding="md" radius="md" withBorder>
              <Text size="sm" c="dimmed" mb={4}>Organismes actifs</Text>
              <Text size="xl" fw={700} c="green">{stats.actifs}</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card padding="md" radius="md" withBorder>
              <Text size="sm" c="dimmed" mb={4}>Formations</Text>
              <Text size="xl" fw={700}>{stats.totalFormations}</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card padding="md" radius="md" withBorder>
              <Text size="sm" c="dimmed" mb={4}>Sessions</Text>
              <Text size="xl" fw={700}>{stats.totalSessions}</Text>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Filtres */}
        <Group>
          <TextInput
            placeholder="Rechercher un organisme..."
            leftSection={<MagnifyingGlass size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Switch
            label="Inclure inactifs"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.currentTarget.checked)}
          />
        </Group>

        {/* Tableau */}
        <Paper withBorder radius="md">
          {isLoading ? (
            <Stack p="md">
              <Skeleton height={50} />
              <Skeleton height={50} />
              <Skeleton height={50} />
            </Stack>
          ) : error ? (
            <Alert color="red" title="Erreur">
              {error.message}
            </Alert>
          ) : filteredOrganismes.length === 0 ? (
            <Stack align="center" p="xl">
              <Buildings size={64} weight="thin" opacity={0.3} />
              <Text c="dimmed">Aucun organisme trouvé</Text>
            </Stack>
          ) : (
            <Table.ScrollContainer minWidth={800}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Nom</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Contact</Table.Th>
                    <Table.Th>Formations</Table.Th>
                    <Table.Th>Sessions</Table.Th>
                    <Table.Th>Statut</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredOrganismes.map((organisme) => (
                    <Table.Tr key={organisme.id}>
                      <Table.Td>
                        <Text fw={500}>{organisme.nomOrganisme}</Text>
                      </Table.Td>
                      <Table.Td>
                        {organisme.typeOrganisme ? (
                          <Badge variant="light">{organisme.typeOrganisme}</Badge>
                        ) : (
                          <Text c="dimmed" size="sm">-</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">{organisme.contact || '-'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="outline">{organisme._count?.formations || 0}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="outline">{organisme._count?.sessions || 0}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={organisme.actif ? 'green' : 'red'} variant="light">
                          {organisme.actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <Tooltip label="Voir les détails">
                            <ActionIcon
                              variant="subtle"
                              onClick={() => router.push(`/organismes/${organisme.id}`)}
                            >
                              <Eye size={18} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Modifier">
                            <ActionIcon
                              variant="subtle"
                              onClick={() => router.push(`/organismes/${organisme.id}/edit`)}
                            >
                              <PencilSimple size={18} />
                            </ActionIcon>
                          </Tooltip>
                          {organisme.actif && (
                            <Tooltip label="Désactiver">
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                onClick={() => handleDelete(organisme)}
                                loading={isDeleting}
                              >
                                <Trash size={18} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
