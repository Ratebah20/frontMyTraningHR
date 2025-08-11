'use client';

import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Table,
  Badge,
  Group,
  Button,
  TextInput,
  Stack,
  Modal,
  Select,
  Alert,
  Tabs,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  MagnifyingGlass, 
  UserPlus, 
  Info,
  CheckCircle,
  Clock,
  X,
} from '@phosphor-icons/react';
import { notifications } from '@mantine/notifications';
import { mockData } from '@/lib/mock-data';

export default function SessionsInscriptionsPage() {
  const [search, setSearch] = useState('');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedCollaborateur, setSelectedCollaborateur] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [activeTab, setActiveTab] = useState<string | null>('pending');

  // Mock inscriptions
  const mockInscriptions = [
    {
      id: 1,
      collaborateur: mockData.collaborateurs[0],
      session: { ...mockData.sessions[0], formation: mockData.formations[0] },
      status: 'pending',
      date: '2024-01-10'
    },
    {
      id: 2,
      collaborateur: mockData.collaborateurs[1],
      session: { ...mockData.sessions[1], formation: mockData.formations[1] },
      status: 'confirmed',
      date: '2024-01-08'
    },
    {
      id: 3,
      collaborateur: mockData.collaborateurs[2],
      session: { ...mockData.sessions[2], formation: mockData.formations[2] },
      status: 'completed',
      date: '2024-01-05'
    }
  ];

  const pendingInscriptions = mockInscriptions.filter(i => i.status === 'pending');
  const confirmedInscriptions = mockInscriptions.filter(i => i.status === 'confirmed');
  const completedInscriptions = mockInscriptions.filter(i => i.status === 'completed');

  const handleInscription = () => {
    if (!selectedSession || !selectedCollaborateur) {
      notifications.show({
        title: 'Erreur',
        message: 'Veuillez sélectionner une session et un collaborateur',
        color: 'red',
      });
      return;
    }

    notifications.show({
      title: 'Inscription enregistrée',
      message: 'Le collaborateur a été inscrit à la session',
      color: 'green',
      icon: <CheckCircle size={20} />,
    });
    
    close();
    setSelectedSession(null);
    setSelectedCollaborateur(null);
  };

  const handleValidate = (inscription: any) => {
    notifications.show({
      title: 'Inscription validée',
      message: 'L\'inscription a été approuvée',
      color: 'green',
    });
  };

  const sessionOptions = mockData.sessions.map(s => {
    const formation = mockData.formations.find(f => f.id === s.formation_id);
    return {
      value: s.id.toString(),
      label: `${formation?.titre || 'Formation'} - ${s.date_debut}`,
    };
  });

  const collaborateurOptions = mockData.collaborateurs.map(c => ({
    value: c.id.toString(),
    label: `${c.nom} ${c.prenom} (${c.service})`,
  }));

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={2}>Gestion des inscriptions</Title>
            <Text c="dimmed" size="sm">
              Gérez les inscriptions aux sessions de formation
            </Text>
          </div>
          <Button leftSection={<UserPlus size={20} />} onClick={open}>
            Nouvelle inscription
          </Button>
        </Group>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="pending" leftSection={<Clock size={16} />}>
              En attente ({pendingInscriptions.length})
            </Tabs.Tab>
            <Tabs.Tab value="confirmed" leftSection={<CheckCircle size={16} />}>
              Confirmées ({confirmedInscriptions.length})
            </Tabs.Tab>
            <Tabs.Tab value="completed" leftSection={<CheckCircle size={16} />}>
              Terminées ({completedInscriptions.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="pending" pt="xl">
            <Stack gap="md">
              <TextInput
                placeholder="Rechercher une inscription..."
                leftSection={<MagnifyingGlass size={16} />}
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
              />

              <Card shadow="sm" p={0} radius="md" withBorder>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Collaborateur</Table.Th>
                      <Table.Th>Formation</Table.Th>
                      <Table.Th>Session</Table.Th>
                      <Table.Th>Date demande</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pendingInscriptions.map((inscription) => (
                      <Table.Tr key={inscription.id}>
                        <Table.Td>
                          {inscription.collaborateur.nom} {inscription.collaborateur.prenom}
                        </Table.Td>
                        <Table.Td>
                          {inscription.session.formation.titre}
                        </Table.Td>
                        <Table.Td>
                          {inscription.session.date_debut}
                        </Table.Td>
                        <Table.Td>
                          {inscription.date}
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Button 
                              size="xs" 
                              color="green" 
                              variant="light"
                              onClick={() => handleValidate(inscription)}
                            >
                              Approuver
                            </Button>
                            <Button 
                              size="xs" 
                              color="red" 
                              variant="light"
                            >
                              Refuser
                            </Button>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>

                {pendingInscriptions.length === 0 && (
                  <Text ta="center" p="xl" c="dimmed">
                    Aucune inscription en attente
                  </Text>
                )}
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="confirmed" pt="xl">
            <Card shadow="sm" p={0} radius="md" withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Collaborateur</Table.Th>
                    <Table.Th>Formation</Table.Th>
                    <Table.Th>Session</Table.Th>
                    <Table.Th>Date inscription</Table.Th>
                    <Table.Th>Statut</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {confirmedInscriptions.map((inscription) => (
                    <Table.Tr key={inscription.id}>
                      <Table.Td>
                        {inscription.collaborateur.nom} {inscription.collaborateur.prenom}
                      </Table.Td>
                      <Table.Td>
                        {inscription.session.formation.titre}
                      </Table.Td>
                      <Table.Td>
                        {inscription.session.date_debut}
                      </Table.Td>
                      <Table.Td>
                        {inscription.date}
                      </Table.Td>
                      <Table.Td>
                        <Badge color="green" variant="light">
                          Confirmée
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="completed" pt="xl">
            <Card shadow="sm" p={0} radius="md" withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Collaborateur</Table.Th>
                    <Table.Th>Formation</Table.Th>
                    <Table.Th>Session</Table.Th>
                    <Table.Th>Date inscription</Table.Th>
                    <Table.Th>Statut</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {completedInscriptions.map((inscription) => (
                    <Table.Tr key={inscription.id}>
                      <Table.Td>
                        {inscription.collaborateur.nom} {inscription.collaborateur.prenom}
                      </Table.Td>
                      <Table.Td>
                        {inscription.session.formation.titre}
                      </Table.Td>
                      <Table.Td>
                        {inscription.session.date_debut}
                      </Table.Td>
                      <Table.Td>
                        {inscription.date}
                      </Table.Td>
                      <Table.Td>
                        <Badge color="blue" variant="light">
                          Terminée
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      <Modal
        opened={opened}
        onClose={close}
        title="Nouvelle inscription"
        size="lg"
      >
        <Stack gap="md">
          <Select
            label="Session de formation"
            placeholder="Sélectionner une session"
            data={sessionOptions}
            value={selectedSession}
            onChange={setSelectedSession}
            searchable
            required
          />

          <Select
            label="Collaborateur"
            placeholder="Sélectionner un collaborateur"
            data={collaborateurOptions}
            value={selectedCollaborateur}
            onChange={setSelectedCollaborateur}
            searchable
            required
          />

          {selectedSession && (
            <Alert
              icon={<Info size={16} />}
              color="blue"
              variant="light"
            >
              Places disponibles : 5/10
            </Alert>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={close}>
              Annuler
            </Button>
            <Button onClick={handleInscription}>
              Inscrire
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}