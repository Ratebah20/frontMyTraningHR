'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
} from '@phosphor-icons/react';
import { formationsService, commonService } from '@/lib/services';
import { CreateFormationDto } from '@/lib/types';
import { generateFormationCode } from '@/lib/utils/formation';

export default function NewFormationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [typesFormation, setTypesFormation] = useState<string[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [unitesDuree, setUnitesDuree] = useState<string[]>([]);
  const [loadingUnites, setLoadingUnites] = useState(true);
  
  const form = useForm<CreateFormationDto & { tarifHT?: number }>({
    initialValues: {
      codeFormation: '',
      nomFormation: '',
      categorieId: undefined,
      typeFormation: '',
      dureePrevue: undefined,
      uniteDuree: 'Heures',
      tarifHT: undefined,
      actif: true,
    },
    validate: {
      // Le code est généré automatiquement, pas de validation nécessaire
      nomFormation: (value) => {
        if (!value) return 'Nom de la formation requis';
        if (value.length < 3) return 'Le nom doit contenir au moins 3 caractères';
        if (value.length > 255) return 'Le nom ne doit pas dépasser 255 caractères';
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
      console.log('Chargement des catégories...');
      const cats = await commonService.getCategoriesFormation();
      console.log('Catégories reçues:', cats);
      
      if (Array.isArray(cats) && cats.length > 0) {
        const categoriesList = cats.map(c => ({
          value: c.id.toString(),
          label: c.nomCategorie,
        }));
        console.log('Catégories formatées:', categoriesList);
        setCategories(categoriesList);
      } else {
        console.warn('Aucune catégorie reçue ou format invalide');
        setCategories([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      // Ne pas utiliser de fallback, afficher un message d'erreur à la place
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
      console.log('Chargement des types de formation...');
      const types = await commonService.getTypesFormation();
      console.log('Types de formation reçus:', types);
      
      if (Array.isArray(types)) {
        // Ajouter des types par défaut s'ils n'existent pas déjà
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
      // Utiliser les types par défaut en cas d'erreur
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
      console.log('Chargement des unités de durée...');
      const unites = await commonService.getUnitesDuree();
      console.log('Unités de durée reçues:', unites);
      
      if (Array.isArray(unites)) {
        // Ajouter des unités par défaut s'ils n'existent pas déjà
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
      // Utiliser les unités par défaut en cas d'erreur
      setUnitesDuree(['Heures', 'Jours', 'Semaines', 'Mois']);
    } finally {
      setLoadingUnites(false);
    }
  };

  // Charger les catégories, types et unités au montage
  useEffect(() => {
    loadCategories();
    loadTypesFormation();
    loadUnitesDuree();
  }, []);

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);
    
    try {
      // Préparer les données pour l'envoi
      const formData: any = {
        ...values,
        categorieId: values.categorieId ? parseInt(values.categorieId) : undefined,
      };
      
      const formation = await formationsService.createFormation(formData);

      notifications.show({
        title: 'Succès',
        message: 'La formation a été créée avec succès',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });

      // Utiliser replace au lieu de push pour éviter les problèmes avec router.back()
      router.replace(`/formations/${formation.id}`);
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
    <Container size="lg">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>Nouvelle formation</Title>
          <Text c="dimmed" mt="xs">Créez une nouvelle formation dans le catalogue</Text>
        </div>
        <Button
          variant="subtle"
          leftSection={<ArrowLeft size={20} />}
          onClick={() => router.push('/formations')}
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
                        <Text size="xs">Généré automatiquement depuis le nom</Text>
                      </Group>
                    }
                    {...form.getInputProps('codeFormation')}
                    readOnly
                    styles={{
                      input: {
                        backgroundColor: 'var(--mantine-color-gray-0)',
                        cursor: 'not-allowed',
                        color: 'var(--mantine-color-gray-7)',
                      }
                    }}
                  />
                </Grid.Col>
              </Grid>
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
              Ces valeurs servent de références et valeurs par défaut. Elles seront utilisées automatiquement lors de la création de sessions (si non spécifiées) et pour les calculs de coûts estimatifs.
            </Alert>
          </Card>

          {/* Paramètres */}
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Text fw={600} mb="md">Paramètres</Text>
            
            <Switch
              label="Formation active"
              description="Les formations inactives ne peuvent pas recevoir de nouvelles inscriptions"
              checked={form.values.actif}
              {...form.getInputProps('actif', { type: 'checkbox' })}
              size="md"
            />
          </Card>

          {/* Actions */}
          <Group justify="flex-end">
            <Button
              variant="subtle"
              onClick={() => router.push('/formations')}
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
              Créer la formation
            </Button>
          </Group>
        </Stack>
      </form>
    </Container>
  );
}