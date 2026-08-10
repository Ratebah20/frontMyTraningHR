'use client';

/**
 * Synthèse des retours d'évaluation par formation.
 *
 * Toutes les sessions d'une même formation sont agrégées côté serveur par
 * `GET /evaluations/formation/:id/synthese` : cette page ne fait que filtrer
 * (formation, à chaud / à froid, période) et restituer.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Container,
  Group,
  Loader,
  Paper,
  Progress,
  RingProgress,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import dynamic from 'next/dynamic';
import { ChartLineUp } from '@phosphor-icons/react/dist/ssr/ChartLineUp';
import { ClipboardText } from '@phosphor-icons/react/dist/ssr/ClipboardText';
import { Info } from '@phosphor-icons/react/dist/ssr/Info';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { Star } from '@phosphor-icons/react/dist/ssr/Star';
import { ChatCircle } from '@phosphor-icons/react/dist/ssr/ChatCircle';
import { ArrowClockwise } from '@phosphor-icons/react/dist/ssr/ArrowClockwise';
import { PeriodSelector } from '@/components/PeriodSelector';
import { formationsService } from '@/lib/services';
import { evaluationsService } from '@/lib/services/evaluations.service';
import type {
  EvaluationMoment,
  FormationEvaluationSynthese,
} from '@/lib/types';

const QuestionRepartitionChart = dynamic(
  () => import('@/components/evaluations/EvaluationCharts').then(mod => mod.QuestionRepartitionChart),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
        Chargement du graphique...
      </div>
    ),
  }
);

interface FormationOption {
  value: string;
  label: string;
}

/** Date locale au format YYYY-MM-DD (pas d'UTC : évite le décalage d'un jour). */
function toIsoDay(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Traduit la sélection du PeriodSelector (année / mois / plage) en bornes
 * `dateDebut` / `dateFin` attendues par l'API.
 * Retourne null quand la plage est incomplète : on ne lance alors aucun appel.
 */
function computeDateRange(
  periode: 'annee' | 'mois' | 'plage',
  date: string,
  dateDebut: Date | null,
  dateFin: Date | null,
): { dateDebut: string; dateFin: string } | null {
  if (periode === 'plage') {
    if (!dateDebut || !dateFin) return null;
    return { dateDebut: toIsoDay(dateDebut), dateFin: toIsoDay(dateFin) };
  }

  const [anneeStr, moisStr] = date.split('-');
  const annee = Number(anneeStr) || new Date().getFullYear();

  if (periode === 'mois') {
    const mois = Number(moisStr) || 1;
    // Le jour 0 du mois suivant = dernier jour du mois courant
    const dernierJour = new Date(annee, mois, 0).getDate();
    return {
      dateDebut: `${annee}-${String(mois).padStart(2, '0')}-01`,
      dateFin: `${annee}-${String(mois).padStart(2, '0')}-${String(dernierJour).padStart(2, '0')}`,
    };
  }

  return { dateDebut: `${annee}-01-01`, dateFin: `${annee}-12-31` };
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR');
}

function tauxColor(taux: number): string {
  if (taux >= 70) return 'teal';
  if (taux >= 40) return 'yellow';
  return 'red';
}

export default function EvaluationsSynthesePage() {
  const router = useRouter();

  const [formations, setFormations] = useState<FormationOption[]>([]);
  const [formationsError, setFormationsError] = useState<string | null>(null);
  const [formationId, setFormationId] = useState<string | null>(null);

  const [evaluationType, setEvaluationType] = useState<EvaluationMoment>('chaud');
  const [periode, setPeriode] = useState<'annee' | 'mois' | 'plage'>('annee');
  const [date, setDate] = useState<string>(String(new Date().getFullYear()));
  const [dateDebut, setDateDebut] = useState<Date | null>(null);
  const [dateFin, setDateFin] = useState<Date | null>(null);

  const [synthese, setSynthese] = useState<FormationEvaluationSynthese | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ----- Chargement de la liste des formations (même approche que /kpi/conformite)
  useEffect(() => {
    let cancelled = false;

    const loadFormations = async () => {
      try {
        const response = await formationsService.getFormations({ limit: 1000 });
        if (cancelled) return;
        setFormations(
          response.data.map((formation) => ({
            value: String(formation.id),
            label: formation.codeFormation
              ? `${formation.codeFormation} — ${formation.nomFormation}`
              : formation.nomFormation,
          })),
        );
      } catch (err: any) {
        if (!cancelled) {
          setFormationsError(
            err?.response?.data?.message || err?.message || 'Impossible de charger les formations',
          );
        }
      }
    };

    loadFormations();
    return () => {
      cancelled = true;
    };
  }, []);

  // Séquencement des requêtes : en changeant vite de filtre (chaud -> froid),
  // une réponse lente pourrait écraser une réponse plus récente. Seule la
  // dernière requête émise a le droit d'écrire dans l'état.
  const requeteEnCours = useRef(0);

  // ----- Chargement de la synthèse
  const loadSynthese = useCallback(async () => {
    if (!formationId) {
      requeteEnCours.current += 1;
      setSynthese(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const range = computeDateRange(periode, date, dateDebut, dateFin);
    // Plage incomplète : on attend que les deux bornes soient saisies
    if (!range) return;

    const requeteId = ++requeteEnCours.current;
    setIsLoading(true);
    setError(null);
    try {
      const data = await evaluationsService.getFormationSynthese(Number(formationId), {
        evaluationType,
        dateDebut: range.dateDebut,
        dateFin: range.dateFin,
      });
      if (requeteId !== requeteEnCours.current) return;
      setSynthese(data);
    } catch (err: any) {
      if (requeteId !== requeteEnCours.current) return;
      setError(
        err?.response?.data?.message
          || err?.message
          || 'Impossible de charger la synthèse des évaluations',
      );
      setSynthese(null);
    } finally {
      if (requeteId === requeteEnCours.current) {
        setIsLoading(false);
      }
    }
  }, [formationId, evaluationType, periode, date, dateDebut, dateFin]);

  useEffect(() => {
    loadSynthese();
  }, [loadSynthese]);

  const questions = synthese?.questions ?? [];

  const questionsFermees = useMemo(
    () => questions.filter((question) => question.type !== 'texte'),
    [questions],
  );

  const questionsTexte = useMemo(
    () => questions.filter((question) => question.type === 'texte' && (question.reponsesTexte?.length ?? 0) > 0),
    [questions],
  );

  const stats = synthese?.stats;
  const aucuneEvaluation = Boolean(synthese) && (stats?.totalEnvoyees ?? 0) === 0;

  return (
    <Container size="xl">
      <Group justify="space-between" mb="xl">
        <Group gap="md">
          <ThemeIcon size="xl" radius="md" variant="light" color="orange">
            <ChartLineUp size={28} weight="duotone" />
          </ThemeIcon>
          <div>
            <Title order={1}>Synthèse des évaluations</Title>
            <Text size="lg" c="dimmed" mt="xs">
              Retours des participants, toutes sessions confondues, pour une formation
            </Text>
          </div>
        </Group>
      </Group>

      {/* Filtres */}
      <Paper shadow="sm" p="lg" radius="md" withBorder mb="lg">
        <Stack gap="md">
          <Select
            label="Formation"
            placeholder="Sélectionnez une formation"
            data={formations}
            value={formationId}
            onChange={setFormationId}
            searchable
            clearable
            nothingFoundMessage="Aucune formation trouvée"
            maxDropdownHeight={320}
            disabled={formations.length === 0 && !formationsError}
          />

          {formationsError && (
            <Alert color="red" variant="light" icon={<Warning size={16} />}>
              {formationsError}
            </Alert>
          )}

          <Group gap="md" align="center" wrap="wrap">
            <SegmentedControl
              value={evaluationType}
              onChange={(value) => setEvaluationType(value as EvaluationMoment)}
              data={[
                { label: 'À chaud', value: 'chaud' },
                { label: 'À froid', value: 'froid' },
              ]}
            />

            <PeriodSelector
              periode={periode}
              date={date}
              dateDebut={dateDebut}
              dateFin={dateFin}
              onChange={(p, d) => { setPeriode(p); setDate(d); }}
              onDateRangeChange={(debut, fin) => { setDateDebut(debut); setDateFin(fin); }}
            />
          </Group>

          {periode === 'plage' && (!dateDebut || !dateFin) && (
            <Text size="xs" c="dimmed">
              Renseignez les deux bornes de la plage pour lancer la recherche.
            </Text>
          )}
        </Stack>
      </Paper>

      {/* États */}
      {!formationId ? (
        <Paper shadow="sm" p="xl" radius="md" withBorder>
          <Stack align="center" gap="sm" py="xl">
            <ThemeIcon size={56} radius="xl" variant="light" color="gray">
              <ClipboardText size={30} />
            </ThemeIcon>
            <Text fw={600}>Aucune formation sélectionnée</Text>
            <Text size="sm" c="dimmed" ta="center" maw={520}>
              Choisissez une formation ci-dessus pour consulter la synthèse de ses
              évaluations : taux de réponse, moyennes par question et sessions qui
              décrochent.
            </Text>
          </Stack>
        </Paper>
      ) : isLoading ? (
        <Center py="xl">
          <Loader size="lg" />
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
              onClick={loadSynthese}
            >
              Réessayer
            </Button>
          </Stack>
        </Alert>
      ) : !synthese ? null : aucuneEvaluation ? (
        <Alert color="blue" variant="light" icon={<Info size={16} />}>
          <Stack gap={4}>
            <Text size="sm" fw={500}>
              Aucune évaluation à {evaluationType === 'froid' ? 'froid' : 'chaud'} sur
              cette période pour « {synthese.formation.nomFormation} ».
            </Text>
            <Text size="sm">
              Élargissez la période, changez de type d&apos;évaluation, ou envoyez un
              questionnaire depuis le détail d&apos;une session.
            </Text>
          </Stack>
        </Alert>
      ) : (
        <Stack gap="lg">
          {/* Cartes de synthèse */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 5 }} spacing="md">
            <Card shadow="sm" radius="md" withBorder>
              <Text size="xs" c="dimmed">Sessions évaluées</Text>
              <Text fw={700} size="xl">{synthese.stats.nombreSessions}</Text>
            </Card>

            <Card shadow="sm" radius="md" withBorder>
              <Text size="xs" c="dimmed">Invitations envoyées</Text>
              <Text fw={700} size="xl">{synthese.stats.totalEnvoyees}</Text>
            </Card>

            <Card shadow="sm" radius="md" withBorder>
              <Text size="xs" c="dimmed">Réponses reçues</Text>
              <Text fw={700} size="xl" c="teal">{synthese.stats.totalRepondues}</Text>
            </Card>

            <Card shadow="sm" radius="md" withBorder>
              <Group gap="sm" wrap="nowrap">
                <RingProgress
                  size={64}
                  thickness={7}
                  roundCaps
                  sections={[{
                    value: synthese.stats.tauxReponse,
                    color: tauxColor(synthese.stats.tauxReponse),
                  }]}
                />
                <div>
                  <Text size="xs" c="dimmed">Taux de réponse</Text>
                  <Text fw={700} size="xl">{synthese.stats.tauxReponse}%</Text>
                </div>
              </Group>
            </Card>

            <Card shadow="sm" radius="md" withBorder>
              <Text size="xs" c="dimmed">Note moyenne globale</Text>
              {synthese.stats.moyenneGlobale !== null ? (
                <Group gap={6} align="baseline">
                  <Text fw={700} size="xl" c="orange">
                    {synthese.stats.moyenneGlobale.toFixed(2)}
                  </Text>
                  <Text size="sm" c="dimmed">/ 5</Text>
                </Group>
              ) : (
                <Text size="sm" c="dimmed" mt={6}>Aucune question notée</Text>
              )}
            </Card>
          </SimpleGrid>

          {/* Plusieurs questionnaires = questions non comparables */}
          {synthese.questionnaires.length > 1 && (
            <Alert color="blue" variant="light" icon={<Info size={16} />} title="Questionnaires multiples">
              <Stack gap={4}>
                <Text size="sm">
                  Plusieurs questionnaires ont été utilisés pour cette formation : les
                  questions ne sont pas nécessairement comparables d&apos;une session à
                  l&apos;autre.
                </Text>
                <Group gap="xs" mt={4}>
                  {synthese.questionnaires.map((questionnaire) => (
                    <Badge key={questionnaire.id} variant="light" color="blue">
                      {questionnaire.nom} ({questionnaire.nombreEvaluations})
                    </Badge>
                  ))}
                </Group>
              </Stack>
            </Alert>
          )}

          {/* Résultats par question */}
          <Paper shadow="sm" p="lg" radius="md" withBorder>
            <Text fw={600} size="lg">Résultats par question</Text>
            <Text size="sm" c="dimmed" mb="lg">
              Moyenne et répartition des réponses sur la période sélectionnée
            </Text>

            {questionsFermees.length === 0 ? (
              <Text size="sm" c="dimmed">
                Aucune question fermée exploitable sur cette période.
              </Text>
            ) : (
              <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
                {questionsFermees.map((question) => (
                  <Paper key={question.id} withBorder radius="md" p="md">
                    <Group justify="space-between" align="flex-start" mb="sm" wrap="nowrap">
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

                    {question.repartition && question.repartition.length > 0 ? (
                      <QuestionRepartitionChart
                        data={question.repartition}
                        filename={`evaluations-${synthese.formation.codeFormation || synthese.formation.id}-${question.id}`}
                        isNote={question.type === 'note'}
                      />
                    ) : (
                      <Text size="sm" c="dimmed">Aucune réponse à cette question.</Text>
                    )}
                  </Paper>
                ))}
              </SimpleGrid>
            )}
          </Paper>

          {/* Tableau des sessions */}
          <Paper shadow="sm" p="lg" radius="md" withBorder>
            <Text fw={600} size="lg">Sessions évaluées</Text>
            <Text size="sm" c="dimmed" mb="lg">
              Cliquez sur une ligne pour ouvrir le détail de la session
            </Text>

            {synthese.sessions.length === 0 ? (
              <Text size="sm" c="dimmed">Aucune session évaluée sur cette période.</Text>
            ) : (
              <Table.ScrollContainer minWidth={720}>
                <Table highlightOnHover striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Session</Table.Th>
                      <Table.Th>Date</Table.Th>
                      <Table.Th ta="right">Envoyées</Table.Th>
                      <Table.Th ta="right">Répondues</Table.Th>
                      <Table.Th>Taux</Table.Th>
                      <Table.Th ta="right">Moyenne</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {synthese.sessions.map((session) => (
                      <Table.Tr
                        key={`${session.type}-${session.sessionId}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => router.push(`/sessions/${session.sessionId}?type=${session.type}`)}
                      >
                        <Table.Td>
                          <Group gap="xs" wrap="nowrap">
                            <Badge
                              size="sm"
                              variant="light"
                              color={session.type === 'collective' ? 'grape' : 'blue'}
                            >
                              {session.type === 'collective' ? 'Collective' : 'Individuelle'}
                            </Badge>
                            <Text size="sm">{session.titre}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>{formatDate(session.dateDebut)}</Table.Td>
                        <Table.Td ta="right">{session.envoyees}</Table.Td>
                        <Table.Td ta="right">{session.repondues}</Table.Td>
                        <Table.Td>
                          <Group gap="xs" wrap="nowrap">
                            <Progress
                              value={session.tauxReponse}
                              color={tauxColor(session.tauxReponse)}
                              size="sm"
                              radius="sm"
                              w={90}
                            />
                            <Text size="sm" c="dimmed">{session.tauxReponse}%</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td ta="right">
                          {session.moyenneGlobale !== null ? (
                            <Text size="sm" fw={500} c="orange">
                              {session.moyenneGlobale.toFixed(2)} / 5
                            </Text>
                          ) : (
                            <Text size="sm" c="dimmed">—</Text>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Paper>

          {/* Réponses libres regroupées */}
          {questionsTexte.length > 0 && (
            <Paper shadow="sm" p="lg" radius="md" withBorder>
              <Text fw={600} size="lg">Réponses libres</Text>
              <Text size="sm" c="dimmed" mb="lg">
                Commentaires des participants, regroupés par question
              </Text>

              <Stack gap="lg">
                {questionsTexte.map((question) => (
                  <Box key={question.id}>
                    <Group gap="xs" mb="sm">
                      <Text size="sm" fw={500}>{question.libelle}</Text>
                      <Badge color="gray" variant="light">
                        {question.reponsesTexte?.length ?? 0}
                      </Badge>
                    </Group>

                    <Stack gap="sm">
                      {(question.reponsesTexte ?? []).map((reponse, index) => (
                        <Paper key={`${question.id}-${index}`} withBorder radius="sm" p="sm">
                          <Group gap="xs" mb={4}>
                            <ChatCircle size={14} />
                            <Text size="xs" fw={500}>{reponse.collaborateurNom}</Text>
                            <Text size="xs" c="dimmed">— {formatDate(reponse.date)}</Text>
                          </Group>
                          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                            {reponse.valeur}
                          </Text>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}
        </Stack>
      )}
    </Container>
  );
}
