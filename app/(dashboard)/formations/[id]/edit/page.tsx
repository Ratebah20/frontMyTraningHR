'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  Title,
  Card,
  TextInput,
  Textarea,
  NumberInput,
  Select,
  Button,
  Group,
  Stack,
  Switch,
  Alert,
  Grid,
  Text,
  Divider,
  Paper,
  ActionIcon,
  Tooltip,
  Loader,
  Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { 
  ArrowLeft, 
  CheckCircle, 
  Warning,
  Tag,
  Clock,
  CurrencyEur,
  Info,
  BookOpen,
  ArrowsClockwise,
  PencilSimple,
} from '@phosphor-icons/react';
import { formationsService, commonService, organismesService } from '@/lib/services';
import { UpdateFormationDto, Formation } from '@/lib/types';

export default function EditFormationPage() {
  const router = useRouter();
  const params = useParams();
  const formationId = Number(params.id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formation, setFormation] = useState<Formation | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [organismes, setOrganismes] = useState<{ value: string; label: string }[]>([]);
  const [loadingOrganismes, setLoadingOrganismes] = useState(true);
  const [typesFormation, setTypesFormation] = useState<string[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [unitesDuree, setUnitesDuree] = useState<string[]>([]);
  const [loadingUnites, setLoadingUnites] = useState(true);
  
  const form = useForm<UpdateFormationDto & { tarifHT?: number }>({
    initialValues: {
      codeFormation: '',
      nomFormation: '',
      categorieId: undefined,
      organismeId: undefined,
      typeFormation: '',
      dureePrevue: undefined,
      uniteDuree: 'Heures',
      tarifHT: undefined,
      actif: true,
      estCertifiante: false,
    },
    validate: {
      codeFormation: (value) => {
        if (!value) return 'Code formation requis';
        if (value.length < 3) return 'Le code doit contenir au moins 3 caractères';
        if (value.length > 50) return 'Le code ne doit pas dépasser 50 caractères';
        if (!/^[A-Z0-9_-]+$/i.test(value)) {
          return 'Le code doit contenir uniquement des lettres, chiffres, tirets et underscores';
        }
        return null;
      },
      nomFormation: (value) => {
        if (!value) return 'Nom de la formation requis';
        if (value.length < 3) return 'Le nom doit contenir au moins 3 caractères';
        if (value.length > 255) return 'Le nom ne doit pas dépasser 255 caractères';
        return null;
      },
      organismeId: (value) => {
        if (!value) return 'Organisme de formation requis';
        return null;
      },
      dureePrevue: (value) => {
        if (value && value <= 0) return 'La durée doit être positive';
        return null;
      },
      tarifHT: (value) => {
        if (value && value < 0) return 'Le tarif ne peut pas être négatif';
        return null;
      },
    },
  });

  // Fonction pour charger les catégories
  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const cats = await commonService.getCategoriesFormation();
      
      if (Array.isArray(cats) && cats.length > 0) {
        const categoriesList = cats.map(c => ({
          value: c.id.toString(),
          label: c.nomCategorie,
        }));
        setCategories(categoriesList);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      notifications.show({
        title: 'Attention',
        message: 'Impossible de charger les catégories. Vérifiez votre connexion.',
        color: 'orange',
        icon: <Warning size={20} />,
      });
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fonction pour charger les types de formation
  const loadTypesFormation = async () => {
    setLoadingTypes(true);
    try {
      const types = await commonService.getTypesFormation();

      if (Array.isArray(types)) {
        const defaultTypes = [
          'Présentiel',
          'Distanciel',
          'E-learning',
          'Blended',
        ];

        const allTypes = new Set([...types, ...defaultTypes]);
        const sortedTypes = Array.from(allTypes).sort();
        setTypesFormation(sortedTypes);
      } else {
        setTypesFormation([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des types de formation:', error);
      setTypesFormation([
        'Présentiel',
        'Distanciel',
        'E-learning',
        'Blended',
      ]);
    } finally {
      setLoadingTypes(false);
    }
  };

  // Fonction pour charger les unités de durée
  const loadUnitesDuree = async () => {
    setLoadingUnites(true);
    try {
      const unites = await commonService.getUnitesDuree();

      if (Array.isArray(unites)) {
        const defaultUnites = [
          'Heures',
          'Jours',
          'Semaines',
          'Mois',
        ];

        const allUnites = new Set([...unites, ...defaultUnites]);
        const sortedUnites = Array.from(allUnites).sort();
        setUnitesDuree(sortedUnites);
      } else {
        setUnitesDuree(['Heures', 'Jours', 'Semaines', 'Mois']);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des unités de durée:', error);
      setUnitesDuree(['Heures', 'Jours', 'Semaines', 'Mois']);
    } finally {
      setLoadingUnites(false);
    }
  };

  // Fonction pour charger les organismes
  const loadOrganismes = async () => {
    setLoadingOrganismes(true);
    try {
      const orgs = await organismesService.getOrganismes(false); // Seulement les actifs

      if (Array.isArray(orgs) && orgs.length > 0) {
        const organismesList = orgs.map(o => ({
          value: o.id.toString(),
          label: o.nomOrganisme,
        }));
        setOrganismes(organismesList);
      } else {
        setOrganismes([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des organismes:', error);
      notifications.show({
        title: 'Attention',
        message: 'Impossible de charger les organismes. Vérifiez votre connexion.',
        color: 'orange',
        icon: <Warning size={20} />,
      });
      setOrganismes([]);
    } finally {
      setLoadingOrganismes(false);
    }
  };

  // Charger la formation existante
  const loadFormation = async () => {
    try {
      setIsLoading(true);
      const data = await formationsService.getFormation(formationId);
      setFormation(data);
      
      // Pré-remplir le formulaire avec les données existantes
      form.setValues({
        codeFormation: data.codeFormation || '',
        nomFormation: data.nomFormation || '',
        categorieId: data.categorie?.id?.toString(),
        organismeId: data.organisme?.id?.toString() || data.organismeId?.toString(),
        typeFormation: data.typeFormation || '',
        dureePrevue: data.dureePrevue,
        uniteDuree: data.uniteDuree || 'Heures',
        tarifHT: data.tarifHT,
        actif: data.actif !== false,
        estCertifiante: data.estCertifiante || false,
      });
    } catch (error) {
      console.error('Erreur lors du chargement de la formation:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les données de la formation',
        color: 'red',
        icon: <Warning size={20} />,
      });
      router.push('/formations');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger toutes les données au montage
  useEffect(() => {
    loadCategories();
    loadOrganismes();
    loadTypesFormation();
    loadUnitesDuree();
    loadFormation();
  }, [formationId]);

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);
    setWarningMessage(null);

    try {
      // Préparer les données pour l'envoi
      const formData: any = {
        ...values,
        categorieId: values.categorieId ? parseInt(values.categorieId) : undefined,
        organismeId: values.organismeId ? parseInt(values.organismeId) : undefined,
      };

      const response = await formationsService.updateFormation(formationId, formData);

      // Afficher le warning s'il y en a un dans la réponse
      if (response.warning) {
        setWarningMessage(response.warning);
      }

      notifications.show({
        title: 'Succès',
        message: 'La formation a été mise à jour avec succès',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });

      router.push(`/formations/${formationId}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la mise à jour de la formation';

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
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (!formation) {
    return (
      <Container size="lg">
        <Alert color="red" title="Erreur" icon={<Warning size={20} />}>
          Formation introuvable
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>Modifier la formation</Title>
          <Text c="dimmed" mt="xs">
            Modification de : {formation.nomFormation}
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
          {/* Informations principales */}
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group gap="xs" mb="md">
              <BookOpen size={20} />
              <Text fw={600}>Informations principales</Text>
            </Group>
            
            <Stack gap="md">
              <Grid gutter="md">
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="Code de la formation"
                    placeholder="EXCEL_ADV_2025"
                    required
                    description="Code unique (lettres, chiffres, tirets)"
                    {...form.getInputProps('codeFormation')}
                    onBlur={(e) => {
                      const value = e.currentTarget.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
                      form.setFieldValue('codeFormation', value);
                    }}
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 8 }}>
                  <TextInput
                    label="Nom de la formation"
                    placeholder="Excel Avancé - Tableaux croisés dynamiques"
                    required
                    description="Nom complet et descriptif de la formation"
                    {...form.getInputProps('nomFormation')}
                  />
                </Grid.Col>
              </Grid>

              <Textarea
                label="Description"
                placeholder="Décrivez les objectifs et le contenu de la formation..."
                minRows={3}
                maxRows={6}
                description="Description détaillée pour les participants (optionnel)"
              />
            </Stack>
          </Card>

          {/* Classification et type */}
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group gap="xs" mb="md" justify="space-between">
              <Group gap="xs">
                <Tag size={20} />
                <Text fw={600}>Classification</Text>
              </Group>
              {categories.length === 0 && !loadingCategories && (
                <Tooltip label="Recharger les catégories">
                  <ActionIcon 
                    variant="subtle" 
                    onClick={loadCategories}
                    loading={loadingCategories}
                  >
                    <ArrowsClockwise size={16} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
            
            {warningMessage && (
              <Alert color="orange" title="Avertissement" icon={<Warning size={20} />}>
                {warningMessage}
              </Alert>
            )}

            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="Catégorie"
                  placeholder={loadingCategories ? "Chargement..." : "Sélectionner une catégorie"}
                  description={`Catégorie principale de la formation ${categories.length > 0 ? `(${categories.length} disponibles)` : ''}`}
                  clearable
                  searchable
                  data={categories}
                  disabled={loadingCategories || categories.length === 0}
                  nothingFoundMessage="Aucune catégorie trouvée"
                  {...form.getInputProps('categorieId')}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="Organisme de formation"
                  placeholder={loadingOrganismes ? "Chargement..." : "Sélectionner un organisme"}
                  description={`Organisme qui dispense la formation ${organismes.length > 0 ? `(${organismes.length} disponibles)` : ''}`}
                  required
                  searchable
                  data={organismes}
                  disabled={loadingOrganismes || organismes.length === 0}
                  nothingFoundMessage="Aucun organisme trouvé"
                  {...form.getInputProps('organismeId')}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="Type de formation"
                  placeholder={loadingTypes ? "Chargement..." : "Sélectionner ou créer un type"}
                  description={`Modalité de dispensation ${typesFormation.length > 0 ? `(${typesFormation.length} existants)` : ''}`}
                  clearable
                  searchable
                  creatable
                  getCreateLabel={(query) => `+ Créer "${query}"`}
                  onCreate={(query) => {
                    const item = query;
                    setTypesFormation((current) => [...current, item].sort());
                    return item;
                  }}
                  data={typesFormation}
                  disabled={loadingTypes}
                  nothingFoundMessage="Tapez pour créer un nouveau type"
                  {...form.getInputProps('typeFormation')}
                />
              </Grid.Col>
            </Grid>
          </Card>

          {/* Durée et tarif */}
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group gap="xs" mb="md">
              <Clock size={20} />
              <Text fw={600}>Durée et tarification</Text>
            </Group>
            
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="Durée prévue"
                  placeholder="14"
                  description="Durée standard de la formation"
                  min={0}
                  decimalScale={2}
                  {...form.getInputProps('dureePrevue')}
                />
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Select
                  label="Unité de durée"
                  placeholder={loadingUnites ? "Chargement..." : "Sélectionner ou créer"}
                  description="Unité de mesure du temps"
                  searchable
                  creatable
                  getCreateLabel={(query) => `+ Créer "${query}"`}
                  onCreate={(query) => {
                    const item = query;
                    setUnitesDuree((current) => [...current, item].sort());
                    return item;
                  }}
                  data={unitesDuree}
                  disabled={loadingUnites}
                  nothingFoundMessage="Tapez pour créer une nouvelle unité"
                  {...form.getInputProps('uniteDuree')}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <NumberInput
                  label="Tarif HT standard"
                  placeholder="1500"
                  description="Prix de référence hors taxes (optionnel)"
                  min={0}
                  decimalScale={2}
                  prefix="€ "
                  thousandSeparator=" "
                  {...form.getInputProps('tarifHT')}
                />
              </Grid.Col>
            </Grid>

            <Alert color="blue" variant="light" mt="md" icon={<Info size={20} />}>
              Ces valeurs sont des références. Elles peuvent être ajustées pour chaque session.
            </Alert>
          </Card>

          {/* Paramètres */}
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Text fw={600} mb="md">Paramètres</Text>

            <Stack gap="md">
              <Switch
                label="Formation active"
                description="Les formations inactives ne peuvent pas recevoir de nouvelles inscriptions"
                checked={form.values.actif}
                {...form.getInputProps('actif', { type: 'checkbox' })}
                size="md"
              />

              <Switch
                label="Formation certifiante"
                description="Cette formation délivre une certification ou un diplôme"
                checked={form.values.estCertifiante}
                {...form.getInputProps('estCertifiante', { type: 'checkbox' })}
                size="md"
              />
            </Stack>
          </Card>

          {/* Statistiques de la formation (info seulement) */}
          {formation.stats && (
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Text fw={600} mb="md">Informations actuelles</Text>
              <Grid gutter="md">
                <Grid.Col span={{ base: 6, md: 3 }}>
                  <Text size="sm" c="dimmed">Sessions totales</Text>
                  <Text fw={600}>{formation.stats.nombreSessions || 0}</Text>
                </Grid.Col>
                <Grid.Col span={{ base: 6, md: 3 }}>
                  <Text size="sm" c="dimmed">Participants</Text>
                  <Text fw={600}>{formation.stats.nombreParticipants || 0}</Text>
                </Grid.Col>
                <Grid.Col span={{ base: 6, md: 3 }}>
                  <Text size="sm" c="dimmed">Heures totales</Text>
                  <Text fw={600}>{formation.stats.heuresTotales || 0}h</Text>
                </Grid.Col>
              </Grid>
            </Card>
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
              size="md"
              leftSection={<CheckCircle size={20} />}
            >
              Enregistrer les modifications
            </Button>
          </Group>
        </Stack>
      </form>
    </Container>
  );
}