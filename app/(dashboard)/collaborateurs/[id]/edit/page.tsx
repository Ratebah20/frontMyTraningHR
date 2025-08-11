'use client';

import { useEffect } from 'react';
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
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { ArrowLeft, Check, X } from '@phosphor-icons/react';
import { mockData } from '@/lib/mock-data';

interface Props {
  params: {
    id: string;
  };
}

export default function CollaborateurEditPage({ params }: Props) {
  const router = useRouter();
  
  // Mock data
  const collaborateur = mockData.collaborateurs.find(c => c.id === parseInt(params.id));
  const departements = ['IT', 'RH', 'Finance', 'Marketing', 'Commercial'];

  const form = useForm({
    initialValues: {
      nom: '',
      prenom: '',
      email: '',
      service: '',
      role: '',
      date_entree: '',
    },
    validate: {
      nom: (value) => (!value ? 'Le nom est requis' : null),
      prenom: (value) => (!value ? 'Le prénom est requis' : null),
      email: (value) => {
        if (!value) return 'L\'email est requis';
        if (!/^\S+@\S+$/.test(value)) return 'Email invalide';
        return null;
      },
      service: (value) => (!value ? 'Le service est requis' : null),
    },
  });

  useEffect(() => {
    if (collaborateur) {
      form.setValues({
        nom: collaborateur.nom,
        prenom: collaborateur.prenom,
        email: collaborateur.email,
        service: collaborateur.service,
        role: collaborateur.role,
        date_entree: new Date().toISOString().split('T')[0],
      });
    }
  }, []);

  const handleSubmit = async (values: typeof form.values) => {
    // Mock update
    notifications.show({
      title: 'Succès',
      message: 'Collaborateur mis à jour avec succès',
      color: 'green',
    });
    router.push(`/collaborateurs/${params.id}`);
  };

  if (!collaborateur) {
    return (
      <Center h="100vh">
        <Title order={3}>Collaborateur non trouvé</Title>
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
        <Title order={1}>Modifier le collaborateur</Title>
      </Group>

      <Paper shadow="sm" radius="md" p="xl" withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Nom"
                  placeholder="Nom"
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

            <TextInput
              label="Email"
              placeholder="email@example.com"
              required
              {...form.getInputProps('email')}
            />

            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="Service"
                  placeholder="Sélectionner le service"
                  required
                  data={departements}
                  {...form.getInputProps('service')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Rôle"
                  placeholder="Rôle du collaborateur"
                  {...form.getInputProps('role')}
                />
              </Grid.Col>
            </Grid>

            <TextInput
              label="Date d'entrée"
              placeholder="YYYY-MM-DD"
              type="date"
              {...form.getInputProps('date_entree')}
            />

            <Group justify="flex-end" mt="xl">
              <Button
                variant="subtle"
                leftSection={<X size={16} />}
                onClick={() => router.back()}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                leftSection={<Check size={16} />}
              >
                Enregistrer
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}