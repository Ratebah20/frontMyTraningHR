'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Text,
  Group,
  Button,
  Select,
  Alert,
  Avatar,
  Loader,
  Center,
} from '@mantine/core';
import { User } from '@phosphor-icons/react/dist/ssr/User';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { collaborateursService, managersService } from '@/lib/services';
import { notifications } from '@mantine/notifications';
import { Collaborateur } from '@/lib/types';

interface ManagerSelectorProps {
  opened: boolean;
  onClose: () => void;
  collaborateurId: number;
  collaborateurNom: string;
  currentManagerId?: number | null;
  onSuccess?: () => void;
}

interface ManagerOption {
  value: string;
  label: string;
}

const toManagerOption = (collab: Collaborateur): ManagerOption => ({
  value: String(collab.id),
  label: `${collab.nomComplet}${collab.departement && typeof collab.departement !== 'string' ? ` - ${collab.departement.nomDepartement}` : ''}`,
});

export function ManagerSelector({
  opened,
  onClose,
  collaborateurId,
  collaborateurNom,
  currentManagerId,
  onSuccess,
}: ManagerSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Liste par défaut (50 premiers actifs) affichée avant toute recherche
  const [defaultManagers, setDefaultManagers] = useState<ManagerOption[]>([]);
  // Résultats de la recherche serveur
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<ManagerOption[] | null>(null);
  // Option du manager actuel (chargée individuellement pour afficher son libellé)
  const [currentManagerOption, setCurrentManagerOption] = useState<ManagerOption | null>(null);
  // Libellés des options déjà vues (pour garder la sélection valide hors résultats courants)
  const [knownOptions, setKnownOptions] = useState<Map<string, ManagerOption>>(new Map());
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(
    currentManagerId ? String(currentManagerId) : null
  );

  useEffect(() => {
    if (opened) {
      loadManagers();
    }
  }, [opened]);

  const rememberOptions = (options: ManagerOption[]) => {
    setKnownOptions(prev => {
      const next = new Map(prev);
      options.forEach(o => next.set(o.value, o));
      return next;
    });
  };

  const loadManagers = async () => {
    setLoading(true);
    try {
      // Recherche serveur : ne charger qu'une petite liste par défaut (50)
      const response = await collaborateursService.getCollaborateurs({
        actif: true,
        limit: 50,
      });

      const managerOptions = response.data
        .filter(collab => collab.id !== collaborateurId) // Exclure le collaborateur lui-même
        .map(toManagerOption);

      setDefaultManagers(managerOptions);
      rememberOptions(managerOptions);

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
        icon: <Warning size={20} />,
      });
    } finally {
      setLoading(false);
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
          .filter(collab => collab.id !== collaborateurId)
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

  // Options courantes + sélection/manager actuel absents des résultats (libellés conservés)
  const currentSource = searchResults ?? defaultManagers;
  const sourceIds = new Set(currentSource.map(o => o.value));
  const managers: ManagerOption[] = [...currentSource];
  [selectedManagerId, currentManagerId ? String(currentManagerId) : null].forEach(id => {
    if (id && !sourceIds.has(id) && !managers.some(o => o.value === id)) {
      const known = knownOptions.get(id) || currentManagerOption;
      if (known && known.value === id) {
        managers.push(known);
      } else {
        managers.push({ value: id, label: `Collaborateur #${id}` });
      }
    }
  });

  const findLabel = (id: string | null | undefined): string | undefined => {
    if (!id) return undefined;
    return knownOptions.get(id)?.label
      || managers.find(m => m.value === id)?.label;
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const newManagerId = selectedManagerId ? parseInt(selectedManagerId) : null;

      await managersService.assignManager(collaborateurId, newManagerId);

      notifications.show({
        title: 'Succès',
        message: newManagerId
          ? 'Manager assigné avec succès'
          : 'Manager retiré avec succès',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de l\'assignation du manager:', error);

      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'assignation du manager';

      notifications.show({
        title: 'Erreur',
        message: errorMessage,
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const hasChanges = selectedManagerId !== (currentManagerId ? String(currentManagerId) : null);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Assigner un manager"
      size="lg"
    >
      <Stack gap="md">
        {/* Info collaborateur */}
        <Alert
          icon={<User size={20} />}
          title="Collaborateur"
          color="blue"
          variant="light"
        >
          <Group>
            <Avatar size="sm" radius="xl" color="blue">
              {collaborateurNom.split(' ').map(n => n[0]).join('').toUpperCase()}
            </Avatar>
            <Text size="sm" fw={500}>
              {collaborateurNom}
            </Text>
          </Group>
        </Alert>

        {/* Sélecteur de manager */}
        {loading ? (
          <Center h={200}>
            <Loader />
          </Center>
        ) : (
          <>
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
              clearable
              nothingFoundMessage="Aucun collaborateur trouvé"
              leftSection={<Users size={16} />}
            />

            {currentManagerId && (
              <Alert
                icon={<User size={16} />}
                title="Manager actuel"
                color="gray"
                variant="light"
              >
                <Text size="sm">
                  {findLabel(String(currentManagerId)) || 'Inconnu'}
                </Text>
              </Alert>
            )}

            {selectedManagerId && selectedManagerId !== String(currentManagerId) && (
              <Alert
                icon={<CheckCircle size={16} />}
                title="Nouveau manager"
                color="green"
                variant="light"
              >
                <Text size="sm">
                  {findLabel(selectedManagerId)}
                </Text>
              </Alert>
            )}

            {!selectedManagerId && currentManagerId && (
              <Alert
                icon={<Warning size={16} />}
                title="Attention"
                color="orange"
                variant="light"
              >
                <Text size="sm">
                  Le manager actuel sera retiré. Le collaborateur n'aura plus de manager.
                </Text>
              </Alert>
            )}
          </>
        )}

        {/* Actions */}
        <Group justify="flex-end" mt="md">
          <Button
            variant="subtle"
            onClick={onClose}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={!hasChanges || loading}
          >
            {selectedManagerId ? 'Assigner' : 'Retirer le manager'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
