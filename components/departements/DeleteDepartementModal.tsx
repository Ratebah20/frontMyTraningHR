'use client';

import { useState } from 'react';
import { Modal, Stack, Text, Paper, Group, Button, Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { departementsService } from '@/lib/services';
import { DepartementDetail } from '@/lib/types';

interface DeleteDepartementModalProps {
  opened: boolean;
  onClose: () => void;
  departement: DepartementDetail | null;
  /** Appelé après une suppression réussie (rechargement / navigation). */
  onDeleted: () => void;
  /**
   * Parcours alternatif : le département est devenu une ÉQUIPE. L'appelant
   * ouvre son propre formulaire d'édition déjà positionné sur « Équipe ».
   */
  onTransformerEnEquipe: (departement: DepartementDetail) => void;
}

/**
 * Modale de suppression d'un département, PARTAGÉE entre la page liste
 * (`/collaborateurs/departements`) et la page détail (`/…/departements/[id]`).
 *
 * Elle existait uniquement sur la page liste : la RH, arrivée sur la fiche du
 * département depuis un lien ou un KPI, n'y trouvait ni « Supprimer » ni
 * « Transformer en équipe » — le parcours prévu était invisible depuis l'écran
 * où elle se trouvait. La logique n'est pas dupliquée : elle est ici.
 */
export function DeleteDepartementModal({
  opened,
  onClose,
  departement,
  onDeleted,
  onTransformerEnEquipe,
}: DeleteDepartementModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  // Message d'échec renvoyé par le backend : il dit combien de collaborateurs
  // sont rattachés, combien sont INACTIFS, et les issues possibles.
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fermer = () => {
    if (isDeleting) return;
    setDeleteError(null);
    onClose();
  };

  const handleDelete = async () => {
    if (!departement) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await departementsService.delete(departement.id);
      notifications.show({
        title: 'Succès',
        message: 'Département supprimé avec succès',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
      setDeleteError(null);
      onClose();
      onDeleted();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      // NestJS renvoie parfois `message` sous forme de tableau (erreurs de
      // validation) : on l'aplatit pour ne pas afficher « [object Object] ».
      const brut = error.response?.data?.message;
      const message = Array.isArray(brut)
        ? brut.join(' ')
        : brut || error.message || 'Une erreur est survenue';
      setDeleteError(message);
      notifications.show({
        title: 'Suppression impossible',
        message,
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const transformer = () => {
    if (!departement) return;
    const cible = departement;
    setDeleteError(null);
    onClose();
    onTransformerEnEquipe(cible);
  };

  return (
    <Modal opened={opened} onClose={fermer} title="Confirmer la suppression" centered>
      <Stack gap="md">
        <Text>
          Êtes-vous sûr de vouloir supprimer le département{' '}
          <Text span fw={600}>
            {departement?.nomDepartement}
          </Text>{' '}
          ?
        </Text>

        {/*
          Un département peuplé n'est pas forcément à supprimer : s'il est
          devenu une équipe, le bon geste est de le passer en type « Équipe »
          avec un département parent. Les collaborateurs restent en place et
          leurs KPI remontent au parent.
        */}
        {departement && departement.nombreCollaborateurs > 0 && (
          <Paper p="sm" withBorder bg="yellow.0">
            <Stack gap="xs">
              <Group gap="xs" wrap="nowrap" align="flex-start">
                <Warning size={20} className="text-yellow-600" />
                <Text size="sm" c="yellow.8">
                  Ce département contient {departement.nombreCollaborateurs} collaborateur(s),
                  dont{' '}
                  {departement.nombreCollaborateurs - (departement.nombreCollaborateursActifs || 0)}{' '}
                  inactif(s) : la suppression sera refusée. Les personnes inactives comptent aussi —
                  elles conservent leur historique de formation et restent rattachées. S&apos;il est
                  devenu une équipe, transformez-le en équipe rattachée à un département parent
                  plutôt que de le supprimer — les collaborateurs restent en place et leurs KPI
                  remontent au parent.
                </Text>
              </Group>
              {/* Bouton repris dans l'alerte d'échec : ne pas le doubler */}
              {!deleteError && (
                <Group justify="flex-end">
                  <Button
                    size="compact-sm"
                    variant="light"
                    leftSection={<Users size={16} />}
                    onClick={transformer}
                  >
                    Transformer en équipe
                  </Button>
                </Group>
              )}
            </Stack>
          </Paper>
        )}

        {/* Message exact renvoyé par le backend en cas de refus */}
        {deleteError && (
          <Alert icon={<Warning size={18} />} color="red" variant="light" title="Suppression refusée">
            <Stack gap="xs">
              <Text size="sm">{deleteError}</Text>
              <Group justify="flex-end">
                <Button
                  size="compact-sm"
                  variant="light"
                  leftSection={<Users size={16} />}
                  onClick={transformer}
                >
                  Transformer en équipe
                </Button>
              </Group>
            </Stack>
          </Alert>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" color="gray" onClick={fermer} disabled={isDeleting}>
            {deleteError ? 'Fermer' : 'Annuler'}
          </Button>
          <Button color="red" onClick={handleDelete} loading={isDeleting}>
            Supprimer
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
