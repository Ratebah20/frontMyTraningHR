'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Select,
  MultiSelect,
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
import { Building } from '@phosphor-icons/react/dist/ssr/Building';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { UsersThree } from '@phosphor-icons/react/dist/ssr/UsersThree';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { Check } from '@phosphor-icons/react/dist/ssr/Check';
import { collaborateursService, departementsService } from '@/lib/services';

interface CollaborateurOption {
  id: number;
  nomComplet: string;
  typeUtilisateur?: string;
}

interface AssignTeamModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignTeamModal({ opened, onClose, onSuccess }: AssignTeamModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingMembres, setIsLoadingMembres] = useState(false);
  const [collaborateurs, setCollaborateurs] = useState<CollaborateurOption[]>([]);
  const [departements, setDepartements] = useState<{ value: string; label: string }[]>([]);
  const [mode, setMode] = useState<'MANUEL' | 'DEPARTEMENT'>('MANUEL');
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);
  const [selectedDepartementId, setSelectedDepartementId] = useState<string | null>(null);
  const [selectedCollaborateurIds, setSelectedCollaborateurIds] = useState<string[]>([]);

  // Charger les collaborateurs et départements à l'ouverture
  useEffect(() => {
    if (opened) {
      loadData();
    }
  }, [opened]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [collabsResponse, departementsData] = await Promise.all([
        collaborateursService.getCollaborateurs({ limit: 2000, actif: 'true' }),
        departementsService.getAll(),
      ]);

      setCollaborateurs(
        (collabsResponse.data || []).map((c: any) => ({
          id: c.id,
          nomComplet: c.nomComplet,
          typeUtilisateur: c.typeUtilisateur,
        }))
      );

      setDepartements(
        (departementsData || []).map(d => ({
          value: d.id.toString(),
          label: d.nomDepartement,
        }))
      );
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les collaborateurs et départements',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Données du sélecteur de manager (Managers & Directeurs en premier)
  const managersEtDirecteurs = collaborateurs.filter(
    c => c.typeUtilisateur === 'Manager' || c.typeUtilisateur === 'Directeur'
  );
  const autresCollaborateurs = collaborateurs.filter(
    c => c.typeUtilisateur !== 'Manager' && c.typeUtilisateur !== 'Directeur'
  );
  const toOption = (c: CollaborateurOption) => ({
    value: c.id.toString(),
    label: c.nomComplet,
  });
  const managerSelectData = [
    ...(managersEtDirecteurs.length > 0
      ? [{ group: 'Managers & Directeurs', items: managersEtDirecteurs.map(toOption) }]
      : []),
    ...(autresCollaborateurs.length > 0
      ? [{ group: 'Autres collaborateurs', items: autresCollaborateurs.map(toOption) }]
      : []),
  ];

  // Collaborateurs sélectionnables (exclure le manager choisi)
  const collaborateursSelectData = collaborateurs
    .filter(c => c.id.toString() !== selectedManagerId)
    .map(toOption);

  // Changer de manager : le retirer de la sélection si présent
  const handleManagerChange = (value: string | null) => {
    setSelectedManagerId(value);
    if (value) {
      setSelectedCollaborateurIds(prev => prev.filter(id => id !== value));
    }
  };

  // Sélectionner un département : pré-remplir avec ses membres
  const handleDepartementChange = async (value: string | null) => {
    setSelectedDepartementId(value);
    if (!value) {
      setSelectedCollaborateurIds([]);
      return;
    }

    setIsLoadingMembres(true);
    try {
      const membres = await departementsService.getCollaborateurs(parseInt(value, 10), false);
      const availableIds = new Set(collaborateursSelectData.map(o => o.value));
      const ids = (membres || [])
        .map(m => m.id.toString())
        .filter(id => id !== selectedManagerId && availableIds.has(id));
      setSelectedCollaborateurIds(ids);
    } catch (error) {
      console.error('Erreur lors du chargement des membres du département:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les membres du département',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsLoadingMembres(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedManagerId) {
      notifications.show({
        title: 'Erreur',
        message: 'Veuillez sélectionner un manager',
        color: 'red',
        icon: <Warning size={20} />,
      });
      return;
    }

    const managerId = parseInt(selectedManagerId, 10);
    const ids = selectedCollaborateurIds
      .map(id => parseInt(id, 10))
      .filter(id => id !== managerId);

    if (ids.length === 0) {
      notifications.show({
        title: 'Erreur',
        message: 'Veuillez sélectionner au moins un collaborateur à rattacher',
        color: 'red',
        icon: <Warning size={20} />,
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await collaborateursService.bulkAssignManager(managerId, ids);
      const managerNom = collaborateurs.find(c => c.id === managerId)?.nomComplet;

      notifications.show({
        title: 'Succès',
        message: result.message || `${result.updated} collaborateur(s) rattaché(s) à ${managerNom}`,
        color: 'green',
        icon: <Check size={20} />,
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error("Erreur lors du rattachement de l'équipe:", error);
      notifications.show({
        title: 'Erreur',
        message: error.response?.data?.message || error.message || "Erreur lors du rattachement de l'équipe",
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setMode('MANUEL');
    setSelectedManagerId(null);
    setSelectedDepartementId(null);
    setSelectedCollaborateurIds([]);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <UsersThree size={20} />
          <Text fw={600}>Rattacher une équipe à un manager</Text>
        </Group>
      }
      size="lg"
    >
      {isLoading ? (
        <Center h={200}>
          <Loader size="lg" variant="bars" />
        </Center>
      ) : (
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Sélectionnez un manager puis les collaborateurs à lui rattacher
            (individuellement ou via un département/équipe entier).
          </Text>

          {/* Sélecteur de manager */}
          <Select
            label="Manager"
            placeholder="Sélectionner le manager"
            data={managerSelectData}
            value={selectedManagerId}
            onChange={handleManagerChange}
            searchable
            clearable
            nothingFoundMessage="Aucun résultat"
          />

          {/* Mode de sélection des collaborateurs */}
          <Stack gap="xs">
            <Text size="sm" fw={500}>Mode de sélection</Text>
            <SegmentedControl
              value={mode}
              onChange={(value) => {
                setMode(value as 'MANUEL' | 'DEPARTEMENT');
                setSelectedDepartementId(null);
                setSelectedCollaborateurIds([]);
              }}
              data={[
                {
                  value: 'MANUEL',
                  label: (
                    <Group gap="xs">
                      <Users size={16} />
                      <Text size="sm">Sélection manuelle</Text>
                    </Group>
                  ),
                },
                {
                  value: 'DEPARTEMENT',
                  label: (
                    <Group gap="xs">
                      <Building size={16} />
                      <Text size="sm">Par département / équipe</Text>
                    </Group>
                  ),
                },
              ]}
            />
          </Stack>

          {/* Sélection par département : pré-remplit la liste des membres */}
          {mode === 'DEPARTEMENT' && (
            <Select
              label="Département / Équipe"
              placeholder="Sélectionner un département ou une équipe"
              description="Les membres actifs du département seront pré-sélectionnés ci-dessous"
              data={departements}
              value={selectedDepartementId}
              onChange={handleDepartementChange}
              searchable
              clearable
              nothingFoundMessage="Aucun résultat"
              rightSection={isLoadingMembres ? <Loader size="xs" /> : undefined}
            />
          )}

          {/* Multi-sélection des collaborateurs */}
          <MultiSelect
            label="Collaborateurs à rattacher"
            placeholder={selectedCollaborateurIds.length === 0 ? 'Sélectionner les collaborateurs' : ''}
            data={collaborateursSelectData}
            value={selectedCollaborateurIds}
            onChange={setSelectedCollaborateurIds}
            searchable
            clearable
            nothingFoundMessage="Aucun résultat"
            maxDropdownHeight={220}
            limit={50}
          />

          {selectedCollaborateurIds.length > 0 && (
            <Alert variant="light" color="blue" icon={<UsersThree size={20} />}>
              <Group gap="xs">
                <Badge variant="filled" color="blue" size="lg">
                  {selectedCollaborateurIds.length}
                </Badge>
                <Text size="sm">
                  collaborateur{selectedCollaborateurIds.length > 1 ? 's' : ''} sera
                  {selectedCollaborateurIds.length > 1 ? 'ont' : ''} rattaché
                  {selectedCollaborateurIds.length > 1 ? 's' : ''} à ce manager
                </Text>
              </Group>
            </Alert>
          )}

          {/* Boutons d'action */}
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={handleClose} disabled={isSaving}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              loading={isSaving}
              disabled={!selectedManagerId || selectedCollaborateurIds.length === 0}
              leftSection={<Check size={16} />}
            >
              Rattacher l'équipe
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
