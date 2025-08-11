'use client';

import { useState } from 'react';
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
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { ArrowLeft, CheckCircle, Warning } from '@phosphor-icons/react';
import { formationsService } from '@/lib/services';
import { CreateFormationDto } from '@/lib/types';

export default function NewFormationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<CreateFormationDto>({
    initialValues: {
      codeFormation: '',
      nomFormation: '',
      categorieId: undefined,
      typeFormation: '',
      dureePrevue: 1,
      uniteDuree: 'heures',
      actif: true,
    },
    validate: {
      codeFormation: (value) => {
        if (!value) return 'Code formation requis';
        if (value.length < 3) return 'Le code doit contenir au moins 3 caractères';
        return null;
      },
      nomFormation: (value) => (!value ? 'Nom de la formation requis' : null),
      dureePrevue: (value) => {
        if (!value || value <= 0) return 'Durée doit être positive';
        return null;
      },
    },
  });

  const handleSubmit = async (values: CreateFormationDto) => {
    setIsSubmitting(true);
    
    try {
      const formation = await formationsService.createFormation(values);
      
      notifications.show({
        title: 'Succès',
        message: 'La formation a été créée avec succès',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
      
      router.push(`/formations/${formation.id}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création de la formation';
      
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

  return (
    <Container size="md">
      <Group justify="space-between" mb="xl">
        <Title order={2}>Nouvelle formation</Title>
        <Button
          variant="subtle"
          leftSection={<ArrowLeft size={20} />}
          onClick={() => router.back()}
        >
          Retour
        </Button>
      </Group>

      <Card shadow="sm" p="lg" radius="md" withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Code de la formation"
              placeholder="FORM-001"
              required
              description="Code unique pour identifier la formation"
              {...form.getInputProps('codeFormation')}
            />
            
            <TextInput
              label="Nom de la formation"
              placeholder="Excel Avancé"
              required
              {...form.getInputProps('nomFormation')}
            />

            <Select
              label="Catégorie"
              placeholder="Sélectionner une catégorie"
              clearable
              data={[
                { value: '1', label: 'Technique' },
                { value: '2', label: 'Management' },
                { value: '3', label: 'Soft Skills' },
                { value: '4', label: 'Sécurité' },
                { value: '5', label: 'Langues' },
              ]}
              {...form.getInputProps('categorieId')}
            />
            
            <Select
              label="Type de formation"
              placeholder="Sélectionner un type"
              clearable
              data={[
                { value: 'presentiel', label: 'Présentiel' },
                { value: 'distanciel', label: 'Distanciel' },
                { value: 'elearning', label: 'E-learning' },
                { value: 'blended', label: 'Blended (mixte)' },
              ]}
              {...form.getInputProps('typeFormation')}
            />

            <Group grow>
              <NumberInput
                label="Durée prévue"
                placeholder="8"
                required
                min={1}
                {...form.getInputProps('dureePrevue')}
              />
              
              <Select
                label="Unité de durée"
                required
                data={[
                  { value: 'heures', label: 'Heures' },
                  { value: 'jours', label: 'Jours' },
                  { value: 'semaines', label: 'Semaines' },
                ]}
                {...form.getInputProps('uniteDuree')}
              />
            </Group>
            
            <Switch
              label="Formation active"
              description="Les formations inactives ne peuvent pas recevoir de nouvelles inscriptions"
              checked={form.values.actif}
              {...form.getInputProps('actif', { type: 'checkbox' })}
            />

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
              >
                Créer la formation
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Container>
  );
}