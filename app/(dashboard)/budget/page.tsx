'use client';

import { useState, useEffect } from 'react';
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
  Grid,
  Card,
  Progress,
  Modal,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Stack,
  Flex,
  ThemeIcon,
  Alert,
  Loader,
  Center,
  Menu,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import {
  Plus,
  CurrencyEur,
  TrendUp,
  Warning,
  PencilSimple,
  Trash,
  Wallet,
  ChartBar,
  Calculator,
  Calendar,
  DotsThreeVertical,
  Info,
} from '@phosphor-icons/react';
import { budgetService, BudgetAnnuel, CreateBudgetAnnuel, UpdateBudgetAnnuel } from '@/lib/services/budget.service';

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<BudgetAnnuel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBudget, setSelectedBudget] = useState<BudgetAnnuel | null>(null);
  
  // Modals
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  
  // Form data
  const [formData, setFormData] = useState<CreateBudgetAnnuel>({
    annee: new Date().getFullYear(),
    budgetTotal: 0,
    budgetFormation: 0,
    budgetAutre: 0,
    commentaire: '',
    statut: 'actif'
  });

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const data = await budgetService.getAll();
      setBudgets(data);
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les budgets',
        color: 'red',
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await budgetService.create(formData);
      notifications.show({
        title: 'Succès',
        message: 'Budget créé avec succès',
        color: 'green',
      });
      closeCreate();
      loadBudgets();
      resetForm();
    } catch (error: any) {
      if (error.response?.status === 409) {
        notifications.show({
          title: 'Erreur',
          message: 'Un budget existe déjà pour cette année',
          color: 'red',
        });
      } else {
        notifications.show({
          title: 'Erreur',
          message: 'Impossible de créer le budget',
          color: 'red',
        });
      }
    }
  };

  const handleUpdate = async () => {
    if (!selectedBudget) return;

    try {
      const updateData: UpdateBudgetAnnuel = {
        budgetTotal: formData.budgetTotal,
        budgetFormation: formData.budgetFormation,
        budgetAutre: formData.budgetAutre,
        commentaire: formData.commentaire,
        statut: formData.statut
      };
      
      await budgetService.update(selectedBudget.id, updateData);
      notifications.show({
        title: 'Succès',
        message: 'Budget mis à jour avec succès',
        color: 'green',
      });
      closeEdit();
      loadBudgets();
      resetForm();
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de mettre à jour le budget',
        color: 'red',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce budget ?')) return;

    try {
      await budgetService.delete(id);
      notifications.show({
        title: 'Succès',
        message: 'Budget supprimé avec succès',
        color: 'green',
      });
      loadBudgets();
    } catch (error: any) {
      if (error.response?.status === 400) {
        notifications.show({
          title: 'Erreur',
          message: 'Impossible de supprimer un budget avec des allocations',
          color: 'red',
        });
      } else {
        notifications.show({
          title: 'Erreur',
          message: 'Impossible de supprimer le budget',
          color: 'red',
        });
      }
    }
  };

  const openEditModal = (budget: BudgetAnnuel) => {
    setSelectedBudget(budget);
    setFormData({
      annee: budget.annee,
      budgetTotal: budget.budgetTotal,
      budgetFormation: budget.budgetFormation,
      budgetAutre: budget.budgetAutre || 0,
      commentaire: budget.commentaire || '',
      statut: budget.statut
    });
    openEdit();
  };

  const resetForm = () => {
    setFormData({
      annee: new Date().getFullYear(),
      budgetTotal: 0,
      budgetFormation: 0,
      budgetAutre: 0,
      commentaire: '',
      statut: 'actif'
    });
    setSelectedBudget(null);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'actif': return 'green';
      case 'cloture': return 'gray';
      case 'previsionnel': return 'blue';
      default: return 'gray';
    }
  };

  const calculateConsommationPercentage = (budget: BudgetAnnuel) => {
    if (!budget.consommation) return 0;
    return Math.min(100, budget.consommation.pourcentage);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'red';
    if (percentage >= 70) return 'orange';
    return 'green';
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  const currentYearBudget = budgets.find(b => b.annee === new Date().getFullYear() && b.statut === 'actif');

  return (
    <Container size="xl" py="lg">
      <Flex justify="space-between" align="center" mb="xl">
        <div>
          <Title order={2}>Gestion des Budgets Annuels</Title>
          <Text c="dimmed" size="sm">Gérez et suivez les budgets de formation</Text>
        </div>
        <Button leftSection={<Plus size={20} />} onClick={openCreate}>
          Nouveau Budget
        </Button>
      </Flex>

      {currentYearBudget && (
        <Grid mb="xl">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text fw={500} size="sm" c="dimmed">Budget Total</Text>
                <ThemeIcon color="blue" variant="light" size="lg">
                  <CurrencyEur size={20} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl">{formatCurrency(currentYearBudget.budgetTotal)}</Text>
              <Text size="xs" c="dimmed" mt="xs">Année {currentYearBudget.annee}</Text>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text fw={500} size="sm" c="dimmed">Budget Formation</Text>
                <ThemeIcon color="teal" variant="light" size="lg">
                  <Wallet size={20} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl">{formatCurrency(currentYearBudget.budgetFormation)}</Text>
              <Text size="xs" c="dimmed" mt="xs">
                {((currentYearBudget.budgetFormation / currentYearBudget.budgetTotal) * 100).toFixed(1)}% du total
              </Text>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text fw={500} size="sm" c="dimmed">Consommation</Text>
                <ThemeIcon color="orange" variant="light" size="lg">
                  <ChartBar size={20} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl">
                {currentYearBudget.consommation ? formatCurrency(currentYearBudget.consommation.montant) : '0 €'}
              </Text>
              <Progress 
                value={calculateConsommationPercentage(currentYearBudget)} 
                color={getProgressColor(calculateConsommationPercentage(currentYearBudget))}
                size="sm"
                mt="xs"
              />
              <Text size="xs" c="dimmed" mt={5}>
                {currentYearBudget.consommation?.pourcentage || 0}% utilisé
              </Text>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text fw={500} size="sm" c="dimmed">Budget Restant</Text>
                <ThemeIcon color="green" variant="light" size="lg">
                  <Calculator size={20} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl">
                {formatCurrency(currentYearBudget.budgetFormation - (currentYearBudget.consommation?.montant || 0))}
              </Text>
              <Text size="xs" c="dimmed" mt="xs">Disponible pour formations</Text>
            </Card>
          </Grid.Col>
        </Grid>
      )}

      <Paper shadow="xs" p="md" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={4}>Historique des Budgets</Title>
          <Badge leftSection={<Calendar size={14} />} variant="light">
            {budgets.length} budget{budgets.length > 1 ? 's' : ''}
          </Badge>
        </Group>

        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Année</Table.Th>
              <Table.Th>Budget Total</Table.Th>
              <Table.Th>Budget Formation</Table.Th>
              <Table.Th>Autres</Table.Th>
              <Table.Th>Consommation</Table.Th>
              <Table.Th>Statut</Table.Th>
              <Table.Th>Commentaire</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {budgets.map((budget) => (
              <Table.Tr key={budget.id}>
                <Table.Td fw={600}>{budget.annee}</Table.Td>
                <Table.Td>{formatCurrency(budget.budgetTotal)}</Table.Td>
                <Table.Td>{formatCurrency(budget.budgetFormation)}</Table.Td>
                <Table.Td>{budget.budgetAutre ? formatCurrency(budget.budgetAutre) : '-'}</Table.Td>
                <Table.Td>
                  <Stack gap={4}>
                    <Text size="sm">
                      {budget.consommation ? formatCurrency(budget.consommation.montant) : '0 €'}
                    </Text>
                    <Progress 
                      value={calculateConsommationPercentage(budget)} 
                      size="xs"
                      color={getProgressColor(calculateConsommationPercentage(budget))}
                    />
                    <Text size="xs" c="dimmed">
                      {budget.consommation?.pourcentage || 0}%
                    </Text>
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Badge color={getStatutColor(budget.statut)} variant="light">
                    {budget.statut}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" lineClamp={1}>
                    {budget.commentaire || '-'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <ActionIcon variant="subtle">
                        <DotsThreeVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<PencilSimple size={16} />}
                        onClick={() => openEditModal(budget)}
                      >
                        Modifier
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item
                        color="red"
                        leftSection={<Trash size={16} />}
                        onClick={() => handleDelete(budget.id)}
                      >
                        Supprimer
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        {budgets.length === 0 && (
          <Alert icon={<Info size={20} />} color="blue" mt="md">
            Aucun budget créé. Cliquez sur "Nouveau Budget" pour commencer.
          </Alert>
        )}
      </Paper>

      {/* Modal Création */}
      <Modal
        opened={createOpened}
        onClose={closeCreate}
        title="Créer un nouveau budget"
        size="md"
      >
        <Stack>
          <NumberInput
            label="Année"
            value={formData.annee}
            onChange={(value) => setFormData({...formData, annee: value || new Date().getFullYear()})}
            required
          />
          <NumberInput
            label="Budget Total (€)"
            value={formData.budgetTotal}
            onChange={(value) => setFormData({...formData, budgetTotal: value || 0})}
            thousandSeparator=" "
            decimalSeparator=","
            required
          />
          <NumberInput
            label="Budget Formation (€)"
            value={formData.budgetFormation}
            onChange={(value) => setFormData({...formData, budgetFormation: value || 0})}
            thousandSeparator=" "
            decimalSeparator=","
            required
          />
          <NumberInput
            label="Autres Budgets (€)"
            value={formData.budgetAutre}
            onChange={(value) => setFormData({...formData, budgetAutre: value || 0})}
            thousandSeparator=" "
            decimalSeparator=","
          />
          <Select
            label="Statut"
            value={formData.statut}
            onChange={(value) => setFormData({...formData, statut: value as any || 'actif'})}
            data={[
              { value: 'previsionnel', label: 'Prévisionnel' },
              { value: 'actif', label: 'Actif' },
              { value: 'cloture', label: 'Clôturé' },
            ]}
          />
          <Textarea
            label="Commentaire"
            value={formData.commentaire}
            onChange={(e) => setFormData({...formData, commentaire: e.target.value})}
            rows={3}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={closeCreate}>
              Annuler
            </Button>
            <Button onClick={handleCreate}>
              Créer
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal Édition */}
      <Modal
        opened={editOpened}
        onClose={closeEdit}
        title="Modifier le budget"
        size="md"
      >
        <Stack>
          <NumberInput
            label="Budget Total (€)"
            value={formData.budgetTotal}
            onChange={(value) => setFormData({...formData, budgetTotal: value || 0})}
            thousandSeparator=" "
            decimalSeparator=","
            required
          />
          <NumberInput
            label="Budget Formation (€)"
            value={formData.budgetFormation}
            onChange={(value) => setFormData({...formData, budgetFormation: value || 0})}
            thousandSeparator=" "
            decimalSeparator=","
            required
          />
          <NumberInput
            label="Autres Budgets (€)"
            value={formData.budgetAutre}
            onChange={(value) => setFormData({...formData, budgetAutre: value || 0})}
            thousandSeparator=" "
            decimalSeparator=","
          />
          <Select
            label="Statut"
            value={formData.statut}
            onChange={(value) => setFormData({...formData, statut: value as any || 'actif'})}
            data={[
              { value: 'previsionnel', label: 'Prévisionnel' },
              { value: 'actif', label: 'Actif' },
              { value: 'cloture', label: 'Clôturé' },
            ]}
          />
          <Textarea
            label="Commentaire"
            value={formData.commentaire}
            onChange={(e) => setFormData({...formData, commentaire: e.target.value})}
            rows={3}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={closeEdit}>
              Annuler
            </Button>
            <Button onClick={handleUpdate}>
              Mettre à jour
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}