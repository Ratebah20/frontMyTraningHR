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
  Modal,
  TextInput,
  Textarea,
  Stack,
  Paper,
  Switch,
  Menu,
  Alert,
  Tooltip,
  Center,
  Loader,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  Plus,
  PencilSimple,
  Trash,
  Warning,
  CheckCircle,
  Tag,
  ArrowLeft,
  DotsThreeVertical,
  BookOpen,
  Info,
} from '@phosphor-icons/react';
import { commonService } from '@/lib/services';

interface Category {
  id: number;
  nomCategorie: string;
  description?: string;
  actif: boolean;
  nombreFormations?: number;
}

export default function CategoriesPage() {
  const router = useRouter();
  
  // États
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  
  const form = useForm({
    initialValues: {
      nomCategorie: '',
      description: '',
      actif: true,
    },
    validate: {
      nomCategorie: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Le nom est requis';
        }
        if (value.length > 100) {
          return 'Le nom ne doit pas dépasser 100 caractères';
        }
        return null;
      },
      description: (value) => {
        if (value && value.length > 255) {
          return 'La description ne doit pas dépasser 255 caractères';
        }
        return null;
      },
    },
  });

  // Charger les catégories
  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await commonService.getCategoriesFormation(showInactive);
      setCategories(data);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les catégories',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [showInactive]);

  // Ouvrir le modal d'ajout/édition
  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      form.setValues({
        nomCategorie: category.nomCategorie,
        description: category.description || '',
        actif: category.actif,
      });
    } else {
      setEditingCategory(null);
      form.reset();
    }
    setModalOpened(true);
  };

  // Fermer le modal
  const closeModal = () => {
    setModalOpened(false);
    setEditingCategory(null);
    form.reset();
  };

  // Soumettre le formulaire
  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        // Mise à jour
        await commonService.updateCategorieFormation(editingCategory.id, values);
        notifications.show({
          title: 'Succès',
          message: 'Catégorie mise à jour avec succès',
          color: 'green',
          icon: <CheckCircle size={20} />,
        });
      } else {
        // Création
        await commonService.createCategorieFormation({
          nomCategorie: values.nomCategorie,
          description: values.description,
        });
        notifications.show({
          title: 'Succès',
          message: 'Catégorie créée avec succès',
          color: 'green',
          icon: <CheckCircle size={20} />,
        });
      }
      closeModal();
      loadCategories();
    } catch (error: any) {
      notifications.show({
        title: 'Erreur',
        message: error.response?.data?.message || 'Une erreur est survenue',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ouvrir le modal de suppression
  const openDeleteModal = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteModalOpened(true);
  };

  // Confirmer la suppression
  const handleDelete = async () => {
    if (!categoryToDelete) return;
    
    setIsDeleting(true);
    try {
      await commonService.deleteCategorieFormation(categoryToDelete.id);
      notifications.show({
        title: 'Succès',
        message: categoryToDelete.nombreFormations && categoryToDelete.nombreFormations > 0
          ? 'Catégorie désactivée avec succès'
          : 'Catégorie supprimée avec succès',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
      setDeleteModalOpened(false);
      setCategoryToDelete(null);
      loadCategories();
    } catch (error: any) {
      notifications.show({
        title: 'Erreur',
        message: error.response?.data?.message || 'Impossible de supprimer la catégorie',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Basculer le statut actif/inactif
  const toggleStatus = async (category: Category) => {
    try {
      await commonService.updateCategorieFormation(category.id, {
        actif: !category.actif,
      });
      notifications.show({
        title: 'Succès',
        message: `Catégorie ${!category.actif ? 'activée' : 'désactivée'} avec succès`,
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
      loadCategories();
    } catch (error: any) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de modifier le statut',
        color: 'red',
        icon: <Warning size={20} />,
      });
    }
  };

  if (isLoading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Container size="lg">
      {/* En-tête */}
      <Group justify="space-between" mb="xl">
        <div>
          <Group align="center" gap="sm">
            <Tag size={32} color="#228BE6" />
            <Title order={1}>Gestion des Catégories</Title>
          </Group>
          <Text size="lg" c="dimmed" mt="xs">
            Gérez les catégories de formations
          </Text>
        </div>
        <Group>
          <Button
            variant="subtle"
            leftSection={<ArrowLeft size={20} />}
            onClick={() => router.push('/formations')}
          >
            Retour
          </Button>
          <Button
            leftSection={<Plus size={20} />}
            onClick={() => openModal()}
          >
            Nouvelle catégorie
          </Button>
        </Group>
      </Group>

      {/* Statistiques */}
      <Group mb="xl">
        <Paper withBorder p="md" radius="md" style={{ flex: 1 }}>
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Total Catégories
              </Text>
              <Text size="xl" fw={700}>{categories.length}</Text>
            </div>
            <Tag size={24} color="#228BE6" />
          </Group>
        </Paper>
        <Paper withBorder p="md" radius="md" style={{ flex: 1 }}>
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Catégories Actives
              </Text>
              <Text size="xl" fw={700} c="green">
                {categories.filter(c => c.actif).length}
              </Text>
            </div>
            <CheckCircle size={24} color="#40C057" />
          </Group>
        </Paper>
        <Paper withBorder p="md" radius="md" style={{ flex: 1 }}>
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Total Formations
              </Text>
              <Text size="xl" fw={700}>
                {categories.reduce((sum, c) => sum + (c.nombreFormations || 0), 0)}
              </Text>
            </div>
            <BookOpen size={24} color="#7950F2" />
          </Group>
        </Paper>
      </Group>

      {/* Filtre */}
      <Group mb="md">
        <Switch
          label="Afficher les catégories inactives"
          checked={showInactive}
          onChange={(event) => setShowInactive(event.currentTarget.checked)}
        />
      </Group>

      {/* Table des catégories */}
      <Paper shadow="xs" radius="md" withBorder>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nom</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Formations</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Statut</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {categories.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                  <Text c="dimmed">Aucune catégorie trouvée</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              categories.map((category) => (
                <Table.Tr key={category.id}>
                  <Table.Td>
                    <Text fw={500}>{category.nomCategorie}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed" lineClamp={2}>
                      {category.description || '-'}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'center' }}>
                    <Badge variant="light" color="blue">
                      {category.nombreFormations || 0}
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'center' }}>
                    <Switch
                      checked={category.actif}
                      onChange={() => toggleStatus(category)}
                      size="sm"
                    />
                  </Table.Td>
                  <Table.Td>
                    <Group justify="flex-end" gap="xs">
                      <Tooltip label="Modifier">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => openModal(category)}
                        >
                          <PencilSimple size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Menu withinPortal position="bottom-end" shadow="sm">
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray">
                            <DotsThreeVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<PencilSimple size={14} />}
                            onClick={() => openModal(category)}
                          >
                            Modifier
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<Switch size={14} checked={category.actif} readOnly />}
                            onClick={() => toggleStatus(category)}
                          >
                            {category.actif ? 'Désactiver' : 'Activer'}
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            color="red"
                            leftSection={<Trash size={14} />}
                            onClick={() => openDeleteModal(category)}
                          >
                            Supprimer
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* Modal d'ajout/édition */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Nom de la catégorie"
              placeholder="Ex: Management"
              required
              {...form.getInputProps('nomCategorie')}
            />
            <Textarea
              label="Description"
              placeholder="Description de la catégorie (optionnel)"
              minRows={3}
              {...form.getInputProps('description')}
            />
            {editingCategory && (
              <Switch
                label="Catégorie active"
                checked={form.values.actif}
                {...form.getInputProps('actif', { type: 'checkbox' })}
              />
            )}
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={closeModal}>
                Annuler
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {editingCategory ? 'Enregistrer' : 'Créer'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal de suppression */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title="Confirmer la suppression"
        centered
      >
        <Stack>
          <Text>
            Êtes-vous sûr de vouloir supprimer la catégorie <strong>{categoryToDelete?.nomCategorie}</strong> ?
          </Text>
          {categoryToDelete?.nombreFormations && categoryToDelete.nombreFormations > 0 && (
            <Alert color="yellow" icon={<Warning size={20} />}>
              Cette catégorie contient {categoryToDelete.nombreFormations} formation(s).
              Elle sera désactivée au lieu d'être supprimée.
            </Alert>
          )}
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setDeleteModalOpened(false)}>
              Annuler
            </Button>
            <Button 
              color="red" 
              onClick={handleDelete}
              loading={isDeleting}
            >
              Confirmer
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}