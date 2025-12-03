'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Paper,
  Table,
  Badge,
  Group,
  Text,
  ActionIcon,
  Tooltip,
  Select,
  Alert,
  Center,
  Loader,
  Stack,
  Card,
  Grid,
  ThemeIcon,
  Modal,
  Button,
  Radio,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  ArrowLeft,
  Trash,
  Pencil,
  MapPin,
  ArrowsClockwise,
  Warning,
  CheckCircle,
  XCircle,
  Funnel,
  ListChecks,
  Building,
  Tag,
  Users,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { importPreviewService } from '@/lib/services/import-preview.service';
import type {
  RegleImport,
  TypeEntiteImport,
  ActionResolutionConflict,
  EntityOption,
  RulesStats,
} from '@/lib/types/import-preview.types';

export default function ImportRulesPage() {
  const [rules, setRules] = useState<RegleImport[]>([]);
  const [stats, setStats] = useState<RulesStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string | null>(null);

  // Modal d'edition
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [editingRule, setEditingRule] = useState<RegleImport | null>(null);
  const [editAction, setEditAction] = useState<string>('');
  const [editEntityId, setEditEntityId] = useState<string | null>(null);
  const [availableEntities, setAvailableEntities] = useState<EntityOption[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal de confirmation de suppression
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deletingRule, setDeletingRule] = useState<RegleImport | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadRules();
    loadStats();
  }, [filterType]);

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const filters = filterType ? { typeEntite: filterType as TypeEntiteImport } : undefined;
      const data = await importPreviewService.getRules(filters);
      setRules(data);
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les regles',
        color: 'red',
        icon: <XCircle size={20} />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await importPreviewService.getRulesStats();
      setStats(data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleEdit = async (rule: RegleImport) => {
    setEditingRule(rule);
    setEditAction(rule.action);
    setEditEntityId(rule.entiteCibleId?.toString() || null);
    setEditModalOpened(true);

    // Charger les entites disponibles si MAPPER
    if (rule.action === 'MAPPER') {
      loadEntitiesForType(rule.typeEntite as TypeEntiteImport);
    }
  };

  const loadEntitiesForType = async (type: TypeEntiteImport) => {
    setLoadingEntities(true);
    try {
      const entities = await importPreviewService.getAvailableEntities(type);
      setAvailableEntities(entities);
    } catch (error) {
      console.error('Erreur chargement entites:', error);
    } finally {
      setLoadingEntities(false);
    }
  };

  const handleActionChange = (action: string) => {
    setEditAction(action);
    if (action === 'MAPPER' && editingRule) {
      loadEntitiesForType(editingRule.typeEntite as TypeEntiteImport);
    } else {
      setEditEntityId(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingRule) return;

    // Validation
    if (editAction === 'MAPPER' && !editEntityId) {
      notifications.show({
        title: 'Erreur',
        message: 'Veuillez selectionner une entite cible',
        color: 'red',
        icon: <Warning size={20} />,
      });
      return;
    }

    setIsSaving(true);
    try {
      await importPreviewService.updateRule(editingRule.id, {
        action: editAction as ActionResolutionConflict,
        entiteCibleId: editEntityId ? parseInt(editEntityId) : undefined,
      });

      notifications.show({
        title: 'Succes',
        message: 'Regle mise a jour',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });

      setEditModalOpened(false);
      loadRules();
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de mettre a jour la regle',
        color: 'red',
        icon: <XCircle size={20} />,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (rule: RegleImport) => {
    setDeletingRule(rule);
    setDeleteModalOpened(true);
  };

  const confirmDelete = async () => {
    if (!deletingRule) return;

    setIsDeleting(true);
    try {
      await importPreviewService.deleteRule(deletingRule.id);

      notifications.show({
        title: 'Succes',
        message: 'Regle supprimee',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });

      setDeleteModalOpened(false);
      loadRules();
      loadStats();
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de supprimer la regle',
        color: 'red',
        icon: <XCircle size={20} />,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'MAPPER':
        return 'blue';
      case 'IGNORER':
        return 'gray';
      case 'RECREER':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'MAPPER':
        return 'Mapper';
      case 'IGNORER':
        return 'Ignorer';
      case 'RECREER':
        return 'Recreer';
      default:
        return action;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'DEPARTEMENT':
        return 'Departement';
      case 'ORGANISME':
        return 'Organisme';
      case 'CATEGORIE':
        return 'Categorie';
      default:
        return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DEPARTEMENT':
        return <Users size={16} />;
      case 'ORGANISME':
        return <Building size={16} />;
      case 'CATEGORIE':
        return <Tag size={16} />;
      default:
        return <Tag size={16} />;
    }
  };

  const totalRules = stats.reduce((acc, s) => acc + s.count, 0);

  return (
    <Container size="xl">
      {/* En-tete */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Group justify="space-between" mb="md">
          <Group>
            <ActionIcon
              component={Link}
              href="/import"
              variant="light"
              size="lg"
            >
              <ArrowLeft size={20} />
            </ActionIcon>
            <div>
              <Group align="center" gap="sm">
                <ListChecks size={32} color="#228BE6" />
                <Title order={1}>Regles d'import</Title>
              </Group>
              <Text size="lg" c="dimmed" mt="xs">
                Gerez les decisions memorisees pour les imports OLU
              </Text>
            </div>
          </Group>
        </Group>

        {/* Statistiques */}
        <Grid mt="lg">
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Total regles
                  </Text>
                  <Text size="xl" fw={700}>{totalRules}</Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                  <ListChecks size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>

          {stats.map((stat) => (
            <Grid.Col key={stat.typeEntite} span={{ base: 12, sm: 3 }}>
              <Card withBorder p="md" radius="md">
                <Group justify="space-between">
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      {getTypeLabel(stat.typeEntite)}
                    </Text>
                    <Text size="xl" fw={700}>{stat.count}</Text>
                  </div>
                  <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                    {getTypeIcon(stat.typeEntite)}
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Paper>

      {/* Filtres et tableau */}
      <Paper shadow="xs" p="lg" radius="md">
        <Group justify="space-between" mb="lg">
          <Group>
            <Funnel size={20} />
            <Text fw={500}>Filtres</Text>
          </Group>
          <Select
            placeholder="Tous les types"
            clearable
            value={filterType}
            onChange={setFilterType}
            data={[
              { value: 'DEPARTEMENT', label: 'Departement' },
              { value: 'ORGANISME', label: 'Organisme' },
              { value: 'CATEGORIE', label: 'Categorie' },
            ]}
            style={{ width: 200 }}
          />
        </Group>

        {isLoading ? (
          <Center h={200}>
            <Loader size="lg" variant="bars" />
          </Center>
        ) : rules.length > 0 ? (
          <Table.ScrollContainer minWidth={800}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Valeur Excel</Table.Th>
                  <Table.Th>Action</Table.Th>
                  <Table.Th>Cible</Table.Th>
                  <Table.Th>Date creation</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rules.map((rule) => (
                  <Table.Tr key={rule.id}>
                    <Table.Td>
                      <Badge variant="light" leftSection={getTypeIcon(rule.typeEntite)}>
                        {getTypeLabel(rule.typeEntite)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500}>{rule.valeurExcel}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getActionColor(rule.action)} variant="filled">
                        {getActionLabel(rule.action)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {rule.action === 'MAPPER' && rule.entiteCibleNom ? (
                        <Group gap="xs">
                          <MapPin size={14} />
                          <Text size="sm">{rule.entiteCibleNom}</Text>
                        </Group>
                      ) : (
                        <Text size="sm" c="dimmed">-</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {new Date(rule.dateCreation).toLocaleDateString('fr-FR')}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Tooltip label="Modifier">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => handleEdit(rule)}
                          >
                            <Pencil size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Supprimer">
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => handleDelete(rule)}
                          >
                            <Trash size={16} />
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
              <ListChecks size={48} color="#868E96" />
              <Text size="lg" fw={500} c="dimmed">Aucune regle memorisee</Text>
              <Text size="sm" c="dimmed">
                Les regles apparaitront ici apres avoir resolu des conflits lors d'un import
              </Text>
            </Stack>
          </Center>
        )}
      </Paper>

      {/* Modal d'edition */}
      <Modal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        title={
          <Group gap="sm">
            <Pencil size={20} />
            <Text fw={600}>Modifier la regle</Text>
          </Group>
        }
      >
        {editingRule && (
          <Stack gap="md">
            <Alert icon={<Warning size={16} />} color="orange" variant="light">
              <Text size="sm">
                <Text span fw={600}>{editingRule.typeEntite}</Text> :{' '}
                {editingRule.valeurExcel}
              </Text>
            </Alert>

            <Radio.Group
              value={editAction}
              onChange={handleActionChange}
              label="Action a effectuer"
            >
              <Stack gap="xs" mt="xs">
                <Radio
                  value="RECREER"
                  label={
                    <Group gap="xs">
                      <ArrowsClockwise size={16} />
                      <Text size="sm">Reactiver l'entite</Text>
                    </Group>
                  }
                />
                <Radio
                  value="MAPPER"
                  label={
                    <Group gap="xs">
                      <MapPin size={16} />
                      <Text size="sm">Mapper vers une autre entite</Text>
                    </Group>
                  }
                />
                <Radio
                  value="IGNORER"
                  label={
                    <Group gap="xs">
                      <Trash size={16} />
                      <Text size="sm">Ignorer</Text>
                    </Group>
                  }
                />
              </Stack>
            </Radio.Group>

            {editAction === 'MAPPER' && (
              <Select
                label="Entite cible"
                placeholder="Selectionnez l'entite de remplacement"
                data={availableEntities.map((e) => ({
                  value: e.id.toString(),
                  label: e.nom,
                }))}
                value={editEntityId}
                onChange={setEditEntityId}
                searchable
                clearable
                disabled={loadingEntities}
                rightSection={loadingEntities ? <Loader size="xs" /> : null}
              />
            )}

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={() => setEditModalOpened(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleSaveEdit}
                loading={isSaving}
                leftSection={<CheckCircle size={16} />}
              >
                Enregistrer
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title={
          <Group gap="sm">
            <Trash size={20} color="#E03131" />
            <Text fw={600}>Supprimer la regle</Text>
          </Group>
        }
      >
        {deletingRule && (
          <Stack gap="md">
            <Text>
              Etes-vous sur de vouloir supprimer cette regle ?
            </Text>
            <Alert icon={<Warning size={16} />} color="orange" variant="light">
              <Text size="sm">
                <Text span fw={600}>{deletingRule.typeEntite}</Text> :{' '}
                {deletingRule.valeurExcel} {' -> '}
                <Badge size="sm" color={getActionColor(deletingRule.action)}>
                  {getActionLabel(deletingRule.action)}
                </Badge>
              </Text>
            </Alert>
            <Text size="sm" c="dimmed">
              Les prochains imports ne beneficieront plus de cette decision automatique.
            </Text>

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={() => setDeleteModalOpened(false)}>
                Annuler
              </Button>
              <Button
                color="red"
                onClick={confirmDelete}
                loading={isDeleting}
                leftSection={<Trash size={16} />}
              >
                Supprimer
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
