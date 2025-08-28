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
  ThemeIcon,
  Progress,
  Divider,
  List,
  Tooltip,
  Modal,
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
  CurrencyEur,
  Buildings,
  GraduationCap,
  ChartBar,
  CalendarCheck,
  UserCheck,
  Hourglass,
  Timer,
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
  const [formation, setFormation] = useState<any>(null);
  const [sessions, setSessions] = useState<SessionFormation[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('overview');
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { page, limit, total, setTotal, goToPage, totalPages } = usePagination(1, 10);
  
  // Charger la formation avec toutes les infos détaillées
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
    
    setIsDeleting(true);
    try {
      await formationsService.deleteFormation(formation.id);
      notifications.show({
        title: 'Succès',
        message: 'Formation désactivée avec succès',
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
    } finally {
      setIsDeleting(false);
      setDeleteModalOpened(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatutColor = (statut: string) => {
    switch (statut?.toLowerCase()) {
      case 'termine':
      case 'complete':
        return 'green';
      case 'en_cours':
        return 'blue';
      case 'inscrit':
        return 'yellow';
      case 'annule':
        return 'red';
      default:
        return 'gray';
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
    <>
      {/* Modal de confirmation de suppression */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title="Confirmer la suppression"
        centered
      >
        <Stack>
          <Text>
            Êtes-vous sûr de vouloir supprimer la formation <strong>{formation?.nomFormation}</strong> ?
          </Text>
          {formation?.stats?.nombreSessions > 0 && (
            <Alert color="yellow" icon={<Warning size={20} />}>
              Cette formation a {formation.stats.nombreSessions} session(s) associée(s).
              La suppression sera logique (désactivation).
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
              Confirmer la suppression
            </Button>
          </Group>
        </Stack>
      </Modal>

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
            <Group gap="sm" mt="xs">
              <Text size="lg" c="dimmed">Code: {formation.codeFormation}</Text>
              {formation.actif ? (
                <Badge color="green" variant="light">Active</Badge>
              ) : (
                <Badge color="red" variant="light">Inactive</Badge>
              )}
            </Group>
          </div>
        </Group>
        <Group>
          <Button
            leftSection={<PencilSimple size={16} />}
            onClick={() => router.push(`/formations/${params.id}/edit`)}
          >
            Modifier
          </Button>
          <Button
            color="red"
            variant="outline"
            leftSection={<Trash size={16} />}
            onClick={() => setDeleteModalOpened(true)}
            disabled={formation?.stats?.sessionsEnCours > 0 || formation?.stats?.sessionsInscrites > 0}
          >
            Supprimer
          </Button>
        </Group>
      </Group>

      <Grid gutter="lg">
        {/* Colonne principale */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          {/* Informations générales */}
          <Card shadow="sm" radius="md" withBorder mb="lg">
            <Title order={3} mb="md">Informations générales</Title>
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

              {formation.typeFormation && (
                <Group gap="xs">
                  <GraduationCap size={20} weight="duotone" />
                  <Text fw={500}>Type:</Text>
                  <Text>{formation.typeFormation}</Text>
                </Group>
              )}

              <Group gap="xs">
                <Clock size={20} weight="duotone" />
                <Text fw={500}>Durée prévue:</Text>
                <Text>{formation.dureePrevue} {formation.uniteDuree || 'heures'}</Text>
              </Group>

              {formation.tarifHT && (
                <Group gap="xs">
                  <CurrencyEur size={20} weight="duotone" />
                  <Text fw={500}>Tarif standard HT:</Text>
                  <Text>{formatCurrency(formation.tarifHT)}</Text>
                </Group>
              )}

              {formation.stats?.premiereSession && (
                <Group gap="xs">
                  <Calendar size={20} weight="duotone" />
                  <Text fw={500}>Période:</Text>
                  <Text>
                    Du {formatDate(formation.stats.premiereSession)} au {formatDate(formation.stats.derniereSession)}
                  </Text>
                </Group>
              )}
            </Stack>
          </Card>

          {/* Statistiques détaillées */}
          <Card shadow="sm" radius="md" withBorder mb="lg">
            <Title order={3} mb="md">Statistiques</Title>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Stack gap="sm">
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      Taux de complétion
                    </Text>
                    <Group gap="xs" mt="xs">
                      <Progress value={formation.stats?.tauxCompletion || 0} size="lg" style={{ flex: 1 }} />
                      <Text fw={700}>{formation.stats?.tauxCompletion || 0}%</Text>
                    </Group>
                  </div>
                  
                  <Group justify="space-between">
                    <Text size="sm">Sessions terminées</Text>
                    <Badge color="green">{formation.stats?.sessionsTerminees || 0}</Badge>
                  </Group>
                  
                  <Group justify="space-between">
                    <Text size="sm">Sessions en cours</Text>
                    <Badge color="blue">{formation.stats?.sessionsEnCours || 0}</Badge>
                  </Group>
                  
                  <Group justify="space-between">
                    <Text size="sm">Sessions inscrites</Text>
                    <Badge color="yellow">{formation.stats?.sessionsInscrites || 0}</Badge>
                  </Group>
                </Stack>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Stack gap="sm">
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      Heures totales dispensées
                    </Text>
                    <Text size="xl" fw={700} mt="xs">
                      {formation.stats?.heuresTotales || 0} h
                    </Text>
                  </div>

                  <Divider />

                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      Investissement total
                    </Text>
                    <Text size="lg" fw={700} mt="xs">
                      {formatCurrency(formation.stats?.coutTotalHT || 0)} HT
                    </Text>
                    {formation.stats?.coutTotalTTC > 0 && (
                      <Text size="sm" c="dimmed">
                        {formatCurrency(formation.stats?.coutTotalTTC || 0)} TTC
                      </Text>
                    )}
                    {formation.stats?.fraisAnnexesTotal > 0 && (
                      <Text size="xs" c="dimmed">
                        + {formatCurrency(formation.stats?.fraisAnnexesTotal || 0)} de frais annexes
                      </Text>
                    )}
                  </div>
                </Stack>
              </Grid.Col>
            </Grid>
          </Card>

          {/* Organismes et départements */}
          {(formation.organismes?.length > 0 || formation.departementsConcernes?.length > 0) && (
            <Card shadow="sm" radius="md" withBorder mb="lg">
              <Title order={3} mb="md">Portée de la formation</Title>
              <Grid>
                {formation.organismes?.length > 0 && (
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Stack gap="xs">
                      <Group gap="xs">
                        <Buildings size={20} weight="duotone" />
                        <Text fw={500}>Organismes formateurs:</Text>
                      </Group>
                      <List size="sm">
                        {formation.organismes.map((org: any) => (
                          <List.Item key={org.id}>
                            {org.nomOrganisme}
                            {org.typeOrganisme && (
                              <Text span size="xs" c="dimmed"> ({org.typeOrganisme})</Text>
                            )}
                          </List.Item>
                        ))}
                      </List>
                    </Stack>
                  </Grid.Col>
                )}

                {formation.departementsConcernes?.length > 0 && (
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Stack gap="xs">
                      <Group gap="xs">
                        <Users size={20} weight="duotone" />
                        <Text fw={500}>Départements concernés:</Text>
                      </Group>
                      <Group gap="xs">
                        {formation.departementsConcernes.map((dept: string) => (
                          <Badge key={dept} variant="light">{dept}</Badge>
                        ))}
                      </Group>
                    </Stack>
                  </Grid.Col>
                )}
              </Grid>
            </Card>
          )}

          {/* Sessions récentes */}
          <Card shadow="sm" radius="md" withBorder>
            <Tabs defaultValue="sessions">
              <Tabs.List>
                <Tabs.Tab value="sessions" leftSection={<Calendar size={16} />}>
                  Sessions récentes
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="sessions" pt="xl">
                {formation.sessionsRecentes?.length === 0 ? (
                  <Center h={200}>
                    <Stack align="center">
                      <Calendar size={48} style={{ opacity: 0.5 }} />
                      <Text c="dimmed">Aucune session récente</Text>
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
                    {formation.sessionsRecentes?.map((session: any) => (
                      <Paper key={session.id} p="md" withBorder>
                        <Group justify="space-between">
                          <div>
                            <Group gap="sm">
                              <Text fw={500}>{session.collaborateur.nomComplet}</Text>
                              <Badge size="sm" variant="light">
                                {session.collaborateur.departement}
                              </Badge>
                            </Group>
                            <Group gap="xs" mt="xs">
                              <Text size="sm" c="dimmed">
                                Du {formatDate(session.dateDebut)} au {formatDate(session.dateFin)}
                              </Text>
                              <Text size="sm" c="dimmed">•</Text>
                              <Text size="sm" c="dimmed">
                                {session.organisme}
                              </Text>
                              {session.tarifHT && (
                                <>
                                  <Text size="sm" c="dimmed">•</Text>
                                  <Text size="sm" c="dimmed">
                                    {formatCurrency(session.tarifHT)}
                                  </Text>
                                </>
                              )}
                            </Group>
                          </div>
                          <Badge color={getStatutColor(session.statut)}>
                            {session.statut}
                          </Badge>
                        </Group>
                      </Paper>
                    ))}
                    {total > formation.sessionsRecentes?.length && (
                      <Button 
                        variant="subtle" 
                        onClick={() => router.push(`/formations/${params.id}/sessions`)}
                      >
                        Voir toutes les {total} sessions
                      </Button>
                    )}
                  </Stack>
                )}
              </Tabs.Panel>
            </Tabs>
          </Card>
        </Grid.Col>

        {/* Colonne latérale */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            {/* Statistiques rapides */}
            <Card shadow="sm" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Sessions totales
                  </Text>
                  <Text size="xl" fw={700}>
                    {formation.stats?.nombreSessions || 0}
                  </Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                  <Calendar size={20} />
                </ThemeIcon>
              </Group>
            </Card>

            <Card shadow="sm" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Participants uniques
                  </Text>
                  <Text size="xl" fw={700}>
                    {formation.stats?.nombreParticipants || 0}
                  </Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="green">
                  <Users size={20} />
                </ThemeIcon>
              </Group>
            </Card>

            {formation.stats?.budgetImpute > 0 && (
              <Card shadow="sm" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      Budget imputé
                    </Text>
                    <Text size="xl" fw={700}>
                      {formation.stats?.budgetImpute || 0}
                    </Text>
                    <Text size="xs" c="dimmed">
                      sessions
                    </Text>
                  </div>
                  <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                    <CurrencyEur size={20} />
                  </ThemeIcon>
                </Group>
              </Card>
            )}
            
            {/* Actions */}
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
                  leftSection={<Eye size={16} />}
                  onClick={() => router.push(`/formations/${params.id}/sessions`)}
                >
                  Voir toutes les sessions
                </Button>
                <Divider />
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
    </>
  );
}