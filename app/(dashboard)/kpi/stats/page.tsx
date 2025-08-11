'use client';

import {
  Container,
  Title,
  Text,
  Card,
  SimpleGrid,
  Stack,
  ThemeIcon,
  RingProgress,
  Center,
  Group,
  Badge,
} from '@mantine/core';
import { Users, GraduationCap, Calendar, CurrencyEur } from '@phosphor-icons/react';
import { mockData } from '@/lib/mock-data';

export default function KPIStatsPage() {
  const kpi = mockData.kpi;

  return (
    <Container size="xl">
      <Stack gap="xl">
        <div>
          <Title order={2}>Statistiques générales</Title>
          <Text c="dimmed" size="sm">
            Vue d'ensemble des indicateurs de formation
          </Text>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Stack align="center" gap="md">
              <ThemeIcon size="xl" variant="light" color="blue">
                <Users size={32} />
              </ThemeIcon>
              <div style={{ textAlign: 'center' }}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Total collaborateurs
                </Text>
                <Text size="2xl" fw={700}>
                  {kpi.totalCollaborateurs}
                </Text>
              </div>
            </Stack>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Stack align="center" gap="md">
              <ThemeIcon size="xl" variant="light" color="green">
                <GraduationCap size={32} />
              </ThemeIcon>
              <div style={{ textAlign: 'center' }}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Total formations
                </Text>
                <Text size="2xl" fw={700}>
                  {kpi.totalFormations}
                </Text>
              </div>
            </Stack>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Stack align="center" gap="md">
              <ThemeIcon size="xl" variant="light" color="grape">
                <Calendar size={32} />
              </ThemeIcon>
              <div style={{ textAlign: 'center' }}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Sessions planifiées
                </Text>
                <Text size="2xl" fw={700}>
                  {kpi.totalSessions}
                </Text>
              </div>
            </Stack>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Stack align="center" gap="md">
              <ThemeIcon size="xl" variant="light" color="orange">
                <CurrencyEur size={32} />
              </ThemeIcon>
              <div style={{ textAlign: 'center' }}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Budget total
                </Text>
                <Text size="2xl" fw={700}>
                  {kpi.budget.toLocaleString()}€
                </Text>
              </div>
            </Stack>
          </Card>
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Title order={3} mb="md">Taux de participation</Title>
            <Center>
              <RingProgress
                size={180}
                thickness={16}
                sections={[{ value: kpi.tauxParticipation, color: 'blue' }]}
                label={
                  <Center>
                    <Text size="xl" fw={700}>{kpi.tauxParticipation}%</Text>
                  </Center>
                }
              />
            </Center>
            <Text size="sm" c="dimmed" ta="center" mt="md">
              des collaborateurs ont participé à au moins une formation
            </Text>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Title order={3} mb="md">Répartition par catégorie</Title>
            <Stack gap="sm">
              {['Développement', 'Management', 'Bureautique'].map((categorie, index) => {
                const value = [40, 30, 30][index];
                const color = ['blue', 'green', 'orange'][index];
                return (
                  <div key={categorie}>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">{categorie}</Text>
                      <Badge color={color} variant="light">{value}%</Badge>
                    </Group>
                    <RingProgress
                      size={40}
                      thickness={4}
                      sections={[{ value, color }]}
                      style={{ display: 'inline-block' }}
                    />
                  </div>
                );
              })}
            </Stack>
          </Card>
        </SimpleGrid>
      </Stack>
    </Container>
  );
}