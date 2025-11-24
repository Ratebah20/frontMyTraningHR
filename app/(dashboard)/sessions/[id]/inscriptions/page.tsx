'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Loader,
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
  Warning,
  CheckCircle,
} from '@phosphor-icons/react';
import { SessionsUnifiedService } from '@/lib/services/sessions-unified.service';
import CollectiveSessionsService from '@/lib/services/collective-sessions.service';
import { collaborateursService } from '@/lib/services';
import { Collaborateur } from '@/lib/types';

interface Props {
  params: {
    id: string;
  };
}

export default function SessionInscriptionsPage({ params }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = parseInt(params.id);

  // États
  const [session, setSession] = useState<any | null>(null);
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);
  const [existingParticipants, setExistingParticipants] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCollaborateurs, setSelectedCollaborateurs] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger la session
  const loadSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const typeHint = searchParams.get('type') as 'collective' | null;
      const sessionData = await SessionsUnifiedService.findOne(sessionId, typeHint || undefined);

      // Vérifier que c'est bien une session collective
      if (sessionData.type !== 'collective') {
        throw new Error('Cette page est réservée aux sessions collectives');
      }

      setSession(sessionData);

      // Récupérer les participants existants
      const participants = sessionData.participants || [];
      const participantIds = participants.map((p: any) => p.collaborateurId || p.collaborateur?.id).filter(Boolean);
      setExistingParticipants(participantIds);

    } catch (err: any) {
      console.error('Erreur lors du chargement de la session:', err);
      setError(err.message || 'Session non trouvée');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger tous les collaborateurs
  const loadCollaborateurs = async () => {
    try {
      const response = await collaborateursService.getCollaborateurs({
        page: 1,
        limit: 1000, // Charger tous les collaborateurs (actifs et inactifs)
        includeInactive: true, // Inclure les collaborateurs inactifs
      });
      setCollaborateurs(response.data || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des collaborateurs:', err);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger la liste des collaborateurs',
        color: 'red',
        icon: <Warning size={20} />,
      });
    }
  };

  useEffect(() => {
    loadSession();
    loadCollaborateurs();
  }, [sessionId]);

  const handleSelectAll = () => {
    const availableIds = filteredCollaborateurs
      .filter(c => !existingParticipants.includes(c.id))
      .map(c => c.id);
    setSelectedCollaborateurs(availableIds);
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

  const handleInscrire = async () => {
    if (selectedCollaborateurs.length === 0) {
      notifications.show({
        title: 'Aucune sélection',
        message: 'Veuillez sélectionner au moins un collaborateur',
        color: 'orange',
        icon: <Info size={20} />,
      });
      return;
    }

    // Vérifier la capacité
    if (session.capaciteMax) {
      const currentParticipants = existingParticipants.length;
      const placesDisponibles = session.capaciteMax - currentParticipants;

      if (selectedCollaborateurs.length > placesDisponibles) {
        notifications.show({
          title: 'Places insuffisantes',
          message: `Il ne reste que ${placesDisponibles} places disponibles`,
          color: 'red',
          icon: <Warning size={20} />,
        });
        return;
      }
    }

    try {
      setIsSubmitting(true);

      // Ajouter les participants via l'API
      await CollectiveSessionsService.addParticipantsBulk(sessionId, {
        collaborateurIds: selectedCollaborateurs,
      });

      notifications.show({
        title: 'Succès',
        message: `${selectedCollaborateurs.length} participant(s) ajouté(s) avec succès`,
        color: 'green',
        icon: <CheckCircle size={20} />,
      });

      // Retourner à la page de détail de la session
      router.push(`/sessions/${sessionId}?type=collective`);
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout des participants:', err);
      notifications.show({
        title: 'Erreur',
        message: err.message || 'Impossible d\'ajouter les participants',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrer les collaborateurs
  const filteredCollaborateurs = collaborateurs.filter(c =>
    search === '' ||
    c.nom?.toLowerCase().includes(search.toLowerCase()) ||
    c.prenom?.toLowerCase().includes(search.toLowerCase()) ||
    c.nomComplet?.toLowerCase().includes(search.toLowerCase())
  );

  // Affichage pendant le chargement
  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" variant="bars" />
      </Center>
    );
  }

  // Affichage en cas d'erreur
  if (error || !session) {
    return (
      <Center h="100vh">
        <Stack align="center">
          <Warning size={48} color="gray" />
          <Text size="lg" c="dimmed">{error || 'Session non trouvée'}</Text>
          <Button onClick={() => router.back()}>Retour</Button>
        </Stack>
      </Center>
    );
  }

  const placesDisponibles = session.capaciteMax
    ? session.capaciteMax - existingParticipants.length
    : Infinity;
  const isPlacesLimited = session.capaciteMax !== null && session.capaciteMax !== undefined;
  const isFull = isPlacesLimited && placesDisponibles <= 0;

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
          <Text size="lg" c="dimmed">{session.formation?.nomFormation || session.titre}</Text>
        </div>
      </Group>

      {/* Informations de la session */}
      <Card shadow="sm" radius="md" withBorder mb="xl">
        <Group justify="space-between">
          <Stack gap="xs">
            <Group gap="lg">
              <Group gap="xs">
                <Calendar size={16} />
                <Text size="sm">
                  {session.dateDebut ? new Date(session.dateDebut).toLocaleDateString('fr-FR') : 'Date non définie'}
                </Text>
              </Group>
              {session.modalite && (
                <Group gap="xs">
                  <MapPin size={16} />
                  <Text size="sm">
                    {session.modalite === 'presentiel' ? session.lieu || 'Présentiel' :
                     session.modalite === 'distanciel' ? 'Distanciel' : 'Hybride'}
                  </Text>
                </Group>
              )}
            </Group>
          </Stack>

          {isPlacesLimited && (
            <Paper p="md" radius="md" withBorder>
              <Stack gap="xs" align="center">
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Places disponibles
                </Text>
                <Text size="2xl" fw={700} c={isFull ? 'red' : placesDisponibles < 5 ? 'orange' : 'green'}>
                  {placesDisponibles} / {session.capaciteMax}
                </Text>
                <Progress
                  value={(existingParticipants.length / session.capaciteMax) * 100}
                  color={isFull ? 'red' : placesDisponibles < 5 ? 'orange' : 'blue'}
                  size="sm"
                  radius="xl"
                  w={120}
                />
              </Stack>
            </Paper>
          )}
        </Group>
      </Card>

      {isFull && (
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
                disabled={isFull}
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
                    checked={selectedCollaborateurs.length > 0 && selectedCollaborateurs.length === filteredCollaborateurs.filter(c => !existingParticipants.includes(c.id)).length}
                    indeterminate={selectedCollaborateurs.length > 0 && selectedCollaborateurs.length < filteredCollaborateurs.filter(c => !existingParticipants.includes(c.id)).length}
                    onChange={() => selectedCollaborateurs.length === filteredCollaborateurs.filter(c => !existingParticipants.includes(c.id)).length ? handleDeselectAll() : handleSelectAll()}
                    disabled={isFull}
                  />
                </Table.Th>
                <Table.Th>Collaborateur</Table.Th>
                <Table.Th>Département</Table.Th>
                <Table.Th>Statut</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredCollaborateurs.map((collaborateur) => {
                const isAlreadyParticipant = existingParticipants.includes(collaborateur.id);
                const isSelected = selectedCollaborateurs.includes(collaborateur.id);
                const canSelect = !isAlreadyParticipant && (!isFull || isSelected);

                return (
                  <Table.Tr
                    key={collaborateur.id}
                    style={{
                      opacity: canSelect ? 1 : 0.5,
                      cursor: canSelect ? 'pointer' : 'not-allowed',
                      backgroundColor: isAlreadyParticipant ? '#f0f0f0' : undefined,
                    }}
                    onClick={() => canSelect && handleToggleCollaborateur(collaborateur.id)}
                  >
                    <Table.Td>
                      {isAlreadyParticipant ? (
                        <Badge size="xs" color="gray">Déjà inscrit</Badge>
                      ) : (
                        <Checkbox
                          checked={isSelected}
                          onChange={() => {}}
                          disabled={!canSelect}
                        />
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar size="sm" color="blue">
                          {collaborateur.prenom?.[0]}{collaborateur.nom?.[0]}
                        </Avatar>
                        <Text fw={500}>{collaborateur.nomComplet || `${collaborateur.prenom} ${collaborateur.nom}`}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      {collaborateur.departement?.nomDepartement || 'Non défini'}
                    </Table.Td>
                    <Table.Td>
                      {isAlreadyParticipant ? (
                        <Badge color="green" size="sm">Inscrit</Badge>
                      ) : (
                        <Badge color="gray" variant="light" size="sm">Disponible</Badge>
                      )}
                    </Table.Td>
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
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              leftSection={<UserPlus size={16} />}
              onClick={handleInscrire}
              disabled={selectedCollaborateurs.length === 0 || isFull || isSubmitting}
              loading={isSubmitting}
            >
              Inscrire {selectedCollaborateurs.length} participant(s)
            </Button>
          </Group>
        </Stack>
      </Card>
    </Container>
  );
}
