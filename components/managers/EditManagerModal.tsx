'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Select,
  Stack,
  Text,
  Group,
  Alert,
  Loader,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { collaborateursService } from '@/lib/services';

interface EditManagerModalProps {
  opened: boolean;
  onClose: () => void;
  collaborateurId: number;
  collaborateurName: string;
  currentManagerId?: number | null;
  onSuccess?: () => void;
}

interface ManagerOption {
  value: string;
  label: string;
}

const toManagerOption = (collab: any): ManagerOption => ({
  value: collab.id.toString(),
  label: `${collab.nomComplet} ${collab.matricule ? `(${collab.matricule})` : ''}`,
});

const NO_MANAGER_OPTION: ManagerOption = { value: 'null', label: 'Aucun manager (Top niveau)' };

export function EditManagerModal({
  opened,
  onClose,
  collaborateurId,
  collaborateurName,
  currentManagerId,
  onSuccess,
}: EditManagerModalProps) {
  // Liste par défaut (50 premiers) affichée avant toute recherche
  const [defaultManagers, setDefaultManagers] = useState<ManagerOption[]>([]);
  // Résultats de la recherche serveur
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<ManagerOption[] | null>(null);
  // Option du manager actuel (chargée individuellement pour afficher son libellé)
  const [currentManagerOption, setCurrentManagerOption] = useState<ManagerOption | null>(null);
  // Libellés des options déjà vues (sélection conservée hors des résultats courants)
  const [knownOptions, setKnownOptions] = useState<Map<string, ManagerOption>>(new Map());
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(
    currentManagerId ? currentManagerId.toString() : null
  );
  const [loading, setLoading] = useState(false);
  const [loadingManagers, setLoadingManagers] = useState(false);

  useEffect(() => {
    if (opened) {
      loadManagers();
      setSelectedManagerId(currentManagerId ? currentManagerId.toString() : null);
      setSearchValue('');
      setSearchResults(null);
    }
  }, [opened, currentManagerId]);

  const rememberOptions = (options: ManagerOption[]) => {
    setKnownOptions(prev => {
      const next = new Map(prev);
      options.forEach(o => next.set(o.value, o));
      return next;
    });
  };

  const loadManagers = async () => {
    setLoadingManagers(true);
    try {
      // Recherche serveur : ne charger qu'une petite liste par défaut (50)
      // Note: Ne pas envoyer actif car par défaut le backend retourne les actifs
      const response = await collaborateursService.getCollaborateurs({
        page: 1,
        limit: 50,
      });

      // Filtrer pour exclure le collaborateur lui-même
      const managersData = response.data
        .filter((collab: any) => collab.id !== collaborateurId)
        .map(toManagerOption);

      setDefaultManagers(managersData);
      rememberOptions(managersData);

      // Charger le manager actuel individuellement pour afficher son libellé
      if (currentManagerId) {
        try {
          const current = await collaborateursService.getCollaborateur(currentManagerId);
          const option = toManagerOption(current);
          setCurrentManagerOption(option);
          rememberOptions([option]);
        } catch (err) {
          console.error('Erreur lors du chargement du manager actuel:', err);
        }
      } else {
        setCurrentManagerOption(null);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des managers:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger la liste des managers',
        color: 'red',
        icon: <Warning size={18} />,
      });
    } finally {
      setLoadingManagers(false);
    }
  };

  // Recherche serveur avec debounce 300ms
  useEffect(() => {
    const q = searchValue.trim();
    if (q.length < 2) {
      setSearchResults(null);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const data = await collaborateursService.searchCollaborateurs(q, { limit: 50 });
        const options = (Array.isArray(data) ? data : [])
          .filter((collab: any) => collab.id !== collaborateurId)
          .map(toManagerOption);
        rememberOptions(options);
        setSearchResults(options);
      } catch (err) {
        console.error('Erreur lors de la recherche de managers:', err);
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [searchValue, collaborateurId]);

  // Options : "Aucun manager" + résultats courants + sélection absente des résultats
  const currentSource = searchResults ?? defaultManagers;
  const sourceIds = new Set(currentSource.map(o => o.value));
  const managers: ManagerOption[] = [NO_MANAGER_OPTION, ...currentSource];
  if (
    selectedManagerId &&
    selectedManagerId !== 'null' &&
    !sourceIds.has(selectedManagerId)
  ) {
    const known = knownOptions.get(selectedManagerId)
      || (currentManagerOption?.value === selectedManagerId ? currentManagerOption : null);
    managers.push(known || { value: selectedManagerId, label: `Collaborateur #${selectedManagerId}` });
  }

  const handleSubmit = async () => {
    if (selectedManagerId === (currentManagerId?.toString() || 'null')) {
      notifications.show({
        title: 'Information',
        message: 'Aucun changement à effectuer',
        color: 'blue',
      });
      onClose();
      return;
    }

    setLoading(true);
    try {
      const managerId = selectedManagerId === 'null' ? null : parseInt(selectedManagerId || '');

      await collaborateursService.assignManager(collaborateurId, managerId);

      notifications.show({
        title: 'Succès',
        message: `Le manager de ${collaborateurName} a été modifié avec succès`,
        color: 'green',
        icon: <CheckCircle size={18} />,
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de la modification du manager:', error);
      notifications.show({
        title: 'Erreur',
        message: error.response?.data?.message || 'Impossible de modifier le manager',
        color: 'red',
        icon: <Warning size={18} />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Modifier le manager"
      size="md"
      centered
    >
      <Stack gap="md">
        <Alert variant="light" color="blue" icon={<Warning size={16} />}>
          <Text size="sm">
            Vous allez modifier le manager de <strong>{collaborateurName}</strong>
          </Text>
        </Alert>

        {loadingManagers ? (
          <Group justify="center" p="xl">
            <Loader size="md" />
          </Group>
        ) : (
          <Select
            label="Nouveau manager"
            placeholder="Rechercher un manager"
            data={managers}
            value={selectedManagerId}
            onChange={setSelectedManagerId}
            searchable
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            filter={({ options }) => options}
            nothingFoundMessage="Aucun manager trouvé"
            required
          />
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={!selectedManagerId || loadingManagers}
          >
            Modifier
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
