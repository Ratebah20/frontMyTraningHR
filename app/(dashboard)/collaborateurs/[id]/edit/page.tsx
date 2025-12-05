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
  Center,
  Grid,
  Loader,
  Alert,
  Switch,
  Divider,
  Text,
  SegmentedControl,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  ArrowLeft,
  Check,
  X,
  Warning,
  User,
  Users,
  Building,
  IdentificationCard,
} from '@phosphor-icons/react';
import { collaborateursService, commonService, managersService, departementsService } from '@/lib/services';
import { Collaborateur, TypeUtilisateur } from '@/lib/types';

interface Props {
  params: {
    id: string;
  };
}

export default function CollaborateurEditPage({ params }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collaborateur, setCollaborateur] = useState<Collaborateur | null>(null);
  const [allDepartements, setAllDepartements] = useState<any[]>([]); // Tous les départements/équipes
  const [departements, setDepartements] = useState<any[]>([]); // Liste filtrée
  const [managers, setManagers] = useState<any[]>([]);
  const [typeContrats, setTypeContrats] = useState<any[]>([]);
  const [departementType, setDepartementType] = useState<'DEPARTEMENT' | 'EQUIPE'>('DEPARTEMENT');

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
      typeUtilisateur: TypeUtilisateur.COLLABORATEUR,
      actif: true,
    },
    validate: {
      nom: (value) => (!value?.trim() ? 'Le nom est requis' : null),
      prenom: (value) => (!value?.trim() ? 'Le prénom est requis' : null),
      matricule: (value) => {
        if (!value?.trim()) return null; // Optionnel
        if (value.length > 20) return 'Le matricule ne peut pas dépasser 20 caractères';
        return null;
      },
      idExterne: (value) => {
        if (!value?.trim()) return null; // Optionnel
        if (value.length > 50) return 'L\'ID Orange Learning ne peut pas dépasser 50 caractères';
        return null;
      },
    },
  });

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Charger le collaborateur
        const collabData = await collaborateursService.getCollaborateur(parseInt(params.id));
        setCollaborateur(collabData);

        // Détecter le type du département actuel du collaborateur
        if (collabData.departementId) {
          try {
            const deptData = await departementsService.getById(collabData.departementId);
            if (deptData.type) {
              setDepartementType(deptData.type as 'DEPARTEMENT' | 'EQUIPE');
            }
          } catch (err) {
            console.error('Erreur lors de la détection du type de département:', err);
          }
        }

        // Charger TOUS les départements et équipes
        const [departementsData, contratsData] = await Promise.all([
          departementsService.getAll(),
          commonService.getTypesContrats(),
        ]);

        // Stocker tous les départements/équipes
        if (departementsData) {
          setAllDepartements(departementsData);
        }
        
        // Formater les types de contrats pour le select
        if (contratsData) {
          const contratsList = contratsData.map(c => ({
            value: c.id.toString(),
            label: c.typeContrat,
          }));
          setTypeContrats(contratsList);
        }
        
        // Mettre à jour le formulaire avec les données existantes
        form.setValues({
          matricule: collabData.matricule || '',
          idExterne: collabData.idExterne || '',
          workerSubType: collabData.workerSubType || '',
          nom: collabData.nom || '',
          prenom: collabData.prenom || '',
          genre: collabData.genre || '',
          departementId: collabData.departementId ? collabData.departementId.toString() : '',
          managerId: collabData.managerId ? collabData.managerId.toString() : '',
          contratId: collabData.contratId ? collabData.contratId.toString() : '',
          typeUtilisateur: (collabData.typeUtilisateur as TypeUtilisateur) || TypeUtilisateur.COLLABORATEUR,
          actif: collabData.actif !== false,
        });
        
        // Charger uniquement les vrais managers (qui ont des subordonnés)
        const managersResponse = await managersService.getManagers();
        if (managersResponse.data) {
          const managersList = managersResponse.data
            .filter(m => m.id !== parseInt(params.id)) // Exclure le collaborateur lui-même
            .map(m => ({
              value: m.id.toString(),
              label: m.nomComplet,
            }));
          setManagers(managersList);
        }
        
      } catch (err: any) {
        console.error('Erreur lors du chargement:', err);
        setError(err.message || 'Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [params.id]);

  // Filtrer les départements/équipes selon le type sélectionné
  useEffect(() => {
    if (allDepartements.length > 0) {
      const filtered = allDepartements.filter(d => d.type === departementType);
      const departmentsList = filtered.map(d => ({
        value: d.id.toString(),
        label: d.nomDepartement,
      }));
      setDepartements(departmentsList);
    }
  }, [departementType, allDepartements]);

  const handleSubmit = async (values: typeof form.values) => {
    setIsSaving(true);
    
    try {
      // Préparer les données pour l'envoi
      const updateData: any = {
        matricule: values.matricule || undefined,
        idExterne: values.idExterne || undefined,
        workerSubType: values.workerSubType || undefined,
        nom: values.nom,
        prenom: values.prenom,
        // N'inclure genre que s'il est valide
        ...(values.genre && ['M', 'F', 'Autre'].includes(values.genre) ? { genre: values.genre } : {}),
        departementId: values.departementId ? parseInt(values.departementId) : undefined,
        managerId: values.managerId ? parseInt(values.managerId) : undefined,
        contratId: values.contratId ? parseInt(values.contratId) : undefined,
        typeUtilisateur: values.typeUtilisateur,
        actif: values.actif,
      };

      // Retirer les champs undefined
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      await collaborateursService.updateCollaborateur(parseInt(params.id), updateData);
      
      notifications.show({
        title: 'Succès',
        message: 'Collaborateur mis à jour avec succès',
        color: 'green',
        icon: <Check size={20} />,
      });
      
      router.push(`/collaborateurs/${params.id}`);
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour:', err);
      notifications.show({
        title: 'Erreur',
        message: err.message || 'Erreur lors de la mise à jour',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Center h={400}>
        <Loader size="lg" variant="bars" />
      </Center>
    );
  }

  if (error || !collaborateur) {
    return (
      <Container size="md">
        <Alert icon={<Warning size={16} />} color="red" variant="light">
          {error || 'Collaborateur non trouvé'}
        </Alert>
        <Button onClick={() => router.push('/collaborateurs')} mt="md">
          Retour à la liste
        </Button>
      </Container>
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
          Retour à la liste
        </Button>
        <Title order={1}>Modifier le collaborateur</Title>
      </Group>

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
                  <Select
                    label="Genre"
                    placeholder="Sélectionner le genre"
                    data={[
                      { value: 'M', label: 'Masculin' },
                      { value: 'F', label: 'Féminin' },
                      { value: 'Autre', label: 'Autre' },
                    ]}
                    clearable
                    {...form.getInputProps('genre')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="Matricule RH"
                    placeholder="Ex: 00017336"
                    {...form.getInputProps('matricule')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="ID Orange Learning"
                    placeholder="Ex: COL001"
                    {...form.getInputProps('idExterne')}
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

              {/* Sélecteur Type : Département ou Équipe */}
              <Stack gap="xs" mb="md">
                <Text size="sm" fw={500}>Type d'affectation</Text>
                <SegmentedControl
                  value={departementType}
                  onChange={(value) => {
                    setDepartementType(value as 'DEPARTEMENT' | 'EQUIPE');
                    // Réinitialiser la sélection du département quand on change de type
                    form.setFieldValue('departementId', '');
                  }}
                  data={[
                    {
                      value: 'DEPARTEMENT',
                      label: (
                        <Group gap="xs">
                          <Building size={16} />
                          <Text size="sm">Département</Text>
                        </Group>
                      )
                    },
                    {
                      value: 'EQUIPE',
                      label: (
                        <Group gap="xs">
                          <Users size={16} />
                          <Text size="sm">Équipe</Text>
                        </Group>
                      )
                    },
                  ]}
                />
              </Stack>

              <Grid gutter="md">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label={departementType === 'DEPARTEMENT' ? 'Département' : 'Équipe'}
                    placeholder={departementType === 'DEPARTEMENT' ? 'Sélectionner le département' : 'Sélectionner l\'équipe'}
                    data={departements}
                    clearable
                    searchable
                    {...form.getInputProps('departementId')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Manager"
                    placeholder="Sélectionner le manager"
                    data={managers}
                    clearable
                    searchable
                    {...form.getInputProps('managerId')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Rôle"
                    placeholder="Sélectionner le rôle"
                    description="Définit le niveau hiérarchique du collaborateur"
                    data={[
                      { value: TypeUtilisateur.COLLABORATEUR, label: 'Collaborateur' },
                      { value: TypeUtilisateur.MANAGER, label: 'Manager' },
                      { value: TypeUtilisateur.DIRECTEUR, label: 'Directeur' },
                    ]}
                    {...form.getInputProps('typeUtilisateur')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Type de contrat"
                    placeholder="Sélectionner le type de contrat"
                    data={typeContrats}
                    clearable
                    searchable
                    {...form.getInputProps('contratId')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Sous-type de contrat"
                    placeholder="Ex: Employee FT, VIE, Trainee"
                    {...form.getInputProps('workerSubType')}
                  />
                </Grid.Col>
              </Grid>
            </div>

            <Divider />

            {/* Paramètres */}
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
              />
            </div>

            {/* Boutons d'action */}
            <Group justify="flex-end" mt="xl">
              <Button
                variant="subtle"
                leftSection={<X size={16} />}
                onClick={() => router.push('/collaborateurs')}
                disabled={isSaving}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                leftSection={<Check size={16} />}
                loading={isSaving}
              >
                Enregistrer les modifications
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}