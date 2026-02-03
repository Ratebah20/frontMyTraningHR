'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Card,
  Table,
  Badge,
  Group,
  TextInput,
  Stack,
  Tabs,
  Alert,
  SimpleGrid,
  ThemeIcon,
  Center,
  Loader,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { MagnifyingGlass, Warning, CheckCircle, Clock, Certificate, Eye } from '@phosphor-icons/react';
import { formationsService } from '@/lib/services';
import { Formation } from '@/lib/types';

export default function FormationsObligatoiresPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>('formations');
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les formations obligatoires
  useEffect(() => {
    const loadFormations = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await formationsService.getFormations({
          estObligatoire: true,
          limit: 100, // Charger toutes les formations obligatoires
        });
        setFormations(response.data);
      } catch (err) {
        console.error('Erreur lors du chargement des formations obligatoires:', err);
        setError('Impossible de charger les formations obligatoires');
      } finally {
        setLoading(false);
      }
    };

    loadFormations();
  }, []);

  const filteredFormations = formations.filter(
    f => f.nomFormation.toLowerCase().includes(search.toLowerCase()) ||
         f.codeFormation.toLowerCase().includes(search.toLowerCase())
  );

  // Note: Les stats de conformité restent en mock car le calcul réel
  // nécessite de savoir quels collaborateurs doivent suivre quelles formations (T14/T20)
  const conformiteStats = {
    total_collaborateurs: 0,
    conforme: 0,
    non_conforme: 0,
    tauxConformite: 0,
  };

  const formatDuree = (duree?: number, unite?: string) => {
    if (!duree) return '-';
    const uniteAffichee = unite || 'Heures';
    return `${duree} ${uniteAffichee.toLowerCase()}`;
  };

  if (loading) {
    return (
      <Container size="xl">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl">
        <Alert color="red" title="Erreur" icon={<Warning size={20} />}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Stack gap="xl">
        <div>
          <Title order={2}>Formations obligatoires</Title>
          <Text c="dimmed" size="sm">
            Gestion et suivi des formations réglementaires et obligatoires
          </Text>
        </div>

        <SimpleGrid cols={{ base: 1, md: 4 }} spacing="lg">
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Total obligatoires
                </Text>
                <Text size="xl" fw={700}>
                  {formations.length}
                </Text>
              </div>
              <ThemeIcon color="blue" size="lg" radius="md">
                <Certificate size={24} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Taux conformité
                </Text>
                <Text size="xl" fw={700} c="dimmed">
                  -
                </Text>
                <Text size="xs" c="dimmed">Configuration requise</Text>
              </div>
              <ThemeIcon color="gray" size="lg" radius="md">
                <CheckCircle size={24} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Non conformes
                </Text>
                <Text size="xl" fw={700} c="dimmed">
                  -
                </Text>
                <Text size="xs" c="dimmed">Configuration requise</Text>
              </div>
              <ThemeIcon color="gray" size="lg" radius="md">
                <Warning size={24} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Certifications expirées
                </Text>
                <Text size="xl" fw={700} c="dimmed">
                  -
                </Text>
                <Text size="xs" c="dimmed">Configuration requise</Text>
              </div>
              <ThemeIcon color="gray" size="lg" radius="md">
                <Clock size={24} />
              </ThemeIcon>
            </Group>
          </Card>
        </SimpleGrid>

        <Alert color="blue" variant="light" icon={<Warning size={20} />}>
          <Text size="sm">
            <strong>Note :</strong> Les statistiques de conformité (taux de conformité, collaborateurs non conformes,
            certifications expirées) nécessitent une configuration supplémentaire pour définir quels collaborateurs
            doivent suivre quelles formations obligatoires. Cette fonctionnalité sera disponible dans une prochaine version.
          </Text>
        </Alert>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="formations">Formations obligatoires ({formations.length})</Tabs.Tab>
            <Tabs.Tab value="conformite">Suivi conformité</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="formations" pt="xl">
            <Stack gap="md">
              <TextInput
                placeholder="Rechercher une formation..."
                leftSection={<MagnifyingGlass size={16} />}
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
              />

              <Card shadow="sm" p={0} radius="md" withBorder>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Formation</Table.Th>
                      <Table.Th>Code</Table.Th>
                      <Table.Th>Catégorie</Table.Th>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>Durée</Table.Th>
                      <Table.Th>Statut</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredFormations.map((formation) => (
                      <Table.Tr key={formation.id}>
                        <Table.Td>
                          <Text size="sm" fw={500}>{formation.nomFormation}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">{formation.codeFormation}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light">
                            {typeof formation.categorie === 'string'
                              ? formation.categorie
                              : formation.categorie?.nomCategorie || 'Non catégorisé'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{formation.typeFormation || '-'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{formatDuree(formation.dureePrevue, formation.uniteDuree)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={formation.actif ? 'green' : 'gray'}
                            variant="light"
                          >
                            {formation.actif ? 'Active' : 'Inactive'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Tooltip label="Voir les détails">
                            <ActionIcon
                              variant="subtle"
                              onClick={() => router.push(`/formations/${formation.id}`)}
                            >
                              <Eye size={18} />
                            </ActionIcon>
                          </Tooltip>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>

                {filteredFormations.length === 0 && (
                  <Text ta="center" p="xl" c="dimmed">
                    {formations.length === 0
                      ? 'Aucune formation n\'est marquée comme obligatoire. Éditez une formation pour la marquer comme obligatoire.'
                      : 'Aucune formation obligatoire ne correspond à votre recherche'}
                  </Text>
                )}
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="conformite" pt="xl">
            <Stack gap="lg">
              <Alert
                icon={<Warning size={20} />}
                title="Fonctionnalité en attente de configuration"
                color="orange"
                variant="light"
              >
                <Text size="sm">
                  Le suivi de conformité nécessite de définir :
                </Text>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>Quels collaborateurs doivent suivre quelles formations obligatoires</li>
                  <li>La fréquence de renouvellement (si applicable)</li>
                  <li>Les règles d'alerte pour les managers</li>
                </ul>
                <Text size="sm" c="dimmed">
                  Ces fonctionnalités seront disponibles dans les tâches T14 et T20.
                </Text>
              </Alert>

              <Card shadow="sm" p="lg" radius="md" withBorder>
                <Title order={4} mb="md">Par département</Title>
                <Text c="dimmed" size="sm">
                  Le suivi par département sera disponible une fois les règles de conformité configurées.
                </Text>
              </Card>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
