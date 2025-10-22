'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Table,
  Badge,
  ActionIcon,
  Paper,
  Stack,
  Breadcrumbs,
  Anchor,
  Card,
  SimpleGrid,
  Center,
  Loader,
  Tooltip,
  Menu,
  Avatar,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  ArrowLeft,
  PencilSimple,
  Users,
  CheckCircle,
  XCircle,
  Warning,
  Buildings,
  Eye,
  DotsThreeVertical,
  UserCircle,
} from '@phosphor-icons/react';
import { departementsService } from '@/lib/services';
import { DepartementDetail, Collaborateur } from '@/lib/types';
import { DepartementFormModal } from '@/components/departements/DepartementFormModal';

export default function DepartementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const departementId = parseInt(params.id as string);

  // États
  const [departement, setDepartement] = useState<DepartementDetail | null>(null);
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger les données
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [deptData, collabsData] = await Promise.all([
        departementsService.getById(departementId),
        departementsService.getCollaborateurs(departementId, false),
      ]);
      setDepartement(deptData);
      setCollaborateurs(collabsData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les données du département',
        color: 'red',
        icon: <Warning size={20} />,
      });
      router.push('/collaborateurs/departements');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [departementId]);

  // Soumettre le formulaire d'édition
  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      await departementsService.update(departementId, values);
      notifications.show({
        title: 'Succès',
        message: 'Département mis à jour avec succès',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
      setModalOpened(false);
      loadData();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      const message = error.response?.data?.message || error.message || 'Une erreur est survenue';
      notifications.show({
        title: 'Erreur',
        message,
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Center style={{ minHeight: '60vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (!departement) {
    return null;
  }

  const breadcrumbItems = [
    { title: 'Collaborateurs', href: '/collaborateurs' },
    { title: 'Départements', href: '/collaborateurs/departements' },
    { title: departement.nomDepartement, href: '#' },
  ].map((item, index) => (
    <Anchor
      key={index}
      onClick={() => item.href !== '#' && router.push(item.href)}
      c={item.href === '#' ? 'dimmed' : undefined}
    >
      {item.title}
    </Anchor>
  ));

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Breadcrumb et navigation */}
        <Group>
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={() => router.push('/collaborateurs/departements')}
          >
            <ArrowLeft size={20} />
          </ActionIcon>
          <Breadcrumbs>{breadcrumbItems}</Breadcrumbs>
        </Group>

        {/* En-tête avec infos du département */}
        <Paper p="xl" withBorder>
          <Group justify="space-between" align="flex-start">
            <Group align="flex-start" gap="lg">
              <Buildings size={48} weight="duotone" className="text-blue-500" />
              <div>
                <Group gap="sm" align="center">
                  <Title order={2}>{departement.nomDepartement}</Title>
                  <Badge color={departement.actif ? 'green' : 'gray'} variant="light" size="lg">
                    {departement.actif ? 'Actif' : 'Inactif'}
                  </Badge>
                </Group>
                {departement.codeDepartement && (
                  <Text c="dimmed" size="sm" mt={4}>
                    Code: {departement.codeDepartement}
                  </Text>
                )}
              </div>
            </Group>

            <Button
              leftSection={<PencilSimple size={18} />}
              variant="light"
              onClick={() => setModalOpened(true)}
            >
              Modifier
            </Button>
          </Group>
        </Paper>

        {/* Statistiques */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          <Card shadow="sm" padding="lg" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed" fw={500}>
                  Total collaborateurs
                </Text>
                <Text size="xl" fw={700} mt="xs">
                  {departement.nombreCollaborateurs}
                </Text>
              </div>
              <Users size={32} className="text-blue-500" weight="duotone" />
            </Group>
          </Card>

          <Card shadow="sm" padding="lg" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed" fw={500}>
                  Collaborateurs actifs
                </Text>
                <Text size="xl" fw={700} mt="xs" c="green">
                  {departement.nombreCollaborateursActifs}
                </Text>
              </div>
              <CheckCircle size={32} className="text-green-500" weight="duotone" />
            </Group>
          </Card>

          <Card shadow="sm" padding="lg" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed" fw={500}>
                  Collaborateurs inactifs
                </Text>
                <Text size="xl" fw={700} mt="xs" c="gray">
                  {departement.nombreCollaborateurs - departement.nombreCollaborateursActifs}
                </Text>
              </div>
              <XCircle size={32} className="text-gray-400" weight="duotone" />
            </Group>
          </Card>
        </SimpleGrid>

        {/* Liste des collaborateurs */}
        <Paper withBorder>
          <Group p="md" justify="space-between">
            <Title order={3} size="h4">
              <Group gap="xs">
                <Users size={24} />
                Collaborateurs du département
              </Group>
            </Title>
            <Text c="dimmed" size="sm">
              {collaborateurs.length} collaborateur(s)
            </Text>
          </Group>

          {collaborateurs.length === 0 ? (
            <Center p="xl">
              <Stack align="center" gap="md">
                <Users size={48} weight="thin" className="text-gray-400" />
                <Text c="dimmed">Aucun collaborateur dans ce département</Text>
              </Stack>
            </Center>
          ) : (
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Collaborateur</Table.Th>
                  <Table.Th>Matricule</Table.Th>
                  <Table.Th>Manager</Table.Th>
                  <Table.Th>Formations</Table.Th>
                  <Table.Th>Statut</Table.Th>
                  <Table.Th style={{ width: 80 }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {collaborateurs.map((collab) => (
                  <Table.Tr key={collab.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar size="sm" color="blue">
                          <UserCircle size={20} />
                        </Avatar>
                        <div>
                          <Text fw={500} size="sm">
                            {collab.nomComplet}
                          </Text>
                          {collab.idExterne && (
                            <Text size="xs" c="dimmed">
                              {collab.idExterne}
                            </Text>
                          )}
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {collab.matricule || '-'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {collab.manager?.nomComplet || '-'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" size="sm">
                        {collab.nombreFormations || 0}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={collab.actif ? 'green' : 'gray'} variant="light" size="sm">
                        {collab.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        <Tooltip label="Voir le profil">
                          <ActionIcon
                            variant="subtle"
                            onClick={() => router.push(`/collaborateurs/${collab.id}`)}
                          >
                            <Eye size={18} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Paper>
      </Stack>

      {/* Modal d'édition */}
      <DepartementFormModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onSubmit={handleSubmit}
        departement={departement}
        isSubmitting={isSubmitting}
      />
    </Container>
  );
}
