'use client';

import {
  Container,
  Title,
  Text,
  Card,
  Button,
  Group,
  Stack,
  SimpleGrid,
  Badge,
  ThemeIcon,
} from '@mantine/core';
import { Download, FileXls, FilePdf, FileText } from '@phosphor-icons/react';

export default function ExportsPage() {
  const exportTypes = [
    {
      title: 'Liste des collaborateurs',
      description: 'Export Excel de tous les collaborateurs',
      format: 'XLSX',
      icon: FileXls,
      color: 'green'
    },
    {
      title: 'Catalogue formations',
      description: 'PDF du catalogue complet des formations',
      format: 'PDF',
      icon: FilePdf,
      color: 'red'
    },
    {
      title: 'Rapport de conformité',
      description: 'Rapport détaillé des formations obligatoires',
      format: 'PDF',
      icon: FilePdf,
      color: 'red'
    },
    {
      title: 'Planning des sessions',
      description: 'Export Excel du planning annuel',
      format: 'XLSX',
      icon: FileXls,
      color: 'green'
    },
    {
      title: 'Statistiques globales',
      description: 'Tableau de bord KPI en Excel',
      format: 'XLSX',
      icon: FileXls,
      color: 'green'
    },
    {
      title: 'Historique des formations',
      description: 'Export CSV de l\'historique complet',
      format: 'CSV',
      icon: FileText,
      color: 'blue'
    }
  ];

  return (
    <Container size="xl">
      <Stack gap="xl">
        <div>
          <Title order={2}>Exports de données</Title>
          <Text c="dimmed" size="sm">
            Générez des rapports et exportez vos données
          </Text>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {exportTypes.map((exportType, index) => (
            <Card key={index} shadow="sm" p="lg" radius="md" withBorder>
              <Card.Section withBorder inheritPadding py="xs">
                <Group justify="space-between">
                  <Text fw={500}>{exportType.title}</Text>
                  <Badge color={exportType.color} variant="light">
                    {exportType.format}
                  </Badge>
                </Group>
              </Card.Section>

              <Stack gap="md" mt="md">
                <Group>
                  <ThemeIcon size="lg" variant="light" color={exportType.color}>
                    <exportType.icon size={24} />
                  </ThemeIcon>
                  <Text size="sm" c="dimmed">
                    {exportType.description}
                  </Text>
                </Group>

                <Button
                  fullWidth
                  variant="light"
                  leftSection={<Download size={16} />}
                  color={exportType.color}
                >
                  Exporter
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}