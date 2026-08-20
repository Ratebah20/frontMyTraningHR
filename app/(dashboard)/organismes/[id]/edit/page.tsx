'use client';

import { useEffect, useState } from 'react';
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
  Loader,
  Center,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Buildings } from '@phosphor-icons/react/dist/ssr/Buildings';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { Check } from '@phosphor-icons/react/dist/ssr/Check';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from '@mantine/form';
import { organismesService } from '@/lib/services';

export default function EditOrganismePage() {
  const router = useRouter();
  const params = useParams();
  // `params.id` est typé string | string[] par Next : la route n'ayant pas de
  // segment catch-all, seul le cas string se produit réellement.
  const organismeId = Number(Array.isArray(params.id) ? params.id[0] : params.id);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!Number.isInteger(organismeId) || organismeId <= 0) {
      setLoadError("Identifiant d'organisme invalide");
      setIsLoading(false);
      return;
    }

    let annule = false;

    (async () => {
      try {
        const organisme = await organismesService.getOrganisme(organismeId);
        if (annule) return;
        form.setValues({
          nomOrganisme: organisme.nomOrganisme ?? '',
          typeOrganisme: organisme.typeOrganisme ?? '',
          contact: organisme.contact ?? '',
          actif: organisme.actif ?? true,
        });
        // Sans resetDirty, le formulaire est considéré comme modifié dès le
        // pré-remplissage et le bouton d'annulation demanderait une confirmation.
        form.resetDirty();
      } catch (err: any) {
        if (!annule) setLoadError(err?.message || "Impossible de charger l'organisme");
      } finally {
        if (!annule) setIsLoading(false);
      }
    })();

    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organismeId]);

  const handleSubmit = async (values: typeof form.values) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await organismesService.updateOrganisme(organismeId, {
        nomOrganisme: values.nomOrganisme,
        typeOrganisme: values.typeOrganisme || undefined,
        contact: values.contact || undefined,
        actif: values.actif,
      });

      notifications.show({
        title: 'Succès',
        message: `Organisme "${values.nomOrganisme}" modifié avec succès`,
        color: 'green',
        icon: <Check size={18} />,
      });

      router.push('/organismes');
    } catch (err: any) {
      const message = err?.message || 'Erreur lors de la modification';
      setSaveError(message);
      notifications.show({
        title: 'Erreur',
        message,
        color: 'red',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Container size="md" py="xl">
        <Center h={240}>
          <Loader />
        </Center>
      </Container>
    );
  }

  if (loadError) {
    return (
      <Container size="md" py="xl">
        <Stack gap="lg">
          <Group gap="sm">
            <Button
              variant="subtle"
              leftSection={<ArrowLeft size={20} />}
              onClick={() => router.push('/organismes')}
            >
              Retour
            </Button>
          </Group>
          <Alert color="red" title="Erreur">
            {loadError}
          </Alert>
        </Stack>
      </Container>
    );
  }

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
            <Title order={2}>Modifier l&apos;organisme</Title>
          </Group>
          <Text c="dimmed" size="sm">
            Mettez à jour les informations de cet organisme de formation
          </Text>
        </div>

        {/* Formulaire */}
        <Card withBorder radius="md" padding="lg">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              {saveError && (
                <Alert color="red" title="Erreur">
                  {saveError}
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
                  loading={isSaving}
                  leftSection={<Check size={20} />}
                >
                  Enregistrer
                </Button>
              </Group>
            </Stack>
          </form>
        </Card>
      </Stack>
    </Container>
  );
}
