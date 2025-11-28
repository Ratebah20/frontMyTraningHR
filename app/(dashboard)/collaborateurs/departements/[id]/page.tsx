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
  Checkbox,
  Affix,
  Transition,
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
  Plus,
  TreeStructure,
  ArrowsLeftRight,
  X,
} from '@phosphor-icons/react';
import { departementsService } from '@/lib/services';
import { DepartementDetail, Collaborateur } from '@/lib/types';
import { DepartementFormModal } from '@/components/departements/DepartementFormModal';
import { DepartementBreadcrumb } from '@/components/departements/DepartementBreadcrumb';
import { TypeBadge } from '@/components/departements/TypeBadge';
import { ChangeEquipeModal } from '@/components/collaborateurs/ChangeEquipeModal';

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
  const [isCreatingEquipe, setIsCreatingEquipe] = useState(false);

  // États pour la sélection multiple et le changement d'équipe
  const [selectedCollaborateurs, setSelectedCollaborateurs] = useState<number[]>([]);
  const [changeEquipeModalOpened, setChangeEquipeModalOpened] = useState(false);
  const [collaborateursToMove, setCollaborateursToMove] = useState<{ id: number; nomComplet: string }[]>([]);

  // Gestion de la sélection
  const isAllSelected = collaborateurs.length > 0 && selectedCollaborateurs.length === collaborateurs.length;
  const isSomeSelected = selectedCollaborateurs.length > 0 && selectedCollaborateurs.length < collaborateurs.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCollaborateurs([]);
    } else {
      setSelectedCollaborateurs(collaborateurs.map(c => c.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedCollaborateurs(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Ouvrir la modale pour un seul collaborateur
  const openChangeEquipeForOne = (collab: Collaborateur) => {
    setCollaborateursToMove([{ id: collab.id, nomComplet: collab.nomComplet }]);
    setChangeEquipeModalOpened(true);
  };

  // Ouvrir la modale pour les collaborateurs sélectionnés
  const openChangeEquipeForSelected = () => {
    const selected = collaborateurs
      .filter(c => selectedCollaborateurs.includes(c.id))
      .map(c => ({ id: c.id, nomComplet: c.nomComplet }));
    setCollaborateursToMove(selected);
    setChangeEquipeModalOpened(true);
  };

  // Callback après changement d'équipe réussi
  const handleChangeEquipeSuccess = () => {
    setSelectedCollaborateurs([]);
    loadData();
  };

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

  // Soumettre le formulaire (création d'équipe ou édition)
  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      if (isCreatingEquipe) {
        // Créer une nouvelle équipe sous ce département
        await departementsService.create(values);
        notifications.show({
          title: 'Succès',
          message: 'Équipe créée avec succès',
          color: 'green',
          icon: <CheckCircle size={20} />,
        });
      } else {
        // Mettre à jour le département actuel
        await departementsService.update(departementId, values);
        notifications.show({
          title: 'Succès',
          message: 'Département mis à jour avec succès',
          color: 'green',
          icon: <CheckCircle size={20} />,
        });
      }
      setModalOpened(false);
      setIsCreatingEquipe(false);
      loadData();
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
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
          <DepartementBreadcrumb departementId={departementId} />
        </Group>

        {/* En-tête avec infos du département */}
        <Paper p="xl" withBorder>
          <Group justify="space-between" align="flex-start">
            <Group align="flex-start" gap="lg">
              {departement.type === 'EQUIPE' ? (
                <Users size={48} weight="duotone" className="text-green-500" />
              ) : (
                <Buildings size={48} weight="duotone" className="text-blue-500" />
              )}
              <div>
                <Group gap="sm" align="center">
                  <Title order={2}>{departement.nomDepartement}</Title>
                  <TypeBadge type={departement.type} />
                  <Badge color={departement.actif ? 'green' : 'gray'} variant="light" size="lg">
                    {departement.actif ? 'Actif' : 'Inactif'}
                  </Badge>
                </Group>
                {departement.codeDepartement && (
                  <Text c="dimmed" size="sm" mt={4}>
                    Code: {departement.codeDepartement}
                  </Text>
                )}
                {departement.cheminComplet && (
                  <Text c="dimmed" size="sm" mt={4}>
                    Chemin: {departement.cheminComplet}
                  </Text>
                )}
              </div>
            </Group>

            <Group>
              <Button
                leftSection={<PencilSimple size={18} />}
                variant="light"
                onClick={() => {
                  setIsCreatingEquipe(false);
                  setModalOpened(true);
                }}
              >
                Modifier
              </Button>
              <Button
                leftSection={<Plus size={18} />}
                color="green"
                onClick={() => {
                  setIsCreatingEquipe(true);
                  setModalOpened(true);
                }}
              >
                Ajouter une équipe
              </Button>
            </Group>
          </Group>
        </Paper>

        {/* Statistiques */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
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

          <Card shadow="sm" padding="lg" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed" fw={500}>
                  Sous-{departement.type === 'EQUIPE' ? 'équipes' : 'départements'}
                </Text>
                <Text size="xl" fw={700} mt="xs" c="blue">
                  {departement.nombreSousDepartements || 0}
                </Text>
              </div>
              <TreeStructure size={32} className="text-blue-500" weight="duotone" />
            </Group>
          </Card>
        </SimpleGrid>

        {/* Sous-départements/équipes */}
        {departement.sousDepartements && departement.sousDepartements.length > 0 && (
          <Paper withBorder>
            <Group p="md" justify="space-between">
              <Title order={3} size="h4">
                <Group gap="xs">
                  <TreeStructure size={24} />
                  Sous-{departement.type === 'EQUIPE' ? 'équipes' : 'départements'}
                </Group>
              </Title>
              <Text c="dimmed" size="sm">
                {departement.sousDepartements.length} élément(s)
              </Text>
            </Group>

            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nom</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Statut</Table.Th>
                  <Table.Th style={{ width: 80 }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {departement.sousDepartements.map((subDept) => (
                  <Table.Tr key={subDept.id}>
                    <Table.Td>
                      <Text fw={500} size="sm">
                        {subDept.nomDepartement}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <TypeBadge type={subDept.type} size="xs" />
                    </Table.Td>
                    <Table.Td>
                      <Badge color={subDept.actif ? 'green' : 'gray'} variant="light" size="sm">
                        {subDept.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Tooltip label="Voir les détails">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => router.push(`/collaborateurs/departements/${subDept.id}`)}
                        >
                          <Eye size={18} />
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        )}

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
                  <Table.Th style={{ width: 40 }}>
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isSomeSelected}
                      onChange={toggleSelectAll}
                      aria-label="Sélectionner tout"
                    />
                  </Table.Th>
                  <Table.Th>Collaborateur</Table.Th>
                  <Table.Th>Matricule</Table.Th>
                  <Table.Th>Manager</Table.Th>
                  <Table.Th>Formations</Table.Th>
                  <Table.Th>Statut</Table.Th>
                  <Table.Th style={{ width: 100 }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {collaborateurs.map((collab) => (
                  <Table.Tr
                    key={collab.id}
                    bg={selectedCollaborateurs.includes(collab.id) ? 'var(--mantine-color-blue-light)' : undefined}
                  >
                    <Table.Td>
                      <Checkbox
                        checked={selectedCollaborateurs.includes(collab.id)}
                        onChange={() => toggleSelect(collab.id)}
                        aria-label={`Sélectionner ${collab.nomComplet}`}
                      />
                    </Table.Td>
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
                        <Menu shadow="md" width={200} position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle">
                              <DotsThreeVertical size={18} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<ArrowsLeftRight size={16} />}
                              onClick={() => openChangeEquipeForOne(collab)}
                            >
                              Changer d'équipe
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<Eye size={16} />}
                              onClick={() => router.push(`/collaborateurs/${collab.id}`)}
                            >
                              Voir le profil
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Paper>
      </Stack>

      {/* Modal d'édition/création */}
      <DepartementFormModal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setIsCreatingEquipe(false);
        }}
        onSubmit={handleSubmit}
        departement={isCreatingEquipe ? null : departement}
        isSubmitting={isSubmitting}
        initialType={isCreatingEquipe ? 'EQUIPE' : undefined}
        initialParentId={isCreatingEquipe ? departementId : undefined}
      />

      {/* Modal de changement d'équipe */}
      <ChangeEquipeModal
        opened={changeEquipeModalOpened}
        onClose={() => setChangeEquipeModalOpened(false)}
        collaborateurs={collaborateursToMove}
        currentDepartementId={departementId}
        onSuccess={handleChangeEquipeSuccess}
      />

      {/* Barre d'actions flottante pour la sélection multiple */}
      <Affix position={{ bottom: 20, left: '50%' }} style={{ transform: 'translateX(-50%)' }}>
        <Transition transition="slide-up" mounted={selectedCollaborateurs.length > 0}>
          {(transitionStyles) => (
            <Paper
              shadow="lg"
              p="md"
              radius="lg"
              withBorder
              style={{
                ...transitionStyles,
                backgroundColor: 'var(--mantine-color-body)',
              }}
            >
              <Group gap="md">
                <Badge size="lg" variant="filled" color="blue">
                  {selectedCollaborateurs.length} sélectionné{selectedCollaborateurs.length > 1 ? 's' : ''}
                </Badge>
                <Button
                  leftSection={<ArrowsLeftRight size={18} />}
                  onClick={openChangeEquipeForSelected}
                >
                  Changer d'équipe
                </Button>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => setSelectedCollaborateurs([])}
                  size="lg"
                >
                  <X size={18} />
                </ActionIcon>
              </Group>
            </Paper>
          )}
        </Transition>
      </Affix>
    </Container>
  );
}
