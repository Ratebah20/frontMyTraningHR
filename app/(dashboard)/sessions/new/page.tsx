'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Divider,
  Autocomplete,
  Loader,
  Badge,
  Center,
  MultiSelect,
  Switch,
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
  Users,
} from '@phosphor-icons/react';
import { 
  sessionsService, 
  formationsService, 
  collaborateursService,
  organismesService 
} from '@/lib/services';
import { 
  CreateSessionDto, 
  Formation, 
  Collaborateur,
  Organisme 
} from '@/lib/types';

export default function NewSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchMode, setBatchMode] = useState(false);

  // Données pour les selects
  const [formations, setFormations] = useState<Formation[]>([]);
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);
  const [organismes, setOrganismes] = useState<Organisme[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedCollaborateurs, setSelectedCollaborateurs] = useState<string[]>([]);

  // Pré-remplir si on vient d'une formation ou d'un collaborateur
  const preselectedFormationId = searchParams.get('formationId');
  const preselectedCollaborateurId = searchParams.get('collaborateurId');

  const form = useForm<CreateSessionDto>({
    initialValues: {
      collaborateurId: preselectedCollaborateurId ? parseInt(preselectedCollaborateurId) : 0,
      formationId: preselectedFormationId ? parseInt(preselectedFormationId) : 0,
      dateDebut: new Date().toISOString().split('T')[0],
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
      collaborateurId: (value) => {
        if (!batchMode && (!value || value === 0)) return 'Collaborateur requis';
        return null;
      },
      formationId: (value) => {
        if (!value || value === 0) return 'Formation requise';
        return null;
      },
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
      setLoadingData(true);
      try {
        // Charger les formations actives
        const formationsResponse = await formationsService.getFormations({
          limit: 2000,
          includeInactive: false,
        });
        setFormations(formationsResponse.data || []);

        // Charger les collaborateurs actifs
        const collaborateursResponse = await collaborateursService.getCollaborateurs({
          limit: 2000,
          actif: true,
        });
        setCollaborateurs(collaborateursResponse.data || []);
        
        // TODO: Charger les organismes quand le service sera disponible
        // const organismesResponse = await organismesService.getOrganismes();
        // setOrganismes(organismesResponse.data || []);
        
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        notifications.show({
          title: 'Erreur',
          message: 'Erreur lors du chargement des données',
          color: 'red',
          icon: <Warning size={20} />,
        });
      } finally {
        setLoadingData(false);
      }
    };
    
    loadData();
  }, []);

  const handleSubmit = async (values: CreateSessionDto) => {
    // Validation pour le mode batch
    if (batchMode && selectedCollaborateurs.length === 0) {
      notifications.show({
        title: 'Erreur',
        message: 'Veuillez sélectionner au moins un collaborateur',
        color: 'red',
        icon: <Warning size={20} />,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Nettoyer les données avant envoi
      const baseData = {
        ...values,
        dureePrevue: values.dureePrevue || undefined,
        dureeReelle: values.dureeReelle || undefined,
        organismeId: values.organismeId || undefined,
        tarifHT: values.tarifHT || undefined,
        note: values.note !== undefined ? values.note : undefined,
        dateFin: values.dateFin || undefined,
      };

      if (batchMode) {
        // Mode batch : créer une session pour chaque collaborateur
        const promises = selectedCollaborateurs.map(collabId =>
          sessionsService.createSession({
            ...baseData,
            collaborateurId: parseInt(collabId),
          })
        );

        await Promise.all(promises);

        notifications.show({
          title: 'Succès',
          message: `${selectedCollaborateurs.length} inscription(s) créée(s) avec succès`,
          color: 'green',
          icon: <CheckCircle size={20} />,
        });
      } else {
        // Mode simple : créer une seule session
        await sessionsService.createSession(baseData);

        notifications.show({
          title: 'Succès',
          message: 'Inscription créée avec succès',
          color: 'green',
          icon: <CheckCircle size={20} />,
        });
      }

      router.push('/sessions');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création de l\'inscription';

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

  if (loadingData) {
    return (
      <Container size="md">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  // Préparer les données pour les autocompletes
  const collaborateursData = collaborateurs.map(c => ({
    value: c.id.toString(),
    label: `${c.nomComplet} - ${c.departement?.nomDepartement || 'Sans département'}`,
  }));
  
  const formationsData = formations.map(f => ({
    value: f.id.toString(),
    label: `${f.nomFormation} (${f.codeFormation})`,
  }));

  return (
    <Container size="md">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>Nouvelle inscription</Title>
          <Text c="dimmed">
            {batchMode ? 'Inscrire plusieurs collaborateurs à une formation' : 'Inscrire un collaborateur à une formation'}
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

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          {/* Mode d'inscription */}
          <Paper shadow="xs" p="lg" radius="md" withBorder>
            <Group justify="space-between">
              <Group>
                {batchMode ? <Users size={24} /> : <User size={24} />}
                <div>
                  <Text fw={600}>Mode d'inscription</Text>
                  <Text size="sm" c="dimmed">
                    {batchMode ? 'Plusieurs collaborateurs' : 'Un seul collaborateur'}
                  </Text>
                </div>
              </Group>
              <Switch
                checked={batchMode}
                onChange={(event) => {
                  setBatchMode(event.currentTarget.checked);
                  setSelectedCollaborateurs([]);
                  form.setFieldValue('collaborateurId', 0);
                }}
                label="Inscription multiple"
                size="md"
              />
            </Group>
          </Paper>

          {/* Informations principales */}
          <Paper shadow="xs" p="lg" radius="md" withBorder>
            <Group align="center" mb="md">
              {batchMode ? <Users size={20} /> : <User size={20} />}
              <Text fw={600}>Informations principales</Text>
            </Group>

            <Stack gap="md">
              {batchMode ? (
                <MultiSelect
                  label="Collaborateurs"
                  placeholder="Sélectionner les collaborateurs"
                  required
                  searchable
                  data={collaborateursData}
                  value={selectedCollaborateurs}
                  onChange={setSelectedCollaborateurs}
                  leftSection={<Users size={16} />}
                  description={`${selectedCollaborateurs.length} collaborateur(s) sélectionné(s)`}
                />
              ) : (
                <Select
                  label="Collaborateur"
                  placeholder="Sélectionner un collaborateur"
                  required
                  searchable
                  data={collaborateursData}
                  value={form.values.collaborateurId?.toString()}
                  onChange={(value) => form.setFieldValue('collaborateurId', value ? parseInt(value) : 0)}
                  error={form.errors.collaborateurId}
                  leftSection={<User size={16} />}
                />
              )}

              <Select
                label="Formation"
                placeholder="Sélectionner une formation"
                required
                searchable
                data={formationsData}
                value={form.values.formationId?.toString()}
                onChange={(value) => form.setFieldValue('formationId', value ? parseInt(value) : 0)}
                error={form.errors.formationId}
                leftSection={<BookOpen size={16} />}
              />
              
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
            </Stack>
          </Paper>

          {/* Dates et durée */}
          <Paper shadow="xs" p="lg" radius="md" withBorder>
            <Group align="center" mb="md">
              <Calendar size={20} />
              <Text fw={600}>Dates et durée</Text>
            </Group>
            
            <Stack gap="md">
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
              
              <Group grow>
                <NumberInput
                  label="Durée prévue"
                  placeholder="Ex: 14"
                  min={0}
                  {...form.getInputProps('dureePrevue')}
                  leftSection={<Clock size={16} />}
                />
                
                <NumberInput
                  label="Durée réelle"
                  placeholder="Ex: 12"
                  min={0}
                  {...form.getInputProps('dureeReelle')}
                  leftSection={<Clock size={16} />}
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
            </Stack>
          </Paper>

          {/* Informations complémentaires */}
          <Paper shadow="xs" p="lg" radius="md" withBorder>
            <Group align="center" mb="md">
              <FileText size={20} />
              <Text fw={600}>Informations complémentaires</Text>
            </Group>
            
            <Stack gap="md">
              {/* TODO: Activer quand le service organismes sera disponible */}
              {/* <Select
                label="Organisme"
                placeholder="Sélectionner un organisme"
                searchable
                data={organismes.map(o => ({
                  value: o.id.toString(),
                  label: o.nomOrganisme,
                }))}
                value={form.values.organismeId?.toString()}
                onChange={(value) => form.setFieldValue('organismeId', value ? parseInt(value) : undefined)}
                leftSection={<Building size={16} />}
              /> */}
              
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

          {/* Résumé en mode batch */}
          {batchMode && selectedCollaborateurs.length > 0 && (
            <Alert color="blue" title="Récapitulatif" icon={<Users size={16} />}>
              <Text size="sm">
                <strong>{selectedCollaborateurs.length}</strong> inscription(s) vont être créées pour la formation sélectionnée.
              </Text>
            </Alert>
          )}

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
              leftSection={<CheckCircle size={16} />}
            >
              {batchMode
                ? `Créer ${selectedCollaborateurs.length} inscription(s)`
                : 'Créer l\'inscription'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Container>
  );
}