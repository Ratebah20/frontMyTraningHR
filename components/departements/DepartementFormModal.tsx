'use client';

import { useEffect, useState } from 'react';
import {
  Modal,
  TextInput,
  Select,
  Stack,
  Group,
  Button,
  Switch,
  SegmentedControl,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Buildings } from '@phosphor-icons/react/dist/ssr/Buildings';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { Departement, CreateDepartementDto, UpdateDepartementDto } from '@/lib/types';
import { collaborateursService } from '@/lib/services';
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
  // Liste par défaut (directeurs en priorité, sinon 50 premiers actifs)
  const [directeurs, setDirecteurs] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingDirecteurs, setIsLoadingDirecteurs] = useState(false);
  // Recherche serveur pour le sélecteur de directeur
  const [directeurSearch, setDirecteurSearch] = useState('');
  const [directeurResults, setDirecteurResults] = useState<{ value: string; label: string }[] | null>(null);
  // Option du directeur actuel (mode édition) pour conserver son libellé
  const [currentDirecteurOption, setCurrentDirecteurOption] = useState<{ value: string; label: string } | null>(null);

  const form = useForm({
    initialValues: {
      nomDepartement: '',
      codeDepartement: '',
      type: 'DEPARTEMENT' as string,
      parentId: null as number | null,
      directeurId: null as string | null,
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
        if (value && value.length > 100) {
          return 'Le code ne doit pas dépasser 100 caractères';
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

  // Charger la liste des directeurs à l'ouverture
  useEffect(() => {
    if (opened) {
      loadDirecteurs();
    }
  }, [opened]);

  const loadDirecteurs = async () => {
    setIsLoadingDirecteurs(true);
    try {
      // Recherche serveur : ne charger qu'une petite liste par défaut.
      // Prioriser les collaborateurs avec le rôle Directeur,
      // fallback sur les 50 premiers collaborateurs actifs (liste recherchable)
      const directeursResponse = await collaborateursService.getCollaborateurs({
        limit: 50,
        actif: 'true',
        typeUtilisateur: 'Directeur',
      } as any);
      let collabs = directeursResponse.data || [];
      if (collabs.length === 0) {
        const fallbackResponse = await collaborateursService.getCollaborateurs({ limit: 50, actif: 'true' });
        collabs = fallbackResponse.data || [];
      }
      setDirecteurs(
        collabs.map((c: any) => ({
          value: c.id.toString(),
          label: c.nomComplet,
        }))
      );
    } catch (error) {
      console.error('Erreur lors du chargement des directeurs:', error);
    } finally {
      setIsLoadingDirecteurs(false);
    }
  };

  // Recherche serveur du directeur avec debounce 300ms
  useEffect(() => {
    const q = directeurSearch.trim();
    if (q.length < 2) {
      setDirecteurResults(null);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const data = await collaborateursService.searchCollaborateurs(q, { limit: 50 });
        setDirecteurResults(
          (Array.isArray(data) ? data : []).map((c: any) => ({
            value: c.id.toString(),
            label: c.nomComplet,
          }))
        );
      } catch (error) {
        console.error('Erreur lors de la recherche de directeurs:', error);
        setDirecteurResults([]);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [directeurSearch]);

  // Mode édition : charger le directeur actuel pour afficher son libellé
  useEffect(() => {
    const directeurId = departement ? (departement as any).directeurId : null;
    if (!opened || !directeurId) {
      setCurrentDirecteurOption(null);
      return;
    }
    let cancelled = false;
    collaborateursService
      .getCollaborateur(directeurId)
      .then((collab) => {
        if (!cancelled && collab) {
          setCurrentDirecteurOption({ value: String(collab.id), label: collab.nomComplet });
        }
      })
      .catch((error) => console.error('Erreur lors du chargement du directeur actuel:', error));
    return () => {
      cancelled = true;
    };
  }, [departement, opened]);

  // Options : résultats courants + sélection absente des résultats (libellé conservé)
  const directeurSource = directeurResults ?? directeurs;
  const directeurData = [...directeurSource];
  const selectedDirecteurId = form.values.directeurId;
  if (selectedDirecteurId && !directeurSource.some(o => o.value === selectedDirecteurId)) {
    directeurData.push(
      currentDirecteurOption && currentDirecteurOption.value === selectedDirecteurId
        ? currentDirecteurOption
        : { value: selectedDirecteurId, label: `Collaborateur #${selectedDirecteurId}` }
    );
  }

  // Pré-remplir le formulaire en mode édition ou avec des valeurs initiales
  useEffect(() => {
    if (departement && opened) {
      // Mode édition
      form.setValues({
        nomDepartement: departement.nomDepartement,
        codeDepartement: departement.codeDepartement || '',
        type: departement.type || 'DEPARTEMENT',
        parentId: departement.parentId || null,
        directeurId: (departement as any).directeurId
          ? String((departement as any).directeurId)
          : null,
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
    // Convertir directeurId (string du Select) en number | null pour l'API
    const payload = {
      ...values,
      directeurId: values.directeurId ? parseInt(values.directeurId, 10) : null,
    };
    await onSubmit(payload);
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

          <Select
            label="Directeur"
            placeholder="Sélectionner le directeur"
            description={
              form.values.type === 'EQUIPE'
                ? 'Optionnel : directeur responsable de cette équipe'
                : 'Optionnel : directeur responsable de ce département'
            }
            data={directeurData}
            value={form.values.directeurId}
            onChange={(value) => form.setFieldValue('directeurId', value)}
            searchable
            searchValue={directeurSearch}
            onSearchChange={setDirecteurSearch}
            filter={({ options }) => options}
            clearable
            nothingFoundMessage="Aucun résultat"
            disabled={isSubmitting || isLoadingDirecteurs}
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
