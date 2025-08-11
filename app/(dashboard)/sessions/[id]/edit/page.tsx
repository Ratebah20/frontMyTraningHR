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
} from '@phosphor-icons/react';
import { 
  sessionsService, 
  formationsService, 
  collaborateursService,
} from '@/lib/services';
import { 
  UpdateSessionDto, 
  SessionFormation,
  Formation, 
  Collaborateur,
} from '@/lib/types';

interface Props {
  params: {
    id: string;
  };
}

export default function EditSessionPage({ params }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<SessionFormation | null>(null);
  
  // Données pour les selects
  const [formations, setFormations] = useState<Formation[]>([]);
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);
  
  const form = useForm<UpdateSessionDto>({
    initialValues: {
      dateDebut: '',
      dateFin: '',
      dureePrevue: undefined,
      dureeReelle: undefined,
      uniteDuree: 'heures',
      statut: 'inscrit',
      organismeId: undefined,
      tarifHT: undefined,
      note: undefined,
      commentaire: '',
    },
    validate: {
      dateDebut: (value) => {
        if (!value) return 'Date de début requise';
        return null;
      },
      dateFin: (value, values) => {
        if (value && value < values.dateDebut) {
          return 'La date de fin doit être après la date de début';
        }
        return null;
      },
      note: (value) => {
        if (value !== undefined && (value < 0 || value > 100)) {
          return 'La note doit être entre 0 et 100';
        }
        return null;
      },
      tarifHT: (value) => {
        if (value !== undefined && value < 0) {
          return 'Le tarif doit être positif';
        }
        return null;
      },
    },
  });

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Charger la session
        const sessionData = await sessionsService.getSession(parseInt(params.id));
        setSession(sessionData);
        
        // Mettre à jour le formulaire avec les données de la session
        form.setValues({
          dateDebut: sessionData.dateDebut ? new Date(sessionData.dateDebut).toISOString().split('T')[0] : '',
          dateFin: sessionData.dateFin ? new Date(sessionData.dateFin).toISOString().split('T')[0] : '',
          dureePrevue: sessionData.dureePrevue || undefined,
          dureeReelle: sessionData.dureeReelle || undefined,
          uniteDuree: sessionData.uniteDuree || 'heures',
          statut: sessionData.statut || 'inscrit',
          organismeId: sessionData.organisme?.id || undefined,
          tarifHT: sessionData.tarifHT || undefined,
          note: sessionData.note !== null ? sessionData.note : undefined,
          commentaire: sessionData.commentaire || '',
        });
        
        // Charger les formations actives
        const formationsResponse = await formationsService.getFormations({
          limit: 100,
          includeInactive: false,
        });
        setFormations(formationsResponse.data || []);
        
        // Charger les collaborateurs actifs
        const collaborateursResponse = await collaborateursService.getCollaborateurs({
          limit: 100,
          actif: true,
        });
        setCollaborateurs(collaborateursResponse.data || []);
        
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        notifications.show({
          title: 'Erreur',
          message: 'Erreur lors du chargement de la session',
          color: 'red',
          icon: <Warning size={20} />,
        });
        router.back();
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [params.id]);

  const handleSubmit = async (values: UpdateSessionDto) => {
    setIsSubmitting(true);
    
    try {
      // Nettoyer les données avant envoi
      const dataToSend = {
        ...values,
        dureePrevue: values.dureePrevue || undefined,
        dureeReelle: values.dureeReelle || undefined,
        organismeId: values.organismeId || undefined,
        tarifHT: values.tarifHT || undefined,
        note: values.note !== undefined ? values.note : undefined,
        dateFin: values.dateFin || undefined,
      };
      
      await sessionsService.updateSession(parseInt(params.id), dataToSend);
      
      notifications.show({
        title: 'Succès',
        message: 'Session mise à jour avec succès',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
      
      router.push(`/sessions/${params.id}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la mise à jour de la session';
      
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
      <Container size="md">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (!session) {
    return (
      <Container size="md">
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

  return (
    <Container size="md">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>Modifier la session</Title>
          <Text c="dimmed">Session #{session.id}</Text>
        </div>
        <Button
          variant="subtle"
          leftSection={<ArrowLeft size={20} />}
          onClick={() => router.back()}
        >
          Retour
        </Button>
      </Group>

      {/* Informations non modifiables */}
      <Paper shadow="xs" p="lg" radius="md" withBorder mb="lg">
        <Text fw={600} mb="md">Informations de la session</Text>
        <Stack gap="sm">
          <Group>
            <User size={20} />
            <div>
              <Text size="sm" c="dimmed">Collaborateur</Text>
              <Text fw={500}>
                {session.collaborateur?.nomComplet || 'Non renseigné'}
              </Text>
            </div>
          </Group>
          <Group>
            <BookOpen size={20} />
            <div>
              <Text size="sm" c="dimmed">Formation</Text>
              <Text fw={500}>
                {session.formation?.nomFormation || 'Non renseignée'}
              </Text>
            </div>
          </Group>
        </Stack>
      </Paper>

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
                required
                data={[
                  { value: 'inscrit', label: 'Inscrit' },
                  { value: 'en_cours', label: 'En cours' },
                  { value: 'complete', label: 'Terminé' },
                  { value: 'annule', label: 'Annulé' },
                ]}
                {...form.getInputProps('statut')}
              />
              
              <Group grow>
                <TextInput
                  label="Date de début"
                  type="date"
                  required
                  {...form.getInputProps('dateDebut')}
                />
                
                <TextInput
                  label="Date de fin"
                  type="date"
                  {...form.getInputProps('dateFin')}
                />
              </Group>
            </Stack>
          </Paper>

          {/* Durée */}
          <Paper shadow="xs" p="lg" radius="md" withBorder>
            <Group align="center" mb="md">
              <Clock size={20} />
              <Text fw={600}>Durée</Text>
            </Group>
            
            <Group grow>
              <NumberInput
                label="Durée prévue"
                placeholder="Ex: 14"
                min={0}
                {...form.getInputProps('dureePrevue')}
              />
              
              <NumberInput
                label="Durée réelle"
                placeholder="Ex: 12"
                min={0}
                {...form.getInputProps('dureeReelle')}
              />
              
              <Select
                label="Unité"
                data={[
                  { value: 'heures', label: 'Heures' },
                  { value: 'jours', label: 'Jours' },
                  { value: 'semaines', label: 'Semaines' },
                ]}
                {...form.getInputProps('uniteDuree')}
              />
            </Group>
          </Paper>

          {/* Informations complémentaires */}
          <Paper shadow="xs" p="lg" radius="md" withBorder>
            <Group align="center" mb="md">
              <FileText size={20} />
              <Text fw={600}>Informations complémentaires</Text>
            </Group>
            
            <Stack gap="md">
              <Group grow>
                <NumberInput
                  label="Tarif HT (€)"
                  placeholder="Ex: 1500"
                  min={0}
                  decimalScale={2}
                  {...form.getInputProps('tarifHT')}
                />
                
                <NumberInput
                  label="Note (/100)"
                  placeholder="Ex: 85"
                  min={0}
                  max={100}
                  {...form.getInputProps('note')}
                />
              </Group>
              
              <Textarea
                label="Commentaire"
                placeholder="Commentaires ou remarques..."
                rows={3}
                {...form.getInputProps('commentaire')}
              />
            </Stack>
          </Paper>

          {/* Actions */}
          <Group justify="flex-end">
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
            >
              Enregistrer les modifications
            </Button>
          </Group>
        </Stack>
      </form>
    </Container>
  );
}