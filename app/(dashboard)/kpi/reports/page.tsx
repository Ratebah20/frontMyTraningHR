'use client';

import {
  Container,
  Title,
  Text,
  Card,
  SimpleGrid,
  Stack,
  Progress,
  Group,
  Badge,
  Paper,
} from '@mantine/core';
import { ChartBar, TrendUp, Users, Calendar } from '@phosphor-icons/react';
import { mockData } from '@/lib/mock-data';

export default function KPIReportsPage() {
  const stats = {
    tauxParticipation: 75,
    tauxCompletion: 82,
    satisfactionMoyenne: 4.2,
    budgetUtilise: 65
  };

  return (
    <Container size="xl">
      <Stack gap="xl">
        <div>
          <Title order={2}>Rapports KPI</Title>
          <Text c="dimmed" size="sm">
            Indicateurs clés de performance des formations
          </Text>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={500}>Taux de participation</Text>
              <Badge color="blue" variant="light">
                {stats.tauxParticipation}%
              </Badge>
            </Group>
            <Progress value={stats.tauxParticipation} size="lg" radius="xl" />
            <Text size="sm" c="dimmed" mt="md">
              Pourcentage de collaborateurs ayant participé à au moins une formation
            </Text>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={500}>Taux de complétion</Text>
              <Badge color="green" variant="light">
                {stats.tauxCompletion}%
              </Badge>
            </Group>
            <Progress value={stats.tauxCompletion} size="lg" radius="xl" color="green" />
            <Text size="sm" c="dimmed" mt="md">
              Pourcentage de formations terminées avec succès
            </Text>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={500}>Satisfaction moyenne</Text>
              <Badge color="yellow" variant="light">
                {stats.satisfactionMoyenne}/5
              </Badge>
            </Group>
            <Progress value={(stats.satisfactionMoyenne / 5) * 100} size="lg" radius="xl" color="yellow" />
            <Text size="sm" c="dimmed" mt="md">
              Note moyenne donnée par les participants
            </Text>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={500}>Budget utilisé</Text>
              <Badge color="orange" variant="light">
                {stats.budgetUtilise}%
              </Badge>
            </Group>
            <Progress value={stats.budgetUtilise} size="lg" radius="xl" color="orange" />
            <Text size="sm" c="dimmed" mt="md">
              Pourcentage du budget formation consommé
            </Text>
          </Card>
        </SimpleGrid>

        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Title order={3} mb="md">Top 5 des formations</Title>
          <Stack gap="sm">
            {mockData.formations.map((formation, index) => (
              <Paper key={formation.id} p="sm" withBorder>
                <Group justify="space-between">
                  <Group>
                    <Text fw={500}>#{index + 1}</Text>
                    <div>
                      <Text size="sm">{formation.titre}</Text>
                      <Text size="xs" c="dimmed">{formation.categorie}</Text>
                    </div>
                  </Group>
                  <Badge variant="light">
                    {Math.floor(Math.random() * 50 + 50)} participants
                  </Badge>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}