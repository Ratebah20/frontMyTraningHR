'use client';

import {
  Container,
  Title,
  Text,
  Card,
  Table,
  Badge,
  Group,
  Button,
  TextInput,
  Stack,
  ActionIcon,
} from '@mantine/core';
import { MagnifyingGlass, Download, Eye, FilePdf, FileDoc, FileXls } from '@phosphor-icons/react';

export default function DocumentsPage() {
  // Mock documents
  const documents = [
    {
      id: 1,
      nom: 'Guide de formation Excel',
      type: 'PDF',
      taille: '2.5 MB',
      dateAjout: '2024-01-15',
      categorie: 'Bureautique'
    },
    {
      id: 2,
      nom: 'Manuel React avancé',
      type: 'PDF',
      taille: '5.2 MB',
      dateAjout: '2024-01-10',
      categorie: 'Développement'
    },
    {
      id: 3,
      nom: 'Procédures sécurité',
      type: 'DOCX',
      taille: '1.8 MB',
      dateAjout: '2024-01-08',
      categorie: 'Sécurité'
    },
    {
      id: 4,
      nom: 'Planning formations 2024',
      type: 'XLSX',
      taille: '0.8 MB',
      dateAjout: '2024-01-05',
      categorie: 'Administration'
    }
  ];

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FilePdf size={20} />;
      case 'DOCX':
        return <FileDoc size={20} />;
      case 'XLSX':
        return <FileXls size={20} />;
      default:
        return <FileDoc size={20} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PDF':
        return 'red';
      case 'DOCX':
        return 'blue';
      case 'XLSX':
        return 'green';
      default:
        return 'gray';
    }
  };

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={2}>Documents de formation</Title>
            <Text c="dimmed" size="sm">
              Bibliothèque de ressources et supports de formation
            </Text>
          </div>
          <Button>
            Ajouter un document
          </Button>
        </Group>

        <TextInput
          placeholder="Rechercher un document..."
          leftSection={<MagnifyingGlass size={16} />}
        />

        <Card shadow="sm" p={0} radius="md" withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Document</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Taille</Table.Th>
                <Table.Th>Date d'ajout</Table.Th>
                <Table.Th>Catégorie</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {documents.map((doc) => (
                <Table.Tr key={doc.id}>
                  <Table.Td>
                    <Group gap="xs">
                      {getFileIcon(doc.type)}
                      <Text size="sm">{doc.nom}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getTypeColor(doc.type)} variant="light">
                      {doc.type}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{doc.taille}</Table.Td>
                  <Table.Td>{doc.dateAjout}</Table.Td>
                  <Table.Td>
                    <Badge variant="outline">{doc.categorie}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon variant="subtle">
                        <Eye size={16} />
                      </ActionIcon>
                      <ActionIcon variant="subtle">
                        <Download size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      </Stack>
    </Container>
  );
}