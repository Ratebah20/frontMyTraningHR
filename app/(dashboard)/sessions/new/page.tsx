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
import { SessionsUnifiedService } from '@/lib/services/sessions-unified.service';
import {
  CreateSessionDto,
  Formation,
  Collaborateur,
  OrganismeFormation,
  CreateCollectiveSessionDto
} from '@/lib/types';
import { FormationFormModal } from '@/components/formations/FormationFormModal';
import { SessionTypeSelector } from '@/components/sessions/SessionTypeSelector';
import { ParticipantSelector } from '@/components/sessions/ParticipantSelector';

export default function NewSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionType, setSessionType] = useState<'individuelle' | 'collective'>('individuelle');
  const [batchMode, setBatchMode] = useState(false);
  const [formationModalOpened, setFormationModalOpened] = useState(false);

  // Données pour les selects
  const [formations, setFormations] = useState<Formation[]>([]);
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);
  const [organismes, setOrganismes] = useState<OrganismeFormation[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingFormations, setLoadingFormations] = useState(false);
  const [selectedCollaborateurs, setSelectedCollaborateurs] = useState<string[]>([]);
  const [participantIds, setParticipantIds] = useState<number[]>([]);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [organismeWarning, setOrganismeWarning] = useState<string | null>(null);

  // Pré-remplir si on vient d'une formation ou d'un collaborateur
  const preselectedFormationId = searchParams.get('formationId');
  const preselectedCollaborateurId = searchParams.get('collaborateurId');

  const form = useForm<any>({
    initialValues: {
      // Champs communs
      formationId: preselectedFormationId ? parseInt(preselectedFormationId) : 0,
      dateDebut: new Date(),
      dateFin: null,
      organismeId: undefined,
      anneeBudgetaire: undefined,

      // Champs individuels
      collaborateurId: preselectedCollaborateurId ? parseInt(preselectedCollaborateurId) : 0,
      dureePrevue: undefined,
      dureeReelle: undefined,
      uniteDuree: 'heures',
      statut: 'inscrit',
      tarifHT: undefined,
      commentaire: '',

      // Champs collectifs
      titre: '',
      lieu: '',
      heureDebut: '',
      heureFin: '',
      dureePrevueHeures: undefined,
      capaciteMax: undefined,
      statutCollectif: 'inscrit',
      modalite: 'presentiel',
      tarifUnitaireHT: undefined,
      tarifTotalHT: undefined,
      description: '',
      formateurNom: '',
      formateurContact: '',
      lienVisio: '',
    },
    validate: {
      collaborateurId: (value) => {
        if (sessionType === 'individuelle' && !batchMode && (!value || value === 0)) {
          return 'Collaborateur requis';
        }
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
      anneeBudgetaire: (value) => {
        if (value !== undefined && (value < 2000 || value > 2100)) {
          return 'L\'année doit être entre 2000 et 2100';
        }
        return null;
      },
      tarifHT: (value) => {
        if (sessionType === 'individuelle' && value !== undefined && value < 0) {
          return 'Le tarif doit être positif';
        }
        return null;
      },
      capaciteMax: (value) => {
        if (sessionType === 'collective' && value !== undefined && value < 1) {
          return 'La capacité doit être au moins 1';
        }
        return null;
      },
    },
  });

  // State pour la recherche de formation
  const [formationSearchValue, setFormationSearchValue] = useState('');

  // Fonction de recherche de formations
  useEffect(() => {
    const searchFormations = async () => {
      // Ne rechercher qu'après 2 caractères minimum
      if (formationSearchValue.length < 2) {
        setFormations([]);
        return;
      }

      setLoadingFormations(true);
      try {
        const formationsResponse = await formationsService.getFormations({
          search: formationSearchValue,
          limit: 50, // Limiter à 50 résultats pour éviter le crash
          includeInactive: false,
        });
        setFormations(formationsResponse.data || []);
      } catch (error) {
        console.error('Erreur lors de la recherche des formations:', error);
        notifications.show({
          title: 'Erreur',
          message: 'Erreur lors de la recherche des formations',
          color: 'red',
          icon: <Warning size={20} />,
        });
      } finally {
        setLoadingFormations(false);
      }
    };

    // Debounce de 300ms
    const timeoutId = setTimeout(searchFormations, 300);
    return () => clearTimeout(timeoutId);
  }, [formationSearchValue]);

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        // NE PLUS charger les formations ici - elles seront chargées via la recherche
        // Si une formation est pré-sélectionnée, la charger individuellement
        if (preselectedFormationId) {
          try {
            const formation = await formationsService.getFormation(parseInt(preselectedFormationId));
            setFormations([formation]);
            setFormationSearchValue(`${formation.nomFormation} (${formation.codeFormation})`);
          } catch (error) {
            console.error('Erreur lors du chargement de la formation pré-sélectionnée:', error);
          }
        }

        // Charger tous les collaborateurs (actifs et inactifs)
        const collaborateursResponse = await collaborateursService.getCollaborateurs({
          limit: 1000,
          includeInactive: true, // Inclure les collaborateurs inactifs
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
  }, [preselectedFormationId]);

  // Auto-remplir l'organismeId quand la formation change
  useEffect(() => {
    const loadFormationDetails = async () => {
      if (form.values.formationId && form.values.formationId > 0) {
        try {
          const formation = await formationsService.getFormation(form.values.formationId);
          setSelectedFormation(formation);

          // Auto-remplir l'organismeId depuis la formation
          if (formation.organismeId) {
            form.setFieldValue('organismeId', formation.organismeId);
            setOrganismeWarning(null);
          }
        } catch (error) {
          console.error('Erreur lors du chargement de la formation:', error);
        }
      }
    };

    loadFormationDetails();
  }, [form.values.formationId]);

  const handleSubmit = async (values: any) => {
    // Validation spécifique selon le type
    if (sessionType === 'individuelle') {
      if (batchMode && selectedCollaborateurs.length === 0) {
        notifications.show({
          title: 'Erreur',
          message: 'Veuillez sélectionner au moins un collaborateur',
          color: 'red',
          icon: <Warning size={20} />,
        });
        return;
      }
    } else if (sessionType === 'collective') {
      if (participantIds.length === 0) {
        notifications.show({
          title: 'Erreur',
          message: 'Veuillez sélectionner au moins un participant pour la session collective',
          color: 'red',
          icon: <Warning size={20} />,
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (sessionType === 'individuelle') {
        // Session individuelle
        const baseData: CreateSessionDto = {
          formationId: values.formationId,
          collaborateurId: values.collaborateurId,
          dateDebut: values.dateDebut instanceof Date ? formatDateOnly(values.dateDebut) : values.dateDebut,
          dateFin: values.dateFin instanceof Date ? formatDateOnly(values.dateFin) : undefined,
          dureePrevue: values.dureePrevue || undefined,
          dureeReelle: values.dureeReelle || undefined,
          uniteDuree: values.uniteDuree,
          statut: values.statut,
          organismeId: values.organismeId || undefined,
          tarifHT: values.tarifHT || undefined,
          anneeBudgetaire: values.anneeBudgetaire || undefined,
          commentaire: values.commentaire || '',
        };

        if (batchMode) {
          // Mode batch : créer une session pour chaque collaborateur
          const promises = selectedCollaborateurs.map(collabId =>
            SessionsUnifiedService.create({
              ...baseData,
              collaborateurId: parseInt(collabId),
            }, 'individuelle')
          );

          // Utiliser allSettled pour gérer les échecs partiels
          const results = await Promise.allSettled(promises);
          const succeeded = results.filter(r => r.status === 'fulfilled');
          const failed = results.filter(r => r.status === 'rejected');

          if (failed.length > 0 && succeeded.length > 0) {
            // Échec partiel
            notifications.show({
              title: 'Inscription partielle',
              message: `${succeeded.length} inscription(s) réussie(s), ${failed.length} échouée(s)`,
              color: 'yellow',
              icon: <Warning size={20} />,
            });
          } else if (failed.length > 0 && succeeded.length === 0) {
            // Tout a échoué
            throw new Error(`Toutes les inscriptions ont échoué`);
          } else {
            // Tout a réussi
            notifications.show({
              title: 'Succès',
              message: `${selectedCollaborateurs.length} inscription(s) créée(s) avec succès`,
              color: 'green',
              icon: <CheckCircle size={20} />,
            });
          }
        } else {
          // Mode simple : créer une seule session
          await SessionsUnifiedService.create(baseData, 'individuelle');

          notifications.show({
            title: 'Succès',
            message: 'Session individuelle créée avec succès',
            color: 'green',
            icon: <CheckCircle size={20} />,
          });
        }
      } else {
        // Session collective
        const collectiveData: CreateCollectiveSessionDto = {
          formationId: values.formationId,
          organismeId: values.organismeId || undefined,
          titre: values.titre || undefined,
          lieu: values.lieu || undefined,
          dateDebut: values.dateDebut instanceof Date ? formatDateOnly(values.dateDebut) : undefined,
          dateFin: values.dateFin instanceof Date ? formatDateOnly(values.dateFin) : undefined,
          heureDebut: values.heureDebut || undefined,
          heureFin: values.heureFin || undefined,
          dureePrevue: values.dureePrevueHeures || undefined,
          capaciteMax: values.capaciteMax || undefined,
          statut: values.statutCollectif,
          modalite: values.modalite,
          tarifUnitaireHT: values.tarifUnitaireHT || undefined,
          tarifTotalHT: values.tarifTotalHT || undefined,
          anneeBudgetaire: values.anneeBudgetaire || undefined,
          description: values.description || undefined,
          formateurNom: values.formateurNom || undefined,
          formateurContact: values.formateurContact || undefined,
          lienVisio: values.lienVisio || undefined,
          participantIds: participantIds,
        };

        await SessionsUnifiedService.create(collectiveData, 'collective');

        notifications.show({
          title: 'Succès',
          message: 'Session collective créée avec succès',
          color: 'green',
          icon: <CheckCircle size={20} />,
        });
      }

      router.push('/sessions');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Erreur lors de la création de la session ${sessionType}`;

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
    label: `${c.nomComplet} - ${c.departement?.nomDepartement || 'Sans département'}${!c.actif ? ' (Inactif)' : ''}`,
  }));

  // Pour Autocomplete, on utilise un tableau de strings avec une map pour retrouver l'ID
  const formationsData = (formations || []).map(f => `${f.nomFormation} (${f.codeFormation})`);
  const formationsMap = new Map((formations || []).map(f => [`${f.nomFormation} (${f.codeFormation})`, f.id]));

  return (
    <Container size="md">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>Nouvelle session</Title>
          <Text c="dimmed">
            {sessionType === 'collective'
              ? 'Créer une session collective avec plusieurs participants'
              : batchMode
                ? 'Inscrire plusieurs collaborateurs à une formation'
                : 'Inscrire un collaborateur à une formation'}
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
          {/* Sélecteur de type de session */}
          <SessionTypeSelector
            value={sessionType}
            onChange={(type) => {
              setSessionType(type);
              // Réinitialiser les champs spécifiques
              if (type === 'collective') {
                setBatchMode(false);
                setSelectedCollaborateurs([]);
              } else {
                setParticipantIds([]);
              }
            }}
          />

          {/* Mode d'inscription multiple (seulement pour sessions individuelles) */}
          {sessionType === 'individuelle' && (
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
          )}

          {/* Informations principales */}
          <Paper shadow="xs" p="lg" radius="md" withBorder>
            <Group align="center" mb="md">
              {sessionType === 'collective' ? <Users size={20} /> : batchMode ? <Users size={20} /> : <User size={20} />}
              <Text fw={600}>Informations principales</Text>
            </Group>

            <Stack gap="md">
              {/* Formation (commun aux deux types) */}
              <Group align="flex-end" gap="xs" grow>
                <Autocomplete
                  label="Formation"
                  placeholder="Tapez pour rechercher une formation..."
                  required
                  data={formationsData || []}
                  value={formationSearchValue}
                  onChange={(value) => {
                    setFormationSearchValue(value);
                    // Trouver l'ID de la formation depuis la map
                    const formationId = formationsMap.get(value);
                    if (formationId) {
                      form.setFieldValue('formationId', formationId);
                    } else if (!value) {
                      // Si le champ est vidé, réinitialiser
                      form.setFieldValue('formationId', 0);
                    }
                  }}
                  error={form.errors.formationId}
                  leftSection={loadingFormations ? <Loader size={16} /> : <BookOpen size={16} />}
                  style={{ flex: 1 }}
                  limit={50}
                  description="Tapez au moins 2 caractères pour rechercher"
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

              {/* Champs spécifiques SESSION INDIVIDUELLE */}
              {sessionType === 'individuelle' && (
                <>
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
                </>
              )}

              {/* Champs spécifiques SESSION COLLECTIVE */}
              {sessionType === 'collective' && (
                <>
                  <TextInput
                    label="Titre de la session"
                    placeholder="Ex: Formation React - Session Printemps 2024"
                    {...form.getInputProps('titre')}
                  />

                  <Group grow>
                    <TextInput
                      label="Lieu"
                      placeholder="Ex: Salle de formation A, Paris"
                      {...form.getInputProps('lieu')}
                    />

                    <Select
                      label="Modalité"
                      required
                      data={[
                        { value: 'presentiel', label: 'Présentiel' },
                        { value: 'distanciel', label: 'Distanciel' },
                        { value: 'hybride', label: 'Hybride' },
                      ]}
                      {...form.getInputProps('modalite')}
                    />
                  </Group>

                  <Group grow>
                    <NumberInput
                      label="Capacité maximale"
                      placeholder="Ex: 15"
                      min={1}
                      max={1000}
                      {...form.getInputProps('capaciteMax')}
                      description="Nombre maximum de participants"
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
                      {...form.getInputProps('statutCollectif')}
                    />
                  </Group>

                  <ParticipantSelector
                    value={participantIds}
                    onChange={setParticipantIds}
                    maxCapacity={form.values.capaciteMax}
                  />

                  <Group grow>
                    <TextInput
                      label="Formateur"
                      placeholder="Nom du formateur"
                      {...form.getInputProps('formateurNom')}
                    />

                    <TextInput
                      label="Contact formateur"
                      placeholder="Email ou téléphone"
                      {...form.getInputProps('formateurContact')}
                    />
                  </Group>

                  <TextInput
                    label="Lien visio"
                    placeholder="https://meet.google.com/..."
                    {...form.getInputProps('lienVisio')}
                    description="Pour les sessions distancielles ou hybrides"
                  />

                  <Textarea
                    label="Description"
                    placeholder="Description de la session collective..."
                    rows={3}
                    {...form.getInputProps('description')}
                  />
                </>
              )}
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

              {/* Champs SESSION INDIVIDUELLE */}
              {sessionType === 'individuelle' && (
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
              )}

              {/* Champs SESSION COLLECTIVE */}
              {sessionType === 'collective' && (
                <Group grow>
                  <TextInput
                    label="Heure de début"
                    placeholder="Ex: 09:00"
                    {...form.getInputProps('heureDebut')}
                    leftSection={<Clock size={16} />}
                  />

                  <TextInput
                    label="Heure de fin"
                    placeholder="Ex: 17:00"
                    {...form.getInputProps('heureFin')}
                    leftSection={<Clock size={16} />}
                  />

                  <NumberInput
                    label="Durée (heures)"
                    placeholder="Ex: 7"
                    min={0}
                    decimalScale={2}
                    {...form.getInputProps('dureePrevueHeures')}
                    leftSection={<Clock size={16} />}
                  />
                </Group>
              )}
            </Stack>
          </Paper>

          {/* Informations complémentaires */}
          <Paper shadow="xs" p="lg" radius="md" withBorder>
            <Group align="center" mb="md">
              <FileText size={20} />
              <Text fw={600}>Informations complémentaires</Text>
            </Group>

            <Stack gap="md">
              {organismeWarning && (
                <Alert color="blue" title="Information" icon={<Warning size={20} />}>
                  {organismeWarning}
                </Alert>
              )}

              <Select
                label="Organisme de formation"
                placeholder="Sélectionner un organisme"
                description={selectedFormation?.organisme
                  ? `Auto-rempli depuis la formation : ${selectedFormation.organisme.nomOrganisme}`
                  : "Sélectionnez l'organisme dispensant la formation"}
                searchable
                clearable
                data={organismes.map(o => ({
                  value: o.id.toString(),
                  label: o.nomOrganisme,
                }))}
                value={form.values.organismeId?.toString()}
                onChange={(value) => {
                  const newOrganismeId = value ? parseInt(value) : undefined;
                  form.setFieldValue('organismeId', newOrganismeId);

                  // Afficher un warning si l'organisme diffère de celui de la formation
                  if (selectedFormation?.organismeId && newOrganismeId !== selectedFormation.organismeId) {
                    const selectedOrg = organismes.find(o => o.id === newOrganismeId);
                    const formationOrg = organismes.find(o => o.id === selectedFormation.organismeId);
                    setOrganismeWarning(
                      `⚠️ Vous avez sélectionné "${selectedOrg?.nomOrganisme || 'un autre organisme'}" alors que la formation est normalement dispensée par "${formationOrg?.nomOrganisme || 'un autre organisme'}".`
                    );
                  } else {
                    setOrganismeWarning(null);
                  }
                }}
                leftSection={<Building size={16} />}
              />

              <NumberInput
                label="Année budgétaire"
                description="Laissez vide pour utiliser l'année de la session"
                placeholder="Ex: 2024"
                min={2000}
                max={2100}
                {...form.getInputProps('anneeBudgetaire')}
              />

              {/* Champs SESSION INDIVIDUELLE */}
              {sessionType === 'individuelle' && (
                <>
                  <NumberInput
                    label="Tarif HT (€)"
                    placeholder="Ex: 1500"
                    min={0}
                    decimalScale={2}
                    {...form.getInputProps('tarifHT')}
                  />

                  <Textarea
                    label="Commentaire"
                    placeholder="Commentaires ou remarques..."
                    rows={3}
                    {...form.getInputProps('commentaire')}
                  />
                </>
              )}

              {/* Champs SESSION COLLECTIVE */}
              {sessionType === 'collective' && (
                <Group grow>
                  <NumberInput
                    label="Tarif unitaire HT (€)"
                    placeholder="Ex: 500"
                    description="Prix par participant"
                    min={0}
                    decimalScale={2}
                    {...form.getInputProps('tarifUnitaireHT')}
                  />

                  <NumberInput
                    label="Tarif total HT (€)"
                    placeholder="Ex: 7500"
                    description="Prix total de la session"
                    min={0}
                    decimalScale={2}
                    {...form.getInputProps('tarifTotalHT')}
                  />
                </Group>
              )}
            </Stack>
          </Paper>

          {/* Résumé */}
          {sessionType === 'individuelle' && batchMode && selectedCollaborateurs.length > 0 && (
            <Alert color="blue" title="Récapitulatif" icon={<Users size={16} />}>
              <Text size="sm">
                <strong>{selectedCollaborateurs.length}</strong> inscription(s) individuelle(s) vont être créées pour la formation sélectionnée.
              </Text>
            </Alert>
          )}

          {sessionType === 'collective' && participantIds.length > 0 && (
            <Alert color="blue" title="Récapitulatif" icon={<Users size={16} />}>
              <Text size="sm">
                Session collective avec <strong>{participantIds.length}</strong> participant(s) sélectionné(s).
                {form.values.capaciteMax && (
                  <> Capacité : {participantIds.length}/{form.values.capaciteMax}</>
                )}
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
              {sessionType === 'collective'
                ? 'Créer la session collective'
                : batchMode
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