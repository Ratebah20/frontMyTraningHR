'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
  Card,
  Text,
  Alert,
  ActionIcon,
  Tooltip,
  Switch,
  Checkbox,
  Badge,
  Divider,
  Box,
  ScrollArea,
  Accordion,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { Plus } from '@phosphor-icons/react/dist/ssr/Plus';
import { Trash } from '@phosphor-icons/react/dist/ssr/Trash';
import { ArrowUp } from '@phosphor-icons/react/dist/ssr/ArrowUp';
import { ArrowDown } from '@phosphor-icons/react/dist/ssr/ArrowDown';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr/ArrowUpRight';
import { ListChecks } from '@phosphor-icons/react/dist/ssr/ListChecks';
import { ClipboardText } from '@phosphor-icons/react/dist/ssr/ClipboardText';
import {
  createQuestionnaire,
  updateQuestionnaire,
} from '@/lib/services/questionnaires.service';
import { MAX_LONGUEUR_LIEN_URL } from '@/lib/types';
import type {
  Question,
  Questionnaire,
  QuestionType,
  QuestionnaireType,
  CreateQuestionnaireDto,
  UpdateQuestionnaireDto,
} from '@/lib/types';

/** Nombre maximum de questions accepté par le backend */
const MAX_QUESTIONS = 50;

/**
 * Contrôle du lien VOLONTAIREMENT PERMISSIF, copié sur le backend
 * (`LIEN_URL_REGEX`) : les liens SharePoint intranet n'ont pas toujours de TLD
 * et les URL Forms à rallonge (paramètres encodés, accolades…) doivent passer.
 * On vérifie donc uniquement qu'il s'agit d'une adresse ABSOLUE.
 */
const LIEN_URL_REGEX = /^https?:\/\/\S/i;

/** Message de la règle « lien OU questions », aligné sur le message serveur */
const MESSAGE_TEMPLATE_VIDE =
  'Un questionnaire doit contenir soit un lien externe, soit au moins une question.';

export const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'note', label: 'Note (1 à 5 étoiles)' },
  { value: 'texte', label: 'Texte libre' },
  { value: 'choix', label: 'Choix parmi une liste' },
  { value: 'oui_non', label: 'Oui / Non' },
];

/**
 * Ligne de question dans l'éditeur.
 * - `id` non nul  : question déjà enregistrée côté serveur -> identifiant GELÉ
 *   (c'est la clé de stockage des réponses, le modifier orphelinerait les
 *   réponses déjà collectées).
 * - `id` nul      : nouvelle question -> l'identifiant est dérivé du libellé
 *   au moment de l'enregistrement (aperçu affiché en direct).
 */
interface QuestionDraft {
  /** Clé React locale, jamais envoyée au backend */
  key: string;
  id: string | null;
  libelle: string;
  type: QuestionType;
  obligatoire: boolean;
  options: string[];
}

let draftKeyCounter = 0;
const nextDraftKey = () => `q_${Date.now()}_${draftKeyCounter++}`;

/** Marques diacritiques Unicode (accents) à retirer après normalisation NFD */
const DIACRITICS_REGEX = new RegExp('[\\u0300-\\u036f]', 'g');

/** Slug ASCII snake_case, sans accent, dérivé du libellé */
export function slugifyQuestionId(libelle: string): string {
  const slug = libelle
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '') // supprime les diacritiques
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60)
    .replace(/_+$/g, '');

  return slug || 'question';
}

/** Slug unique : suffixe numérique en cas de collision */
function uniqueQuestionId(libelle: string, used: Set<string>): string {
  const base = slugifyQuestionId(libelle);
  if (!used.has(base)) return base;

  let index = 2;
  while (used.has(`${base}_${index}`)) index += 1;
  return `${base}_${index}`;
}

const emptyDraft = (): QuestionDraft => ({
  key: nextDraftKey(),
  id: null,
  libelle: '',
  type: 'note',
  obligatoire: true,
  options: [],
});

interface QuestionnaireFormModalProps {
  opened: boolean;
  onClose: () => void;
  /** null = création, sinon édition */
  questionnaire: Questionnaire | null;
  onSuccess: (questionnaire: Questionnaire) => void;
}

export function QuestionnaireFormModal({
  opened,
  onClose,
  questionnaire,
  onSuccess,
}: QuestionnaireFormModalProps) {
  const isEdit = Boolean(questionnaire);

  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [lienUrl, setLienUrl] = useState('');
  const [type, setType] = useState<QuestionnaireType>('chaud');
  const [actif, setActif] = useState(true);
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);

  // Section « questions » : repliée par défaut (l'éditeur de questions est
  // désormais l'ANCIEN mode). Elle s'ouvre d'office à l'édition d'un
  // questionnaire qui en contient déjà, pour rester modifiable sans chercher.
  const [questionsPanel, setQuestionsPanel] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /** Nombre de questions présentes à l'ouverture : sert à savoir s'il faut
   *  envoyer `questions: []` pour les effacer (champ absent = inchangé). */
  const [questionsInitiales, setQuestionsInitiales] = useState(0);

  // (Ré)initialiser le formulaire à chaque ouverture
  useEffect(() => {
    if (!opened) return;

    setFormError(null);
    setIsSubmitting(false);

    if (questionnaire) {
      const existantes = questionnaire.questions || [];
      setNom(questionnaire.nom);
      setDescription(questionnaire.description || '');
      setLienUrl(questionnaire.lienUrl || '');
      setType(questionnaire.type);
      setActif(questionnaire.actif);
      setQuestions(
        existantes.map((q) => ({
          key: nextDraftKey(),
          id: q.id, // identifiant gelé
          libelle: q.libelle,
          type: q.type,
          obligatoire: q.obligatoire,
          options: q.options ? [...q.options] : [],
        })),
      );
      setQuestionsInitiales(existantes.length);
      setQuestionsPanel(existantes.length > 0 ? 'questions' : null);
    } else {
      setNom('');
      setDescription('');
      setLienUrl('');
      setType('chaud');
      setActif(true);
      setQuestions([]);
      setQuestionsInitiales(0);
      setQuestionsPanel(null);
    }
  }, [opened, questionnaire]);

  const patchQuestion = (index: number, patch: Partial<QuestionDraft>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    );
  };

  const addQuestion = () => {
    if (questions.length >= MAX_QUESTIONS) return;
    setQuestions((prev) => [...prev, emptyDraft()]);
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    setQuestions((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addOption = (index: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, options: [...q.options, ''] } : q)),
    );
  };

  const patchOption = (index: number, optionIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === index
          ? { ...q, options: q.options.map((o, oi) => (oi === optionIndex ? value : o)) }
          : q,
      ),
    );
  };

  const removeOption = (index: number, optionIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === index
          ? { ...q, options: q.options.filter((_, oi) => oi !== optionIndex) }
          : q,
      ),
    );
  };

  /**
   * Construit la liste finale de questions :
   * - `ordre` recalculé de 0 à n
   * - identifiants gelés conservés, nouveaux identifiants dérivés du libellé
   * Renvoie une erreur lisible si la validation client échoue.
   */
  const buildQuestions = (): { questions?: Question[]; error?: string } => {
    // 0 question est désormais VALIDE : un template « lien externe » n'en a
    // aucune. La règle « lien OU questions » est vérifiée dans handleSubmit.
    if (questions.length === 0) {
      return { questions: [] };
    }
    if (questions.length > MAX_QUESTIONS) {
      return { error: `Un questionnaire ne peut pas dépasser ${MAX_QUESTIONS} questions.` };
    }

    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      if (!q.libelle.trim()) {
        return { error: `Le libellé de la question ${i + 1} est obligatoire.` };
      }
      if (q.type === 'choix') {
        const cleanOptions = q.options.map((o) => o.trim()).filter(Boolean);
        if (cleanOptions.length === 0) {
          return {
            error: `La question ${i + 1} est de type « Choix » : ajoutez au moins une option de réponse.`,
          };
        }
        if (new Set(cleanOptions).size !== cleanOptions.length) {
          return { error: `Les options de la question ${i + 1} doivent être différentes.` };
        }
      }
    }

    // Les identifiants gelés sont réservés en premier pour que les nouvelles
    // questions reçoivent un suffixe numérique en cas de collision.
    const frozenIds = questions
      .map((q) => q.id)
      .filter((id): id is string => Boolean(id));
    const used = new Set<string>(frozenIds);

    if (used.size !== frozenIds.length) {
      return { error: 'Deux questions portent le même identifiant. Supprimez le doublon.' };
    }

    const built: Question[] = questions.map((q, index) => {
      const id = q.id ?? uniqueQuestionId(q.libelle, used);
      used.add(id);

      const question: Question = {
        id,
        libelle: q.libelle.trim(),
        type: q.type,
        obligatoire: q.obligatoire,
        ordre: index,
      };

      if (q.type === 'choix') {
        question.options = q.options.map((o) => o.trim()).filter(Boolean);
      }

      return question;
    });

    return { questions: built };
  };

  const handleSubmit = async () => {
    setFormError(null);

    if (!nom.trim()) {
      setFormError('Le nom du questionnaire est obligatoire.');
      return;
    }

    const lien = lienUrl.trim();
    if (lien) {
      if (!LIEN_URL_REGEX.test(lien)) {
        setFormError(
          'Le lien doit être une adresse complète commençant par « http:// » ou « https:// ». Copiez-collez l\'adresse telle qu\'elle apparaît dans votre navigateur.',
        );
        return;
      }
      if (lien.length > MAX_LONGUEUR_LIEN_URL) {
        setFormError(
          `Le lien ne peut pas dépasser ${MAX_LONGUEUR_LIEN_URL} caractères.`,
        );
        return;
      }
    }

    const { questions: builtQuestions, error } = buildQuestions();
    if (error || !builtQuestions) {
      setFormError(error || 'Le questionnaire est invalide.');
      return;
    }

    // Même règle que le serveur : un template vide (ni lien ni question) est refusé
    if (!lien && builtQuestions.length === 0) {
      setFormError(MESSAGE_TEMPLATE_VIDE);
      setQuestionsPanel('questions');
      return;
    }

    setIsSubmitting(true);
    try {
      // `questions` absent = questions INCHANGÉES côté backend. On n'envoie donc
      // un tableau vide que pour effacer des questions qui existaient.
      const envoyerQuestions =
        builtQuestions.length > 0 || questionsInitiales > 0;

      const payload: CreateQuestionnaireDto & UpdateQuestionnaireDto = {
        nom: nom.trim(),
        description: description.trim() || null,
        type,
        // null efface le lien existant côté backend
        lienUrl: lien || null,
        ...(envoyerQuestions ? { questions: builtQuestions } : {}),
        actif,
      };

      const result = questionnaire
        ? await updateQuestionnaire(questionnaire.id, payload)
        : await createQuestionnaire(payload);

      notifications.show({
        title: isEdit ? 'Questionnaire modifié' : 'Questionnaire créé',
        message: `${result.nom} a été ${isEdit ? 'mis à jour' : 'créé'} avec succès`,
        color: 'green',
        icon: <CheckCircle size={20} />,
      });

      onSuccess(result);
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Erreur lors de l\'enregistrement du questionnaire';
      setFormError(Array.isArray(message) ? message.join(' — ') : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ClipboardText size={20} />
          <Text fw={600} size="lg">
            {isEdit ? 'Modifier le questionnaire' : 'Nouveau questionnaire'}
          </Text>
        </Group>
      }
      size="xl"
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md">
        {/* Lien externe : champ PRINCIPAL du questionnaire */}
        <Card shadow="xs" p="md" radius="md" withBorder>
          <Group gap="xs" mb="md">
            <ArrowUpRight size={18} />
            <Text fw={600}>Lien du questionnaire</Text>
            <Badge variant="light" size="sm">
              Mode principal
            </Badge>
          </Group>
          <Stack gap="sm">
            <TextInput
              label="Lien vers le questionnaire (SharePoint, Forms…)"
              placeholder="https://forms.office.com/e/abc123"
              value={lienUrl}
              onChange={(event) => setLienUrl(event.currentTarget.value)}
              description="C'est ce lien qui sera envoyé au collaborateur dans l'email d'évaluation. Chaque questionnaire peut pointer vers un lien différent."
              maxLength={MAX_LONGUEUR_LIEN_URL}
              leftSection={<ArrowUpRight size={16} />}
            />
            <Text size="xs" c="dimmed">
              Collez l'adresse telle qu'elle apparaît dans votre navigateur
              (« http:// » ou « https:// »). Les réponses restent hébergées sur
              l'outil externe : elles ne remonteront pas dans MyTrainingHQ.
            </Text>
          </Stack>
        </Card>

        {/* Informations générales */}
        <Card shadow="xs" p="md" radius="md" withBorder>
          <Text fw={600} mb="md">Informations générales</Text>
          <Stack gap="md">
            <TextInput
              label="Nom du questionnaire"
              placeholder="Ex: Semaine de l'IA — évaluation"
              required
              value={nom}
              onChange={(event) => setNom(event.currentTarget.value)}
            />

            <Textarea
              label="Description"
              placeholder="À quoi sert ce questionnaire ? (optionnel)"
              autosize
              minRows={2}
              value={description}
              onChange={(event) => setDescription(event.currentTarget.value)}
            />

            <Group grow align="flex-start">
              <Select
                label="Type d'évaluation"
                required
                allowDeselect={false}
                data={[
                  { value: 'chaud', label: 'À chaud (juste après la formation)' },
                  { value: 'froid', label: 'À froid (quelques mois après)' },
                ]}
                value={type}
                onChange={(value) => setType((value as QuestionnaireType) || 'chaud')}
              />

              <Box pt={26}>
                <Switch
                  label="Questionnaire actif"
                  description="Seuls les questionnaires actifs sont proposés à la création d'une session"
                  checked={actif}
                  onChange={(event) => setActif(event.currentTarget.checked)}
                />
              </Box>
            </Group>
          </Stack>
        </Card>

        {/* Questions : ANCIEN mode, replié par défaut. Conservé pour que les
            questionnaires déjà construits dans l'outil restent modifiables. */}
        <Accordion
          variant="contained"
          value={questionsPanel}
          onChange={setQuestionsPanel}
        >
          <Accordion.Item value="questions">
            <Accordion.Control>
              <Group gap="xs">
                <ListChecks size={18} />
                <Text fw={600}>
                  Construire le questionnaire dans l'outil — optionnel
                </Text>
                <Badge variant="light" size="sm" color={questions.length > 0 ? 'blue' : 'gray'}>
                  {questions.length} / {MAX_QUESTIONS}
                </Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                <Text size="sm" c="dimmed">
                  Ancien mode : les questions sont saisies ici et le collaborateur
                  répond directement dans MyTrainingHQ. Inutile si vous avez renseigné
                  un lien ci-dessus.
                </Text>

                <Group justify="flex-end">
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<Plus size={14} />}
                    onClick={addQuestion}
                    disabled={questions.length >= MAX_QUESTIONS}
                  >
                    Ajouter une question
                  </Button>
                </Group>

                {questions.length === 0 ? (
                  <Alert color="gray" variant="light" icon={<ListChecks size={16} />}>
                    Aucune question : ce questionnaire fonctionne uniquement avec le
                    lien externe renseigné ci-dessus.
                  </Alert>
                ) : (
                  <Stack gap="sm">
                    {questions.map((question, index) => {
                      const previewId =
                        question.id ??
                        (question.libelle.trim() ? slugifyQuestionId(question.libelle) : '—');

                      return (
                        <Card key={question.key} p="md" radius="md" withBorder>
                          <Group justify="space-between" mb="xs" wrap="nowrap">
                            <Badge variant="filled" size="sm" circle>
                              {index + 1}
                            </Badge>
                            <Group gap={4} wrap="nowrap">
                              <Tooltip label="Monter">
                                <ActionIcon
                                  variant="subtle"
                                  size="sm"
                                  disabled={index === 0}
                                  onClick={() => moveQuestion(index, -1)}
                                >
                                  <ArrowUp size={16} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Descendre">
                                <ActionIcon
                                  variant="subtle"
                                  size="sm"
                                  disabled={index === questions.length - 1}
                                  onClick={() => moveQuestion(index, 1)}
                                >
                                  <ArrowDown size={16} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Supprimer la question">
                                <ActionIcon
                                  variant="subtle"
                                  color="red"
                                  size="sm"
                                  onClick={() => removeQuestion(index)}
                                >
                                  <Trash size={16} />
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                          </Group>

                          <Stack gap="sm">
                            <div>
                              <TextInput
                                label="Libellé de la question"
                                placeholder="Ex: Comment jugez-vous la qualité du formateur ?"
                                required
                                value={question.libelle}
                                onChange={(event) =>
                                  patchQuestion(index, { libelle: event.currentTarget.value })
                                }
                              />
                              <Text size="xs" c="dimmed" mt={4}>
                                Identifiant : {previewId}
                                {question.id
                                  ? ' (non modifiable — clé de stockage des réponses)'
                                  : ' (généré à l\'enregistrement)'}
                              </Text>
                            </div>

                            <Group grow align="flex-start">
                              <Select
                                label="Type de réponse"
                                allowDeselect={false}
                                data={QUESTION_TYPE_OPTIONS}
                                value={question.type}
                                onChange={(value) => {
                                  const newType = (value as QuestionType) || 'note';
                                  patchQuestion(index, {
                                    type: newType,
                                    // Une seule option vide pour amorcer la saisie
                                    options:
                                      newType === 'choix' && question.options.length === 0
                                        ? ['']
                                        : question.options,
                                  });
                                }}
                              />
                              <Box pt={26}>
                                <Checkbox
                                  label="Réponse obligatoire"
                                  checked={question.obligatoire}
                                  onChange={(event) =>
                                    patchQuestion(index, { obligatoire: event.currentTarget.checked })
                                  }
                                />
                              </Box>
                            </Group>

                            {question.type === 'choix' && (
                              <>
                                <Divider label="Options de réponse" labelPosition="left" />
                                <Stack gap="xs">
                                  {question.options.length === 0 && (
                                    <Text size="xs" c="red">
                                      Au moins une option est requise pour une question de type « Choix ».
                                    </Text>
                                  )}
                                  {question.options.map((option, optionIndex) => (
                                    <Group key={optionIndex} gap="xs" wrap="nowrap">
                                      <TextInput
                                        placeholder={`Option ${optionIndex + 1}`}
                                        value={option}
                                        onChange={(event) =>
                                          patchOption(index, optionIndex, event.currentTarget.value)
                                        }
                                        style={{ flex: 1 }}
                                      />
                                      <ActionIcon
                                        variant="subtle"
                                        color="red"
                                        onClick={() => removeOption(index, optionIndex)}
                                      >
                                        <Trash size={16} />
                                      </ActionIcon>
                                    </Group>
                                  ))}
                                  <Button
                                    size="xs"
                                    variant="subtle"
                                    leftSection={<Plus size={14} />}
                                    onClick={() => addOption(index)}
                                    style={{ alignSelf: 'flex-start' }}
                                  >
                                    Ajouter une option
                                  </Button>
                                </Stack>
                              </>
                            )}
                          </Stack>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

        {formError && (
          <Alert color="red" variant="light" icon={<Warning size={16} />}>
            {formError}
          </Alert>
        )}

        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            loading={isSubmitting}
            leftSection={<CheckCircle size={16} />}
            onClick={handleSubmit}
          >
            {isEdit ? 'Enregistrer les modifications' : 'Créer le questionnaire'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
