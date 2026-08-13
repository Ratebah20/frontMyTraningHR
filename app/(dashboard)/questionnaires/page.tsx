'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Card,
  Badge,
  SimpleGrid,
  Center,
  Stack,
  Flex,
  Loader,
  Alert,
  Paper,
  Grid,
  Accordion,
  List,
  ThemeIcon,
  Box,
  Divider,
  ActionIcon,
  Button,
  Menu,
  Modal,
  SegmentedControl,
  Switch,
  Anchor,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { ClipboardText } from '@phosphor-icons/react/dist/ssr/ClipboardText';
import { ListChecks } from '@phosphor-icons/react/dist/ssr/ListChecks';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Circle } from '@phosphor-icons/react/dist/ssr/Circle';
import { ArrowsClockwise } from '@phosphor-icons/react/dist/ssr/ArrowsClockwise';
import { FunnelSimple } from '@phosphor-icons/react/dist/ssr/FunnelSimple';
import { Plus } from '@phosphor-icons/react/dist/ssr/Plus';
import { DotsThreeVertical } from '@phosphor-icons/react/dist/ssr/DotsThreeVertical';
import { PencilSimple } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { Copy } from '@phosphor-icons/react/dist/ssr/Copy';
import { Trash } from '@phosphor-icons/react/dist/ssr/Trash';
import { Star } from '@phosphor-icons/react/dist/ssr/Star';
import { Hourglass } from '@phosphor-icons/react/dist/ssr/Hourglass';
import { Calendar } from '@phosphor-icons/react/dist/ssr/Calendar';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr/ArrowUpRight';
import {
  getQuestionnaires,
  duplicateQuestionnaire,
  deleteQuestionnaire,
} from '@/lib/services/questionnaires.service';
import { QuestionnaireFormModal } from '@/components/questionnaires/QuestionnaireFormModal';
import type { Questionnaire, QuestionType } from '@/lib/types';

// Libellés et couleurs des types de question
const questionTypeConfig: Record<QuestionType, { label: string; color: string }> = {
  note: { label: 'Note', color: 'yellow' },
  texte: { label: 'Texte libre', color: 'blue' },
  choix: { label: 'Choix', color: 'grape' },
  oui_non: { label: 'Oui / Non', color: 'teal' },
};

/** Lien raccourci pour l'affichage sur les cartes (l'URL complète reste en href) */
const tronquerLien = (lien: string, max = 60): string =>
  lien.length > max ? `${lien.slice(0, max)}…` : lien;

export default function QuestionnairesPage() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres (appliqués côté client pour garder des statistiques complètes)
  const [typeFilter, setTypeFilter] = useState<'tous' | 'chaud' | 'froid'>('tous');
  const [showInactifs, setShowInactifs] = useState(false);

  // Éditeur
  const [formOpened, setFormOpened] = useState(false);
  const [editing, setEditing] = useState<Questionnaire | null>(null);

  // Suppression
  const [toDelete, setToDelete] = useState<Questionnaire | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null);

  // On charge toujours les inactifs : le Switch ne fait que filtrer l'affichage,
  // ce qui permet de garder des statistiques exactes.
  const loadQuestionnaires = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getQuestionnaires({ includeInactifs: true });
      setQuestionnaires(data);
    } catch (err: any) {
      console.error('Erreur lors du chargement des questionnaires:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Erreur lors du chargement des questionnaires',
      );
      setQuestionnaires([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestionnaires();
  }, []);

  const stats = useMemo(
    () => ({
      total: questionnaires.length,
      actifs: questionnaires.filter((q) => q.actif).length,
      // Un template porte SOIT un lien externe, SOIT des questions construites
      // dans l'outil : la règle est garantie côté serveur.
      avecLien: questionnaires.filter((q) => Boolean(q.lienUrl)).length,
      avecQuestions: questionnaires.filter((q) => !q.lienUrl).length,
    }),
    [questionnaires],
  );

  const filtered = useMemo(
    () =>
      questionnaires.filter((q) => {
        if (typeFilter !== 'tous' && q.type !== typeFilter) return false;
        if (!showInactifs && !q.actif) return false;
        return true;
      }),
    [questionnaires, typeFilter, showInactifs],
  );

  const hasActiveFilters = typeFilter !== 'tous' || !showInactifs;

  const handleCreate = () => {
    setEditing(null);
    setFormOpened(true);
  };

  const handleEdit = (questionnaire: Questionnaire) => {
    setEditing(questionnaire);
    setFormOpened(true);
  };

  const handleFormSuccess = () => {
    setFormOpened(false);
    setEditing(null);
    loadQuestionnaires();
  };

  const handleDuplicate = async (questionnaire: Questionnaire) => {
    setDuplicatingId(questionnaire.id);
    try {
      const copy = await duplicateQuestionnaire(questionnaire.id);
      notifications.show({
        title: 'Questionnaire dupliqué',
        message: `« ${copy.nom} » a été créé`,
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
      await loadQuestionnaires();
    } catch (err: any) {
      notifications.show({
        title: 'Erreur',
        message:
          err.response?.data?.message ||
          err.message ||
          'Erreur lors de la duplication du questionnaire',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteQuestionnaire(toDelete.id);
      notifications.show({
        title:
          result.action === 'desactive'
            ? 'Questionnaire désactivé'
            : 'Questionnaire supprimé',
        message:
          result.message ||
          (result.action === 'desactive'
            ? `« ${result.nom} » est utilisé par des sessions : il a été désactivé et non supprimé.`
            : `« ${result.nom} » a été supprimé définitivement.`),
        color: result.action === 'desactive' ? 'orange' : 'green',
        icon:
          result.action === 'desactive' ? <Warning size={20} /> : <CheckCircle size={20} />,
      });
      setToDelete(null);
      await loadQuestionnaires();
    } catch (err: any) {
      notifications.show({
        title: 'Erreur',
        message:
          err.response?.data?.message ||
          err.message ||
          'Erreur lors de la suppression du questionnaire',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Container size="xl">
      {/* En-tête */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Flex justify="space-between" align="flex-start" mb="md" gap="md" wrap="wrap">
          <div>
            <Group align="center" gap="sm">
              <ClipboardText size={32} color="#228BE6" />
              <Title order={1}>Questionnaires d'évaluation</Title>
            </Group>
            <Text size="lg" c="dimmed" mt="xs">
              Modèles de liens réutilisables (SharePoint, Forms…) : c'est le lien
              enregistré ici qui est envoyé au collaborateur quand une évaluation
              est demandée
            </Text>
          </div>
          <Group>
            <ActionIcon variant="light" size="lg" onClick={loadQuestionnaires}>
              <ArrowsClockwise size={20} />
            </ActionIcon>
            <Button leftSection={<Plus size={16} />} onClick={handleCreate}>
              Nouveau questionnaire
            </Button>
          </Group>
        </Flex>

        {/* Statistiques rapides */}
        <Grid mt="lg">
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Total
                  </Text>
                  <Text size="xl" fw={700}>{stats.total}</Text>
                </div>
                <ClipboardText size={24} color="#228BE6" />
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Actifs
                  </Text>
                  <Text size="xl" fw={700} c="green">{stats.actifs}</Text>
                </div>
                <CheckCircle size={24} color="#40C057" />
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Lien externe
                  </Text>
                  <Text size="xl" fw={700} c="teal">{stats.avecLien}</Text>
                </div>
                <ArrowUpRight size={24} color="#12B886" />
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Questions internes
                  </Text>
                  <Text size="xl" fw={700} c="grape">{stats.avecQuestions}</Text>
                </div>
                <ListChecks size={24} color="#BE4BDB" />
              </Group>
            </Paper>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Filtres */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Group align="center" mb="md">
          <FunnelSimple size={20} />
          <Text fw={600}>Filtres</Text>
        </Group>
        <Group justify="space-between" align="center" gap="md" wrap="wrap">
          <SegmentedControl
            value={typeFilter}
            onChange={(value) => setTypeFilter(value as 'tous' | 'chaud' | 'froid')}
            data={[
              { value: 'tous', label: 'Tous' },
              { value: 'chaud', label: 'À chaud' },
              { value: 'froid', label: 'À froid' },
            ]}
          />
          <Switch
            label="Afficher les inactifs"
            checked={showInactifs}
            onChange={(event) => setShowInactifs(event.currentTarget.checked)}
          />
        </Group>
      </Paper>

      {/* Liste des questionnaires */}
      {isLoading ? (
        <Center h={300}>
          <Stack align="center">
            <Loader size="lg" />
            <Text c="dimmed">Chargement des questionnaires...</Text>
          </Stack>
        </Center>
      ) : error ? (
        <Alert icon={<Warning size={16} />} color="red" variant="light">
          {error}
        </Alert>
      ) : filtered.length > 0 ? (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          {filtered.map((questionnaire) => (
            <Card
              key={questionnaire.id}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{
                borderColor: questionnaire.actif
                  ? 'var(--mantine-color-gray-3)'
                  : 'var(--mantine-color-red-2)',
              }}
            >
              {/* En-tête de la carte */}
              <Group justify="space-between" mb="md" wrap="nowrap" align="flex-start">
                <div style={{ flex: 1 }}>
                  <Text fw={700} size="lg" mb="xs">
                    {questionnaire.nom}
                  </Text>

                  <Group gap="xs" mb="xs">
                    <Badge
                      variant="light"
                      size="sm"
                      color={questionnaire.type === 'chaud' ? 'orange' : 'blue'}
                      leftSection={
                        questionnaire.type === 'chaud' ? (
                          <Star size={12} />
                        ) : (
                          <Hourglass size={12} />
                        )
                      }
                    >
                      {questionnaire.type === 'chaud' ? 'À chaud' : 'À froid'}
                    </Badge>
                    <Badge
                      size="sm"
                      variant="dot"
                      color={questionnaire.actif ? 'green' : 'red'}
                    >
                      {questionnaire.actif ? 'Actif' : 'Inactif'}
                    </Badge>
                    {/* Mode du questionnaire : le lien prime sur les questions */}
                    <Badge
                      size="sm"
                      variant="filled"
                      color={questionnaire.lienUrl ? 'teal' : 'grape'}
                      leftSection={
                        questionnaire.lienUrl ? (
                          <ArrowUpRight size={12} />
                        ) : (
                          <ListChecks size={12} />
                        )
                      }
                    >
                      {questionnaire.lienUrl ? 'Lien externe' : 'Questions internes'}
                    </Badge>
                  </Group>

                  {questionnaire.description && (
                    <Text size="sm" c="dimmed" mb="xs">
                      {questionnaire.description}
                    </Text>
                  )}

                  {questionnaire.lienUrl && (
                    <Group gap={6} mb="xs" wrap="nowrap" align="center">
                      <ArrowUpRight size={14} color="#12B886" />
                      <Anchor
                        href={questionnaire.lienUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="sm"
                        lineClamp={1}
                        title={questionnaire.lienUrl}
                        onClick={(event) => event.stopPropagation()}
                      >
                        {tronquerLien(questionnaire.lienUrl)}
                      </Anchor>
                    </Group>
                  )}

                  <Group gap="xs">
                    {questionnaire.nombreQuestions > 0 && (
                      <Badge variant="outline" size="sm">
                        {questionnaire.nombreQuestions} question
                        {questionnaire.nombreQuestions > 1 ? 's' : ''}
                      </Badge>
                    )}
                    <Badge variant="outline" size="sm" color="grape">
                      {questionnaire.nombreSessionsLiees} session
                      {questionnaire.nombreSessionsLiees > 1 ? 's' : ''} liée
                      {questionnaire.nombreSessionsLiees > 1 ? 's' : ''}
                    </Badge>
                    <Badge variant="outline" size="sm" color="teal">
                      {questionnaire.nombreEvaluations} évaluation
                      {questionnaire.nombreEvaluations > 1 ? 's' : ''}
                    </Badge>
                  </Group>
                </div>

                <Menu shadow="md" width={200} position="bottom-end">
                  <Menu.Target>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      loading={duplicatingId === questionnaire.id}
                    >
                      <DotsThreeVertical size={20} weight="bold" />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<PencilSimple size={16} />}
                      onClick={() => handleEdit(questionnaire)}
                    >
                      Modifier
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<Copy size={16} />}
                      onClick={() => handleDuplicate(questionnaire)}
                    >
                      Dupliquer
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      color="red"
                      leftSection={<Trash size={16} />}
                      onClick={() => setToDelete(questionnaire)}
                    >
                      Supprimer
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>

              <Divider my="md" />

              {/* Aperçu des questions : uniquement pour les questionnaires
                  construits dans l'outil (ancien mode). */}
              {questionnaire.questions.length === 0 ? (
                <Text size="sm" c="dimmed">
                  {questionnaire.lienUrl
                    ? 'Questionnaire hébergé à l\'extérieur : les réponses sont collectées sur le site du lien, pas dans MyTrainingHQ.'
                    : 'Ce questionnaire ne contient ni lien ni question : modifiez-le pour le rendre exploitable.'}
                </Text>
              ) : (
              <Accordion variant="contained">
                <Accordion.Item value="questions">
                  <Accordion.Control>
                    <Group gap="xs">
                      <ListChecks size={18} />
                      <Text fw={600}>
                        Aperçu des questions ({questionnaire.questions.length})
                      </Text>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    {questionnaire.questions.length > 0 ? (
                      <List
                        spacing="sm"
                        size="sm"
                        center
                        icon={
                          <ThemeIcon color="blue" size={20} radius="xl">
                            <Circle size={12} weight="fill" />
                          </ThemeIcon>
                        }
                      >
                        {questionnaire.questions.map((question) => (
                          <List.Item key={question.id}>
                            <Box>
                              <Group gap="xs" mb={4}>
                                <Text fw={500}>
                                  {question.libelle}
                                  {question.obligatoire && (
                                    <Text span c="red"> *</Text>
                                  )}
                                </Text>
                                <Badge
                                  size="xs"
                                  variant="light"
                                  color={questionTypeConfig[question.type]?.color || 'gray'}
                                >
                                  {questionTypeConfig[question.type]?.label || question.type}
                                </Badge>
                              </Group>
                              {question.type === 'choix' && question.options && (
                                <Text size="xs" c="dimmed">
                                  Options : {question.options.join(' · ')}
                                </Text>
                              )}
                              <Text size="xs" c="dimmed">
                                {question.id}
                              </Text>
                            </Box>
                          </List.Item>
                        ))}
                      </List>
                    ) : (
                      <Text size="sm" c="dimmed" ta="center" py="md">
                        Aucune question dans ce questionnaire
                      </Text>
                    )}
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
              )}

              {/* Métadonnées */}
              <Box mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                <Group justify="space-between">
                  <Group gap={4}>
                    <Calendar size={12} color="#868E96" />
                    <Text size="xs" c="dimmed">
                      Créé le {new Date(questionnaire.dateCreation).toLocaleDateString('fr-FR')}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    Modifié le{' '}
                    {new Date(questionnaire.dateModification).toLocaleDateString('fr-FR')}
                  </Text>
                </Group>
              </Box>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Paper shadow="xs" p="xl" radius="md">
          <Center py="xl">
            <Stack align="center">
              <ClipboardText size={48} color="#868E96" />
              <Text size="lg" fw={500} c="dimmed">
                Aucun questionnaire trouvé
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                {questionnaires.length > 0 && hasActiveFilters
                  ? 'Essayez de modifier vos critères de filtre'
                  : 'Créez un premier modèle en collant le lien du questionnaire (SharePoint, Forms…) à envoyer aux collaborateurs'}
              </Text>
              <Button
                mt="sm"
                variant="light"
                leftSection={<Plus size={16} />}
                onClick={handleCreate}
              >
                Nouveau questionnaire
              </Button>
            </Stack>
          </Center>
        </Paper>
      )}

      {/* Éditeur de questionnaire */}
      <QuestionnaireFormModal
        opened={formOpened}
        onClose={() => {
          setFormOpened(false);
          setEditing(null);
        }}
        questionnaire={editing}
        onSuccess={handleFormSuccess}
      />

      {/* Confirmation de suppression */}
      <Modal
        opened={Boolean(toDelete)}
        onClose={() => !isDeleting && setToDelete(null)}
        title={<Text fw={600}>Supprimer le questionnaire</Text>}
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Voulez-vous vraiment supprimer le questionnaire{' '}
            <Text span fw={600}>« {toDelete?.nom} »</Text> ?
          </Text>

          <Alert color="orange" variant="light" icon={<Warning size={16} />}>
            <Text size="sm">
              Si ce questionnaire est <strong>utilisé par des sessions ou des
              évaluations déjà envoyées</strong>, il ne sera pas supprimé mais{' '}
              <strong>désactivé</strong> : il disparaîtra des choix proposés à la
              création d'une session, tout en préservant les réponses déjà collectées.
            </Text>
          </Alert>

          {toDelete && (toDelete.nombreSessionsLiees > 0 || toDelete.nombreEvaluations > 0) && (
            <Text size="sm" c="dimmed">
              Ce questionnaire est actuellement lié à{' '}
              <strong>{toDelete.nombreSessionsLiees}</strong> session(s) et{' '}
              <strong>{toDelete.nombreEvaluations}</strong> évaluation(s).
            </Text>
          )}

          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setToDelete(null)} disabled={isDeleting}>
              Annuler
            </Button>
            <Button
              color="red"
              loading={isDeleting}
              leftSection={<Trash size={16} />}
              onClick={handleDelete}
            >
              Confirmer
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
