'use client';

import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  Card,
  Stack,
  Switch,
  Alert,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Buildings, ArrowLeft, Check } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useCreateOrganisme } from '@/hooks/useOrganismes';
import { useForm } from '@mantine/form';

export default function NewOrganismePage() {
  const router = useRouter();
  const { createOrganisme, isLoading, error } = useCreateOrganisme();

  const form = useForm({
    initialValues: {
      nomOrganisme: '',
      typeOrganisme: '',
      contact: '',
      actif: true,
    },
    validate: {
      nomOrganisme: (value) =>
        value.length < 2 ? 'Le nom doit contenir au moins 2 caractères' :
        value.length > 255 ? 'Le nom ne peut pas dépasser 255 caractères' :
        null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await createOrganisme({
        nomOrganisme: values.nomOrganisme,
        typeOrganisme: values.typeOrganisme || undefined,
        contact: values.contact || undefined,
        actif: values.actif,
      });

      notifications.show({
        title: 'Succès',
        message: `Organisme "${values.nomOrganisme}" créé avec succès`,
        color: 'green',
        icon: <Check size={18} />,
      });

      router.push('/organismes');
    } catch (err: any) {
      notifications.show({
        title: 'Erreur',
        message: err.message || 'Erreur lors de la création',
        color: 'red',
      });
    }
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {/* En-tête */}
        <Group gap="sm">
          <Button
            variant="subtle"
            leftSection={<ArrowLeft size={20} />}
            onClick={() => router.back()}
          >
            Retour
          </Button>
        </Group>

        <div>
          <Group gap="sm" mb="xs">
            <Buildings size={32} weight="duotone" />
            <Title order={2}>Nouvel organisme de formation</Title>
          </Group>
          <Text c="dimmed" size="sm">
            Créez un nouvel organisme de formation
          </Text>
        </div>

        {/* Formulaire */}
        <Card withBorder radius="md" padding="lg">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              {error && (
                <Alert color="red" title="Erreur">
                  {error.message}
                </Alert>
              )}

              <TextInput
                label="Nom de l'organisme"
                placeholder="Ex: AFPA, CNAM, etc."
                required
                {...form.getInputProps('nomOrganisme')}
              />

              <TextInput
                label="Type d'organisme"
                placeholder="Ex: Public, Privé, etc."
                {...form.getInputProps('typeOrganisme')}
              />

              <TextInput
                label="Contact"
                placeholder="Email, téléphone, etc."
                {...form.getInputProps('contact')}
              />

              <Switch
                label="Organisme actif"
                {...form.getInputProps('actif', { type: 'checkbox' })}
              />

              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={() => router.back()}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  loading={isLoading}
                  leftSection={<Check size={20} />}
                >
                  Créer l'organisme
                </Button>
              </Group>
            </Stack>
          </form>
        </Card>
      </Stack>
    </Container>
  );
}
