'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Card,
  Badge,
  SimpleGrid,
  Center,
  Stack,
  Flex,
  Select,
  Loader,
  Alert,
  Paper,
  Grid,
  Accordion,
  List,
  ThemeIcon,
  Box,
  Divider,
  ActionIcon,
} from '@mantine/core';
import {
  Warning,
  ListChecks,
  Tag,
  BookOpen,
  CheckCircle,
  Circle,
  ArrowsClockwise,
  FunnelSimple,
} from '@phosphor-icons/react';
import { getTodoTemplates } from '@/lib/services/grouped-session-todos.service';
import { TodoTemplate } from '@/lib/types';

// Couleurs par type de formation
const typeColors: Record<string, string> = {
  'externe': 'blue',
  'interne': 'green',
  'elearning': 'purple',
};

// Couleurs par priorité
const priorityColors: Record<string, string> = {
  'bas': 'gray',
  'normal': 'blue',
  'haut': 'red',
};

// Couleurs par catégorie
const categoryColors: Record<string, string> = {
  'doc_admin': 'blue',
  'equipement': 'orange',
  'logistique': 'cyan',
  'budget': 'yellow',
  'communication': 'grape',
  'autre': 'gray',
};

export default function TemplatesPage() {
  // États
  const [templates, setTemplates] = useState<TodoTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Statistiques
  const [stats, setStats] = useState({
    total: 0,
    actifs: 0,
    parType: {
      externe: 0,
      interne: 0,
      elearning: 0,
      tous: 0,
    }
  });

  // Charger les templates
  const loadTemplates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const typeParam = typeFilter || undefined;
      const data = await getTodoTemplates(typeParam);

      setTemplates(data);

      // Calculer les statistiques
      const actifs = data.filter(t => t.actif).length;
      const parType = {
        externe: data.filter(t => t.typeFormation === 'externe').length,
        interne: data.filter(t => t.typeFormation === 'interne').length,
        elearning: data.filter(t => t.typeFormation === 'elearning').length,
        tous: data.filter(t => !t.typeFormation).length,
      };

      setStats({
        total: data.length,
        actifs,
        parType,
      });

    } catch (err: any) {
      console.error('Erreur lors du chargement des templates:', err);
      setError(err.message || 'Erreur lors du chargement des templates');
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les templates au montage et quand les filtres changent
  useEffect(() => {
    loadTemplates();
  }, [typeFilter]);

  const handleRefresh = () => {
    loadTemplates();
  };

  return (
    <Container size="xl">
      {/* En-tête */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Flex justify="space-between" align="center" mb="md">
          <div>
            <Group align="center" gap="sm">
              <ListChecks size={32} color="#228BE6" />
              <Title order={1}>Templates de Tâches</Title>
            </Group>
            <Text size="lg" c="dimmed" mt="xs">
              Modèles de tâches prédéfinis pour vos sessions de formation
            </Text>
          </div>
          <Group>
            <ActionIcon
              variant="light"
              size="lg"
              onClick={handleRefresh}
            >
              <ArrowsClockwise size={20} />
            </ActionIcon>
          </Group>
        </Flex>

        {/* Statistiques rapides */}
        <Grid mt="lg">
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Total Templates
                  </Text>
                  <Text size="xl" fw={700}>{stats.total}</Text>
                </div>
                <BookOpen size={24} color="#228BE6" />
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Actifs
                  </Text>
                  <Text size="xl" fw={700} c="green">
                    {stats.actifs}
                  </Text>
                </div>
                <CheckCircle size={24} color="#40C057" />
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Externes
                  </Text>
                  <Text size="xl" fw={700}>
                    {stats.parType.externe}
                  </Text>
                </div>
                <Tag size={24} color="#228BE6" />
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Internes
                  </Text>
                  <Text size="xl" fw={700}>
                    {stats.parType.interne}
                  </Text>
                </div>
                <Tag size={24} color="#40C057" />
              </Group>
            </Paper>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Filtres */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Group align="center" mb="md">
          <FunnelSimple size={20} />
          <Text fw={600}>Filtres</Text>
        </Group>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              placeholder="Type de formation"
              data={[
                { value: '', label: 'Tous les types' },
                { value: 'externe', label: 'Externe' },
                { value: 'interne', label: 'Interne' },
                { value: 'elearning', label: 'E-learning' },
              ]}
              value={typeFilter}
              onChange={(value) => setTypeFilter(value || '')}
              clearable
            />
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Liste des templates */}
      {isLoading ? (
        <Center h={300}>
          <Stack align="center">
            <Loader size="lg" />
            <Text c="dimmed">Chargement des templates...</Text>
          </Stack>
        </Center>
      ) : error ? (
        <Alert icon={<Warning size={16} />} color="red" variant="light">
          {error}
        </Alert>
      ) : templates.length > 0 ? (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          {templates.map((template) => (
            <Card
              key={template.id}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{
                borderColor: template.actif ? 'var(--mantine-color-gray-3)' : 'var(--mantine-color-red-2)',
              }}
            >
              {/* En-tête du template */}
              <Group justify="space-between" mb="md">
                <div style={{ flex: 1 }}>
                  <Group gap="sm" mb="xs">
                    <Text fw={700} size="lg">
                      {template.nom}
                    </Text>
                    <Badge
                      size="sm"
                      variant="dot"
                      color={template.actif ? 'green' : 'red'}
                    >
                      {template.actif ? 'Actif' : 'Inactif'}
                    </Badge>
                  </Group>

                  {template.description && (
                    <Text size="sm" c="dimmed" mb="xs">
                      {template.description}
                    </Text>
                  )}

                  <Group gap="xs">
                    {template.typeFormation ? (
                      <Badge
                        variant="light"
                        color={typeColors[template.typeFormation] || 'gray'}
                        size="sm"
                      >
                        {template.typeFormation}
                      </Badge>
                    ) : (
                      <Badge variant="outline" size="sm" color="gray">
                        Tous types
                      </Badge>
                    )}
                    <Badge variant="outline" size="sm">
                      {template.items.length} tâche{template.items.length > 1 ? 's' : ''}
                    </Badge>
                  </Group>
                </div>
              </Group>

              <Divider my="md" />

              {/* Liste des items du template */}
              <Accordion variant="contained">
                <Accordion.Item value="items">
                  <Accordion.Control>
                    <Group gap="xs">
                      <ListChecks size={18} />
                      <Text fw={600}>
                        Tâches du template ({template.items.length})
                      </Text>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    {template.items.length > 0 ? (
                      <List
                        spacing="sm"
                        size="sm"
                        center
                        icon={
                          <ThemeIcon color="blue" size={20} radius="xl">
                            <Circle size={12} weight="fill" />
                          </ThemeIcon>
                        }
                      >
                        {template.items
                          .sort((a, b) => a.ordre - b.ordre)
                          .map((item, index) => (
                            <List.Item key={index}>
                              <Box>
                                <Group gap="xs" mb={4}>
                                  <Text fw={500}>{item.titre}</Text>
                                  <Badge
                                    size="xs"
                                    variant="light"
                                    color={priorityColors[item.priorite] || 'gray'}
                                  >
                                    {item.priorite}
                                  </Badge>
                                  {item.categorie && (
                                    <Badge
                                      size="xs"
                                      variant="outline"
                                      color={categoryColors[item.categorie] || 'gray'}
                                    >
                                      {item.categorie}
                                    </Badge>
                                  )}
                                </Group>
                                {item.description && (
                                  <Text size="xs" c="dimmed">
                                    {item.description}
                                  </Text>
                                )}
                              </Box>
                            </List.Item>
                          ))}
                      </List>
                    ) : (
                      <Text size="sm" c="dimmed" ta="center" py="md">
                        Aucune tâche dans ce template
                      </Text>
                    )}
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>

              {/* Métadonnées */}
              <Box mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Créé le {new Date(template.dateCreation).toLocaleDateString('fr-FR')}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Modifié le {new Date(template.dateModification).toLocaleDateString('fr-FR')}
                  </Text>
                </Group>
              </Box>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Paper shadow="xs" p="xl" radius="md">
          <Center py="xl">
            <Stack align="center">
              <ListChecks size={48} color="#868E96" />
              <Text size="lg" fw={500} c="dimmed">Aucun template trouvé</Text>
              <Text size="sm" c="dimmed">
                {typeFilter
                  ? 'Essayez de modifier vos critères de filtre'
                  : 'Aucun template de tâches n\'est disponible pour le moment'
                }
              </Text>
            </Stack>
          </Center>
        </Paper>
      )}
    </Container>
  );
}
