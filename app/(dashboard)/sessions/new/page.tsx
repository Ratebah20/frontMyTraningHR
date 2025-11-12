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
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { DateInput } from '@mantine/dates';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
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
import { formatDateOnly } from '@/lib/utils/date.utils';
import {
  sessionsService,
  formationsService,
  collaborateursService,
  commonService
} from '@/lib/services';
import {
  CreateSessionDto,
  Formation,
  Collaborateur,
  OrganismeFormation
} from '@/lib/types';
import { FormationFormModal } from '@/components/formations/FormationFormModal';

export default function NewSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [formationModalOpened, setFormationModalOpened] = useState(false);

  // Données pour les selects
  const [formations, setFormations] = useState<Formation[]>([]);
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);
  const [organismes, setOrganismes] = useState<OrganismeFormation[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedCollaborateurs, setSelectedCollaborateurs] = useState<string[]>([]);

  // Pré-remplir si on vient d'une formation ou d'un collaborateur
  const preselectedFormationId = searchParams.get('formationId');
  const preselectedCollaborateurId = searchParams.get('collaborateurId');

  const form = useForm<CreateSessionDto>({
    initialValues: {
      collaborateurId: preselectedCollaborateurId ? parseInt(preselectedCollaborateurId) : 0,
      formationId: preselectedFormationId ? parseInt(preselectedFormationId) : 0,
      dateDebut: new Date(),
      dateFin: null,
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
        if (value && values.dateDebut) {
          const dateFin = value instanceof Date ? value : new Date(value);
          const dateDebut = values.dateDebut instanceof Date ? values.dateDebut : new Date(values.dateDebut);
          if (dateFin < dateDebut) {
            return 'La date de fin doit être après la date de début';
          }
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
          limit: 1000,
          actif: true,
        });
        setCollaborateurs(collaborateursResponse.data || []);

        // Charger les organismes de formation actifs
        const organismesResponse = await commonService.getOrganismesFormation();
        setOrganismes(organismesResponse || []);

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
        dateDebut: values.dateDebut instanceof Date ? formatDateOnly(values.dateDebut) : values.dateDebut,
        dateFin: values.dateFin instanceof Date ? formatDateOnly(values.dateFin) : undefined,
        dureePrevue: values.dureePrevue || undefined,
        dureeReelle: values.dureeReelle || undefined,
        organismeId: values.organismeId || undefined,
        tarifHT: values.tarifHT || undefined,
        note: values.note !== undefined ? values.note : undefined,
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

  // Callback quand une formation est créée via la modale
  const handleFormationCreated = (formation: Formation) => {
    // Ajouter la nouvelle formation à la liste
    setFormations(prev => [...prev, formation]);

    // Pré-sélectionner dans le formulaire de session
    form.setFieldValue('formationId', formation.id);

    // Fermer la modale
    setFormationModalOpened(false);

    // Notification
    notifications.show({
      title: 'Formation créée',
      message: `${formation.nomFormation} a été ajoutée et sélectionnée`,
      color: 'green',
      icon: <CheckCircle size={20} />,
    });
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

              <Group align="flex-end" gap="xs" grow>
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
                  style={{ flex: 1 }}
                />
                <Tooltip label="Créer une nouvelle formation">
                  <Button
                    variant="light"
                    onClick={() => setFormationModalOpened(true)}
                    leftSection={<BookOpen size={16} />}
                  >
                    + Nouvelle
                  </Button>
                </Tooltip>
              </Group>
              
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
                <DateInput
                  label="Date de début"
                  placeholder="Sélectionner une date"
                  required
                  locale="fr"
                  valueFormat="DD/MM/YYYY"
                  {...form.getInputProps('dateDebut')}
                />

                <DateInput
                  label="Date de fin"
                  placeholder="Sélectionner une date"
                  locale="fr"
                  valueFormat="DD/MM/YYYY"
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
              <Select
                label="Organisme de formation"
                placeholder="Sélectionner un organisme"
                description="Optionnel - Organisme dispensant la formation"
                searchable
                clearable
                data={organismes.map(o => ({
                  value: o.id.toString(),
                  label: o.nomOrganisme,
                }))}
                value={form.values.organismeId?.toString()}
                onChange={(value) => form.setFieldValue('organismeId', value ? parseInt(value) : undefined)}
                leftSection={<Building size={16} />}
              />

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

      {/* Modale de création de formation */}
      <FormationFormModal
        opened={formationModalOpened}
        onClose={() => setFormationModalOpened(false)}
        onSuccess={handleFormationCreated}
      />
    </Container>
  );
}