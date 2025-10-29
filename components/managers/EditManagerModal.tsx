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
import { Warning, CheckCircle } from '@phosphor-icons/react';
import { collaborateursService } from '@/lib/services';

interface EditManagerModalProps {
  opened: boolean;
  onClose: () => void;
  collaborateurId: number;
  collaborateurName: string;
  currentManagerId?: number | null;
  onSuccess?: () => void;
}

export function EditManagerModal({
  opened,
  onClose,
  collaborateurId,
  collaborateurName,
  currentManagerId,
  onSuccess,
}: EditManagerModalProps) {
  const [managers, setManagers] = useState<{ value: string; label: string }[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(
    currentManagerId ? currentManagerId.toString() : null
  );
  const [loading, setLoading] = useState(false);
  const [loadingManagers, setLoadingManagers] = useState(false);

  useEffect(() => {
    if (opened) {
      loadManagers();
      setSelectedManagerId(currentManagerId ? currentManagerId.toString() : null);
    }
  }, [opened, currentManagerId]);

  const loadManagers = async () => {
    setLoadingManagers(true);
    try {
      // Charger tous les collaborateurs actifs qui sont managers
      // Note: Ne pas envoyer actif car par défaut le backend retourne les actifs
      const response = await collaborateursService.getCollaborateurs({
        page: 1,
        limit: 1000,
        // actif: true, // Commenté temporairement pour debug
      });

      // Filtrer pour exclure le collaborateur lui-même
      const managersData = response.data
        .filter((collab: any) => collab.id !== collaborateurId)
        .map((collab: any) => ({
          value: collab.id.toString(),
          label: `${collab.nomComplet} ${collab.matricule ? `(${collab.matricule})` : ''}`,
        }));

      // Ajouter l'option "Aucun manager"
      setManagers([
        { value: 'null', label: 'Aucun manager (Top niveau)' },
        ...managersData,
      ]);
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
            placeholder="Sélectionner un manager"
            data={managers}
            value={selectedManagerId}
            onChange={setSelectedManagerId}
            searchable
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
