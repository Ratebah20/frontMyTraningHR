'use client';

/**
 * Section « Retours d'évaluation » du détail d'une session.
 *
 * Composant autonome (état + hooks internes) : la page de détail fait des
 * `return` anticipés pour le chargement et l'erreur, on ne peut donc pas y
 * ajouter de hook. Un seul appel réseau, agrégation locale.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  Alert,
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Group,
  Loader,
  Paper,
  Progress,
  RingProgress,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import { ClipboardText } from '@phosphor-icons/react/dist/ssr/ClipboardText';
import { DownloadSimple } from '@phosphor-icons/react/dist/ssr/DownloadSimple';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { Info } from '@phosphor-icons/react/dist/ssr/Info';
import { Star } from '@phosphor-icons/react/dist/ssr/Star';
import { ChatCircle } from '@phosphor-icons/react/dist/ssr/ChatCircle';
import { ArrowClockwise } from '@phosphor-icons/react/dist/ssr/ArrowClockwise';
import { evaluationsService } from '@/lib/services/evaluations.service';
import type {
  EvaluationMoment,
  EvaluationQuestionAggregate,
  EvaluationSessionType,
  SessionEvaluation,
  SessionEvaluationsAggregate,
} from '@/lib/types';
import {
  aggregateSessionEvaluations,
  buildEvaluationsCsv,
  downloadCsv,
  formatAnswerValue,
  getQuestionsForEvaluation,
  hasAnswer,
  labelForUnknownKey,
} from './evaluation-aggregation';

interface SessionEvaluationsPanelProps {
  sessionId: number;
  sessionType: EvaluationSessionType;
  /** Sert uniquement à nommer le fichier CSV */
  formationNom?: string;
}

const MOMENT_LABELS: Record<EvaluationMoment, string> = {
  chaud: 'À chaud',
  froid: 'À froid',
};

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('fr-FR');
}

/** Nettoie une chaîne pour en faire un nom de fichier sûr. */
function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'session';
}

/** Barres de répartition d'une question fermée (note, choix, oui/non). */
function RepartitionBars({ question }: { question: EvaluationQuestionAggregate }) {
  if (question.repartition.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        Aucune réponse à cette question.
      </Text>
    );
  }

  return (
    <Stack gap={6}>
      {question.repartition.map((item) => (
        <Group key={item.valeur} gap="sm" wrap="nowrap">
          <Text size="sm" w={140} style={{ flexShrink: 0 }} truncate="end">
            {question.type === 'note' ? `${item.valeur} / 5` : item.valeur}
          </Text>
          <Progress
            value={item.pourcentage}
            size="lg"
            radius="sm"
            color={question.type === 'note' ? 'orange' : 'blue'}
            style={{ flex: 1 }}
          />
          <Text size="sm" c="dimmed" w={110} ta="right" style={{ flexShrink: 0 }}>
            {item.nombre} ({item.pourcentage}%)
          </Text>
        </Group>
      ))}
    </Stack>
  );
}

/** Détail des réponses d'un destinataire : libellé de la question en face de la valeur. */
function ReponsesDetail({
  evaluation,
  moment,
}: {
  evaluation: SessionEvaluation;
  moment: EvaluationMoment;
}) {
  if (evaluation.statut !== 'complete') {
    return (
      <Text size="sm" c="dimmed">
        Ce destinataire n&apos;a pas encore répondu.
      </Text>
    );
  }

  const questions = getQuestionsForEvaluation(evaluation, moment);
  const declaredIds = new Set(questions.map((question) => question.id));

  // Clés présentes dans les réponses mais absentes du questionnaire :
  // on les affiche quand même, avec un libellé de repli.
  const extraKeys = Object.keys(evaluation.reponses || {}).filter((key) => !declaredIds.has(key));

  const lignes = [
    ...questions.map((question) => ({
      id: question.id,
      libelle: question.libelle || labelForUnknownKey(question.id),
      type: question.type,
    })),
    ...extraKeys.map((key) => ({
      id: key,
      libelle: labelForUnknownKey(key),
      type: 'texte' as const,
    })),
  ];

  if (lignes.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        Aucune réponse enregistrée.
      </Text>
    );
  }

  return (
    <Stack gap="xs">
      {lignes.map((ligne) => {
        const brut = evaluation.reponses?.[ligne.id];
        const repondu = hasAnswer(brut);
        const valeur = formatAnswerValue(ligne.type, brut);

        return (
          <Group key={ligne.id} justify="space-between" align="flex-start" wrap="nowrap" gap="md">
            <Text size="sm" c="dimmed" style={{ flex: 1 }}>
              {ligne.libelle}
            </Text>
            <Text
              size="sm"
              fw={500}
              c={repondu ? undefined : 'dimmed'}
              style={{ flex: 1, whiteSpace: 'pre-wrap' }}
            >
              {repondu
                ? ligne.type === 'note'
                  ? `${valeur} / 5`
                  : valeur
                : 'Non renseigné'}
            </Text>
          </Group>
        );
      })}
    </Stack>
  );
}

function AggregateView({ aggregate }: { aggregate: SessionEvaluationsAggregate }) {
  const questionsNotees = aggregate.questions.filter((question) => question.type === 'note');
  const questionsFermees = aggregate.questions.filter(
    (question) => question.type === 'choix' || question.type === 'oui_non',
  );
  const questionsTexte = aggregate.questions.filter((question) => question.type === 'texte');

  return (
    <Stack gap="lg">
      {/* Bandeau de synthèse */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        <Paper withBorder radius="md" p="md">
          <Text size="xs" c="dimmed">Invitations envoyées</Text>
          <Text fw={700} size="xl">{aggregate.envoyees}</Text>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Text size="xs" c="dimmed">Réponses reçues</Text>
          <Text fw={700} size="xl" c="teal">{aggregate.repondues}</Text>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Group gap="sm" wrap="nowrap">
            <RingProgress
              size={64}
              thickness={7}
              roundCaps
              sections={[{ value: aggregate.tauxReponse, color: 'teal' }]}
            />
            <div>
              <Text size="xs" c="dimmed">Taux de réponse</Text>
              <Text fw={700} size="xl">{aggregate.tauxReponse}%</Text>
            </div>
          </Group>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Text size="xs" c="dimmed">Note moyenne globale</Text>
          {aggregate.moyenneGlobale !== null ? (
            <Group gap={6} align="baseline">
              <Text fw={700} size="xl" c="orange">
                {aggregate.moyenneGlobale.toFixed(2)}
              </Text>
              <Text size="sm" c="dimmed">/ 5</Text>
            </Group>
          ) : (
            <Text size="sm" c="dimmed" mt={6}>
              Aucune question notée
            </Text>
          )}
        </Paper>
      </SimpleGrid>

      {aggregate.questionnaireNoms.length > 1 && (
        <Alert color="blue" variant="light" icon={<Info size={16} />}>
          Plusieurs questionnaires ont servi pour cette session (
          {aggregate.questionnaireNoms.join(', ')}). Les questions ne sont pas
          nécessairement comparables d&apos;un destinataire à l&apos;autre.
        </Alert>
      )}

      {aggregate.repondues === 0 ? (
        <Alert color="gray" variant="light" icon={<Info size={16} />}>
          Les invitations ont bien été envoyées, mais aucune réponse n&apos;a encore
          été reçue.
        </Alert>
      ) : (
        <>
          {/* Questions notées */}
          {questionsNotees.length > 0 && (
            <Box>
              <Text fw={600} mb="sm">Questions notées</Text>
              <Stack gap="md">
                {questionsNotees.map((question) => (
                  <Paper key={question.id} withBorder radius="md" p="md">
                    <Group justify="space-between" mb="sm" wrap="nowrap">
                      <Text size="sm" fw={500}>{question.libelle}</Text>
                      <Group gap="xs" wrap="nowrap">
                        {question.moyenne !== null && (
                          <Badge color="orange" variant="light" leftSection={<Star size={12} />}>
                            {question.moyenne.toFixed(2)} / 5
                          </Badge>
                        )}
                        <Badge color="gray" variant="light">
                          {question.nombreReponses} réponse{question.nombreReponses > 1 ? 's' : ''}
                        </Badge>
                      </Group>
                    </Group>
                    <RepartitionBars question={question} />
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}

          {/* Questions à choix / oui-non */}
          {questionsFermees.length > 0 && (
            <Box>
              <Text fw={600} mb="sm">Questions à choix</Text>
              <Stack gap="md">
                {questionsFermees.map((question) => (
                  <Paper key={question.id} withBorder radius="md" p="md">
                    <Group justify="space-between" mb="sm" wrap="nowrap">
                      <Text size="sm" fw={500}>{question.libelle}</Text>
                      <Badge color="gray" variant="light">
                        {question.nombreReponses} réponse{question.nombreReponses > 1 ? 's' : ''}
                      </Badge>
                    </Group>
                    <RepartitionBars question={question} />
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}

          {/* Réponses libres */}
          {questionsTexte.length > 0 && (
            <Box>
              <Text fw={600} mb="sm">Réponses libres</Text>
              <Stack gap="md">
                {questionsTexte.map((question) => (
                  <Paper key={question.id} withBorder radius="md" p="md">
                    <Group justify="space-between" mb="sm" wrap="nowrap">
                      <Text size="sm" fw={500}>{question.libelle}</Text>
                      <Badge color="gray" variant="light">
                        {question.reponsesTexte.length}
                      </Badge>
                    </Group>

                    {question.reponsesTexte.length === 0 ? (
                      <Text size="sm" c="dimmed">Aucun commentaire.</Text>
                    ) : (
                      <Stack gap="sm">
                        {question.reponsesTexte.map((reponse, index) => (
                          <Paper
                            key={`${question.id}-${index}`}
                            radius="sm"
                            p="sm"
                            withBorder
                          >
                            <Group gap="xs" mb={4}>
                              <ChatCircle size={14} />
                              <Text size="xs" fw={500}>{reponse.collaborateurNom}</Text>
                              <Text size="xs" c="dimmed">
                                — {formatDateTime(reponse.date)}
                              </Text>
                            </Group>
                            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                              {reponse.valeur}
                            </Text>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}
        </>
      )}

      <Divider />

      {/* Tableau nominatif dépliable */}
      <Box>
        <Text fw={600} mb="sm">Détail par destinataire</Text>
        <Accordion variant="separated" radius="md">
          {aggregate.destinataires.map((evaluation) => {
            const repondu = evaluation.statut === 'complete';
            return (
              <Accordion.Item key={evaluation.id} value={String(evaluation.id)}>
                <Accordion.Control>
                  <Group justify="space-between" wrap="nowrap" pr="md">
                    <div style={{ minWidth: 0 }}>
                      <Text size="sm" fw={500} truncate="end">
                        {evaluation.collaborateurNom || evaluation.destinataireEmail}
                      </Text>
                      <Text size="xs" c="dimmed" truncate="end">
                        {evaluation.destinataireEmail}
                      </Text>
                    </div>
                    <Group gap="sm" wrap="nowrap">
                      <Text size="xs" c="dimmed" visibleFrom="sm">
                        {repondu ? formatDateTime(evaluation.dateReponse) : '—'}
                      </Text>
                      <Badge color={repondu ? 'green' : 'gray'} variant="light">
                        {repondu ? 'Répondu' : 'En attente'}
                      </Badge>
                    </Group>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="sm">
                    <Group gap="lg">
                      <Text size="xs" c="dimmed">
                        Envoyée le {formatDateTime(evaluation.dateEnvoi)}
                      </Text>
                      {repondu && (
                        <Text size="xs" c="dimmed">
                          Répondue le {formatDateTime(evaluation.dateReponse)}
                        </Text>
                      )}
                      {evaluation.questionnaire?.nom && (
                        <Text size="xs" c="dimmed">
                          Questionnaire : {evaluation.questionnaire.nom}
                        </Text>
                      )}
                    </Group>
                    <Divider />
                    <ReponsesDetail evaluation={evaluation} moment={aggregate.moment} />
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      </Box>
    </Stack>
  );
}

export function SessionEvaluationsPanel({
  sessionId,
  sessionType,
  formationNom,
}: SessionEvaluationsPanelProps) {
  const [evaluations, setEvaluations] = useState<SessionEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moment, setMoment] = useState<EvaluationMoment>('chaud');

  const loadEvaluations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await evaluationsService.getSessionEvaluations(sessionType, sessionId);
      const liste = Array.isArray(data) ? data : [];
      setEvaluations(liste);
      // Si aucune évaluation à chaud mais des évaluations à froid, on ouvre
      // directement sur l'onglet qui contient quelque chose.
      const aDuChaud = liste.some((item) => item.type === 'chaud');
      const aDuFroid = liste.some((item) => item.type === 'froid');
      setMoment(!aDuChaud && aDuFroid ? 'froid' : 'chaud');
    } catch (err: any) {
      setError(
        err?.response?.data?.message
          || err?.message
          || 'Impossible de charger les retours d\'évaluation',
      );
      setEvaluations([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, sessionType]);

  useEffect(() => {
    loadEvaluations();
  }, [loadEvaluations]);

  const parMoment = useMemo(() => ({
    chaud: evaluations.filter((item) => item.type === 'chaud'),
    froid: evaluations.filter((item) => item.type === 'froid'),
  }), [evaluations]);

  const aggregate = useMemo(
    () => aggregateSessionEvaluations(parMoment[moment], moment),
    [parMoment, moment],
  );

  const handleExportCsv = () => {
    const csv = buildEvaluationsCsv(aggregate);
    const base = slugify(formationNom || `session-${sessionId}`);
    downloadCsv(`evaluations-${base}-${moment}.csv`, csv);
  };

  return (
    <Paper shadow="xs" p="lg" radius="md" withBorder>
      <Group justify="space-between" align="flex-start" mb="lg" wrap="nowrap">
        <Group gap="md" wrap="nowrap">
          <ThemeIcon size="lg" radius="md" variant="light" color="orange">
            <ClipboardText size={20} />
          </ThemeIcon>
          <div>
            <Text fw={600} size="lg">Retours d&apos;évaluation</Text>
            <Text size="sm" c="dimmed">
              Réponses des participants aux questionnaires envoyés pour cette session
            </Text>
          </div>
        </Group>

        {!isLoading && !error && evaluations.length > 0 && (
          <Tooltip label="Une ligne par destinataire, une colonne par question">
            <Button
              variant="light"
              leftSection={<DownloadSimple size={16} />}
              onClick={handleExportCsv}
            >
              Exporter en CSV
            </Button>
          </Tooltip>
        )}
      </Group>

      {isLoading ? (
        <Center py="xl">
          <Loader size="md" />
        </Center>
      ) : error ? (
        <Alert color="red" variant="light" icon={<Warning size={16} />}>
          <Stack gap="sm" align="flex-start">
            <Text size="sm">{error}</Text>
            <Button
              size="xs"
              variant="light"
              color="red"
              leftSection={<ArrowClockwise size={14} />}
              onClick={loadEvaluations}
            >
              Réessayer
            </Button>
          </Stack>
        </Alert>
      ) : evaluations.length === 0 ? (
        <Alert color="blue" variant="light" icon={<Info size={16} />}>
          <Stack gap={4}>
            <Text size="sm" fw={500}>Aucune évaluation envoyée pour cette session.</Text>
            <Text size="sm">
              Utilisez le bouton « Évaluations » du bloc « Actions disponibles » pour
              envoyer un questionnaire à chaud ou à froid aux participants. Leurs
              réponses apparaîtront ici.
            </Text>
          </Stack>
        </Alert>
      ) : (
        <Stack gap="lg">
          <SegmentedControl
            value={moment}
            onChange={(value) => setMoment(value as EvaluationMoment)}
            data={(['chaud', 'froid'] as EvaluationMoment[]).map((value) => ({
              value,
              label: `${MOMENT_LABELS[value]} (${parMoment[value].length})`,
              disabled: parMoment[value].length === 0,
            }))}
          />

          {parMoment[moment].length === 0 ? (
            <Alert color="gray" variant="light" icon={<Info size={16} />}>
              Aucune évaluation {MOMENT_LABELS[moment].toLowerCase()} n&apos;a été
              envoyée pour cette session.
            </Alert>
          ) : (
            <AggregateView aggregate={aggregate} />
          )}
        </Stack>
      )}
    </Paper>
  );
}

export default SessionEvaluationsPanel;
