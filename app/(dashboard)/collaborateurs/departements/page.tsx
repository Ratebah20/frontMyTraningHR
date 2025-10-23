'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Switch,
  Menu,
  TextInput,
  Center,
  Loader,
  Modal,
  SimpleGrid,
  SegmentedControl,
  Tooltip,
  Stack,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  Plus,
  PencilSimple,
  Trash,
  Warning,
  CheckCircle,
  DotsThreeVertical,
  MagnifyingGlass,
  Eye,
  SquaresFour,
  ListBullets,
  Buildings,
  Users,
  TreeStructure,
} from '@phosphor-icons/react';
import { departementsService } from '@/lib/services';
import { Departement, DepartementDetail, CreateDepartementDto, UpdateDepartementDto, HierarchyData, HierarchyNode } from '@/lib/types';
import { DepartementFormModal } from '@/components/departements/DepartementFormModal';
import { DepartementCard } from '@/components/departements/DepartementCard';
import { HierarchyTree } from '@/components/departements/HierarchyTree';
import { TypeBadge } from '@/components/departements/TypeBadge';

export default function DepartementsPage() {
  const router = useRouter();

  // États
  const [departements, setDepartements] = useState<DepartementDetail[]>([]);
  const [hierarchyData, setHierarchyData] = useState<HierarchyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingDepartement, setEditingDepartement] = useState<Departement | null>(null);
  const [departementToDelete, setDepartementToDelete] = useState<DepartementDetail | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'tree'>('table');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DEPARTEMENT' | 'EQUIPE'>('ALL');
  const [parentForNewEquipe, setParentForNewEquipe] = useState<HierarchyNode | null>(null);

  // Charger les départements
  const loadDepartements = async () => {
    setIsLoading(true);
    try {
      // Charger la liste pour les vues table et grid
      const data = await departementsService.getAll({ includeInactive: showInactive });
      const departementsWithStats = await Promise.all(
        data.map(async (dept) => {
          try {
            const details = await departementsService.getById(dept.id);
            return details;
          } catch {
            return {
              ...dept,
              nombreCollaborateurs: 0,
              nombreCollaborateursActifs: 0,
            };
          }
        })
      );
      setDepartements(departementsWithStats);

      // Charger la hiérarchie pour la vue arbre
      if (viewMode === 'tree') {
        const hierarchy = await departementsService.getHierarchy(showInactive);
        setHierarchyData(hierarchy);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des départements:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les départements',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDepartements();
  }, [showInactive, viewMode]);

  // Filtrer les départements
  const filteredDepartements = departements.filter((dept) => {
    const matchesSearch = dept.nomDepartement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.codeDepartement?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'ALL' || dept.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Ouvrir le modal d'ajout/édition
  const openModal = (departement?: Departement) => {
    setEditingDepartement(departement || null);
    setParentForNewEquipe(null);
    setModalOpened(true);
  };

  // Ouvrir le modal pour créer une équipe avec un parent prédéfini
  const openModalForEquipe = (parent?: HierarchyNode) => {
    setEditingDepartement(null);
    setParentForNewEquipe(parent || null);
    setModalOpened(true);
  };

  // Fermer le modal
  const closeModal = () => {
    setModalOpened(false);
    setEditingDepartement(null);
    setParentForNewEquipe(null);
  };

  // Soumettre le formulaire
  const handleSubmit = async (values: CreateDepartementDto | UpdateDepartementDto) => {
    setIsSubmitting(true);
    try {
      if (editingDepartement) {
        // Mise à jour
        await departementsService.update(editingDepartement.id, values);
        notifications.show({
          title: 'Succès',
          message: 'Département mis à jour avec succès',
          color: 'green',
          icon: <CheckCircle size={20} />,
        });
      } else {
        // Création
        await departementsService.create(values as CreateDepartementDto);
        notifications.show({
          title: 'Succès',
          message: 'Département créé avec succès',
          color: 'green',
          icon: <CheckCircle size={20} />,
        });
      }
      closeModal();
      loadDepartements();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
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

  // Ouvrir le modal de suppression
  const openDeleteModal = (departement: DepartementDetail) => {
    setDepartementToDelete(departement);
    setDeleteModalOpened(true);
  };

  // Supprimer un département
  const handleDelete = async () => {
    if (!departementToDelete) return;

    setIsDeleting(true);
    try {
      await departementsService.delete(departementToDelete.id);
      notifications.show({
        title: 'Succès',
        message: 'Département supprimé avec succès',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
      setDeleteModalOpened(false);
      setDepartementToDelete(null);
      loadDepartements();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      const message = error.response?.data?.message || error.message || 'Une erreur est survenue';
      notifications.show({
        title: 'Erreur',
        message,
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* En-tête */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1} size="h2">
              <Group gap="xs">
                <Buildings size={32} weight="duotone" />
                Départements & Équipes
              </Group>
            </Title>
            <Text c="dimmed" size="sm" mt="xs">
              Gérez les départements et équipes de votre organisation
            </Text>
          </div>
          <Group>
            <Button
              leftSection={<Buildings size={18} />}
              onClick={() => openModal()}
              variant="light"
            >
              Nouveau département
            </Button>
            <Button
              leftSection={<Users size={18} />}
              onClick={() => openModalForEquipe()}
              color="green"
            >
              Nouvelle équipe
            </Button>
          </Group>
        </Group>

        {/* Filtres et recherche */}
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <TextInput
                placeholder="Rechercher un département ou une équipe..."
                leftSection={<MagnifyingGlass size={18} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                style={{ flex: 1, maxWidth: 400 }}
              />

              <Group>
                <Switch
                  label="Afficher les inactifs"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.currentTarget.checked)}
                />

                <SegmentedControl
                  value={viewMode}
                  onChange={(value) => setViewMode(value as 'table' | 'grid' | 'tree')}
                  data={[
                    {
                      value: 'table',
                      label: (
                        <Center>
                          <ListBullets size={16} />
                          <Text size="sm" ml={8}>
                            Tableau
                          </Text>
                        </Center>
                      ),
                    },
                    {
                      value: 'grid',
                      label: (
                        <Center>
                          <SquaresFour size={16} />
                          <Text size="sm" ml={8}>
                            Cartes
                          </Text>
                        </Center>
                      ),
                    },
                    {
                      value: 'tree',
                      label: (
                        <Center>
                          <TreeStructure size={16} />
                          <Text size="sm" ml={8}>
                            Arbre
                          </Text>
                        </Center>
                      ),
                    },
                  ]}
                />
              </Group>
            </Group>

            {/* Filtre par type (non visible en mode arbre car l'arbre montre déjà tout) */}
            {viewMode !== 'tree' && (
              <Group>
                <Text size="sm" fw={500}>Type :</Text>
                <SegmentedControl
                  value={typeFilter}
                  onChange={(value) => setTypeFilter(value as 'ALL' | 'DEPARTEMENT' | 'EQUIPE')}
                  data={[
                    { value: 'ALL', label: 'Tous' },
                    { value: 'DEPARTEMENT', label: 'Départements' },
                    { value: 'EQUIPE', label: 'Équipes' },
                  ]}
                />
              </Group>
            )}
          </Stack>
        </Paper>

        {/* Contenu principal */}
        {isLoading ? (
          <Center py={50}>
            <Loader size="lg" />
          </Center>
        ) : viewMode === 'tree' ? (
          // Vue arbre hiérarchique
          hierarchyData ? (
            <HierarchyTree
              nodes={hierarchyData.nodes}
              onEdit={openModal}
              onDelete={openDeleteModal}
              onAddChild={openModalForEquipe}
            />
          ) : (
            <Paper p="xl" withBorder>
              <Center>
                <Stack align="center" gap="md">
                  <TreeStructure size={48} weight="thin" className="text-gray-400" />
                  <Text c="dimmed">Chargement de la hiérarchie...</Text>
                </Stack>
              </Center>
            </Paper>
          )
        ) : filteredDepartements.length === 0 ? (
          <Paper p="xl" withBorder>
            <Center>
              <Stack align="center" gap="md">
                <Buildings size={48} weight="thin" className="text-gray-400" />
                <Text c="dimmed">
                  {searchQuery
                    ? 'Aucun département ne correspond à votre recherche'
                    : 'Aucun département trouvé'}
                </Text>
                {!searchQuery && (
                  <Button
                    leftSection={<Plus size={18} />}
                    onClick={() => openModal()}
                  >
                    Créer le premier département
                  </Button>
                )}
              </Stack>
            </Center>
          </Paper>
        ) : viewMode === 'grid' ? (
          // Vue cartes
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {filteredDepartements.map((dept) => (
              <DepartementCard
                key={dept.id}
                departement={dept}
                onEdit={openModal}
                onDelete={openDeleteModal}
              />
            ))}
          </SimpleGrid>
        ) : (
          // Vue tableau
          <Paper withBorder>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nom</Table.Th>
                  <Table.Th>Code</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Parent</Table.Th>
                  <Table.Th>Collaborateurs</Table.Th>
                  <Table.Th>Statut</Table.Th>
                  <Table.Th style={{ width: 100 }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredDepartements.map((dept) => (
                  <Table.Tr key={dept.id}>
                    <Table.Td>
                      <Text fw={500}>{dept.nomDepartement}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text c="dimmed" size="sm">
                        {dept.codeDepartement || '-'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <TypeBadge type={dept.type} size="xs" />
                    </Table.Td>
                    <Table.Td>
                      {dept.parent ? (
                        <Text size="sm" c="dimmed">
                          {dept.parent.nomDepartement}
                        </Text>
                      ) : (
                        <Text size="sm" c="dimmed">-</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Tooltip label={`${dept.nombreCollaborateursActifs} actifs sur ${dept.nombreCollaborateurs} au total`}>
                        <Badge variant="light" color="blue">
                          {dept.nombreCollaborateursActifs} / {dept.nombreCollaborateurs}
                        </Badge>
                      </Tooltip>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={dept.actif ? 'green' : 'gray'} variant="light">
                        {dept.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        <Tooltip label="Voir les détails">
                          <ActionIcon
                            variant="subtle"
                            onClick={() =>
                              router.push(`/collaborateurs/departements/${dept.id}`)
                            }
                          >
                            <Eye size={18} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Modifier">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => openModal(dept)}
                          >
                            <PencilSimple size={18} />
                          </ActionIcon>
                        </Tooltip>

                        <Menu shadow="md" width={200} position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray">
                              <DotsThreeVertical size={18} />
                            </ActionIcon>
                          </Menu.Target>

                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<Trash size={16} />}
                              color="red"
                              onClick={() => openDeleteModal(dept)}
                            >
                              Supprimer
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        )}
      </Stack>

      {/* Modal de formulaire */}
      <DepartementFormModal
        opened={modalOpened}
        onClose={closeModal}
        onSubmit={handleSubmit}
        departement={editingDepartement}
        isSubmitting={isSubmitting}
        initialType={parentForNewEquipe ? 'EQUIPE' : undefined}
        initialParentId={parentForNewEquipe ? parentForNewEquipe.id : undefined}
      />

      {/* Modal de confirmation de suppression */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => !isDeleting && setDeleteModalOpened(false)}
        title="Confirmer la suppression"
        centered
      >
        <Stack gap="md">
          <Text>
            Êtes-vous sûr de vouloir supprimer le département{' '}
            <Text span fw={600}>
              {departementToDelete?.nomDepartement}
            </Text>{' '}
            ?
          </Text>

          {departementToDelete && departementToDelete.nombreCollaborateurs > 0 && (
            <Paper p="sm" withBorder bg="yellow.0">
              <Group gap="xs">
                <Warning size={20} className="text-yellow-600" />
                <Text size="sm" c="yellow.8">
                  Ce département contient {departementToDelete.nombreCollaborateurs}{' '}
                  collaborateur(s). Vous devez d'abord les réassigner.
                </Text>
              </Group>
            </Paper>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" color="gray" onClick={() => setDeleteModalOpened(false)} disabled={isDeleting}>
              Annuler
            </Button>
            <Button color="red" onClick={handleDelete} loading={isDeleting}>
              Supprimer
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
