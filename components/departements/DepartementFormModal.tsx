'use client';

import { useEffect } from 'react';
import {
  Modal,
  TextInput,
  Stack,
  Group,
  Button,
  Switch,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Departement, CreateDepartementDto, UpdateDepartementDto } from '@/lib/types';

interface DepartementFormModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: CreateDepartementDto | UpdateDepartementDto) => Promise<void>;
  departement?: Departement | null;
  isSubmitting: boolean;
}

export function DepartementFormModal({
  opened,
  onClose,
  onSubmit,
  departement,
  isSubmitting,
}: DepartementFormModalProps) {
  const form = useForm({
    initialValues: {
      nomDepartement: '',
      codeDepartement: '',
      actif: true,
    },
    validate: {
      nomDepartement: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Le nom du département est requis';
        }
        if (value.length > 100) {
          return 'Le nom ne doit pas dépasser 100 caractères';
        }
        return null;
      },
      codeDepartement: (value) => {
        if (value && value.length > 20) {
          return 'Le code ne doit pas dépasser 20 caractères';
        }
        return null;
      },
    },
  });

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (departement && opened) {
      form.setValues({
        nomDepartement: departement.nomDepartement,
        codeDepartement: departement.codeDepartement || '',
        actif: departement.actif,
      });
    } else if (!departement && opened) {
      form.reset();
    }
  }, [departement, opened]);

  const handleSubmit = async (values: typeof form.values) => {
    await onSubmit(values);
    form.reset();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={departement ? 'Modifier le département' : 'Nouveau département'}
      size="md"
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Nom du département"
            placeholder="Ex: Ressources Humaines"
            required
            {...form.getInputProps('nomDepartement')}
            disabled={isSubmitting}
          />

          <TextInput
            label="Code du département"
            placeholder="Ex: RH"
            description="Code court pour identifier le département"
            {...form.getInputProps('codeDepartement')}
            disabled={isSubmitting}
          />

          <Switch
            label="Département actif"
            description="Les départements inactifs sont masqués par défaut"
            {...form.getInputProps('actif', { type: 'checkbox' })}
            disabled={isSubmitting}
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              color="gray"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
            >
              {departement ? 'Modifier' : 'Créer'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
