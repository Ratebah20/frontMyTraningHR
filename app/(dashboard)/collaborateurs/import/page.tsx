'use client';

import { Container, Title, Text, Alert, Card } from '@mantine/core';
import { Info } from '@phosphor-icons/react';
import Link from 'next/link';

export default function CollaborateursImportPage() {
  return (
    <Container size="md">
      <Title order={2} mb="xl">Import des collaborateurs</Title>
      
      <Alert 
        icon={<Info size={20} />} 
        title="Import via ETL"
        color="blue"
        variant="light"
      >
        <Text size="sm">
          L'import des collaborateurs se fait via le module Import ETL qui traite les fichiers Excel sources.
        </Text>
        <Text size="sm" mt="xs">
          Les collaborateurs sont automatiquement créés ou mis à jour lors de l'import des fichiers :
        </Text>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>Orange Learning (OLU)</li>
          <li>Suivi des formations</li>
          <li>Plan de formation</li>
        </ul>
        <Text size="sm" mt="md">
          <Link href="/import" style={{ textDecoration: 'underline' }}>
            Aller vers l'Import ETL →
          </Link>
        </Text>
      </Alert>

      <Card mt="xl" shadow="sm" padding="lg">
        <Title order={4} mb="md">Processus d'import</Title>
        <Text size="sm" c="dimmed">
          1. Uploadez vos fichiers Excel dans le module Import ETL
        </Text>
        <Text size="sm" c="dimmed" mt="xs">
          2. Les collaborateurs sont automatiquement extraits et créés
        </Text>
        <Text size="sm" c="dimmed" mt="xs">
          3. Les doublons sont détectés et fusionnés intelligemment
        </Text>
        <Text size="sm" c="dimmed" mt="xs">
          4. Les informations sont enrichies à chaque import
        </Text>
      </Card>
    </Container>
  );
}