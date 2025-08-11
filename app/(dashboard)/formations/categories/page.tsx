'use client';

import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  SimpleGrid,
  Group,
  Badge,
  Stack,
  Progress,
  ThemeIcon,
  Paper,
} from '@mantine/core';
import {
  Desktop,
  Users,
  Wrench,
  Globe,
  ShieldCheck,
  Brain,
} from '@phosphor-icons/react';
import { mockData } from '@/lib/mock-data';

const categoryIcons: Record<string, any> = {
  'Bureautique': Desktop,
  'Management': Users,
  'Développement': Wrench,
  'Langues': Globe,
  'Sécurité': ShieldCheck,
  'Autre': Brain,
};

const categoryColors: Record<string, string> = {
  'Bureautique': 'blue',
  'Management': 'teal',
  'Développement': 'orange',
  'Langues': 'grape',
  'Sécurité': 'red',
  'Autre': 'gray',
};

export default function FormationsCategoriesPage() {
  // Calculer les statistiques par catégorie
  const categoryStats = mockData.formations.reduce((acc, formation) => {
    const cat = formation.categorie || 'Autre';
    if (!acc[cat]) {
      acc[cat] = {
        count: 0,
        heures: 0,
        formations: [],
      };
    }
    acc[cat].count++;
    acc[cat].heures += formation.duree * 7; // Convertir jours en heures
    acc[cat].formations.push(formation);
    return acc;
  }, {} as Record<string, any>);

  const totalFormations = mockData.formations.length;

  return (
    <Container size="xl">
      <Stack gap="xl">
        <div>
          <Title order={2}>Catégories de formations</Title>
          <Text c="dimmed" size="sm">
            Vue d'ensemble des formations par catégorie
          </Text>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {Object.entries(categoryStats).map(([category, stats]) => {
            const Icon = categoryIcons[category] || Brain;
            const color = categoryColors[category] || 'gray';
            const percentage = (stats.count / totalFormations) * 100;

            return (
              <Card key={category} shadow="sm" p="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Group>
                    <ThemeIcon size="lg" variant="light" color={color}>
                      <Icon size={24} />
                    </ThemeIcon>
                    <div>
                      <Text fw={500}>{category}</Text>
                      <Text size="xs" c="dimmed">
                        {stats.count} formation{stats.count > 1 ? 's' : ''}
                      </Text>
                    </div>
                  </Group>
                  <Badge color={color} variant="light">
                    {percentage.toFixed(0)}%
                  </Badge>
                </Group>

                <Progress value={percentage} color={color} size="sm" mb="md" />

                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Total heures</Text>
                    <Text size="sm" fw={500}>{stats.heures}h</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Moy. heures/formation</Text>
                    <Text size="sm" fw={500}>
                      {(stats.heures / stats.count).toFixed(1)}h
                    </Text>
                  </Group>
                </Stack>

                <Paper p="sm" mt="md" withBorder>
                  <Text size="xs" fw={500} mb="xs">Top formations</Text>
                  {stats.formations.slice(0, 3).map((f: any, idx: number) => (
                    <Text key={idx} size="xs" c="dimmed" truncate>
                      • {f.titre}
                    </Text>
                  ))}
                </Paper>
              </Card>
            );
          })}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}