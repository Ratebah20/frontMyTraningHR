'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Stack,
  Title,
  Text,
  ThemeIcon,
  Alert,
  Button,
  Rating,
  Select,
  Textarea,
  Group,
  Loader,
  Center,
  Divider,
  Badge,
  Box,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle';
import { PaperPlaneTilt } from '@phosphor-icons/react/dist/ssr/PaperPlaneTilt';
import {
  evaluationsService,
  EvaluationContext,
} from '@/lib/services/evaluations.service';

interface Props {
  params: {
    token: string;
  };
}

export default function EvaluationPage({ params }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [context, setContext] = useState<EvaluationContext | null>(null);
  const [invalidToken, setInvalidToken] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Champs évaluation à chaud (collaborateur)
  const [noteGlobale, setNoteGlobale] = useState(0);
  const [noteContenu, setNoteContenu] = useState(0);
  const [noteFormateur, setNoteFormateur] = useState(0);
  const [commentaire, setCommentaire] = useState('');

  // Champs évaluation à froid (manager)
  const [competences, setCompetences] = useState<string | null>(null);
  const [impactObserve, setImpactObserve] = useState('');
  const [noteUtilite, setNoteUtilite] = useState(0);

  useEffect(() => {
    const loadContext = async () => {
      setIsLoading(true);
      try {
        const data = await evaluationsService.getByToken(params.token);
        setContext(data);
        if (data.statut === 'complete') {
          setAlreadyCompleted(true);
        }
      } catch (error: any) {
        setInvalidToken(true);
      } finally {
        setIsLoading(false);
      }
    };
    loadContext();
  }, [params.token]);

  const handleSubmit = async () => {
    if (!context) return;
    setFormError(null);

    let reponses: Record<string, any>;

    if (context.type === 'chaud') {
      if (noteGlobale < 1 || noteContenu < 1 || noteFormateur < 1) {
        setFormError('Merci de renseigner les trois notes (de 1 à 5 étoiles).');
        return;
      }
      reponses = {
        noteGlobale,
        noteContenu,
        noteFormateur,
        commentaire: commentaire.trim() || null,
      };
    } else {
      if (!competences || noteUtilite < 1) {
        setFormError('Merci de renseigner la mise en pratique des compétences et la note d\'utilité.');
        return;
      }
      reponses = {
        competencesMisesEnPratique: competences,
        impactObserve: impactObserve.trim() || null,
        noteUtilite,
      };
    }

    setIsSubmitting(true);
    try {
      await evaluationsService.submitByToken(params.token, reponses);
      setSubmitted(true);
    } catch (error: any) {
      if (error.response?.status === 409) {
        setAlreadyCompleted(true);
        return;
      }
      const message =
        error.response?.data?.message ||
        error.message ||
        'Une erreur est survenue lors de l\'envoi de votre évaluation.';
      notifications.show({
        title: 'Erreur',
        message,
        color: 'red',
        icon: <WarningCircle size={20} />,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderShell = (children: React.ReactNode) => (
    <Box style={{ minHeight: '100vh', backgroundColor: 'var(--mantine-color-gray-0)' }} py={60}>
      <Container size="xs">
        <Paper radius="lg" p="xl" shadow="md" withBorder>
          {children}
        </Paper>
        <Text size="xs" c="dimmed" ta="center" mt="md">
          MyTrainingHQ — Évaluation des formations
        </Text>
      </Container>
    </Box>
  );

  if (isLoading) {
    return renderShell(
      <Center py="xl">
        <Stack align="center" gap="sm">
          <Loader size="lg" />
          <Text c="dimmed">Chargement de l'évaluation...</Text>
        </Stack>
      </Center>
    );
  }

  if (invalidToken || !context) {
    return renderShell(
      <Stack align="center" gap="md" py="md">
        <ThemeIcon size={60} radius="xl" color="red" variant="light">
          <WarningCircle size={35} weight="duotone" />
        </ThemeIcon>
        <Title order={2} ta="center">Lien invalide</Title>
        <Text c="dimmed" ta="center">
          Ce lien d'évaluation est invalide ou n'existe plus. Veuillez contacter
          votre service RH si vous pensez qu'il s'agit d'une erreur.
        </Text>
      </Stack>
    );
  }

  if (submitted) {
    return renderShell(
      <Stack align="center" gap="md" py="md">
        <ThemeIcon size={60} radius="xl" color="green" variant="light">
          <CheckCircle size={35} weight="duotone" />
        </ThemeIcon>
        <Title order={2} ta="center">Merci !</Title>
        <Text c="dimmed" ta="center">
          Votre évaluation a bien été enregistrée. Vous pouvez fermer cette page.
        </Text>
      </Stack>
    );
  }

  if (alreadyCompleted) {
    return renderShell(
      <Stack align="center" gap="md" py="md">
        <ThemeIcon size={60} radius="xl" color="blue" variant="light">
          <CheckCircle size={35} weight="duotone" />
        </ThemeIcon>
        <Title order={2} ta="center">Évaluation déjà complétée</Title>
        <Text c="dimmed" ta="center">
          Cette évaluation a déjà été renseignée. Merci pour votre participation !
        </Text>
      </Stack>
    );
  }

  const isChaud = context.type === 'chaud';

  return renderShell(
    <Stack gap="lg">
      <Stack align="center" gap="xs">
        <ThemeIcon size={60} radius="xl" variant="light" color={isChaud ? 'orange' : 'blue'}>
          <GraduationCap size={35} weight="duotone" />
        </ThemeIcon>
        <Badge variant="light" color={isChaud ? 'orange' : 'blue'}>
          {isChaud ? 'Évaluation à chaud' : 'Évaluation à froid'}
        </Badge>
        <Title order={2} ta="center">{context.formationNom}</Title>
        <Text c="dimmed" size="sm" ta="center">
          {isChaud
            ? 'Votre avis sur la formation que vous venez de suivre'
            : `Retour du manager sur la formation suivie par ${context.collaborateurNom}`}
        </Text>
      </Stack>

      <Divider />

      {isChaud ? (
        <Stack gap="md">
          <div>
            <Text size="sm" fw={500} mb={4}>
              Note globale de la formation <Text span c="red">*</Text>
            </Text>
            <Rating size="lg" value={noteGlobale} onChange={setNoteGlobale} />
          </div>

          <div>
            <Text size="sm" fw={500} mb={4}>
              Qualité du contenu <Text span c="red">*</Text>
            </Text>
            <Rating size="lg" value={noteContenu} onChange={setNoteContenu} />
          </div>

          <div>
            <Text size="sm" fw={500} mb={4}>
              Qualité du formateur <Text span c="red">*</Text>
            </Text>
            <Rating size="lg" value={noteFormateur} onChange={setNoteFormateur} />
          </div>

          <Textarea
            label="Commentaire"
            placeholder="Vos remarques, suggestions d'amélioration... (optionnel)"
            minRows={3}
            autosize
            value={commentaire}
            onChange={(e) => setCommentaire(e.currentTarget.value)}
          />
        </Stack>
      ) : (
        <Stack gap="md">
          <Select
            label="Les compétences acquises ont-elles été mises en pratique ?"
            placeholder="Sélectionnez une réponse"
            required
            data={[
              { value: 'oui', label: 'Oui' },
              { value: 'partiellement', label: 'Partiellement' },
              { value: 'non', label: 'Non' },
            ]}
            value={competences}
            onChange={setCompetences}
          />

          <Textarea
            label="Impact observé sur le travail du collaborateur"
            placeholder="Décrivez les changements observés depuis la formation... (optionnel)"
            minRows={3}
            autosize
            value={impactObserve}
            onChange={(e) => setImpactObserve(e.currentTarget.value)}
          />

          <div>
            <Text size="sm" fw={500} mb={4}>
              Utilité de la formation pour le poste <Text span c="red">*</Text>
            </Text>
            <Rating size="lg" value={noteUtilite} onChange={setNoteUtilite} />
          </div>
        </Stack>
      )}

      {formError && (
        <Alert icon={<WarningCircle size={16} />} color="red" variant="light">
          {formError}
        </Alert>
      )}

      <Group justify="flex-end">
        <Button
          leftSection={<PaperPlaneTilt size={16} />}
          loading={isSubmitting}
          onClick={handleSubmit}
        >
          Envoyer mon évaluation
        </Button>
      </Group>
    </Stack>
  );
}
