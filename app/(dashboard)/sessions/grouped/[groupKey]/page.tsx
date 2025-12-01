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
  Stack,
  Paper,
  Grid,
  Avatar,
  ActionIcon,
  Center,
  Loader,
  Alert,
  ThemeIcon,
  Divider,
  Tabs,
} from '@mantine/core';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  Building,
  Users,
  Eye,
  PencilSimple,
  XCircle,
  CalendarCheck,
  Hourglass,
  Certificate,
  CalendarX,
  Warning,
  ListChecks,
  CurrencyDollar,
} from '@phosphor-icons/react';
import { notifications } from '@mantine/notifications';
import { sessionsService } from '@/lib/services';
import { GroupedSession } from '@/lib/types';
import { TodoList } from '@/components/session-todos/TodoList';
import { DocumentGenerator } from '@/components/documents';

interface Props {
  params: {
    groupKey: string;
  };
}

const statusColors: Record<string, string> = {
  'inscrit': 'blue',
  'INSCRIT': 'blue',
  'en_cours': 'yellow',
  'EN_COURS': 'yellow',
  'complete': 'green',
  'TERMINE': 'green',
  'COMPLETE': 'green',
  'annule': 'red',
  'ANNULE': 'red',
};

const statusIcons: Record<string, any> = {
  'inscrit': CalendarCheck,
  'INSCRIT': CalendarCheck,
  'en_cours': Hourglass,
  'EN_COURS': Hourglass,
  'complete': Certificate,
  'TERMINE': Certificate,
  'COMPLETE': Certificate,
  'annule': CalendarX,
  'ANNULE': CalendarX,
};

export default function GroupedSessionDetailPage({ params }: Props) {
  const router = useRouter();
  const [session, setSession] = useState<GroupedSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSession();
  }, [params.groupKey]);

  const loadSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const groupKey = decodeURIComponent(params.groupKey);

      // Récupérer directement la session groupée par son groupKey
      const data = await sessionsService.getGroupedSessionByKey(groupKey);
      
      // Si une seule session, rediriger vers la page de détail
      if (data.participants && data.participants.length === 1) {
        const sessionId = data.participants[0].sessionId;
        router.replace(`/sessions/${sessionId}`);
        return;
      }

      setSession(data);
    } catch (err: any) {
      console.error('Erreur lors du chargement de la session:', err);
      setError(err.response?.data?.message || err.message || 'Session non trouvée');
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewCollaborateur = (collaborateurId: number) => {
    router.push(`/collaborateurs/${collaborateurId}`);
  };

  const handleEditSession = (sessionId: number) => {
    router.push(`/sessions/${sessionId}/edit`);
  };

  const handleCancelSession = async (sessionId: number, collaborateurNom: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir annuler l'inscription de ${collaborateurNom} ?`)) {
      return;
    }

    try {
      await sessionsService.cancelSession(sessionId);
      notifications.show({
        title: 'Succès',
        message: 'Inscription annulée avec succès',
        color: 'green',
      });
      loadSession();
    } catch (err: any) {
      notifications.show({
        title: 'Erreur',
        message: err.message || 'Erreur lors de l\'annulation',
        color: 'red',
      });
    }
  };

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" variant="bars" />
      </Center>
    );
  }

  if (error || !session) {
    return (
      <Container size="xl">
        <Alert icon={<Warning size={20} />} color="red" variant="light" mt="xl">
          {error || 'Session non trouvée'}
        </Alert>
        <Group mt="xl">
          <Button
            leftSection={<ArrowLeft size={16} />}
            onClick={() => router.back()}
          >
            Retour aux sessions
          </Button>
        </Group>
      </Container>
    );
  }

  return (
    <Container size="xl">
      {/* Header */}
      <Group mb="xl">
        <Button
          variant="subtle"
          leftSection={<ArrowLeft size={16} />}
          onClick={() => router.back()}
        >
          Retour
        </Button>
      </Group>

      {/* Info Formation */}
      <Paper shadow="xs" p="xl" radius="md" mb="xl">
        <Group align="start" justify="space-between" mb="md">
          <div style={{ flex: 1 }}>
            <Group mb="sm">
              <BookOpen size={32} color="#228BE6" />
              <div>
                <Title order={1}>{session.formationNom}</Title>
                <Text size="sm" c="dimmed">
                  Code: {session.formationCode}
                </Text>
              </div>
            </Group>

            {session.categorie && (
              <Badge variant="light" size="lg" mb="md">
                {session.categorie}
              </Badge>
            )}
          </div>

          <Group gap="sm">
            <DocumentGenerator session={session} sessionType="grouped" variant="button" />
            <Button
              variant="light"
              onClick={() => router.push(`/formations/${session.formationId}`)}
            >
              Voir la formation
            </Button>
          </Group>
        </Group>

        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group gap="sm">
                <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                  <Users size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Participants
                  </Text>
                  <Text size="xl" fw={700}>
                    {session.stats.total}
                  </Text>
                </div>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group gap="sm">
                <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                  <CalendarCheck size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Inscrits
                  </Text>
                  <Text size="xl" fw={700} c="blue">
                    {session.stats.inscrit}
                  </Text>
                </div>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group gap="sm">
                <ThemeIcon size="lg" radius="md" variant="light" color="yellow">
                  <Hourglass size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    En cours
                  </Text>
                  <Text size="xl" fw={700} c="yellow">
                    {session.stats.enCours}
                  </Text>
                </div>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group gap="sm">
                <ThemeIcon size="lg" radius="md" variant="light" color="green">
                  <Certificate size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Terminés
                  </Text>
                  <Text size="xl" fw={700} c="green">
                    {session.stats.complete}
                  </Text>
                </div>
              </Group>
            </Paper>
          </Grid.Col>
        </Grid>

        <Divider my="lg" />

        <Grid>
          {(session.dateDebut || session.dateFin) && (
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Group gap="xs">
                <Calendar size={20} color="#868E96" />
                <div>
                  <Text size="xs" c="dimmed">Dates</Text>
                  <Text size="sm" fw={500}>
                    {session.dateDebut
                      ? `Du ${new Date(session.dateDebut).toLocaleDateString('fr-FR')}`
                      : 'Date non définie'}
                    {session.dateFin && ` au ${new Date(session.dateFin).toLocaleDateString('fr-FR')}`}
                  </Text>
                </div>
              </Group>
            </Grid.Col>
          )}

          {session.dureeHeures && (
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Group gap="xs">
                <Clock size={20} color="#868E96" />
                <div>
                  <Text size="xs" c="dimmed">Durée</Text>
                  <Text size="sm" fw={500}>
                    {session.dureeHeures} heures
                  </Text>
                </div>
              </Group>
            </Grid.Col>
          )}

          {session.organisme && (
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Group gap="xs">
                <Building size={20} color="#868E96" />
                <div>
                  <Text size="xs" c="dimmed">Organisme</Text>
                  <Text size="sm" fw={500}>
                    {session.organisme}
                  </Text>
                </div>
              </Group>
            </Grid.Col>
          )}

          {session.anneeBudgetaire && (
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Group gap="xs">
                <Calendar size={20} color="#228BE6" />
                <div>
                  <Text size="xs" c="dimmed">Année budgétaire</Text>
                  <Text size="sm" fw={500}>
                    {session.anneeBudgetaire}
                  </Text>
                </div>
              </Group>
            </Grid.Col>
          )}
        </Grid>

        {/* Informations budgétaires */}
        {(session.tarifHT || session.coutTotal) && (
          <>
            <Divider my="lg" />
            <Group mb="md">
              <ThemeIcon size="lg" radius="md" variant="light" color="green">
                <CurrencyDollar size={20} />
              </ThemeIcon>
              <Text fw={600} size="lg">Informations budgétaires</Text>
            </Group>
            <Grid>
              {session.tarifHT && (
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <Paper withBorder p="md" radius="md">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Tarif HT / participant</Text>
                    <Text size="xl" fw={700} c="blue">
                      {Number(session.tarifHT).toLocaleString('fr-FR')} €
                    </Text>
                  </Paper>
                </Grid.Col>
              )}
              {session.coutTotal && (
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <Paper withBorder p="md" radius="md">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Coût total estimé</Text>
                    <Text size="xl" fw={700} c="green">
                      {Number(session.coutTotal).toLocaleString('fr-FR')} €
                    </Text>
                    <Text size="xs" c="dimmed">
                      ({session.stats.total} participant{session.stats.total > 1 ? 's' : ''} × {Number(session.tarifHT || 0).toLocaleString('fr-FR')} €)
                    </Text>
                  </Paper>
                </Grid.Col>
              )}
            </Grid>
          </>
        )}
      </Paper>

      {/* Tabs: Participants et Checklist */}
      <Paper shadow="xs" p="xl" radius="md">
        <Tabs defaultValue="participants">
          <Tabs.List>
            <Tabs.Tab value="participants" leftSection={<Users size={16} />}>
              Participants ({session.participants.length})
            </Tabs.Tab>
            <Tabs.Tab value="checklist" leftSection={<ListChecks size={16} />}>
              Checklist de préparation
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="participants" pt="xl">
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Collaborateur</Table.Th>
                  <Table.Th>Département</Table.Th>
                  <Table.Th>Statut</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {session.participants.map((participant) => {
                  const StatusIcon = statusIcons[participant.statut] || CalendarCheck;
                  const statusColor = statusColors[participant.statut] || 'gray';

                  return (
                    <Table.Tr key={participant.sessionId}>
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar size="sm" radius="xl" color="blue">
                            {participant.prenom[0]}{participant.nom[0]}
                          </Avatar>
                          <div>
                            <Text size="sm" fw={500}>
                              {participant.prenom} {participant.nom}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {participant.email}
                            </Text>
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{participant.departement}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          leftSection={<StatusIcon size={12} />}
                          color={statusColor}
                          variant="light"
                        >
                          {participant.statut}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" justify="flex-end">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => handleViewCollaborateur(participant.collaborateurId)}
                          >
                            <Eye size={18} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            onClick={() => handleEditSession(participant.sessionId)}
                          >
                            <PencilSimple size={18} />
                          </ActionIcon>
                          {participant.statut !== 'annule' && participant.statut !== 'ANNULE' && (
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() =>
                                handleCancelSession(
                                  participant.sessionId,
                                  `${participant.prenom} ${participant.nom}`
                                )
                              }
                            >
                              <XCircle size={18} />
                            </ActionIcon>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>

            {session.participants.length === 0 && (
              <Center h={200}>
                <Stack align="center">
                  <Users size={48} style={{ opacity: 0.5 }} />
                  <Text c="dimmed">Aucun participant</Text>
                </Stack>
              </Center>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="checklist" pt="xl">
            <TodoList groupKey={session.groupKey} typeFormation={session.typeFormation} />
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Container>
  );
}
