'use client';

import { useEffect, useState } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Select,
  Switch,
  Button,
  Group,
  Stack,
  Card,
  ActionIcon,
  Text,
  Alert,
  Divider,
  Tooltip,
  Progress,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Plus } from '@phosphor-icons/react/dist/ssr/Plus';
import { Trash } from '@phosphor-icons/react/dist/ssr/Trash';
import { ArrowUp } from '@phosphor-icons/react/dist/ssr/ArrowUp';
import { ArrowDown } from '@phosphor-icons/react/dist/ssr/ArrowDown';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { Check } from '@phosphor-icons/react/dist/ssr/Check';
import {
  createTodoTemplate,
  updateTodoTemplate,
} from '@/lib/services/grouped-session-todos.service';
import { TodoTemplate, TodoTemplateItem } from '@/lib/types';

/**
 * Création / modification d'un template de tâches.
 *
 * La page /templates était jusqu'ici en lecture seule : les modèles ne
 * pouvaient être créés qu'en insérant directement des lignes en base.
 */

// La colonne TodosTemplates.items est un NVARCHAR(4000) contenant le JSON
// sérialisé. On surveille la taille ici pour prévenir l'utilisateur AVANT
// l'aller-retour serveur, qui refuserait l'enregistrement avec un 400.
const TAILLE_MAX_ITEMS = 4000;

const PRIORITES = [
  { value: 'bas', label: 'Basse' },
  { value: 'normal', label: 'Normale' },
  { value: 'haut', label: 'Haute' },
];

const TYPES_FORMATION = [
  { value: '', label: 'Tous les types' },
  { value: 'externe', label: 'Externe' },
  { value: 'interne', label: 'Interne' },
  { value: 'elearning', label: 'E-learning' },
];

const CATEGORIES = [
  { value: '', label: 'Aucune' },
  { value: 'doc_admin', label: 'Document administratif' },
  { value: 'equipement', label: 'Équipement' },
  { value: 'logistique', label: 'Logistique' },
  { value: 'budget', label: 'Budget' },
  { value: 'communication', label: 'Communication' },
  { value: 'autre', label: 'Autre' },
];

function itemVide(ordre: number): TodoTemplateItem {
  return { titre: '', description: '', priorite: 'normal', categorie: '', ordre };
}

interface TodoTemplateFormModalProps {
  opened: boolean;
  onClose: () => void;
  /** Template à modifier ; absent = création. */
  template?: TodoTemplate | null;
  onSuccess: () => void;
}

export function TodoTemplateFormModal({
  opened,
  onClose,
  template,
  onSuccess,
}: TodoTemplateFormModalProps) {
  const enEdition = Boolean(template);

  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [typeFormation, setTypeFormation] = useState('');
  const [actif, setActif] = useState(true);
  const [items, setItems] = useState<TodoTemplateItem[]>([itemVide(0)]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Réinitialiser le formulaire à chaque ouverture : la modale reste montée
  // entre deux usages, sans cela on éditerait le template précédent.
  useEffect(() => {
    if (!opened) return;

    setErreur(null);
    setNom(template?.nom ?? '');
    setDescription(template?.description ?? '');
    setTypeFormation(template?.typeFormation ?? '');
    setActif(template?.actif ?? true);
    setItems(
      template?.items?.length
        ? template.items.map((item, index) => ({ ...item, ordre: index }))
        : [itemVide(0)],
    );
  }, [opened, template]);

  const tailleSerialisee = JSON.stringify(items).length;
  const tropVolumineux = tailleSerialisee > TAILLE_MAX_ITEMS;

  const majItem = (index: number, champ: keyof TodoTemplateItem, valeur: any) => {
    setItems((actuels) =>
      actuels.map((item, i) => (i === index ? { ...item, [champ]: valeur } : item)),
    );
  };

  const ajouterItem = () => {
    setItems((actuels) => [...actuels, itemVide(actuels.length)]);
  };

  const supprimerItem = (index: number) => {
    setItems((actuels) =>
      actuels.filter((_, i) => i !== index).map((item, i) => ({ ...item, ordre: i })),
    );
  };

  const deplacerItem = (index: number, direction: -1 | 1) => {
    const cible = index + direction;
    setItems((actuels) => {
      if (cible < 0 || cible >= actuels.length) return actuels;
      const copie = [...actuels];
      [copie[index], copie[cible]] = [copie[cible], copie[index]];
      return copie.map((item, i) => ({ ...item, ordre: i }));
    });
  };

  const handleSubmit = async () => {
    setErreur(null);

    if (!nom.trim()) {
      setErreur('Le nom du template est obligatoire');
      return;
    }

    const itemsNettoyes = items
      .filter((item) => item.titre.trim())
      .map((item, index) => ({
        titre: item.titre.trim(),
        description: item.description?.trim() || undefined,
        priorite: item.priorite,
        categorie: item.categorie || undefined,
        ordre: index,
      }));

    if (itemsNettoyes.length === 0) {
      setErreur('Ajoutez au moins une tâche avec un intitulé');
      return;
    }

    if (JSON.stringify(itemsNettoyes).length > TAILLE_MAX_ITEMS) {
      setErreur(
        'Le template est trop volumineux pour être enregistré. Réduisez le nombre de tâches ou raccourcissez les descriptions.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        nom: nom.trim(),
        description: description.trim() || undefined,
        typeFormation: typeFormation || null,
        items: itemsNettoyes,
        actif,
      };

      if (enEdition && template) {
        await updateTodoTemplate(template.id, payload);
      } else {
        await createTodoTemplate(payload);
      }

      notifications.show({
        title: 'Succès',
        message: enEdition ? 'Template modifié' : 'Template créé',
        color: 'green',
        icon: <Check size={18} />,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Erreur lors de l'enregistrement";
      setErreur(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={enEdition ? 'Modifier le template' : 'Nouveau template de tâches'}
      size="lg"
      styles={{ title: { fontWeight: 700 } }}
    >
      <Stack gap="md">
        {erreur && (
          <Alert icon={<Warning size={16} />} color="red" variant="light">
            {erreur}
          </Alert>
        )}

        <TextInput
          label="Nom du template"
          placeholder="Ex : Formation externe — préparation"
          required
          value={nom}
          onChange={(e) => setNom(e.currentTarget.value)}
        />

        <Textarea
          label="Description"
          placeholder="À quoi sert ce modèle ?"
          autosize
          minRows={2}
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
        />

        <Group grow align="flex-start">
          <Select
            label="Type de formation"
            description="« Tous les types » rend le template universel"
            data={TYPES_FORMATION}
            value={typeFormation}
            onChange={(value) => setTypeFormation(value || '')}
            allowDeselect={false}
          />
          <Switch
            label="Template actif"
            description="Un template inactif n'apparaît plus dans la liste"
            mt="xl"
            checked={actif}
            onChange={(e) => setActif(e.currentTarget.checked)}
          />
        </Group>

        <Divider label="Tâches du template" labelPosition="center" />

        <Stack gap="sm">
          {items.map((item, index) => (
            <Card key={index} withBorder radius="md" padding="sm">
              <Stack gap="xs">
                <Group gap="xs" align="flex-end" wrap="nowrap">
                  <TextInput
                    label={`Tâche ${index + 1}`}
                    placeholder="Intitulé de la tâche"
                    style={{ flex: 1 }}
                    value={item.titre}
                    onChange={(e) => majItem(index, 'titre', e.currentTarget.value)}
                  />
                  <Tooltip label="Monter">
                    <ActionIcon
                      variant="subtle"
                      disabled={index === 0}
                      onClick={() => deplacerItem(index, -1)}
                    >
                      <ArrowUp size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Descendre">
                    <ActionIcon
                      variant="subtle"
                      disabled={index === items.length - 1}
                      onClick={() => deplacerItem(index, 1)}
                    >
                      <ArrowDown size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Supprimer">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      disabled={items.length === 1}
                      onClick={() => supprimerItem(index)}
                    >
                      <Trash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>

                <Textarea
                  placeholder="Description (optionnelle)"
                  autosize
                  minRows={1}
                  value={item.description || ''}
                  onChange={(e) => majItem(index, 'description', e.currentTarget.value)}
                />

                <Group grow>
                  <Select
                    placeholder="Priorité"
                    data={PRIORITES}
                    value={item.priorite}
                    onChange={(value) => majItem(index, 'priorite', value || 'normal')}
                    allowDeselect={false}
                  />
                  <Select
                    placeholder="Catégorie"
                    data={CATEGORIES}
                    value={item.categorie || ''}
                    onChange={(value) => majItem(index, 'categorie', value || '')}
                    allowDeselect={false}
                  />
                </Group>
              </Stack>
            </Card>
          ))}
        </Stack>

        <Button
          variant="light"
          leftSection={<Plus size={16} />}
          onClick={ajouterItem}
        >
          Ajouter une tâche
        </Button>

        <div>
          <Group justify="space-between" mb={4}>
            <Text size="xs" c="dimmed">
              Taille du template
            </Text>
            <Text size="xs" c={tropVolumineux ? 'red' : 'dimmed'}>
              {tailleSerialisee} / {TAILLE_MAX_ITEMS} caractères
            </Text>
          </Group>
          <Progress
            value={Math.min(100, (tailleSerialisee / TAILLE_MAX_ITEMS) * 100)}
            size="xs"
            color={tropVolumineux ? 'red' : 'blue'}
          />
        </div>

        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={tropVolumineux}
            leftSection={<Check size={18} />}
          >
            {enEdition ? 'Enregistrer' : 'Créer le template'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
