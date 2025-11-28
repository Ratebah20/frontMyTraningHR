'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Select,
  Button,
  Group,
  Stack,
  Text,
  SegmentedControl,
  Alert,
  Loader,
  Center,
  Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Building, Users, Warning, Check, ArrowsLeftRight } from '@phosphor-icons/react';
import { departementsService, collaborateursService } from '@/lib/services';

interface CollaborateurInfo {
  id: number;
  nomComplet: string;
}

interface ChangeEquipeModalProps {
  opened: boolean;
  onClose: () => void;
  collaborateurs: CollaborateurInfo[];
  currentDepartementId?: number;
  onSuccess: () => void;
}

export function ChangeEquipeModal({
  opened,
  onClose,
  collaborateurs,
  currentDepartementId,
  onSuccess,
}: ChangeEquipeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [allDepartements, setAllDepartements] = useState<any[]>([]);
  const [departements, setDepartements] = useState<{ value: string; label: string }[]>([]);
  const [departementType, setDepartementType] = useState<'DEPARTEMENT' | 'EQUIPE'>('EQUIPE');
  const [selectedDepartementId, setSelectedDepartementId] = useState<string | null>(null);

  // Charger les départements à l'ouverture
  useEffect(() => {
    if (opened) {
      loadDepartements();
    }
  }, [opened]);

  // Détecter le type du département actuel
  useEffect(() => {
    if (opened && currentDepartementId && allDepartements.length > 0) {
      const currentDept = allDepartements.find(d => d.id === currentDepartementId);
      if (currentDept?.type) {
        setDepartementType(currentDept.type as 'DEPARTEMENT' | 'EQUIPE');
      }
    }
  }, [opened, currentDepartementId, allDepartements]);

  // Filtrer les départements selon le type
  useEffect(() => {
    if (allDepartements.length > 0) {
      const filtered = allDepartements.filter(d => d.type === departementType);
      const departmentsList = filtered.map(d => ({
        value: d.id.toString(),
        label: d.nomDepartement,
      }));
      setDepartements(departmentsList);
    }
  }, [departementType, allDepartements]);

  const loadDepartements = async () => {
    setIsLoading(true);
    try {
      const data = await departementsService.getAll();
      setAllDepartements(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des départements:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les départements',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDepartementId) {
      notifications.show({
        title: 'Erreur',
        message: 'Veuillez sélectionner une équipe ou un département',
        color: 'red',
        icon: <Warning size={20} />,
      });
      return;
    }

    setIsSaving(true);
    try {
      // Mettre à jour les collaborateurs séquentiellement pour éviter les conflits de transaction
      for (const collab of collaborateurs) {
        await collaborateursService.updateCollaborateur(collab.id, {
          departementId: parseInt(selectedDepartementId),
        });
      }

      const message = collaborateurs.length === 1
        ? `${collaborateurs[0].nomComplet} a été déplacé avec succès`
        : `${collaborateurs.length} collaborateurs ont été déplacés avec succès`;

      notifications.show({
        title: 'Succès',
        message,
        color: 'green',
        icon: <Check size={20} />,
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Erreur lors du changement d\'équipe:', error);
      notifications.show({
        title: 'Erreur',
        message: error.message || 'Erreur lors du changement d\'équipe',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedDepartementId(null);
    onClose();
  };

  const isSingleCollab = collaborateurs.length === 1;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <ArrowsLeftRight size={20} />
          <Text fw={600}>
            {isSingleCollab ? "Changer d'équipe" : `Déplacer ${collaborateurs.length} collaborateurs`}
          </Text>
        </Group>
      }
      size="md"
    >
      {isLoading ? (
        <Center h={200}>
          <Loader size="lg" variant="bars" />
        </Center>
      ) : (
        <Stack gap="md">
          {/* Afficher les collaborateurs concernés */}
          {!isSingleCollab && (
            <Alert variant="light" color="blue">
              <Text size="sm" fw={500} mb="xs">Collaborateurs sélectionnés :</Text>
              <Group gap="xs" wrap="wrap">
                {collaborateurs.slice(0, 5).map(c => (
                  <Badge key={c.id} variant="light" size="sm">
                    {c.nomComplet}
                  </Badge>
                ))}
                {collaborateurs.length > 5 && (
                  <Badge variant="light" size="sm" color="gray">
                    +{collaborateurs.length - 5} autres
                  </Badge>
                )}
              </Group>
            </Alert>
          )}

          {isSingleCollab && (
            <Text size="sm" c="dimmed">
              Sélectionnez la nouvelle équipe ou département pour{' '}
              <Text span fw={500}>{collaborateurs[0].nomComplet}</Text>
            </Text>
          )}

          {/* Sélecteur de type */}
          <Stack gap="xs">
            <Text size="sm" fw={500}>Type d'affectation</Text>
            <SegmentedControl
              value={departementType}
              onChange={(value) => {
                setDepartementType(value as 'DEPARTEMENT' | 'EQUIPE');
                setSelectedDepartementId(null);
              }}
              data={[
                {
                  value: 'DEPARTEMENT',
                  label: (
                    <Group gap="xs">
                      <Building size={16} />
                      <Text size="sm">Département</Text>
                    </Group>
                  ),
                },
                {
                  value: 'EQUIPE',
                  label: (
                    <Group gap="xs">
                      <Users size={16} />
                      <Text size="sm">Équipe</Text>
                    </Group>
                  ),
                },
              ]}
            />
          </Stack>

          {/* Sélecteur de département/équipe */}
          <Select
            label={departementType === 'DEPARTEMENT' ? 'Département' : 'Équipe'}
            placeholder={`Sélectionner ${departementType === 'DEPARTEMENT' ? 'le département' : "l'équipe"}`}
            data={departements}
            value={selectedDepartementId}
            onChange={setSelectedDepartementId}
            searchable
            clearable
            nothingFoundMessage="Aucun résultat"
          />

          {/* Boutons d'action */}
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={handleClose} disabled={isSaving}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              loading={isSaving}
              disabled={!selectedDepartementId}
              leftSection={<Check size={16} />}
            >
              Confirmer
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
