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
  Paper,
  Center,
  Loader,
  Alert,
  Timeline,
  ThemeIcon,
  Divider,
  Progress,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  ArrowLeft,
  Clock,
  User,
  Calendar,
  Building,
  PencilSimple,
  XCircle,
  Warning,
  CheckCircle,
  BookOpen,
  Certificate,
  CalendarCheck,
  CalendarX,
  Hourglass,
  CurrencyDollar,
  Star,
  FileText,
  UserCheck,
} from '@phosphor-icons/react';
import { sessionsService } from '@/lib/services';
import { SessionFormation } from '@/lib/types';
import { StatutUtils } from '@/lib/utils/statut.utils';

interface Props {
  params: {
    id: string;
  };
}

// Couleurs et icônes par statut
const statusConfig = {
  'inscrit': { color: 'blue', icon: CalendarCheck, label: 'Inscrit' },
  'INSCRIT': { color: 'blue', icon: CalendarCheck, label: 'Inscrit' },
  'en_cours': { color: 'yellow', icon: Hourglass, label: 'En cours' },
  'EN_COURS': { color: 'yellow', icon: Hourglass, label: 'En cours' },
  'complete': { color: 'green', icon: Certificate, label: 'Terminé' },
  'TERMINE': { color: 'green', icon: Certificate, label: 'Terminé' },
  'COMPLETE': { color: 'green', icon: Certificate, label: 'Terminé' },
  'annule': { color: 'red', icon: CalendarX, label: 'Annulé' },
  'ANNULE': { color: 'red', icon: CalendarX, label: 'Annulé' },
};

export default function SessionDetailPage({ params }: Props) {
  const router = useRouter();
  const [session, setSession] = useState<SessionFormation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Charger la session
  const loadSession = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await sessionsService.getSession(parseInt(params.id));
      setSession(data);
    } catch (err: any) {
      console.error('Erreur lors du chargement de la session:', err);
      setError(err.message || 'Session non trouvée');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadSession();
  }, [params.id]);
  
  const handleCancel = async () => {
    if (!session) return;
    
    if (!confirm('Êtes-vous sûr de vouloir annuler cette session ?')) {
      return;
    }
    
    try {
      await sessionsService.cancelSession(session.id);
      notifications.show({
        title: 'Succès',
        message: 'Session annulée avec succès',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
      loadSession(); // Recharger les données
    } catch (error: any) {
      notifications.show({
        title: 'Erreur',
        message: error.response?.data?.message || 'Impossible d\'annuler la session',
        color: 'red',
        icon: <Warning size={20} />,
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
      <Center h="100vh">
        <Stack align="center">
          <Warning size={48} color="gray" />
          <Text size="lg" c="dimmed">{error || 'Session non trouvée'}</Text>
          <Button onClick={() => router.back()}>Retour</Button>
        </Stack>
      </Center>
    );
  }

  // Déterminer l'icône et la couleur selon le statut
  const StatusIcon = StatutUtils.isComplete(session.statut) ? Certificate :
                     StatutUtils.isEnCours(session.statut) ? Hourglass :
                     StatutUtils.isInscrit(session.statut) ? CalendarCheck :
                     StatutUtils.isAnnule(session.statut) ? CalendarX : CalendarCheck;
  
  const statusColor = StatutUtils.getStatusColor(session.statut);
  const statusLabel = StatutUtils.getStatusLabel(session.statut);

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
            <Title order={1}>Détail de la session</Title>
            <Text size="lg" c="dimmed" mt="xs">Session #{session.id}</Text>
          </div>
        </Group>
        <Group>
          <Tooltip label="Modifier">
            <ActionIcon
              variant="light"
              size="lg"
              onClick={() => router.push(`/sessions/${params.id}/edit`)}
            >
              <PencilSimple size={20} />
            </ActionIcon>
          </Tooltip>
          {!StatutUtils.isAnnule(session.statut) && (
            <Button
              color="red"
              variant="light"
              leftSection={<XCircle size={16} />}
              onClick={handleCancel}
            >
              Annuler
            </Button>
          )}
        </Group>
      </Group>

      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 8 }}>
          {/* Statut et informations principales */}
          <Paper shadow="xs" p="lg" radius="md" withBorder mb="lg">
            <Group justify="space-between" mb="lg">
              <Badge
                size="lg"
                leftSection={<StatusIcon size={16} />}
                color={statusColor}
                variant="light"
              >
                {statusLabel}
              </Badge>
              {session.note !== null && session.note !== undefined && (
                <Group gap="xs">
                  <Star size={20} color="#FD7E14" />
                  <Text fw={600}>{session.note}/100</Text>
                </Group>
              )}
            </Group>

            <Stack gap="lg">
              {/* Collaborateur */}
              <Group>
                <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                  <User size={20} />
                </ThemeIcon>
                <div>
                  <Text size="sm" c="dimmed">Collaborateur</Text>
                  <Text fw={500} size="lg">
                    {session.collaborateur?.nomComplet || 'Non renseigné'}
                  </Text>
                  {session.collaborateur?.departement && (
                    <Text size="sm" c="dimmed">
                      {session.collaborateur.departement.nomDepartement}
                    </Text>
                  )}
                </div>
              </Group>

              <Divider />

              {/* Formation */}
              <Group>
                <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                  <BookOpen size={20} />
                </ThemeIcon>
                <div>
                  <Text size="sm" c="dimmed">Formation</Text>
                  <Text fw={500} size="lg">
                    {session.formation?.nomFormation || 'Non renseignée'}
                  </Text>
                  {session.formation?.codeFormation && (
                    <Text size="sm" c="dimmed">
                      Code: {session.formation.codeFormation}
                    </Text>
                  )}
                </div>
              </Group>

              <Divider />

              {/* Dates */}
              <Group>
                <ThemeIcon size="lg" radius="md" variant="light" color="green">
                  <Calendar size={20} />
                </ThemeIcon>
                <div>
                  <Text size="sm" c="dimmed">Période</Text>
                  <Text fw={500}>
                    Du {new Date(session.dateDebut).toLocaleDateString('fr-FR')}
                    {session.dateFin && ` au ${new Date(session.dateFin).toLocaleDateString('fr-FR')}`}
                  </Text>
                </div>
              </Group>

              {/* Durée */}
              {(session.dureePrevue || session.dureeReelle) && (
                <>
                  <Divider />
                  <Group>
                    <ThemeIcon size="lg" radius="md" variant="light" color="orange">
                      <Clock size={20} />
                    </ThemeIcon>
                    <div>
                      <Text size="sm" c="dimmed">Durée</Text>
                      <Group gap="lg">
                        {session.dureePrevue && (
                          <div>
                            <Text size="xs" c="dimmed">Prévue</Text>
                            <Text fw={500}>
                              {session.dureePrevue} {session.uniteDuree || 'heures'}
                            </Text>
                          </div>
                        )}
                        {session.dureeReelle && (
                          <div>
                            <Text size="xs" c="dimmed">Réelle</Text>
                            <Text fw={500}>
                              {session.dureeReelle} {session.uniteDuree || 'heures'}
                            </Text>
                          </div>
                        )}
                      </Group>
                    </div>
                  </Group>
                </>
              )}

              {/* Organisme */}
              {session.organisme && (
                <>
                  <Divider />
                  <Group>
                    <ThemeIcon size="lg" radius="md" variant="light" color="cyan">
                      <Building size={20} />
                    </ThemeIcon>
                    <div>
                      <Text size="sm" c="dimmed">Organisme</Text>
                      <Text fw={500}>{session.organisme.nomOrganisme}</Text>
                    </div>
                  </Group>
                </>
              )}
            </Stack>
          </Paper>

          {/* Commentaire */}
          {session.commentaire && (
            <Paper shadow="xs" p="lg" radius="md" withBorder>
              <Group mb="md">
                <FileText size={20} />
                <Text fw={600}>Commentaire</Text>
              </Group>
              <Text style={{ whiteSpace: 'pre-wrap' }}>{session.commentaire}</Text>
            </Paper>
          )}
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            {/* Note et progression */}
            {session.note !== null && session.note !== undefined && (
              <Card shadow="xs" radius="md" withBorder>
                <Text fw={600} mb="md">Évaluation</Text>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">Note obtenue</Text>
                  <Progress
                    value={session.note}
                    color={session.note >= 80 ? 'green' : session.note >= 60 ? 'yellow' : 'red'}
                    size="xl"
                    radius="md"
                  />
                  <Text ta="center" fw={600} size="lg">
                    {session.note}/100
                  </Text>
                  <Badge
                    fullWidth
                    size="lg"
                    color={session.note >= 80 ? 'green' : session.note >= 60 ? 'yellow' : 'red'}
                    variant="light"
                  >
                    {session.note >= 80 ? 'Excellent' : session.note >= 60 ? 'Satisfaisant' : 'À améliorer'}
                  </Badge>
                </Stack>
              </Card>
            )}

            {/* Coût */}
            {session.tarifHT && (
              <Card shadow="xs" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      Coût formation
                    </Text>
                    <Text size="xl" fw={700}>
                      {session.tarifHT.toLocaleString('fr-FR')} €
                    </Text>
                    <Text size="xs" c="dimmed">Hors taxes</Text>
                  </div>
                  <ThemeIcon size="xl" radius="md" variant="light" color="green">
                    <CurrencyDollar size={24} />
                  </ThemeIcon>
                </Group>
              </Card>
            )}

            {/* Informations système */}
            <Card shadow="xs" radius="md" withBorder>
              <Text fw={600} mb="md">Informations système</Text>
              <Stack gap="xs">
                {session.sourceImport && (
                  <div>
                    <Text size="xs" c="dimmed">Source d'import</Text>
                    <Text size="sm">{session.sourceImport}</Text>
                  </div>
                )}
                {session.dateImport && (
                  <div>
                    <Text size="xs" c="dimmed">Date d'import</Text>
                    <Text size="sm">
                      {new Date(session.dateImport).toLocaleString('fr-FR')}
                    </Text>
                  </div>
                )}
                {session.dateCreation && (
                  <div>
                    <Text size="xs" c="dimmed">Date de création</Text>
                    <Text size="sm">
                      {new Date(session.dateCreation).toLocaleString('fr-FR')}
                    </Text>
                  </div>
                )}
                {session.dateMiseAJour && (
                  <div>
                    <Text size="xs" c="dimmed">Dernière modification</Text>
                    <Text size="sm">
                      {new Date(session.dateMiseAJour).toLocaleString('fr-FR')}
                    </Text>
                  </div>
                )}
              </Stack>
            </Card>

            {/* Actions */}
            <Card shadow="xs" radius="md" withBorder>
              <Stack gap="sm">
                <Text fw={600}>Actions</Text>
                <Button
                  fullWidth
                  variant="light"
                  leftSection={<PencilSimple size={16} />}
                  onClick={() => router.push(`/sessions/${params.id}/edit`)}
                >
                  Modifier la session
                </Button>
                {!StatutUtils.isAnnule(session.statut) && (
                  <Button
                    fullWidth
                    variant="light"
                    color="red"
                    leftSection={<XCircle size={16} />}
                    onClick={handleCancel}
                  >
                    Annuler la session
                  </Button>
                )}
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
}