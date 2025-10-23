'use client';

import { useEffect } from 'react';
import {
  Modal,
  TextInput,
  Stack,
  Group,
  Button,
  Switch,
  SegmentedControl,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Buildings, Users } from '@phosphor-icons/react';
import { Departement, CreateDepartementDto, UpdateDepartementDto } from '@/lib/types';
import { ParentSelector } from './ParentSelector';

interface DepartementFormModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: CreateDepartementDto | UpdateDepartementDto) => Promise<void>;
  departement?: Departement | null;
  isSubmitting: boolean;
  initialType?: 'DEPARTEMENT' | 'EQUIPE';
  initialParentId?: number | null;
}

export function DepartementFormModal({
  opened,
  onClose,
  onSubmit,
  departement,
  isSubmitting,
  initialType,
  initialParentId,
}: DepartementFormModalProps) {
  const form = useForm({
    initialValues: {
      nomDepartement: '',
      codeDepartement: '',
      type: 'DEPARTEMENT' as string,
      parentId: null as number | null,
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
      type: (value) => {
        if (!value || (value !== 'DEPARTEMENT' && value !== 'EQUIPE')) {
          return 'Le type doit être DEPARTEMENT ou EQUIPE';
        }
        return null;
      },
    },
  });

  // Pré-remplir le formulaire en mode édition ou avec des valeurs initiales
  useEffect(() => {
    if (departement && opened) {
      // Mode édition
      form.setValues({
        nomDepartement: departement.nomDepartement,
        codeDepartement: departement.codeDepartement || '',
        type: departement.type || 'DEPARTEMENT',
        parentId: departement.parentId || null,
        actif: departement.actif,
      });
    } else if (!departement && opened) {
      // Mode création - utiliser les valeurs initiales si fournies
      form.reset();
      if (initialType) {
        form.setFieldValue('type', initialType);
      }
      if (initialParentId !== undefined) {
        form.setFieldValue('parentId', initialParentId);
      }
    }
  }, [departement, opened, initialType, initialParentId]);

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
      title={
        departement
          ? `Modifier ${departement.type === 'EQUIPE' ? "l'équipe" : 'le département'}`
          : `Nouveau ${form.values.type === 'EQUIPE' ? 'équipe' : 'département'}`
      }
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

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              Type <span style={{ color: 'red' }}>*</span>
            </label>
            <SegmentedControl
              fullWidth
              value={form.values.type}
              onChange={(value) => form.setFieldValue('type', value)}
              data={[
                {
                  value: 'DEPARTEMENT',
                  label: (
                    <Group gap="xs" justify="center">
                      <Buildings size={16} />
                      <span>Département</span>
                    </Group>
                  ),
                },
                {
                  value: 'EQUIPE',
                  label: (
                    <Group gap="xs" justify="center">
                      <Users size={16} />
                      <span>Équipe</span>
                    </Group>
                  ),
                },
              ]}
              disabled={isSubmitting}
            />
            {form.errors.type && (
              <div style={{ color: 'var(--mantine-color-error)', fontSize: '12px', marginTop: '4px' }}>
                {form.errors.type}
              </div>
            )}
          </div>

          <ParentSelector
            value={form.values.parentId}
            onChange={(value) => form.setFieldValue('parentId', value)}
            currentDepartementId={departement?.id}
            error={form.errors.parentId}
            label="Département parent"
            description={
              form.values.type === 'EQUIPE'
                ? "Recommandé : sélectionnez le département auquel cette équipe appartient"
                : "Optionnel : sélectionnez un département parent pour créer une hiérarchie"
            }
          />

          <Switch
            label="Actif"
            description={`Les ${form.values.type === 'EQUIPE' ? 'équipes' : 'départements'} inactifs sont masqués par défaut`}
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
