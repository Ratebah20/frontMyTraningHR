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
  Modal,
  Select,
} from '@mantine/core';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { BookOpen } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { Calendar } from '@phosphor-icons/react/dist/ssr/Calendar';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { Building } from '@phosphor-icons/react/dist/ssr/Building';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { Eye } from '@phosphor-icons/react/dist/ssr/Eye';
import { PencilSimple } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { XCircle } from '@phosphor-icons/react/dist/ssr/XCircle';
import { CalendarCheck } from '@phosphor-icons/react/dist/ssr/CalendarCheck';
import { Hourglass } from '@phosphor-icons/react/dist/ssr/Hourglass';
import { Certificate } from '@phosphor-icons/react/dist/ssr/Certificate';
import { CalendarX } from '@phosphor-icons/react/dist/ssr/CalendarX';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { ListChecks } from '@phosphor-icons/react/dist/ssr/ListChecks';
import { ClipboardText } from '@phosphor-icons/react/dist/ssr/ClipboardText';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Info } from '@phosphor-icons/react/dist/ssr/Info';
import { evaluationsService } from '@/lib/services/evaluations.service';
import { getQuestionnaires } from '@/lib/services/questionnaires.service';
import { CurrencyDollar } from '@phosphor-icons/react/dist/ssr/CurrencyDollar';
import { notifications } from '@mantine/notifications';
import { sessionsService } from '@/lib/services';
import { GroupedSession } from '@/lib/types';
import { TodoList } from '@/components/session-todos/TodoList';
import dynamic from 'next/dynamic';
const DocumentGenerator = dynamic(
  () => import('@/components/documents/DocumentGenerator').then(mod => mod.DocumentGenerator),
  { ssr: false, loading: () => null }
);
import AttachmentManager from '@/components/attachments/AttachmentManager';
import { Paperclip } from '@phosphor-icons/react/dist/ssr/Paperclip';

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

  // Envoi d'une demande d'évaluation sur le groupe.
  //
  // Cette page est celle où l'on atterrit depuis une session importée d'OLU ;
  // elle n'offrait jusqu'ici aucun moyen de lancer une évaluation, ce qui
  // obligeait à repasser par la liste des sessions.
  const [evalType, setEvalType] = useState<'chaud' | 'froid' | null>(null);
  const [evalQuestionnaireId, setEvalQuestionnaireId] = useState<string | null>(null);
  const [evalTemplates, setEvalTemplates] = useState<any[]>([]);
  const [evalTemplatesLoading, setEvalTemplatesLoading] = useState(false);
  const [evalPreview, setEvalPreview] = useState<any>(null);
  const [isSendingEval, setIsSendingEval] = useState(false);

  useEffect(() => {
    if (!evalType || !session?.groupKey) return;

    let annule = false;
    setEvalTemplatesLoading(true);
    setEvalQuestionnaireId(null);
    setEvalPreview(null);

    evaluationsService
      .previewGroupEvaluations(session.groupKey, evalType)
      .then((preview) => {
        if (!annule) setEvalPreview(preview);
      })
      .catch(() => {
        if (!annule) setEvalPreview(null);
      });

    getQuestionnaires({ type: evalType })
      .then((list) => {
        if (!annule) setEvalTemplates((list || []).filter((q: any) => q.actif));
      })
      .catch(() => {
        if (!annule) setEvalTemplates([]);
      })
      .finally(() => {
        if (!annule) setEvalTemplatesLoading(false);
      });

    return () => {
      annule = true;
    };
  }, [evalType, session?.groupKey]);

  const handleSendGroupEvaluations = async () => {
    if (!session?.groupKey || !evalType || !evalQuestionnaireId) return;

    setIsSendingEval(true);
    try {
      const result = await evaluationsService.sendGroupEvaluations({
        groupKey: session.groupKey,
        evaluationType: evalType,
        questionnaireTemplateId: parseInt(evalQuestionnaireId, 10),
      });

      const details = [
        `${result.envoyes} envoyée(s)`,
        result.dejaEnvoyees > 0 ? `${result.dejaEnvoyees} déjà envoyée(s)` : null,
        result.sansEmail > 0 ? `${result.sansEmail} sans adresse email` : null,
        result.erreurs > 0 ? `${result.erreurs} en erreur` : null,
      ]
        .filter(Boolean)
        .join(' • ');

      notifications.show({
        title: result.envoyes > 0 ? "Demande d'évaluation envoyée" : 'Aucun nouvel envoi',
        message: `${result.totalParticipants} participant(s) sur ${result.totalSessions} session(s) — ${details}`,
        color: result.erreurs > 0 ? 'orange' : result.envoyes > 0 ? 'green' : 'blue',
        icon: result.erreurs > 0 ? <Warning size={16} /> : <CheckCircle size={16} />,
        autoClose: 8000,
      });

      setEvalType(null);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message;
      notifications.show({
        title: "Erreur lors de l'envoi",
        message: Array.isArray(message) ? message.join(', ') : message || 'Erreur inconnue',
        color: 'red',
        icon: <Warning size={16} />,
      });
    } finally {
      setIsSendingEval(false);
    }
  };

  return (
    <Container size="xl">
      {/* Modale d'envoi d'une demande d'évaluation sur le groupe */}
      <Modal
        opened={evalType !== null}
        onClose={() => setEvalType(null)}
        title={
          <Group gap="xs">
            <ClipboardText size={20} />
            {evalType === 'froid' ? 'Évaluation à froid' : 'Évaluation à chaud'}
          </Group>
        }
        centered
        size="md"
      >
        <Stack>
          <Select
            label="Type d'évaluation"
            data={[
              { value: 'chaud', label: 'À chaud (participants)' },
              { value: 'froid', label: 'À froid (managers)' },
            ]}
            value={evalType}
            onChange={(value) => setEvalType((value as 'chaud' | 'froid') || 'chaud')}
            allowDeselect={false}
          />

          <Select
            label="Questionnaire à envoyer"
            description="Le questionnaire est choisi explicitement : aucun envoi n'est fait sans cette sélection."
            placeholder={evalTemplatesLoading ? 'Chargement...' : 'Choisir un questionnaire'}
            data={evalTemplates.map((q: any) => ({ value: String(q.id), label: q.nom }))}
            value={evalQuestionnaireId}
            onChange={setEvalQuestionnaireId}
            disabled={evalTemplatesLoading}
            searchable
            nothingFoundMessage="Aucun questionnaire actif de ce type"
            required
          />

          {!evalTemplatesLoading && evalTemplates.length === 0 && (
            <Alert color="orange" variant="light" icon={<Warning size={16} />}>
              Aucun questionnaire {evalType === 'froid' ? 'à froid' : 'à chaud'} actif
              n&apos;est disponible. Créez-en un depuis la page Questionnaires.
            </Alert>
          )}

          {evalPreview && (
            <Alert color="blue" variant="light" icon={<Info size={16} />}>
              {evalPreview.totalParticipants} participant(s) sur{' '}
              {evalPreview.totalSessions} session(s).
              {evalPreview.dejaEnvoyees > 0 &&
                ` ${evalPreview.dejaEnvoyees} évaluation(s) déjà envoyée(s), qui ne seront pas renvoyées.`}
              {evalPreview.sansEmail > 0 &&
                ` ${evalPreview.sansEmail} participant(s) sans adresse email.`}
            </Alert>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setEvalType(null)}>
              Annuler
            </Button>
            <Button
              color="orange"
              leftSection={<ClipboardText size={16} />}
              loading={isSendingEval}
              onClick={handleSendGroupEvaluations}
              disabled={!evalQuestionnaireId}
            >
              Envoyer
            </Button>
          </Group>
        </Stack>
      </Modal>

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
              color="orange"
              leftSection={<ClipboardText size={16} />}
              onClick={() => setEvalType('chaud')}
            >
              Demander une évaluation
            </Button>
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
            {session.participants.length > 0 && (
              <Tabs.Tab value="attachments" leftSection={<Paperclip size={16} />}>
                Pièces jointes
              </Tabs.Tab>
            )}
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

          {session.participants.length > 0 && (
            <Tabs.Panel value="attachments" pt="xl">
              <AttachmentManager
                targetType="session"
                targetId={session.participants[0].sessionId}
              />
            </Tabs.Panel>
          )}
        </Tabs>
      </Paper>
    </Container>
  );
}
