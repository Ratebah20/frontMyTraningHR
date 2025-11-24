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
  Certificate,
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

  const handleViewSession = (groupedSession: any) => {
    const sessions = groupedSession.sessions;
    if (sessions && sessions.length > 0) {
      const firstSession = sessions[0];
      // Déterminer le type de session et naviguer vers la bonne route
      if (firstSession.type === 'collective') {
        router.push(`/sessions/${firstSession.id}?type=collective`);
      } else {
        // Pour les sessions individuelles, utiliser la route groupée
        router.push(`/sessions/grouped/${encodeURIComponent(groupedSession.key)}`);
      }
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
          <Button onClick={() => router.push('/formations')}>Retour</Button>
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
            onClick={() => router.push('/formations')}
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

              <Group gap="xs">
                <Certificate size={20} weight="duotone" />
                <Text fw={500}>Formation certifiante:</Text>
                <Badge
                  color={formation.estCertifiante ? 'green' : 'gray'}
                  variant="light"
                >
                  {formation.estCertifiante ? 'Oui' : 'Non'}
                </Badge>
              </Group>

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
                    {/* Grouper les sessions par date/organisme */}
                    {(() => {
                      // Grouper les sessions récentes
                      const groupedSessions = new Map<string, any[]>();

                      // Fonction pour formater la date au format YYYY-MM-DD
                      const formatDateForKey = (date: string | null) => {
                        if (!date) return 'null';
                        try {
                          return new Date(date).toISOString().split('T')[0];
                        } catch {
                          return 'null';
                        }
                      };

                      formation.sessionsRecentes?.forEach((session: any) => {
                        const dateDebutStr = formatDateForKey(session.dateDebut);
                        const dateFinStr = formatDateForKey(session.dateFin);
                        // Le groupKey doit correspondre au format backend: formationId_dateDebut_dateFin
                        const key = `${formation.id}_${dateDebutStr}_${dateFinStr}`;

                        if (!groupedSessions.has(key)) {
                          groupedSessions.set(key, []);
                        }
                        groupedSessions.get(key)?.push(session);
                      });

                      // Convertir en array et trier par date
                      const sessionsArray = Array.from(groupedSessions.entries())
                        .map(([key, sessions]) => {
                          const firstSession = sessions[0];
                          // Calculer les stats
                          const stats = {
                            // Pour les sessions collectives, sommer le nombre de participants
                            // Pour les sessions individuelles, compter le nombre de sessions
                            total: sessions.reduce((sum, s) => {
                              if (s.type === 'collective') {
                                return sum + (s.nombreParticipants || 0);
                              }
                              return sum + 1;
                            }, 0),
                            inscrit: sessions.filter(s => ['inscrit', 'INSCRIT', 'Inscrit'].includes(s.statut)).length,
                            enCours: sessions.filter(s => ['en_cours', 'EN_COURS', 'En cours'].includes(s.statut)).length,
                            complete: sessions.filter(s => ['complete', 'COMPLETE', 'TERMINE', 'Terminé', 'terminé'].includes(s.statut)).length,
                            annule: sessions.filter(s => ['annule', 'ANNULE', 'Annulé', 'annulé'].includes(s.statut)).length,
                          };

                          // Déterminer le statut dominant
                          let statutDominant = 'En cours';
                          let color = 'yellow';

                          // Si c'est une session unique (surtout pour les collectives), utiliser son statut réel
                          if (sessions.length === 1) {
                            const session = sessions[0];
                            const statut = session.statut?.toLowerCase();

                            if (['complete', 'termine', 'terminé'].includes(statut)) {
                              statutDominant = 'Terminée';
                              color = 'green';
                            } else if (['en_cours'].includes(statut)) {
                              statutDominant = 'En cours';
                              color = 'yellow';
                            } else if (['inscrit'].includes(statut)) {
                              statutDominant = 'Inscrit';
                              color = 'blue';
                            } else if (['annule', 'annulé'].includes(statut)) {
                              statutDominant = 'Annulée';
                              color = 'red';
                            }
                          } else {
                            // Pour plusieurs sessions, calculer le statut majoritaire
                            if (stats.annule === sessions.length) {
                              statutDominant = 'Annulée';
                              color = 'red';
                            } else if (stats.complete > sessions.length / 2) {
                              statutDominant = 'Majoritairement terminée';
                              color = 'green';
                            } else if (stats.complete === sessions.length) {
                              statutDominant = 'Toutes terminées';
                              color = 'green';
                            } else if (stats.inscrit > 0) {
                              statutDominant = 'Inscriptions ouvertes';
                              color = 'blue';
                            }
                          }

                          return {
                            key,
                            dateDebut: firstSession.dateDebut,
                            dateFin: firstSession.dateFin,
                            organisme: firstSession.organisme,
                            tarifHT: firstSession.tarifHT,
                            stats,
                            statutDominant,
                            color,
                            sessions
                          };
                        })
                        .sort((a, b) => {
                          if (!a.dateDebut) return 1;
                          if (!b.dateDebut) return -1;
                          return new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime();
                        });

                      return sessionsArray.map((groupedSession) => (
                        <Paper
                          key={groupedSession.key}
                          p="md"
                          withBorder
                          onClick={() => handleViewSession(groupedSession)}
                          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '';
                          }}
                        >
                          <Group justify="space-between" align="flex-start">
                            <div style={{ flex: 1 }}>
                              <Group gap="sm" mb="xs">
                                <Calendar size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
                                <Text fw={500}>Session de formation</Text>
                              </Group>

                              <Group gap="xs" mb="sm">
                                {groupedSession.dateDebut ? (
                                  <Text size="sm" c="dimmed">
                                    Du {formatDate(groupedSession.dateDebut)} au {formatDate(groupedSession.dateFin)}
                                  </Text>
                                ) : (
                                  <Text size="sm" c="dimmed">Date non définie</Text>
                                )}
                                {groupedSession.organisme && (
                                  <>
                                    <Text size="sm" c="dimmed">•</Text>
                                    <Text size="sm" c="dimmed">
                                      {groupedSession.organisme}
                                    </Text>
                                  </>
                                )}
                                {groupedSession.tarifHT && (
                                  <>
                                    <Text size="sm" c="dimmed">•</Text>
                                    <Text size="sm" c="dimmed">
                                      {formatCurrency(groupedSession.tarifHT)}
                                    </Text>
                                  </>
                                )}
                              </Group>

                              <Group gap="xs">
                                <Users size={16} style={{ color: 'var(--mantine-color-violet-6)' }} />
                                <Text size="sm" fw={500}>
                                  {groupedSession.stats.total} participant{groupedSession.stats.total > 1 ? 's' : ''}
                                </Text>
                                {groupedSession.stats.inscrit > 0 && (
                                  <Badge size="xs" color="blue" variant="light">
                                    {groupedSession.stats.inscrit} inscrit{groupedSession.stats.inscrit > 1 ? 's' : ''}
                                  </Badge>
                                )}
                                {groupedSession.stats.enCours > 0 && (
                                  <Badge size="xs" color="yellow" variant="light">
                                    {groupedSession.stats.enCours} en cours
                                  </Badge>
                                )}
                                {groupedSession.stats.complete > 0 && (
                                  <Badge size="xs" color="green" variant="light">
                                    {groupedSession.stats.complete} terminé{groupedSession.stats.complete > 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </Group>
                            </div>
                            <Badge color={groupedSession.color} size="md">
                              {groupedSession.statutDominant}
                            </Badge>
                          </Group>
                        </Paper>
                      ));
                    })()}
                    {total > 0 && (
                      <Button
                        variant="subtle"
                        onClick={() => router.push(`/sessions?formationId=${params.id}`)}
                      >
                        Voir toutes les sessions
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
                  onClick={() => router.push(`/sessions?formationId=${params.id}`)}
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