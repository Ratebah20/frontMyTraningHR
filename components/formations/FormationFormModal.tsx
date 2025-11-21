'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  NumberInput,
  Select,
  Button,
  Group,
  Stack,
  Grid,
  Card,
  Text,
  Alert,
  ActionIcon,
  Tooltip,
  Switch,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  CheckCircle,
  Warning,
  BookOpen,
  Tag,
  Clock,
  Info,
  ArrowsClockwise,
  CurrencyEur,
} from '@phosphor-icons/react';
import { formationsService, commonService, organismesService } from '@/lib/services';
import { CreateFormationDto, Formation } from '@/lib/types';
import { generateFormationCode } from '@/lib/utils/formation';

interface FormationFormModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: (formation: Formation) => void;
}

export function FormationFormModal({ opened, onClose, onSuccess }: FormationFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [organismes, setOrganismes] = useState<{ value: string; label: string }[]>([]);
  const [loadingOrganismes, setLoadingOrganismes] = useState(true);
  const [typesFormation, setTypesFormation] = useState<string[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [unitesDuree, setUnitesDuree] = useState<string[]>([]);
  const [loadingUnites, setLoadingUnites] = useState(true);

  const form = useForm<CreateFormationDto & { tarifHT?: number }>({
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

  // Charger les catégories
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
        message: 'Impossible de charger les catégories.',
        color: 'orange',
        icon: <Warning size={20} />,
      });
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Charger les types de formation
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

  // Charger les unités de durée
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

  // Charger les organismes de formation
  const loadOrganismes = async () => {
    setLoadingOrganismes(true);
    try {
      const orgs = await organismesService.getOrganismes(false);

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
        message: 'Impossible de charger les organismes.',
        color: 'orange',
        icon: <Warning size={20} />,
      });
      setOrganismes([]);
    } finally {
      setLoadingOrganismes(false);
    }
  };

  // Charger les données au montage
  useEffect(() => {
    if (opened) {
      loadCategories();
      loadTypesFormation();
      loadUnitesDuree();
      loadOrganismes();
    }
  }, [opened]);

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);

    try {
      const formData: any = {
        ...values,
        categorieId: values.categorieId ? parseInt(values.categorieId) : undefined,
        organismeId: values.organismeId ? parseInt(values.organismeId) : undefined,
      };

      const formation = await formationsService.createFormation(formData);

      notifications.show({
        title: 'Succès',
        message: 'La formation a été créée avec succès',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });

      // Appeler le callback avec la formation créée
      onSuccess(formation);

      // Réinitialiser le formulaire
      form.reset();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création de la formation';
      const statusCode = error.response?.status;

      // Gestion spécifique de l'erreur 409 (doublon de nom ou code)
      if (statusCode === 409) {
        const isCodeDuplicate = errorMessage.toLowerCase().includes('code');
        const isNameDuplicate = errorMessage.toLowerCase().includes('nom');

        // Mettre en surbrillance le champ concerné
        if (isCodeDuplicate) {
          form.setFieldError('codeFormation', errorMessage);
        } else if (isNameDuplicate) {
          form.setFieldError('nomFormation', errorMessage);
        }

        // Afficher une notification explicative
        notifications.show({
          title: 'Doublon détecté',
          message: errorMessage,
          color: 'orange',
          icon: <Warning size={20} />,
          autoClose: 8000,
        });
      } else {
        // Autres erreurs
        notifications.show({
          title: 'Erreur',
          message: errorMessage,
          color: 'red',
          icon: <Warning size={20} />,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600} size="lg">Nouvelle formation</Text>}
      size="lg"
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Informations principales */}
          <Card shadow="xs" p="md" radius="md" withBorder>
            <Group gap="xs" mb="md">
              <BookOpen size={18} />
              <Text fw={600} size="sm">Informations principales</Text>
            </Group>

            <Stack gap="md">
              <Grid gutter="md">
                <Grid.Col span={{ base: 12, md: 8 }}>
                  <TextInput
                    label="Nom de la formation"
                    placeholder="Excel Avancé - Tableaux croisés dynamiques"
                    required
                    description="Nom complet et descriptif de la formation"
                    {...form.getInputProps('nomFormation')}
                    onChange={(e) => {
                      const nomFormation = e.currentTarget.value;
                      form.setFieldValue('nomFormation', nomFormation);
                      // Générer automatiquement le code à partir du nom
                      const codeGenere = generateFormationCode(nomFormation);
                      form.setFieldValue('codeFormation', codeGenere);
                    }}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="Code de la formation"
                    placeholder="Généré automatiquement..."
                    required
                    description={
                      <Group gap={4}>
                        <Info size={14} />
                        <Text size="xs">Généré automatiquement</Text>
                      </Group>
                    }
                    {...form.getInputProps('codeFormation')}
                    readOnly
                    styles={{
                      input: {
                        backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
                        cursor: 'not-allowed',
                        color: 'light-dark(var(--mantine-color-gray-7), var(--mantine-color-gray-4))',
                      }
                    }}
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </Card>

          {/* Classification */}
          <Card shadow="xs" p="md" radius="md" withBorder>
            <Group gap="xs" mb="md" justify="space-between">
              <Group gap="xs">
                <Tag size={18} />
                <Text fw={600} size="sm">Classification</Text>
              </Group>
              {(categories.length === 0 && !loadingCategories) || (organismes.length === 0 && !loadingOrganismes) ? (
                <Group gap="xs">
                  {organismes.length === 0 && !loadingOrganismes && (
                    <Tooltip label="Recharger les organismes">
                      <ActionIcon
                        variant="subtle"
                        onClick={loadOrganismes}
                        loading={loadingOrganismes}
                        size="sm"
                      >
                        <ArrowsClockwise size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                  {categories.length === 0 && !loadingCategories && (
                    <Tooltip label="Recharger les catégories">
                      <ActionIcon
                        variant="subtle"
                        onClick={loadCategories}
                        loading={loadingCategories}
                        size="sm"
                      >
                        <ArrowsClockwise size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>
              ) : null}
            </Group>

            <Grid gutter="md">
              <Grid.Col span={{ base: 12 }}>
                <Select
                  label="Organisme de formation"
                  placeholder={loadingOrganismes ? "Chargement..." : "Sélectionner un organisme"}
                  description="Organisme responsable de cette formation"
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
                  label="Catégorie"
                  placeholder={loadingCategories ? "Chargement..." : "Sélectionner une catégorie"}
                  description="Catégorie principale (optionnel)"
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
                  label="Type de formation"
                  placeholder={loadingTypes ? "Chargement..." : "Sélectionner ou créer"}
                  description="Modalité de dispensation"
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

          {/* Durée et tarification */}
          <Card shadow="xs" p="md" radius="md" withBorder>
            <Group gap="xs" mb="md">
              <Clock size={18} />
              <Text fw={600} size="sm">Durée et tarification</Text>
            </Group>

            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="Durée prévue"
                  placeholder="14"
                  description="Durée standard"
                  min={0}
                  decimalScale={2}
                  {...form.getInputProps('dureePrevue')}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 3 }}>
                <Select
                  label="Unité de durée"
                  placeholder={loadingUnites ? "Chargement..." : "Sélectionner"}
                  description="Unité de temps"
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
                  description="Prix de référence hors taxes"
                  min={0}
                  decimalScale={2}
                  prefix="€ "
                  thousandSeparator=" "
                  {...form.getInputProps('tarifHT')}
                  leftSection={<CurrencyEur size={16} />}
                />
              </Grid.Col>
            </Grid>

            <Alert color="blue" variant="light" mt="md" icon={<Info size={16} />}>
              <Text size="xs">
                Ces valeurs servent de références et valeurs par défaut. Elles seront utilisées automatiquement lors de la création de sessions (si non spécifiées) et pour les calculs de coûts estimatifs.
              </Text>
            </Alert>
          </Card>

          {/* Paramètres */}
          <Card shadow="xs" p="md" radius="md" withBorder>
            <Text fw={600} size="sm" mb="md">Paramètres</Text>

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

          {/* Actions */}
          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              leftSection={<CheckCircle size={16} />}
            >
              Créer la formation
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
