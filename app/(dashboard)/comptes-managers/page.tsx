'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  Table,
  Badge,
  ActionIcon,
  Center,
  Stack,
  Paper,
  Flex,
  Menu,
  Loader,
  Alert,
  Avatar,
  Select,
  Grid,
  Card,
  Tooltip,
  ThemeIcon,
  Modal,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { Plus } from '@phosphor-icons/react/dist/ssr/Plus';
import { DotsThreeVertical } from '@phosphor-icons/react/dist/ssr/DotsThreeVertical';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { ArrowsClockwise } from '@phosphor-icons/react/dist/ssr/ArrowsClockwise';
import { UserCircleMinus } from '@phosphor-icons/react/dist/ssr/UserCircleMinus';
import { UserCheck } from '@phosphor-icons/react/dist/ssr/UserCheck';
import { Trash } from '@phosphor-icons/react/dist/ssr/Trash';
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr/ShieldCheck';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { Envelope } from '@phosphor-icons/react/dist/ssr/Envelope';
import { Pause } from '@phosphor-icons/react/dist/ssr/Pause';
import { Play } from '@phosphor-icons/react/dist/ssr/Play';
import {
  managerAccountsService,
  ManagerAccount,
  ManagerAccountsResponse,
  InvitableManager,
} from '@/lib/services';
import { useDebounce } from '@/hooks/useApi';

export default function ComptesManagersPage() {
  // Data states
  const [accountsResponse, setAccountsResponse] = useState<ManagerAccountsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const debouncedSearch = useDebounce(search, 300);

  // Invite modal
  const [inviteModalOpened, setInviteModalOpened] = useState(false);
  const [invitableManagers, setInvitableManagers] = useState<InvitableManager[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);
  const [isLoadingInvitable, setIsLoadingInvitable] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // Suspend modal
  const [suspendModalOpened, setSuspendModalOpened] = useState(false);
  const [accountToSuspend, setAccountToSuspend] = useState<ManagerAccount | null>(null);
  const [isSuspending, setIsSuspending] = useState(false);

  // Revoke modal
  const [revokeModalOpened, setRevokeModalOpened] = useState(false);
  const [accountToRevoke, setAccountToRevoke] = useState<ManagerAccount | null>(null);
  const [revokeConfirmation, setRevokeConfirmation] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  // Load manager accounts
  const loadAccounts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await managerAccountsService.getManagerAccounts();
      setAccountsResponse(response);
    } catch (err: any) {
      console.error('Erreur lors du chargement des comptes managers:', err);
      setError(err.response?.data?.message || err.message || 'Erreur lors du chargement des comptes managers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // Load invitable managers when modal opens
  const handleOpenInviteModal = async () => {
    setInviteModalOpened(true);
    setSelectedManagerId(null);
    setIsLoadingInvitable(true);
    try {
      const managers = await managerAccountsService.getInvitableManagers();
      setInvitableManagers(managers);
    } catch (err: any) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger la liste des managers invitables',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsLoadingInvitable(false);
    }
  };

  // Invite manager
  const handleInvite = async () => {
    if (!selectedManagerId) return;
    setIsInviting(true);
    try {
      const result = await managerAccountsService.inviteManager({
        collaborateurId: parseInt(selectedManagerId),
      });
      notifications.show({
        title: 'Invitation envoyee',
        message: `Invitation envoyee a ${result.account.email}`,
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
      setInviteModalOpened(false);
      setSelectedManagerId(null);
      loadAccounts();
    } catch (err: any) {
      notifications.show({
        title: 'Erreur',
        message: err.response?.data?.message || 'Erreur lors de l\'envoi de l\'invitation',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsInviting(false);
    }
  };

  // Suspend / Reactivate
  const handleOpenSuspendModal = (account: ManagerAccount) => {
    setAccountToSuspend(account);
    setSuspendModalOpened(true);
  };

  const handleToggleSuspend = async () => {
    if (!accountToSuspend) return;
    setIsSuspending(true);
    try {
      if (accountToSuspend.statut === 'actif') {
        await managerAccountsService.suspendAccount(accountToSuspend.id);
        notifications.show({
          title: 'Compte suspendu',
          message: `Le compte de ${accountToSuspend.prenom} ${accountToSuspend.nom} a ete suspendu`,
          color: 'orange',
          icon: <Pause size={20} />,
        });
      } else {
        await managerAccountsService.reactivateAccount(accountToSuspend.id);
        notifications.show({
          title: 'Compte reactive',
          message: `Le compte de ${accountToSuspend.prenom} ${accountToSuspend.nom} a ete reactive`,
          color: 'green',
          icon: <Play size={20} />,
        });
      }
      setSuspendModalOpened(false);
      setAccountToSuspend(null);
      loadAccounts();
    } catch (err: any) {
      notifications.show({
        title: 'Erreur',
        message: err.response?.data?.message || 'Erreur lors de la modification du statut',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsSuspending(false);
    }
  };

  // Revoke
  const handleOpenRevokeModal = (account: ManagerAccount) => {
    setAccountToRevoke(account);
    setRevokeConfirmation('');
    setRevokeModalOpened(true);
  };

  const handleRevoke = async () => {
    if (!accountToRevoke) return;
    setIsRevoking(true);
    try {
      await managerAccountsService.revokeAccount(accountToRevoke.id);
      notifications.show({
        title: 'Compte revoque',
        message: `Le compte de ${accountToRevoke.prenom} ${accountToRevoke.nom} a ete definitivement supprime`,
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
      setRevokeModalOpened(false);
      setAccountToRevoke(null);
      setRevokeConfirmation('');
      loadAccounts();
    } catch (err: any) {
      notifications.show({
        title: 'Erreur',
        message: err.response?.data?.message || 'Erreur lors de la revocation du compte',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsRevoking(false);
    }
  };

  // Filter accounts
  const filteredAccounts = (accountsResponse?.data || []).filter((account) => {
    const matchesSearch =
      !debouncedSearch ||
      `${account.prenom} ${account.nom}`.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      account.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      account.collaborateur?.departement?.nomDepartement?.toLowerCase().includes(debouncedSearch.toLowerCase());

    const matchesStatus = !statusFilter || account.statut === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = accountsResponse?.stats || { total: 0, actifs: 0, suspendus: 0, invitationsEnAttente: 0 };

  // Status badge helper
  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'actif':
        return <Badge color="green" variant="light" size="sm">Actif</Badge>;
      case 'suspendu':
        return <Badge color="red" variant="light" size="sm">Suspendu</Badge>;
      case 'invitation_en_attente':
        return <Badge color="yellow" variant="light" size="sm">Invitation en attente</Badge>;
      default:
        return <Badge color="gray" variant="light" size="sm">{statut}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Selected invitable manager info
  const selectedInvitableManager = invitableManagers.find(
    (m) => m.id.toString() === selectedManagerId
  );

  const rows = filteredAccounts.map((account) => (
    <Table.Tr key={account.id}>
      <Table.Td>
        <Group gap="sm">
          <Avatar size={36} radius="xl" color="blue">
            {account.prenom?.[0]}{account.nom?.[0]}
          </Avatar>
          <div>
            <Text size="sm" fw={500}>
              {account.prenom} {account.nom}
            </Text>
            <Text size="xs" c="dimmed">{account.email}</Text>
          </div>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="sm">
          {account.collaborateur?.departement?.nomDepartement || '-'}
        </Text>
      </Table.Td>
      <Table.Td>{getStatusBadge(account.statut)}</Table.Td>
      <Table.Td>
        <Text size="sm">{formatDateTime(account.derniereConnexion)}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{formatDate(account.dateInvitation || account.dateCreation)}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" justify="flex-end">
          <Menu withinPortal position="bottom-end" shadow="sm">
            <Menu.Target>
              <ActionIcon variant="subtle">
                <DotsThreeVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {account.statut === 'actif' && (
                <Menu.Item
                  leftSection={<Pause size={14} />}
                  color="orange"
                  onClick={() => handleOpenSuspendModal(account)}
                >
                  Suspendre
                </Menu.Item>
              )}
              {account.statut === 'suspendu' && (
                <Menu.Item
                  leftSection={<Play size={14} />}
                  color="green"
                  onClick={() => handleOpenSuspendModal(account)}
                >
                  Reactiver
                </Menu.Item>
              )}
              <Menu.Divider />
              <Menu.Item
                leftSection={<Trash size={14} />}
                color="red"
                onClick={() => handleOpenRevokeModal(account)}
              >
                Revoquer
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl">
      {/* Header */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Flex justify="space-between" align="center" mb="md">
          <div>
            <Group align="center" gap="sm">
              <ShieldCheck size={32} color="#228BE6" weight="duotone" />
              <Title order={1}>Comptes managers</Title>
            </Group>
            <Text size="lg" c="dimmed" mt="xs">
              Gerez les comptes d'acces des managers au portail
            </Text>
          </div>
          <Group>
            <Tooltip label="Rafraichir">
              <ActionIcon variant="light" size="lg" onClick={loadAccounts}>
                <ArrowsClockwise size={20} />
              </ActionIcon>
            </Tooltip>
            <Button
              leftSection={<Plus size={16} />}
              onClick={handleOpenInviteModal}
            >
              Inviter un manager
            </Button>
          </Group>
        </Flex>

        {/* Stats cards */}
        <Grid mt="lg">
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total comptes</Text>
                  <Text size="xl" fw={700}>{stats.total}</Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                  <Users size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Actifs</Text>
                  <Text size="xl" fw={700} c="green">{stats.actifs}</Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="green">
                  <UserCheck size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Suspendus</Text>
                  <Text size="xl" fw={700} c="red">{stats.suspendus}</Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="red">
                  <UserCircleMinus size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>En attente</Text>
                  <Text size="xl" fw={700} c="yellow.7">{stats.invitationsEnAttente}</Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="yellow">
                  <Clock size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Filters */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Grid align="flex-end">
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <TextInput
              placeholder="Rechercher par nom, email, departement..."
              leftSection={<MagnifyingGlass size={16} />}
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              placeholder="Tous les statuts"
              data={[
                { value: '', label: 'Tous les statuts' },
                { value: 'actif', label: 'Actifs' },
                { value: 'suspendu', label: 'Suspendus' },
                { value: 'invitation_en_attente', label: 'Invitations en attente' },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || '')}
              clearable
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
        ) : filteredAccounts.length > 0 ? (
          <Table.ScrollContainer minWidth={800}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Manager</Table.Th>
                  <Table.Th>Departement</Table.Th>
                  <Table.Th>Statut</Table.Th>
                  <Table.Th>Derniere connexion</Table.Th>
                  <Table.Th>Date invitation</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        ) : (
          <Center py="xl">
            <Stack align="center">
              <ShieldCheck size={48} color="#868E96" />
              <Text size="lg" fw={500} c="dimmed">Aucun compte manager</Text>
              <Text size="sm" c="dimmed">
                Invitez un manager pour lui donner acces au portail
              </Text>
              <Button
                leftSection={<Plus size={16} />}
                onClick={handleOpenInviteModal}
                mt="md"
              >
                Inviter un manager
              </Button>
            </Stack>
          </Center>
        )}
      </Paper>

      {/* Invite Modal */}
      <Modal
        opened={inviteModalOpened}
        onClose={() => !isInviting && setInviteModalOpened(false)}
        title="Inviter un manager"
        centered
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Selectionnez un manager pour lui creer un compte d'acces au portail manager.
            Seuls les managers ayant des subordonnes et n'ayant pas encore de compte sont affiches.
          </Text>

          {isLoadingInvitable ? (
            <Center py="md">
              <Loader size="sm" />
            </Center>
          ) : (
            <Select
              label="Manager"
              placeholder="Rechercher un manager..."
              data={invitableManagers.map((m) => ({
                value: m.id.toString(),
                label: `${m.nomComplet} - ${m.departement?.nomDepartement || 'Sans departement'} (${m.nombreSubordonnes} subordonnes)`,
              }))}
              value={selectedManagerId}
              onChange={setSelectedManagerId}
              searchable
              clearable
              nothingFoundMessage="Aucun manager disponible"
            />
          )}

          {selectedInvitableManager && (
            <Paper p="md" withBorder radius="md" bg="blue.0">
              <Stack gap="xs">
                <Group gap="xs">
                  <Avatar size={40} radius="xl" color="blue">
                    {selectedInvitableManager.nomComplet?.split(' ').map((n) => n[0]).join('')}
                  </Avatar>
                  <div>
                    <Text size="sm" fw={600}>{selectedInvitableManager.nomComplet}</Text>
                    <Text size="xs" c="dimmed">{selectedInvitableManager.email || 'Pas d\'email'}</Text>
                  </div>
                </Group>
                <Group gap="lg">
                  <Group gap="xs">
                    <Users size={14} color="#868E96" />
                    <Text size="xs" c="dimmed">
                      {selectedInvitableManager.nombreSubordonnes} subordonnes
                    </Text>
                  </Group>
                  {selectedInvitableManager.departement && (
                    <Text size="xs" c="dimmed">
                      {selectedInvitableManager.departement.nomDepartement}
                    </Text>
                  )}
                </Group>
              </Stack>
            </Paper>
          )}

          {selectedInvitableManager && !selectedInvitableManager.email && (
            <Alert icon={<Warning size={16} />} color="orange" variant="light">
              <Text size="sm">
                Ce manager n'a pas d'adresse email renseignee. L'invitation ne pourra pas etre envoyee par email.
              </Text>
            </Alert>
          )}

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              color="gray"
              onClick={() => setInviteModalOpened(false)}
              disabled={isInviting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleInvite}
              loading={isInviting}
              disabled={!selectedManagerId}
              leftSection={<Envelope size={16} />}
            >
              Envoyer l'invitation
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Suspend/Reactivate Modal */}
      <Modal
        opened={suspendModalOpened}
        onClose={() => !isSuspending && setSuspendModalOpened(false)}
        title={accountToSuspend?.statut === 'actif' ? 'Suspendre le compte' : 'Reactiver le compte'}
        centered
      >
        <Stack gap="md">
          <Text>
            {accountToSuspend?.statut === 'actif'
              ? 'Etes-vous sur de vouloir suspendre le compte de '
              : 'Etes-vous sur de vouloir reactiver le compte de '}
            <Text span fw={600}>
              {accountToSuspend?.prenom} {accountToSuspend?.nom}
            </Text>
            {' ?'}
          </Text>

          {accountToSuspend?.statut === 'actif' ? (
            <Alert icon={<Warning size={20} />} color="orange" variant="light">
              <Text size="sm">
                Le manager ne pourra plus se connecter au portail tant que son compte sera suspendu.
                Vous pourrez reactiver le compte a tout moment.
              </Text>
            </Alert>
          ) : (
            <Alert icon={<CheckCircle size={20} />} color="green" variant="light">
              <Text size="sm">
                Le manager pourra de nouveau se connecter au portail.
              </Text>
            </Alert>
          )}

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              color="gray"
              onClick={() => setSuspendModalOpened(false)}
              disabled={isSuspending}
            >
              Annuler
            </Button>
            <Button
              color={accountToSuspend?.statut === 'actif' ? 'orange' : 'green'}
              onClick={handleToggleSuspend}
              loading={isSuspending}
              leftSection={
                accountToSuspend?.statut === 'actif'
                  ? <Pause size={16} />
                  : <Play size={16} />
              }
            >
              {accountToSuspend?.statut === 'actif' ? 'Suspendre' : 'Reactiver'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Revoke Modal */}
      <Modal
        opened={revokeModalOpened}
        onClose={() => !isRevoking && setRevokeModalOpened(false)}
        title="Revoquer le compte"
        centered
      >
        <Stack gap="md">
          <Text>
            Vous etes sur le point de revoquer definitivement le compte de{' '}
            <Text span fw={600}>
              {accountToRevoke?.prenom} {accountToRevoke?.nom}
            </Text>.
          </Text>

          <Alert icon={<Warning size={20} />} color="red" variant="light">
            <Text size="sm" fw={500}>
              Cette action est irreversible !
            </Text>
            <Text size="sm">
              Le manager devra etre reinvite pour obtenir un nouveau compte d'acces.
            </Text>
          </Alert>

          <TextInput
            label="Confirmation"
            description={`Tapez "REVOQUER" pour confirmer`}
            placeholder="REVOQUER"
            value={revokeConfirmation}
            onChange={(e) => setRevokeConfirmation(e.currentTarget.value)}
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              color="gray"
              onClick={() => setRevokeModalOpened(false)}
              disabled={isRevoking}
            >
              Annuler
            </Button>
            <Button
              color="red"
              onClick={handleRevoke}
              loading={isRevoking}
              disabled={revokeConfirmation !== 'REVOQUER'}
              leftSection={<Trash size={16} />}
            >
              Revoquer definitivement
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
