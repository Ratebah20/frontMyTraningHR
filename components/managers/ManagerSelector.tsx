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
  Badge,
  Loader,
  Center,
} from '@mantine/core';
import { User, Warning, CheckCircle, Users } from '@phosphor-icons/react';
import { collaborateursService, managersService } from '@/lib/services';
import { notifications } from '@mantine/notifications';

interface ManagerSelectorProps {
  opened: boolean;
  onClose: () => void;
  collaborateurId: number;
  collaborateurNom: string;
  currentManagerId?: number | null;
  onSuccess?: () => void;
}

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
  const [managers, setManagers] = useState<Array<{ value: string; label: string; data: any }>>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(
    currentManagerId ? String(currentManagerId) : null
  );

  useEffect(() => {
    if (opened) {
      loadManagers();
    }
  }, [opened]);

  const loadManagers = async () => {
    setLoading(true);
    try {
      // Récupérer tous les collaborateurs actifs pour pouvoir choisir n'importe qui comme manager
      const response = await collaborateursService.getCollaborateurs({
        actif: true,
        limit: 1000,
      });

      const managerOptions = response.data
        .filter(collab => collab.id !== collaborateurId) // Exclure le collaborateur lui-même
        .map(collab => ({
          value: String(collab.id),
          label: `${collab.nomComplet}${collab.departement ? ` - ${collab.departement.nomDepartement}` : ''}`,
          data: collab,
        }));

      setManagers(managerOptions);
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
              placeholder="Sélectionner un manager"
              data={managers}
              value={selectedManagerId}
              onChange={setSelectedManagerId}
              searchable
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
                  {managers.find(m => m.value === String(currentManagerId))?.label || 'Inconnu'}
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
                  {managers.find(m => m.value === selectedManagerId)?.label}
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
