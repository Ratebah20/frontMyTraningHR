'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Card,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Alert,
  NumberInput,
  Textarea,
  Paper,
  Text,
  Loader,
  Center,
  Badge,
  ThemeIcon,
  Divider,
  Grid,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { 
  ArrowLeft, 
  CheckCircle, 
  Warning, 
  Calendar,
  User,
  BookOpen,
  Building,
  Clock,
  FileText,
  FloppyDisk,
  Star,
  Info,
  CalendarCheck,
  Hourglass,
  Certificate,
  CalendarX,
  IdentificationCard,
} from '@phosphor-icons/react';
import { sessionsService } from '@/lib/services';
import { SessionFormationResponse } from '@/lib/types';
import { StatutUtils } from '@/lib/utils/statut.utils';

interface Props {
  params: {
    id: string;
  };
}

// Configuration des statuts
const statusConfig = {
  'inscrit': { color: 'blue', icon: CalendarCheck, label: 'Inscrit' },
  'INSCRIT': { color: 'blue', icon: CalendarCheck, label: 'Inscrit' },
  'en_cours': { color: 'yellow', icon: Hourglass, label: 'En cours' },
  'EN_COURS': { color: 'yellow', icon: Hourglass, label: 'En cours' },
  'complete': { color: 'green', icon: Certificate, label: 'Terminé' },
  'COMPLETE': { color: 'green', icon: Certificate, label: 'Terminé' },
  'TERMINE': { color: 'green', icon: Certificate, label: 'Terminé' },
  'Terminé': { color: 'green', icon: Certificate, label: 'Terminé' },
  'terminé': { color: 'green', icon: Certificate, label: 'Terminé' },
  'annule': { color: 'red', icon: CalendarX, label: 'Annulé' },
  'ANNULE': { color: 'red', icon: CalendarX, label: 'Annulé' },
  'Annulé': { color: 'red', icon: CalendarX, label: 'Annulé' },
  'annulé': { color: 'red', icon: CalendarX, label: 'Annulé' },
};

interface FormValues {
  statut: string;
  dateDebut: string;
  dateFin: string;
  dureeHeures?: number;
  note?: number;
  commentaire: string;
}

export default function EditSessionPage({ params }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<SessionFormationResponse | null>(null);
  
  const form = useForm<FormValues>({
    initialValues: {
      statut: '',
      dateDebut: '',
      dateFin: '',
      dureeHeures: undefined,
      note: undefined,
      commentaire: '',
    },
    validate: {
      statut: (value) => {
        if (!value) return 'Le statut est requis';
        return null;
      },
      dateDebut: (value) => {
        if (!value) return 'La date de début est requise';
        return null;
      },
      dateFin: (value, values) => {
        if (value && values.dateDebut && value < values.dateDebut) {
          return 'La date de fin doit être après la date de début';
        }
        return null;
      },
      dureeHeures: (value) => {
        if (value !== undefined && value < 0) {
          return 'La durée doit être positive';
        }
        return null;
      },
      note: (value) => {
        if (value !== undefined && (value < 0 || value > 100)) {
          return 'La note doit être entre 0 et 100';
        }
        return null;
      },
    },
  });

  // Charger les données de la session
  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      try {
        const sessionData = await sessionsService.getSession(parseInt(params.id));
        setSession(sessionData);
        
        // Mettre à jour le formulaire avec les données actuelles
        form.setValues({
          statut: sessionData.statut || 'inscrit',
          dateDebut: sessionData.dateDebut 
            ? new Date(sessionData.dateDebut).toISOString().split('T')[0] 
            : '',
          dateFin: sessionData.dateFin 
            ? new Date(sessionData.dateFin).toISOString().split('T')[0] 
            : '',
          dureeHeures: sessionData.dureeHeures || undefined,
          note: sessionData.note !== null && sessionData.note !== undefined 
            ? sessionData.note 
            : undefined,
          commentaire: sessionData.commentaire || '',
        });
      } catch (error) {
        console.error('Erreur lors du chargement de la session:', error);
        notifications.show({
          title: 'Erreur',
          message: 'Impossible de charger la session',
          color: 'red',
          icon: <Warning size={20} />,
        });
        router.back();
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSession();
  }, [params.id]);

  // Vérifier la transition de statut
  const isStatusTransitionAllowed = (currentStatus: string, newStatus: string): boolean => {
    // Normaliser les statuts en minuscules pour la comparaison
    const normalizedCurrent = currentStatus.toLowerCase();
    const normalizedNew = newStatus.toLowerCase();
    
    // Gérer les statuts spéciaux
    const statusMap: Record<string, string> = {
      'termine': 'complete',
      'inscrit': 'inscrit',
      'en_cours': 'en_cours',
      'annule': 'annule',
      'complete': 'complete'
    };
    
    const mappedCurrent = statusMap[normalizedCurrent] || normalizedCurrent;
    const mappedNew = statusMap[normalizedNew] || normalizedNew;
    
    const allowedTransitions: Record<string, string[]> = {
      'inscrit': ['en_cours', 'annule'],
      'en_cours': ['complete', 'annule'],
      'complete': [], // Aucune transition autorisée
      'annule': ['inscrit'], // Permet de réinscrire
    };
    
    return mappedCurrent === mappedNew || 
           (allowedTransitions[mappedCurrent]?.includes(mappedNew) ?? false);
  };

  const handleSubmit = async (values: FormValues) => {
    // Vérifier si la transition de statut est autorisée
    if (session && !isStatusTransitionAllowed(session.statut || 'inscrit', values.statut)) {
      notifications.show({
        title: 'Erreur',
        message: `Transition de statut non autorisée: ${session.statut} → ${values.statut}`,
        color: 'red',
        icon: <Warning size={20} />,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Préparer les données selon le DTO backend
      const updateData: any = {
        statut: values.statut,
        dateDebut: values.dateDebut,
        dateFin: values.dateFin || undefined,
        dureeHeures: values.dureeHeures || undefined,
        note: values.note,
        commentaire: values.commentaire || undefined,
      };
      
      // Supprimer les valeurs undefined
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      await sessionsService.updateSession(parseInt(params.id), updateData);
      
      notifications.show({
        title: 'Succès',
        message: 'Session mise à jour avec succès',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
      
      router.push(`/sessions/${params.id}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la mise à jour';
      
      notifications.show({
        title: 'Erreur',
        message: errorMessage,
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Container size="lg">
        <Center h={400}>
          <Loader size="lg" variant="bars" />
        </Center>
      </Container>
    );
  }

  if (!session) {
    return (
      <Container size="lg">
        <Center h={400}>
          <Stack align="center">
            <Warning size={48} color="gray" />
            <Text size="lg" c="dimmed">Session non trouvée</Text>
            <Button onClick={() => router.back()}>Retour</Button>
          </Stack>
        </Center>
      </Container>
    );
  }

  // Configuration de l'icône et couleur du statut actuel
  // Chercher la configuration en tenant compte de toutes les variantes possibles
  let currentStatusConfig = statusConfig[session.statut as keyof typeof statusConfig];
  
  // Si pas trouvé directement, essayer en majuscules/minuscules
  if (!currentStatusConfig) {
    const upperStatus = session.statut?.toUpperCase();
    const lowerStatus = session.statut?.toLowerCase();
    currentStatusConfig = statusConfig[upperStatus as keyof typeof statusConfig] || 
                         statusConfig[lowerStatus as keyof typeof statusConfig];
  }
  
  // Si toujours pas trouvé et que c'est une variante de "terminé"
  if (!currentStatusConfig && (session.statut === 'TERMINE' || session.statut === 'termine' || session.statut === 'Terminé')) {
    currentStatusConfig = statusConfig.complete;
  }
  
  // Fallback final
  if (!currentStatusConfig) {
    currentStatusConfig = { color: 'blue', icon: CalendarCheck, label: session.statut || 'Inconnu' };
  }
  
  const StatusIcon = currentStatusConfig.icon;

  // Déterminer les transitions de statut autorisées
  const getAvailableStatusTransitions = () => {
    const currentStatus = session.statut || 'inscrit';
    const normalizedStatus = currentStatus.toLowerCase();
    const transitions: { value: string; label: string; disabled?: boolean }[] = [];
    
    // Toujours afficher le statut actuel
    transitions.push({
      value: currentStatus,
      label: `${statusConfig[currentStatus as keyof typeof statusConfig]?.label || 'Terminé'} (actuel)`,
    });
    
    // Normaliser pour les comparaisons (TERMINE = complete)
    const statusForComparison = normalizedStatus === 'termine' ? 'complete' : normalizedStatus;
    
    // Ajouter les transitions possibles
    if (statusForComparison === 'inscrit') {
      transitions.push(
        { value: 'en_cours', label: 'En cours' },
        { value: 'annule', label: 'Annulé' }
      );
    } else if (statusForComparison === 'en_cours') {
      transitions.push(
        { value: 'complete', label: 'Terminé' },
        { value: 'annule', label: 'Annulé' }
      );
    } else if (statusForComparison === 'annule') {
      transitions.push(
        { value: 'inscrit', label: 'Inscrit (réinscrire)' }
      );
    }
    // Si complete ou termine, aucune transition possible
    
    return transitions;
  };

  return (
    <Container size="lg">
      <Group justify="space-between" mb="xl">
        <div>
          <Group align="center" gap="sm">
            <Title order={1}>Modifier la session</Title>
            <Badge color="gray" variant="light">#{session.id}</Badge>
          </Group>
          <Text c="dimmed" mt="xs">
            Modification de la session de formation
          </Text>
        </div>
        <Button
          variant="subtle"
          leftSection={<ArrowLeft size={20} />}
          onClick={() => router.back()}
        >
          Retour
        </Button>
      </Group>

      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 4 }}>
          {/* Informations non modifiables */}
          <Stack gap="md">
            <Paper shadow="xs" p="lg" radius="md" withBorder>
              <Text fw={600} mb="md">Informations de la session</Text>
              <Stack gap="md">
                {/* Collaborateur */}
                <div>
                  <Group gap="xs" mb={4}>
                    <User size={16} color="#868E96" />
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      Collaborateur
                    </Text>
                  </Group>
                  <Text size="sm" fw={500}>
                    {session.collaborateur?.prenom} {session.collaborateur?.nom}
                  </Text>
                  {session.collaborateur?.matricule && (
                    <Group gap={4} mt={2}>
                      <IdentificationCard size={14} color="#868E96" />
                      <Text size="xs" c="dimmed">
                        Matricule: {session.collaborateur.matricule}
                      </Text>
                    </Group>
                  )}
                  <Text size="xs" c="dimmed" mt={2}>
                    {session.collaborateur?.departement || 'Département non défini'}
                  </Text>
                  {session.collaborateur?.email && (
                    <Text size="xs" c="dimmed">
                      {session.collaborateur.email}
                    </Text>
                  )}
                </div>

                <Divider />

                {/* Formation */}
                <div>
                  <Group gap="xs" mb={4}>
                    <BookOpen size={16} color="#868E96" />
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      Formation
                    </Text>
                  </Group>
                  <Text size="sm" fw={500}>
                    {session.formation?.nom}
                  </Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    Code: {session.formation?.code}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Catégorie: {session.formation?.categorie}
                  </Text>
                  {session.formation?.dureeHeures && (
                    <Text size="xs" c="dimmed">
                      Durée prévue: {session.formation.dureeHeures}h
                    </Text>
                  )}
                </div>

                {/* Organisme */}
                {session.organisme && (
                  <>
                    <Divider />
                    <div>
                      <Group gap="xs" mb={4}>
                        <Building size={16} color="#868E96" />
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                          Organisme
                        </Text>
                      </Group>
                      <Text size="sm" fw={500}>
                        {session.organisme.nom}
                      </Text>
                      {session.organisme.type && (
                        <Text size="xs" c="dimmed" mt={2}>
                          Type: {session.organisme.type}
                        </Text>
                      )}
                    </div>
                  </>
                )}
              </Stack>
            </Paper>

            {/* Statut actuel */}
            <Paper shadow="xs" p="lg" radius="md" withBorder>
              <Text fw={600} mb="md">Statut actuel</Text>
              <Center>
                <Stack align="center" gap="sm">
                  <ThemeIcon size={48} radius="md" variant="light" color={currentStatusConfig.color}>
                    <StatusIcon size={28} />
                  </ThemeIcon>
                  <Badge
                    size="lg"
                    color={currentStatusConfig.color}
                    variant="light"
                  >
                    {currentStatusConfig.label}
                  </Badge>
                </Stack>
              </Center>
            </Paper>

            {/* Note d'information */}
            <Alert icon={<Info size={16} />} color="blue" variant="light">
              <Text size="xs">
                Les transitions de statut sont limitées selon les règles métier. 
                Une session terminée ne peut pas être modifiée.
              </Text>
            </Alert>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="lg">
              {/* Statut et dates */}
              <Paper shadow="xs" p="lg" radius="md" withBorder>
                <Group align="center" mb="md">
                  <Calendar size={20} />
                  <Text fw={600}>Statut et dates</Text>
                </Group>
                
                <Stack gap="md">
                  <Select
                    label="Statut"
                    description="Seules les transitions autorisées sont disponibles"
                    required
                    data={getAvailableStatusTransitions()}
                    {...form.getInputProps('statut')}
                  />
                  
                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Date de début"
                        description="Date de début de la formation"
                        type="date"
                        required
                        {...form.getInputProps('dateDebut')}
                      />
                    </Grid.Col>
                    
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Date de fin"
                        description="Date de fin de la formation"
                        type="date"
                        {...form.getInputProps('dateFin')}
                      />
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Paper>

              {/* Durée et évaluation */}
              <Paper shadow="xs" p="lg" radius="md" withBorder>
                <Group align="center" mb="md">
                  <Clock size={20} />
                  <Text fw={600}>Durée et évaluation</Text>
                </Group>
                
                <Grid>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <NumberInput
                      label="Durée réelle (heures)"
                      description="Nombre d'heures effectivement suivies"
                      placeholder="Ex: 14"
                      min={0}
                      max={1000}
                      decimalScale={1}
                      {...form.getInputProps('dureeHeures')}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <NumberInput
                      label="Note (/100)"
                      description="Note obtenue si formation terminée"
                      placeholder="Ex: 85"
                      min={0}
                      max={100}
                      leftSection={<Star size={16} />}
                      {...form.getInputProps('note')}
                    />
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Commentaire */}
              <Paper shadow="xs" p="lg" radius="md" withBorder>
                <Group align="center" mb="md">
                  <FileText size={20} />
                  <Text fw={600}>Commentaire</Text>
                </Group>
                
                <Textarea
                  label="Commentaire"
                  description="Remarques ou observations sur la session"
                  placeholder="Ajouter un commentaire sur la session..."
                  rows={4}
                  {...form.getInputProps('commentaire')}
                />
              </Paper>

              {/* Actions */}
              <Group justify="space-between">
                <Button 
                  variant="subtle" 
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit"
                  loading={isSubmitting}
                  leftSection={<FloppyDisk size={16} />}
                  size="md"
                >
                  Enregistrer les modifications
                </Button>
              </Group>
            </Stack>
          </form>
        </Grid.Col>
      </Grid>
    </Container>
  );
}