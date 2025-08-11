'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Card,
  Table,
  Checkbox,
  TextInput,
  Badge,
  Stack,
  Flex,
  Center,
  Avatar,
  Paper,
  Progress,
  Alert,
  Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  ArrowLeft,
  MagnifyingGlass,
  UserPlus,
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Info,
} from '@phosphor-icons/react';
import { mockData } from '@/lib/mock-data';

interface Props {
  params: {
    id: string;
  };
}

export default function SessionInscriptionsPage({ params }: Props) {
  const router = useRouter();
  const sessionId = parseInt(params.id);

  // États
  const [search, setSearch] = useState('');
  const [selectedCollaborateurs, setSelectedCollaborateurs] = useState<number[]>([]);

  // Mock session data
  const session = mockData.sessions.find(s => s.id === sessionId);
  const formation = session ? mockData.formations.find(f => f.id === session.formation_id) : null;
  
  if (!session || !formation) {
    return (
      <Center h="100vh">
        <Stack align="center">
          <Text size="lg" c="dimmed">Session non trouvée</Text>
          <Button onClick={() => router.back()}>Retour</Button>
        </Stack>
      </Center>
    );
  }

  const placesDisponibles = session.places - session.inscrits;

  const handleSelectAll = () => {
    setSelectedCollaborateurs(mockData.collaborateurs.map(c => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedCollaborateurs([]);
  };

  const handleToggleCollaborateur = (id: number) => {
    setSelectedCollaborateurs(prev =>
      prev.includes(id)
        ? prev.filter(cId => cId !== id)
        : [...prev, id]
    );
  };

  const handleInscrire = () => {
    if (selectedCollaborateurs.length === 0) {
      notifications.show({
        title: 'Aucune sélection',
        message: 'Veuillez sélectionner au moins un collaborateur',
        color: 'orange',
      });
      return;
    }

    if (selectedCollaborateurs.length > placesDisponibles) {
      notifications.show({
        title: 'Places insuffisantes',
        message: `Il ne reste que ${placesDisponibles} places disponibles`,
        color: 'red',
      });
      return;
    }

    notifications.show({
      title: 'Inscriptions réussies',
      message: `${selectedCollaborateurs.length} collaborateur(s) inscrit(s) à la session`,
      color: 'green',
    });
    
    router.push(`/sessions/${sessionId}`);
  };

  const filteredCollaborateurs = mockData.collaborateurs.filter(c =>
    search === '' || 
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.prenom.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container size="xl">
      <Group mb="xl">
        <Button
          variant="subtle"
          leftSection={<ArrowLeft size={16} />}
          onClick={() => router.back()}
        >
          Retour
        </Button>
        <div>
          <Title order={1}>Gérer les inscriptions</Title>
          <Text size="lg" c="dimmed">{formation.titre}</Text>
        </div>
      </Group>

      {/* Informations de la session */}
      <Card shadow="sm" radius="md" withBorder mb="xl">
        <Group justify="space-between">
          <Stack gap="xs">
            <Group gap="lg">
              <Group gap="xs">
                <Calendar size={16} />
                <Text size="sm">{session.date_debut}</Text>
              </Group>
              <Group gap="xs">
                <Clock size={16} />
                <Text size="sm">09:00 - 17:00</Text>
              </Group>
              <Group gap="xs">
                <MapPin size={16} />
                <Text size="sm">Paris</Text>
              </Group>
            </Group>
          </Stack>
          
          <Paper p="md" radius="md" withBorder>
            <Stack gap="xs" align="center">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Places disponibles
              </Text>
              <Text size="2xl" fw={700} c={placesDisponibles === 0 ? 'red' : 'green'}>
                {placesDisponibles} / {session.places}
              </Text>
              <Progress
                value={(session.inscrits / session.places) * 100}
                color={placesDisponibles === 0 ? 'red' : 'blue'}
                size="sm"
                radius="xl"
                w={120}
              />
            </Stack>
          </Paper>
        </Group>
      </Card>

      {placesDisponibles === 0 && (
        <Alert
          icon={<Info size={20} />}
          title="Session complète"
          color="red"
          variant="light"
          mb="xl"
        >
          Cette session est complète. Vous ne pouvez plus ajouter de participants.
        </Alert>
      )}

      {/* Liste des collaborateurs */}
      <Card shadow="sm" radius="md" withBorder>
        <Stack gap="md">
          <Flex justify="space-between" align="center">
            <Title order={3}>Sélectionner les participants</Title>
            <Badge size="lg" variant="light">
              {selectedCollaborateurs.length} sélectionné(s)
            </Badge>
          </Flex>

          <TextInput
            placeholder="Rechercher un collaborateur..."
            leftSection={<MagnifyingGlass size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />

          <Group justify="space-between">
            <Group>
              <Button
                variant="subtle"
                size="xs"
                onClick={handleSelectAll}
                disabled={placesDisponibles === 0}
              >
                Tout sélectionner
              </Button>
              <Button
                variant="subtle"
                size="xs"
                onClick={handleDeselectAll}
              >
                Tout désélectionner
              </Button>
            </Group>
            <Text size="sm" c="dimmed">
              {filteredCollaborateurs.length} collaborateurs trouvés
            </Text>
          </Group>

          <Divider />

          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 40 }}>
                  <Checkbox
                    checked={selectedCollaborateurs.length === filteredCollaborateurs.length && filteredCollaborateurs.length > 0}
                    indeterminate={selectedCollaborateurs.length > 0 && selectedCollaborateurs.length < filteredCollaborateurs.length}
                    onChange={() => selectedCollaborateurs.length === filteredCollaborateurs.length ? handleDeselectAll() : handleSelectAll()}
                    disabled={placesDisponibles === 0}
                  />
                </Table.Th>
                <Table.Th>Collaborateur</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Service</Table.Th>
                <Table.Th>Rôle</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredCollaborateurs.map((collaborateur) => {
                const isSelected = selectedCollaborateurs.includes(collaborateur.id);
                const canSelect = placesDisponibles > 0 || isSelected;

                return (
                  <Table.Tr
                    key={collaborateur.id}
                    style={{ 
                      opacity: canSelect ? 1 : 0.5,
                      cursor: canSelect ? 'pointer' : 'not-allowed'
                    }}
                    onClick={() => canSelect && handleToggleCollaborateur(collaborateur.id)}
                  >
                    <Table.Td>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => {}}
                        disabled={!canSelect}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar size="sm">
                          {collaborateur.prenom[0]}{collaborateur.nom[0]}
                        </Avatar>
                        <Text fw={500}>{collaborateur.prenom} {collaborateur.nom}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>{collaborateur.email}</Table.Td>
                    <Table.Td>{collaborateur.service}</Table.Td>
                    <Table.Td>{collaborateur.role}</Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>

          {filteredCollaborateurs.length === 0 && (
            <Center h={200}>
              <Stack align="center">
                <Users size={48} style={{ opacity: 0.5 }} />
                <Text c="dimmed">Aucun collaborateur trouvé</Text>
              </Stack>
            </Center>
          )}

          <Divider />

          <Group justify="space-between">
            <Button
              variant="subtle"
              leftSection={<X size={16} />}
              onClick={() => router.back()}
            >
              Annuler
            </Button>
            <Button
              leftSection={<UserPlus size={16} />}
              onClick={handleInscrire}
              disabled={selectedCollaborateurs.length === 0 || placesDisponibles === 0}
            >
              Inscrire {selectedCollaborateurs.length} participant(s)
            </Button>
          </Group>
        </Stack>
      </Card>
    </Container>
  );
}