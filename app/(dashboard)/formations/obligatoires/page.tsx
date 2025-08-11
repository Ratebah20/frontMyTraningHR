'use client';

import { useState } from 'react';
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
  Progress,
  SimpleGrid,
  ThemeIcon,
} from '@mantine/core';
import { MagnifyingGlass, Warning, CheckCircle, Clock, Certificate } from '@phosphor-icons/react';
import { mockData } from '@/lib/mock-data';

export default function FormationsObligatoiresPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>('formations');
  
  // Mock formations obligatoires
  const obligatoireFormations = [
    { id: 1, titre: 'Sécurité au travail', categorie: 'Sécurité', duree: 1, conformite: 85 },
    { id: 2, titre: 'RGPD et protection des données', categorie: 'Réglementaire', duree: 0.5, conformite: 72 },
    { id: 3, titre: 'Premiers secours', categorie: 'Sécurité', duree: 2, conformite: 90 },
  ];

  const filteredFormations = obligatoireFormations.filter(
    f => f.titre.toLowerCase().includes(search.toLowerCase())
  );

  // Mock stats
  const conformiteStats = {
    total_collaborateurs: mockData.collaborateurs.length,
    conforme: 2,
    non_conforme: 1,
    tauxConformite: 66.7,
  };

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
                  {obligatoireFormations.length}
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
                <Text size="xl" fw={700} c="green">
                  {conformiteStats.tauxConformite.toFixed(1)}%
                </Text>
              </div>
              <ThemeIcon color="green" size="lg" radius="md">
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
                <Text size="xl" fw={700} c="red">
                  {conformiteStats.non_conforme}
                </Text>
              </div>
              <ThemeIcon color="red" size="lg" radius="md">
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
                <Text size="xl" fw={700} c="orange">
                  0
                </Text>
              </div>
              <ThemeIcon color="orange" size="lg" radius="md">
                <Clock size={24} />
              </ThemeIcon>
            </Group>
          </Card>
        </SimpleGrid>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="formations">Formations obligatoires</Tabs.Tab>
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
                      <Table.Th>Catégorie</Table.Th>
                      <Table.Th>Durée</Table.Th>
                      <Table.Th>Fréquence</Table.Th>
                      <Table.Th>Conformité</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredFormations.map((formation) => (
                      <Table.Tr key={formation.id}>
                        <Table.Td>
                          <Text size="sm" fw={500}>{formation.titre}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light">{formation.categorie}</Badge>
                        </Table.Td>
                        <Table.Td>{formation.duree} jour(s)</Table.Td>
                        <Table.Td>
                          <Badge variant="outline">Annuelle</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Progress
                            value={formation.conformite}
                            size="sm"
                            color={formation.conformite >= 80 ? 'green' : formation.conformite >= 50 ? 'yellow' : 'red'}
                          />
                          <Text size="xs" ta="center" mt={2}>{formation.conformite}%</Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>

                {filteredFormations.length === 0 && (
                  <Text ta="center" p="xl" c="dimmed">
                    Aucune formation obligatoire trouvée
                  </Text>
                )}
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="conformite" pt="xl">
            <Stack gap="lg">
              <Alert
                icon={<Warning size={20} />}
                title="Résumé de conformité"
                color={conformiteStats.tauxConformite >= 80 ? 'green' : 'red'}
                variant="light"
              >
                <Text size="sm">
                  {conformiteStats.non_conforme} collaborateurs n'ont pas suivi toutes les formations obligatoires.
                </Text>
              </Alert>

              <Card shadow="sm" p="lg" radius="md" withBorder>
                <Title order={4} mb="md">Par département</Title>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text>IT</Text>
                    <Progress value={80} w={200} color="green" />
                  </Group>
                  <Group justify="space-between">
                    <Text>RH</Text>
                    <Progress value={100} w={200} color="green" />
                  </Group>
                  <Group justify="space-between">
                    <Text>Finance</Text>
                    <Progress value={20} w={200} color="red" />
                  </Group>
                </Stack>
              </Card>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}