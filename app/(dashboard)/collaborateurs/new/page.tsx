'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Paper,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Grid,
  Alert,
  Loader,
  Center,
  Switch,
  Divider,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { 
  ArrowLeft, 
  Check, 
  X, 
  Warning, 
  CheckCircle,
  User,
  Building,
  IdentificationCard,
  Info,
} from '@phosphor-icons/react';
import { notifications } from '@mantine/notifications';
import { collaborateursService, commonService, managersService } from '@/lib/services';

export default function CollaborateurNewPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departements, setDepartements] = useState<{ value: string; label: string }[]>([]);
  const [managers, setManagers] = useState<{ value: string; label: string }[]>([]);
  const [typeContrats, setTypeContrats] = useState<{ value: string; label: string }[]>([]);
  const [workerSubTypes, setWorkerSubTypes] = useState<string[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const form = useForm({
    initialValues: {
      matricule: '',
      idExterne: '',
      workerSubType: '',
      nom: '',
      prenom: '',
      genre: '',
      departementId: '',
      managerId: '',
      contratId: '',
      actif: true,
    },
    validate: {
      nom: (value) => (!value?.trim() ? 'Le nom est requis' : null),
      prenom: (value) => (!value?.trim() ? 'Le prénom est requis' : null),
      genre: (value) => (!value ? 'Le genre est requis' : null),
      departementId: (value) => (!value ? 'Le département est requis' : null),
      managerId: (value) => (!value ? 'Le manager est requis' : null),
      contratId: (value) => (!value ? 'Le type de contrat est requis' : null),
      matricule: (value) => {
        // Matricule optionnel - peut être vide pour les anciens collaborateurs
        if (!value?.trim()) return null;
        if (value.length > 20) return 'Le matricule ne peut pas dépasser 20 caractères';
        return null;
      },
      idExterne: (value) => {
        // ID Orange Learning optionnel - sera fourni lors de l'import OLU
        if (!value?.trim()) return null;
        if (value.length > 50) return 'L\'ID Orange Learning ne peut pas dépasser 50 caractères';
        return null;
      },
      workerSubType: (value) => {
        // Sous-type de contrat optionnel
        return null;
      },
    },
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        // Charger les listes depuis les endpoints dédiés
        const [departementsData, contratsData] = await Promise.all([
          commonService.getDepartements(),
          commonService.getTypesContrats(),
        ]);
        
        // Formater les départements pour le select
        if (departementsData) {
          const departmentsList = departementsData.map(d => ({
            value: d.id.toString(),
            label: d.nomDepartement,
          }));
          setDepartements(departmentsList);
        }
        
        // Formater les types de contrats pour le select
        if (contratsData) {
          const contratsList = contratsData.map(c => ({
            value: c.id.toString(),
            label: c.typeContrat,
          }));
          setTypeContrats(contratsList);
        }

        // Charger les managers potentiels et les sous-types de contrats existants
        try {
          // Charger uniquement les vrais managers (qui ont des subordonnés)
          const managersResponse = await managersService.getManagers();

          if (managersResponse.data) {
            const managersList = managersResponse.data.map(m => ({
              value: m.id.toString(),
              label: m.nomComplet,
            }));
            setManagers(managersList);
          }

          // Définir les sous-types de contrats les plus courants
          const commonSubTypes = [
            'Employee FT',
            'Employee PT',
            'VIE',
            'Trainee',
            'Contractor',
            'Intern',
            'Manager',
            'Consultant',
            'Apprentice'
          ];
          setWorkerSubTypes(commonSubTypes.sort());
        } catch (error) {
          console.error('Erreur lors du chargement des managers:', error);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);
    
    try {
      // Préparer les données pour l'envoi
      const dataToSend: any = {
        matricule: values.matricule || undefined,
        idExterne: values.idExterne || undefined,
        workerSubType: values.workerSubType || undefined,
        nom: values.nom,
        prenom: values.prenom,
        genre: values.genre || undefined,
        departementId: values.departementId ? parseInt(values.departementId) : undefined,
        managerId: values.managerId ? parseInt(values.managerId) : undefined,
        contratId: values.contratId ? parseInt(values.contratId) : undefined,
        actif: values.actif,
      };
      
      // Retirer les champs undefined
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === undefined) {
          delete dataToSend[key];
        }
      });
      
      const result = await collaborateursService.createCollaborateur(dataToSend);
      
      notifications.show({
        title: 'Succès',
        message: values.idExterne
          ? 'Collaborateur créé avec succès'
          : 'Collaborateur créé avec succès. N\'oubliez pas d\'ajouter l\'ID Orange Learning dès qu\'il sera disponible.',
        color: 'green',
        icon: <CheckCircle size={20} />,
        autoClose: values.idExterne ? 5000 : false, // Message permanent si pas d'ID Orange Learning
      });
      
      // Rediriger vers la page de détail du nouveau collaborateur
      if (result?.collaborateur?.id) {
        router.push(`/collaborateurs/${result.collaborateur.id}`);
      } else {
        router.push('/collaborateurs');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Une erreur est survenue lors de la création';
      
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

  if (isLoadingData) {
    return (
      <Center h={400}>
        <Loader size="lg" variant="bars" />
      </Center>
    );
  }

  return (
    <Container size="lg">
      {/* En-tête */}
      <Group mb="xl">
        <Button
          variant="subtle"
          leftSection={<ArrowLeft size={16} />}
          onClick={() => router.push('/collaborateurs')}
        >
          Retour
        </Button>
        <Title order={1}>Nouveau collaborateur</Title>
      </Group>

      {/* Message d'information sur l'ID Orange Learning */}
      <Alert
        icon={<Warning size={16} />}
        color="orange"
        variant="light"
        mb="xl"
      >
        <Text fw={600} mb="xs">Information importante sur l'ID Orange Learning</Text>
        <Text size="sm">
          L'ID Orange Learning peut être laissé vide lors de la création, mais <strong>ATTENTION</strong> :
          vous devez <strong>impérativement ajouter l'ID Orange Learning AVANT</strong> d'importer le fichier OLU
          quand le collaborateur suivra sa première formation.
        </Text>
        <Text size="sm" mt="xs">
          <strong>Rappel :</strong> L'ID Orange Learning doit être saisi manuellement dans le système avant l'import OLU,
          sinon l'import échouera pour ce collaborateur.
        </Text>
      </Alert>

      <Paper shadow="xs" radius="md" p="xl" withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="lg">
            {/* Informations personnelles */}
            <div>
              <Group gap="xs" mb="md">
                <User size={20} />
                <Text fw={600}>Informations personnelles</Text>
              </Group>
              <Grid gutter="md">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Nom"
                    placeholder="Nom du collaborateur"
                    required
                    {...form.getInputProps('nom')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Prénom"
                    placeholder="Prénom du collaborateur"
                    required
                    {...form.getInputProps('prenom')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="Matricule RH"
                    placeholder="Ex: 00017336"
                    description="Optionnel pour les anciens collaborateurs"
                    {...form.getInputProps('matricule')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="ID Orange Learning"
                    placeholder="À ajouter avant import OLU"
                    description="Optionnel - requis avant import OLU"
                    {...form.getInputProps('idExterne')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Genre"
                    placeholder="Sélectionner le genre"
                    required
                    data={[
                      { value: 'M', label: 'Masculin' },
                      { value: 'F', label: 'Féminin' },
                      { value: 'Autre', label: 'Autre' },
                    ]}
                    {...form.getInputProps('genre')}
                  />
                </Grid.Col>
              </Grid>
            </div>

            <Divider />

            {/* Informations professionnelles */}
            <div>
              <Group gap="xs" mb="md">
                <Building size={20} />
                <Text fw={600}>Informations professionnelles</Text>
              </Group>
              <Grid gutter="md">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Département"
                    placeholder="Sélectionner le département"
                    required
                    data={departements}
                    searchable
                    {...form.getInputProps('departementId')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Manager"
                    placeholder="Sélectionner le manager"
                    required
                    data={managers}
                    searchable
                    {...form.getInputProps('managerId')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Type de contrat"
                    placeholder="Sélectionner le type de contrat"
                    required
                    data={typeContrats}
                    searchable
                    {...form.getInputProps('contratId')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Sous-type de contrat"
                    placeholder="Ex: Employee FT, VIE, Trainee"
                    description="Optionnel - Sélectionner ou créer"
                    data={workerSubTypes}
                    searchable
                    creatable
                    getCreateLabel={(query) => `+ Créer "${query}"`}
                    onCreate={(query) => {
                      const newItem = query;
                      setWorkerSubTypes((current) => [...current, newItem]);
                      return newItem;
                    }}
                    clearable
                    {...form.getInputProps('workerSubType')}
                  />
                </Grid.Col>
              </Grid>
            </div>

            <Divider />

            {/* Statut */}
            <div>
              <Group gap="xs" mb="md">
                <IdentificationCard size={20} />
                <Text fw={600}>Statut</Text>
              </Group>
              <Switch
                label={form.values.actif ? 'Collaborateur actif' : 'Collaborateur inactif'}
                checked={form.values.actif}
                {...form.getInputProps('actif')}
                size="md"
                description="Les nouveaux collaborateurs sont généralement créés comme actifs"
              />
            </div>

            {/* Boutons d'action */}
            <Group justify="flex-end" mt="xl">
              <Button
                variant="subtle"
                leftSection={<X size={16} />}
                onClick={() => router.push('/collaborateurs')}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                leftSection={<Check size={16} />}
                loading={isSubmitting}
              >
                Créer le collaborateur
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}