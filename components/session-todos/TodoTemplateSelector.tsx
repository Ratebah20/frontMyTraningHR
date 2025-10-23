'use client';

import { useState, useEffect } from 'react';
import { Modal, Stack, Card, Text, Badge, Button, Group, Loader, Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Info } from '@phosphor-icons/react';
import { getTodoTemplates, createTodosFromTemplate } from '@/lib/services/grouped-session-todos.service';
import type { TodoTemplate } from '@/lib/types';

interface TodoTemplateSelectorProps {
  opened: boolean;
  onClose: () => void;
  groupKey: string;
  typeFormation?: string;
  onTemplateApplied: () => void;
}

export default function TodoTemplateSelector({
  opened,
  onClose,
  groupKey,
  typeFormation,
  onTemplateApplied,
}: TodoTemplateSelectorProps) {
  const [templates, setTemplates] = useState<TodoTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<number | null>(null);

  useEffect(() => {
    if (opened) {
      loadTemplates();
    }
  }, [opened, typeFormation]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await getTodoTemplates(typeFormation);
      setTemplates(data);
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les templates',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async (templateId: number) => {
    setApplying(templateId);
    try {
      await createTodosFromTemplate(groupKey, templateId);
      notifications.show({
        title: 'Succès',
        message: 'Checklist ajoutée avec succès',
        color: 'green',
      });
      onTemplateApplied();
      onClose();
    } catch (error: any) {
      notifications.show({
        title: 'Erreur',
        message: error.response?.data?.message || 'Impossible d\'appliquer le template',
        color: 'red',
      });
    } finally {
      setApplying(null);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Choisir un template de checklist"
      size="lg"
    >
      {loading ? (
        <Group justify="center" p="xl">
          <Loader size="lg" />
        </Group>
      ) : templates.length === 0 ? (
        <Alert icon={<Info size={16} />} title="Aucun template disponible" color="blue">
          Aucun template de checklist n'est disponible pour le moment.
        </Alert>
      ) : (
        <Stack gap="md">
          <Alert icon={<Info size={16} />} color="blue">
            Sélectionnez un template pour ajouter automatiquement une checklist prédéfinie à cette formation.
          </Alert>

          {templates.map((template) => (
            <Card key={template.id} withBorder padding="lg">
              <Stack gap="sm">
                <Group justify="space-between">
                  <div>
                    <Text fw={600} size="lg">
                      {template.nom}
                    </Text>
                    {template.typeFormation && (
                      <Badge size="sm" mt="xs">
                        {template.typeFormation}
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={() => handleApplyTemplate(template.id)}
                    loading={applying === template.id}
                    disabled={applying !== null}
                  >
                    Utiliser ce template
                  </Button>
                </Group>

                {template.description && (
                  <Text size="sm" c="dimmed">
                    {template.description}
                  </Text>
                )}

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    {template.items.length} tâches incluses :
                  </Text>
                  <Stack gap="xs">
                    {template.items.slice(0, 5).map((item, idx) => (
                      <Group key={idx} gap="xs">
                        <Badge size="xs" color="gray">
                          {item.ordre}
                        </Badge>
                        <Text size="sm">{item.titre}</Text>
                        {item.priorite === 'haut' && (
                          <Badge size="xs" color="red">
                            Prioritaire
                          </Badge>
                        )}
                      </Group>
                    ))}
                    {template.items.length > 5 && (
                      <Text size="xs" c="dimmed">
                        ... et {template.items.length - 5} autre(s) tâche(s)
                      </Text>
                    )}
                  </Stack>
                </div>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
    </Modal>
  );
}
