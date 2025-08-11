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
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { ArrowLeft, Check, X, Warning, CheckCircle } from '@phosphor-icons/react';
import { notifications } from '@mantine/notifications';
import { collaborateursService } from '@/lib/services';

export default function CollaborateurNewPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departements, setDepartements] = useState<{ value: string; label: string }[]>([]);
  const [managers, setManagers] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const form = useForm({
    initialValues: {
      idExterne: '',
      nom: '',
      prenom: '',
      genre: '',
      departementId: '',
      managerId: '',
      typeUtilisateur: 'STANDARD',
      actif: true,
    },
    validate: {
      idExterne: (value) => {
        if (!value) return 'L\'identifiant est requis';
        if (!/^[A-Z0-9]+$/.test(value)) return 'L\'identifiant doit contenir uniquement des lettres majuscules et des chiffres';
        return null;
      },
      nom: (value) => (!value ? 'Le nom est requis' : null),
      prenom: (value) => (!value ? 'Le prénom est requis' : null),
    },
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        // Charger les départements depuis l'API
        // Pour le moment, on utilise des données statiques
        // TODO: Créer un endpoint pour récupérer les départements
        setDepartements([
          { value: '1', label: 'Commercial' },
          { value: '2', label: 'IT' },
          { value: '3', label: 'RH' },
          { value: '4', label: 'Finance' },
          { value: '5', label: 'Marketing' },
          { value: '6', label: 'Production' },
        ]);

        // Charger les managers potentiels
        try {
          const response = await collaborateursService.getCollaborateurs({
            limit: 100,
            actif: true,
          });
          
          const managersList = (response.data || []).map(c => ({
            value: c.id.toString(),
            label: c.nomComplet,
          }));
          setManagers(managersList);
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
      const dataToSend = {
        idExterne: values.idExterne,
        nom: values.nom,
        prenom: values.prenom,
        genre: values.genre || undefined,
        departementId: values.departementId ? parseInt(values.departementId) : undefined,
        managerId: values.managerId ? parseInt(values.managerId) : undefined,
        typeUtilisateur: values.typeUtilisateur,
        actif: values.actif,
      };
      
      await collaborateursService.createCollaborateur(dataToSend);
      
      notifications.show({
        title: 'Succès',
        message: 'Collaborateur créé avec succès',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
      
      router.push('/collaborateurs');
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
    <Container size="md">
      <Group mb="xl">
        <Button
          variant="subtle"
          leftSection={<ArrowLeft size={16} />}
          onClick={() => router.back()}
        >
          Retour
        </Button>
        <Title order={1}>Nouveau collaborateur</Title>
      </Group>

      <Paper shadow="sm" radius="md" p="xl" withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Identifiant collaborateur"
              placeholder="Ex: COL001"
              required
              description="Lettres majuscules et chiffres uniquement"
              {...form.getInputProps('idExterne')}
            />
            
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Nom"
                  placeholder="Nom de famille"
                  required
                  {...form.getInputProps('nom')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Prénom"
                  placeholder="Prénom"
                  required
                  {...form.getInputProps('prenom')}
                />
              </Grid.Col>
            </Grid>

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

            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="Département"
                  placeholder="Sélectionner le département"
                  data={departements}
                  searchable
                  clearable
                  {...form.getInputProps('departementId')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="Manager"
                  placeholder="Sélectionner le manager"
                  data={managers}
                  searchable
                  clearable
                  {...form.getInputProps('managerId')}
                />
              </Grid.Col>
            </Grid>

            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="Type d'utilisateur"
                  placeholder="Sélectionner le type"
                  data={[
                    { value: 'STANDARD', label: 'Standard' },
                    { value: 'MANAGER', label: 'Manager' },
                    { value: 'ADMIN', label: 'Administrateur' },
                  ]}
                  {...form.getInputProps('typeUtilisateur')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="Statut"
                  placeholder="Sélectionner le statut"
                  data={[
                    { value: 'true', label: 'Actif' },
                    { value: 'false', label: 'Inactif' },
                  ]}
                  value={form.values.actif.toString()}
                  onChange={(value) => form.setFieldValue('actif', value === 'true')}
                />
              </Grid.Col>
            </Grid>

            <Group justify="flex-end" mt="xl">
              <Button
                variant="subtle"
                leftSection={<X size={16} />}
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                leftSection={<Check size={16} />}
                loading={isSubmitting}
              >
                Créer
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}