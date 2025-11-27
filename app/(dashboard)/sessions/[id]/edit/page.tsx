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
import { SessionsUnifiedService } from '@/lib/services/sessions-unified.service';
import { SessionFormationResponse, CollectiveSession } from '@/lib/types';
import { StatutUtils } from '@/lib/utils/statut.utils';
import { formatDateOnly } from '@/lib/utils/date.utils';
import { SessionTypeBadge } from '@/components/sessions/SessionTypeBadge';
import { Users, MapPin } from '@phosphor-icons/react';

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
  // Champs communs
  statut: string;
  dateDebut: string;
  dateFin: string;
  anneeBudgetaire?: number;

  // Champs individuels
  dureeHeures?: number;
  tarifHT?: number;
  tarifTTC?: number;
  commentaire: string;

  // Champs collectifs
  titre?: string;
  lieu?: string;
  heureDebut?: string;
  heureFin?: string;
  dureePrevueHeures?: number;
  capaciteMax?: number;
  modalite?: string;
  tarifUnitaireHT?: number;
  tarifTotalHT?: number;
  description?: string;
  formateurNom?: string;
  formateurContact?: string;
  lienVisio?: string;
}

export default function EditSessionPage({ params }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any | null>(null); // Can be individual or collective
  
  const form = useForm<FormValues>({
    initialValues: {
      // Communs
      statut: '',
      dateDebut: '',
      dateFin: '',
      anneeBudgetaire: undefined,
      // Individuels
      dureeHeures: undefined,
      tarifHT: undefined,
      tarifTTC: undefined,
      commentaire: '',
      // Collectifs
      titre: '',
      lieu: '',
      heureDebut: '',
      heureFin: '',
      dureePrevueHeures: undefined,
      capaciteMax: undefined,
      modalite: 'presentiel',
      tarifUnitaireHT: undefined,
      tarifTotalHT: undefined,
      description: '',
      formateurNom: '',
      formateurContact: '',
      lienVisio: '',
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
      anneeBudgetaire: (value) => {
        if (value !== undefined && (value < 2000 || value > 2100)) {
          return 'L\'année doit être entre 2000 et 2100';
        }
        return null;
      },
    },
  });

  // Charger les données de la session avec auto-détection
  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      try {
        const sessionData = await SessionsUnifiedService.findOne(parseInt(params.id));
        setSession(sessionData);

        // Mettre à jour le formulaire selon le type de session
        if (sessionData.type === 'collective') {
          // Session collective
          form.setValues({
            statut: sessionData.statut || 'inscrit',
            dateDebut: sessionData.dateDebut
              ? formatDateOnly(new Date(sessionData.dateDebut))
              : '',
            dateFin: sessionData.dateFin
              ? formatDateOnly(new Date(sessionData.dateFin))
              : '',
            anneeBudgetaire: sessionData.anneeBudgetaire || undefined,
            // Champs collectifs
            titre: sessionData.titre || '',
            lieu: sessionData.lieu || '',
            heureDebut: sessionData.heureDebut || '',
            heureFin: sessionData.heureFin || '',
            dureePrevueHeures: sessionData.dureePrevue ? Number(sessionData.dureePrevue) : undefined,
            capaciteMax: sessionData.capaciteMax || undefined,
            modalite: sessionData.modalite || 'presentiel',
            tarifUnitaireHT: sessionData.tarifUnitaireHT ? Number(sessionData.tarifUnitaireHT) : undefined,
            tarifTotalHT: sessionData.tarifTotalHT ? Number(sessionData.tarifTotalHT) : undefined,
            description: sessionData.description || '',
            formateurNom: sessionData.formateurNom || '',
            formateurContact: sessionData.formateurContact || '',
            lienVisio: sessionData.lienVisio || '',
            // Champs individuels (vides)
            dureeHeures: undefined,
            commentaire: '',
          });
        } else {
          // Session individuelle
          form.setValues({
            statut: sessionData.statut || 'inscrit',
            dateDebut: sessionData.dateDebut
              ? formatDateOnly(new Date(sessionData.dateDebut))
              : '',
            dateFin: sessionData.dateFin
              ? formatDateOnly(new Date(sessionData.dateFin))
              : '',
            dureeHeures: sessionData.dureeHeures || undefined,
            tarifHT: sessionData.tarifHT ? Number(sessionData.tarifHT) : undefined,
            tarifTTC: sessionData.tarifTTC ? Number(sessionData.tarifTTC) : undefined,
            anneeBudgetaire: sessionData.anneeBudgetaire !== null && sessionData.anneeBudgetaire !== undefined
              ? sessionData.anneeBudgetaire
              : undefined,
            commentaire: sessionData.commentaire || '',
            // Champs collectifs (vides)
            titre: '',
            lieu: '',
            heureDebut: '',
            heureFin: '',
            dureePrevueHeures: undefined,
            capaciteMax: undefined,
            modalite: 'presentiel',
            tarifUnitaireHT: undefined,
            tarifTotalHT: undefined,
            description: '',
            formateurNom: '',
            formateurContact: '',
            lienVisio: '',
          });
        }
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
    if (!session) return;

    // Vérifier si la transition de statut est autorisée
    if (!isStatusTransitionAllowed(session.statut || 'inscrit', values.statut)) {
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
      if (session.type === 'collective') {
        // Mise à jour session collective
        const updateData: any = {
          statut: values.statut,
          dateDebut: values.dateDebut || undefined,
          dateFin: values.dateFin || undefined,
          titre: values.titre || undefined,
          lieu: values.lieu || undefined,
          heureDebut: values.heureDebut || undefined,
          heureFin: values.heureFin || undefined,
          dureePrevue: values.dureePrevueHeures || undefined,
          capaciteMax: values.capaciteMax || undefined,
          modalite: values.modalite || undefined,
          tarifUnitaireHT: values.tarifUnitaireHT || undefined,
          tarifTotalHT: values.tarifTotalHT || undefined,
          anneeBudgetaire: values.anneeBudgetaire || undefined,
          description: values.description || undefined,
          formateurNom: values.formateurNom || undefined,
          formateurContact: values.formateurContact || undefined,
          lienVisio: values.lienVisio || undefined,
        };

        // Supprimer les valeurs undefined
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        });

        await SessionsUnifiedService.update(parseInt(params.id), updateData, 'collective');
      } else {
        // Mise à jour session individuelle
        const updateData: any = {
          statut: values.statut,
          dateDebut: values.dateDebut,
          dateFin: values.dateFin || undefined,
          dureeHeures: values.dureeHeures || undefined,
          tarifHT: values.tarifHT || undefined,
          tarifTTC: values.tarifTTC || undefined,
          anneeBudgetaire: values.anneeBudgetaire,
          commentaire: values.commentaire || undefined,
        };

        // Supprimer les valeurs undefined
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        });

        await sessionsService.updateSession(parseInt(params.id), updateData);
      }

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
            {session.type && <SessionTypeBadge type={session.type} />}
          </Group>
          <Text c="dimmed" mt="xs">
            Modification de la session {session.type === 'collective' ? 'collective' : 'individuelle'}
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
                {/* Collaborateur (seulement pour sessions individuelles) */}
                {session.type === 'individuelle' && session.collaborateur && (
                  <>
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
                  </>
                )}

                {/* Informations collective (pour sessions collectives) */}
                {session.type === 'collective' && (
                  <>
                    <div>
                      <Group gap="xs" mb={4}>
                        <Users size={16} color="#868E96" />
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                          Session collective
                        </Text>
                      </Group>
                      {session.capaciteMax && (
                        <Text size="sm" fw={500}>
                          Capacité: {session.participants?.length || 0} / {session.capaciteMax} participants
                        </Text>
                      )}
                      {session.modalite && (
                        <Badge size="sm" variant="light" color="grape" mt={2}>
                          {session.modalite === 'presentiel' ? 'Présentiel' :
                           session.modalite === 'distanciel' ? 'Distanciel' : 'Hybride'}
                        </Badge>
                      )}
                    </div>
                    <Divider />
                  </>
                )}

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

              {/* Champs SESSION INDIVIDUELLE */}
              {session.type === 'individuelle' && (
                <>
                  <Paper shadow="xs" p="lg" radius="md" withBorder>
                    <Group align="center" mb="md">
                      <Clock size={20} />
                      <Text fw={600}>Durée et tarification</Text>
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
                          label="Année budgétaire"
                          description="Laissez vide pour utiliser l'année de la session"
                          placeholder="Ex: 2024"
                          min={2000}
                          max={2100}
                          leftSection={<Calendar size={16} />}
                          {...form.getInputProps('anneeBudgetaire')}
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <NumberInput
                          label="Tarif HT (€)"
                          description="Prix hors taxes"
                          placeholder="Ex: 500"
                          min={0}
                          decimalScale={2}
                          {...form.getInputProps('tarifHT')}
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <NumberInput
                          label="Tarif TTC (€)"
                          description="Prix TTC (utilisé en priorité pour le budget)"
                          placeholder="Ex: 600"
                          min={0}
                          decimalScale={2}
                          {...form.getInputProps('tarifTTC')}
                        />
                      </Grid.Col>
                    </Grid>
                  </Paper>

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
                </>
              )}

              {/* Champs SESSION COLLECTIVE */}
              {session.type === 'collective' && (
                <>
                  <Paper shadow="xs" p="lg" radius="md" withBorder>
                    <Group align="center" mb="md">
                      <FileText size={20} />
                      <Text fw={600}>Informations de la session</Text>
                    </Group>

                    <Stack gap="md">
                      <TextInput
                        label="Titre de la session"
                        placeholder="Ex: Formation React - Session Printemps 2024"
                        {...form.getInputProps('titre')}
                      />

                      <Grid>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <TextInput
                            label="Lieu"
                            placeholder="Ex: Salle de formation A, Paris"
                            leftSection={<MapPin size={16} />}
                            {...form.getInputProps('lieu')}
                          />
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <Select
                            label="Modalité"
                            data={[
                              { value: 'presentiel', label: 'Présentiel' },
                              { value: 'distanciel', label: 'Distanciel' },
                              { value: 'hybride', label: 'Hybride' },
                            ]}
                            {...form.getInputProps('modalite')}
                          />
                        </Grid.Col>
                      </Grid>

                      <Grid>
                        <Grid.Col span={{ base: 12, sm: 4 }}>
                          <TextInput
                            label="Heure de début"
                            placeholder="Ex: 09:00"
                            type="time"
                            leftSection={<Clock size={16} />}
                            {...form.getInputProps('heureDebut')}
                          />
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, sm: 4 }}>
                          <TextInput
                            label="Heure de fin"
                            placeholder="Ex: 17:00"
                            type="time"
                            leftSection={<Clock size={16} />}
                            {...form.getInputProps('heureFin')}
                          />
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, sm: 4 }}>
                          <NumberInput
                            label="Durée (heures)"
                            placeholder="Ex: 7"
                            min={0}
                            decimalScale={2}
                            leftSection={<Clock size={16} />}
                            {...form.getInputProps('dureePrevueHeures')}
                          />
                        </Grid.Col>
                      </Grid>

                      <NumberInput
                        label="Capacité maximale"
                        placeholder="Ex: 15"
                        description="Nombre maximum de participants"
                        min={1}
                        max={1000}
                        leftSection={<Users size={16} />}
                        {...form.getInputProps('capaciteMax')}
                      />
                    </Stack>
                  </Paper>

                  <Paper shadow="xs" p="lg" radius="md" withBorder>
                    <Group align="center" mb="md">
                      <User size={20} />
                      <Text fw={600}>Formateur</Text>
                    </Group>

                    <Stack gap="md">
                      <TextInput
                        label="Nom du formateur"
                        placeholder="Nom complet du formateur"
                        {...form.getInputProps('formateurNom')}
                      />

                      <TextInput
                        label="Contact du formateur"
                        placeholder="Email ou téléphone"
                        {...form.getInputProps('formateurContact')}
                      />

                      <TextInput
                        label="Lien visio"
                        placeholder="https://meet.google.com/..."
                        description="Pour les sessions distancielles ou hybrides"
                        {...form.getInputProps('lienVisio')}
                      />
                    </Stack>
                  </Paper>

                  <Paper shadow="xs" p="lg" radius="md" withBorder>
                    <Group align="center" mb="md">
                      <FileText size={20} />
                      <Text fw={600}>Tarifs et budget</Text>
                    </Group>

                    <Grid>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <NumberInput
                          label="Tarif unitaire HT (€)"
                          placeholder="Ex: 500"
                          description="Prix par participant"
                          min={0}
                          decimalScale={2}
                          {...form.getInputProps('tarifUnitaireHT')}
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <NumberInput
                          label="Tarif total HT (€)"
                          placeholder="Ex: 7500"
                          description="Prix total de la session"
                          min={0}
                          decimalScale={2}
                          {...form.getInputProps('tarifTotalHT')}
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <NumberInput
                          label="Année budgétaire"
                          placeholder="Ex: 2024"
                          min={2000}
                          max={2100}
                          leftSection={<Calendar size={16} />}
                          {...form.getInputProps('anneeBudgetaire')}
                        />
                      </Grid.Col>
                    </Grid>
                  </Paper>

                  <Paper shadow="xs" p="lg" radius="md" withBorder>
                    <Group align="center" mb="md">
                      <FileText size={20} />
                      <Text fw={600}>Description</Text>
                    </Group>

                    <Textarea
                      label="Description de la session"
                      placeholder="Description détaillée de la session collective..."
                      rows={4}
                      {...form.getInputProps('description')}
                    />
                  </Paper>
                </>
              )}

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