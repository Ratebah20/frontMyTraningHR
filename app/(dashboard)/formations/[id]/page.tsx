'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Card,
  Grid,
  Badge,
  Stack,
  Tabs,
  Paper,
  Center,
  Loader,
  Alert,
  Table,
  ActionIcon,
  Pagination,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  ArrowLeft,
  Clock,
  Users,
  Calendar,
  Tag,
  PencilSimple,
  Trash,
  Warning,
  CheckCircle,
  Plus,
  Eye,
} from '@phosphor-icons/react';
import { formationsService, sessionsService } from '@/lib/services';
import { Formation, SessionFormation } from '@/lib/types';
import { useApi, usePagination } from '@/hooks/useApi';

interface Props {
  params: {
    id: string;
  };
}

export default function FormationDetailPage({ params }: Props) {
  const router = useRouter();
  const [formation, setFormation] = useState<Formation | null>(null);
  const [sessions, setSessions] = useState<SessionFormation[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('overview');
  
  const { page, limit, total, setTotal, goToPage, totalPages } = usePagination(1, 10);
  
  // Charger la formation
  const { data: formationData, error: formationError, isLoading: loadingFormation } = useApi(
    () => formationsService.getFormation(parseInt(params.id)),
    { autoFetch: true }
  );
  
  // Charger les sessions de la formation
  const { data: sessionsData, error: sessionsError, isLoading: loadingSessions, execute: loadSessions } = useApi(
    () => formationsService.getFormationSessions(parseInt(params.id), page, limit)
  );
  
  useEffect(() => {
    if (formationData) {
      setFormation(formationData);
    }
  }, [formationData]);
  
  useEffect(() => {
    if (formation) {
      loadSessions();
    }
  }, [formation, page, limit]);
  
  useEffect(() => {
    if (sessionsData) {
      setSessions(sessionsData.data);
      setTotal(sessionsData.meta.total);
    }
  }, [sessionsData, setTotal]);
  
  const handleDelete = async () => {
    if (!formation) return;
    
    try {
      await formationsService.deleteFormation(formation.id);
      notifications.show({
        title: 'Succès',
        message: 'Formation supprimée avec succès',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
      router.push('/formations');
    } catch (error: any) {
      notifications.show({
        title: 'Erreur',
        message: error.response?.data?.message || 'Impossible de supprimer la formation',
        color: 'red',
        icon: <Warning size={20} />,
      });
    }
  };
  
  if (loadingFormation) {
    return (
      <Center h="100vh">
        <Loader size="lg" variant="bars" />
      </Center>
    );
  }
  
  if (formationError || !formation) {
    return (
      <Center h="100vh">
        <Stack align="center">
          <Warning size={48} color="gray" />
          <Text size="lg" c="dimmed">Formation non trouvée</Text>
          <Button onClick={() => router.back()}>Retour</Button>
        </Stack>
      </Center>
    );
  }

  return (
    <Container size="xl">
      <Group justify="space-between" mb="xl">
        <Group>
          <Button
            variant="subtle"
            leftSection={<ArrowLeft size={16} />}
            onClick={() => router.back()}
          >
            Retour
          </Button>
          <div>
            <Title order={1}>{formation.nomFormation}</Title>
            <Text size="lg" c="dimmed" mt="xs">Code: {formation.codeFormation}</Text>
          </div>
        </Group>
        <Button
          leftSection={<PencilSimple size={16} />}
          onClick={() => router.push(`/formations/${params.id}/edit`)}
        >
          Modifier
        </Button>
      </Group>

      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card shadow="sm" radius="md" withBorder mb="lg">
            <Stack gap="md">
              <Group gap="xs">
                <Tag size={20} weight="duotone" />
                <Text fw={500}>Catégorie:</Text>
                <Badge variant="light">
                  {typeof formation.categorie === 'string' 
                    ? formation.categorie 
                    : formation.categorie?.nomCategorie || 'Non catégorisé'}
                </Badge>
              </Group>

              <Group gap="xs">
                <Clock size={20} weight="duotone" />
                <Text fw={500}>Durée:</Text>
                <Text>{formation.duree} jours</Text>
              </Group>

              <div>
                <Text fw={500} mb="xs">Description:</Text>
                <Text c="dimmed">{formation.description}</Text>
              </div>
            </Stack>
          </Card>

          <Card shadow="sm" radius="md" withBorder>
            <Tabs defaultValue="sessions">
              <Tabs.List>
                <Tabs.Tab value="sessions" leftSection={<Calendar size={16} />}>
                  Sessions ({sessions.length})
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="sessions" pt="xl">
                {sessions.length === 0 ? (
                  <Center h={200}>
                    <Stack align="center">
                      <Calendar size={48} style={{ opacity: 0.5 }} />
                      <Text c="dimmed">Aucune session planifiée</Text>
                      <Button 
                        variant="light"
                        onClick={() => router.push('/sessions/new')}
                      >
                        Créer une session
                      </Button>
                    </Stack>
                  </Center>
                ) : (
                  <Stack gap="md">
                    {sessions.map((session) => (
                      <Paper key={session.id} p="md" withBorder>
                        <Group justify="space-between">
                          <div>
                            <Text fw={500}>Session #{session.id}</Text>
                            <Text size="sm" c="dimmed">
                              Du {session.date_debut} au {session.date_fin}
                            </Text>
                          </div>
                          <Badge color="blue">
                            {session.inscrits}/{session.places} inscrits
                          </Badge>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Tabs.Panel>
            </Tabs>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            <Card shadow="sm" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Sessions totales
                  </Text>
                  <Text size="xl" fw={700}>
                    {sessions.length}
                  </Text>
                </div>
                <Calendar size={32} style={{ opacity: 0.5 }} />
              </Group>
            </Card>

            <Card shadow="sm" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Participants totaux
                  </Text>
                  <Text size="xl" fw={700}>
                    {sessions.length}
                  </Text>
                </div>
                <Users size={32} style={{ opacity: 0.5 }} />
              </Group>
            </Card>
            
            <Card shadow="sm" radius="md" withBorder>
              <Stack gap="sm">
                <Text fw={500}>Actions</Text>
                <Button
                  fullWidth
                  variant="light"
                  leftSection={<Plus size={16} />}
                  onClick={() => router.push(`/sessions/new?formationId=${formation.id}`)}
                >
                  Créer une session
                </Button>
                <Button
                  fullWidth
                  variant="light"
                  color="red"
                  leftSection={<Trash size={16} />}
                  onClick={handleDelete}
                >
                  Supprimer la formation
                </Button>
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
}