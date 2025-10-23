'use client';

import { useState } from 'react';
import { Modal, TextInput, Textarea, Select, Button, Group, Stack } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import type { SessionTodo, CreateSessionTodoDto, UpdateSessionTodoDto } from '@/lib/types';

interface TodoFormProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSessionTodoDto | UpdateSessionTodoDto) => Promise<void>;
  todo?: SessionTodo;
  mode: 'create' | 'edit';
}

const PRIORITE_OPTIONS = [
  { value: 'bas', label: 'Basse' },
  { value: 'normal', label: 'Normale' },
  { value: 'haut', label: 'Haute' },
];

const CATEGORIE_OPTIONS = [
  { value: 'doc_admin', label: '📄 Documents administratifs' },
  { value: 'equipement', label: '💼 Équipements' },
  { value: 'logistique', label: '🚗 Logistique' },
  { value: 'budget', label: '💰 Budget' },
  { value: 'communication', label: '📧 Communication' },
  { value: 'autre', label: '✅ Autre' },
];

export default function TodoForm({ opened, onClose, onSubmit, todo, mode }: TodoFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titre: todo?.titre || '',
    description: todo?.description || '',
    priorite: todo?.priorite || 'normal',
    categorie: todo?.categorie || '',
    dateEcheance: todo?.dateEcheance ? new Date(todo.dateEcheance) : null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 TodoForm handleSubmit appelé, mode:', mode);

    if (!formData.titre.trim()) {
      console.log('⚠️ Titre vide, arrêt de la soumission');
      notifications.show({
        title: 'Erreur',
        message: 'Le titre est requis',
        color: 'red',
      });
      return;
    }

    const submitData = {
      titre: formData.titre.trim(),
      description: formData.description?.trim() || undefined,
      priorite: formData.priorite as 'bas' | 'normal' | 'haut',
      categorie: formData.categorie || undefined,
      dateEcheance: formData.dateEcheance && formData.dateEcheance instanceof Date
        ? formData.dateEcheance.toISOString().split('T')[0]
        : undefined,
    };
    console.log('📤 Données à soumettre:', submitData);

    setLoading(true);
    try {
      await onSubmit(submitData);
      console.log('✅ Soumission réussie');

      notifications.show({
        title: 'Succès',
        message: mode === 'create' ? 'Tâche créée avec succès' : 'Tâche mise à jour',
        color: 'green',
      });

      onClose();
    } catch (error: any) {
      console.error('❌ Erreur lors de la soumission:', error);
      notifications.show({
        title: 'Erreur',
        message: error.response?.data?.message || 'Une erreur est survenue',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={mode === 'create' ? 'Ajouter une tâche' : 'Modifier la tâche'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Titre"
            placeholder="Ex: Signer la convention de formation"
            required
            value={formData.titre}
            onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
            maxLength={500}
          />

          <Textarea
            label="Description"
            placeholder="Détails supplémentaires..."
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            maxLength={2000}
          />

          <Group grow>
            <Select
              label="Priorité"
              data={PRIORITE_OPTIONS}
              value={formData.priorite}
              onChange={(value) => setFormData({ ...formData, priorite: value || 'normal' })}
            />

            <Select
              label="Catégorie"
              placeholder="Choisir une catégorie"
              data={CATEGORIE_OPTIONS}
              value={formData.categorie}
              onChange={(value) => setFormData({ ...formData, categorie: value || '' })}
              clearable
            />
          </Group>

          <DateInput
            label="Date d'échéance"
            placeholder="Sélectionner une date"
            value={formData.dateEcheance}
            onChange={(value) => setFormData({ ...formData, dateEcheance: value })}
            clearable
            minDate={new Date()}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" loading={loading}>
              {mode === 'create' ? 'Créer' : 'Enregistrer'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
