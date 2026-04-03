'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Paper,
  Tabs,
  FileInput,
  Button,
  Group,
  Stack,
  Alert,
  Text,
  Table,
  Badge,
  Progress,
  Card,
  Grid,
  ThemeIcon,
  Center,
  Loader,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Upload } from '@phosphor-icons/react/dist/ssr/Upload';
import { Download } from '@phosphor-icons/react/dist/ssr/Download';
import { FileXls } from '@phosphor-icons/react/dist/ssr/FileXls';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { XCircle } from '@phosphor-icons/react/dist/ssr/XCircle';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { Database } from '@phosphor-icons/react/dist/ssr/Database';
import { ArrowsClockwise } from '@phosphor-icons/react/dist/ssr/ArrowsClockwise';
import { Info } from '@phosphor-icons/react/dist/ssr/Info';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { BookOpen } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { CalendarCheck } from '@phosphor-icons/react/dist/ssr/CalendarCheck';
import { FileText } from '@phosphor-icons/react/dist/ssr/FileText';
import { Eye } from '@phosphor-icons/react/dist/ssr/Eye';
import { Gear } from '@phosphor-icons/react/dist/ssr/Gear';
import { importService } from '@/lib/services';
import { importPreviewService } from '@/lib/services/import-preview.service';
import type { ImportHistory, ImportResult } from '@/lib/services/import.service';
import type { ImportPreviewResponse } from '@/lib/types/import-preview.types';
import { ImportPreviewModal } from '@/components/import/ImportPreviewModal';
import Link from 'next/link';

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<string | null>('olu');
  const [initialFile, setInitialFile] = useState<File | null>(null);
  const [oluFile, setOluFile] = useState<File | null>(null);
  const [collaborateursFile, setCollaborateursFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [importProgress, setImportProgress] = useState(0);
  const [currentImportStats, setCurrentImportStats] = useState<ImportResult | null>(null);

  // States pour le mode preview OLU
  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // Charger l'historique des imports
  useEffect(() => {
    loadImportHistory();
  }, []);

  // Réinitialiser les stats lors du changement d'onglet
  useEffect(() => {
    setCurrentImportStats(null);
    setImportProgress(0);
  }, [activeTab]);

  const loadImportHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await importService.getImportHistory(20, 0);
      // S'assurer que c'est un tableau
      if (Array.isArray(history)) {
        setImportHistory(history);
      } else {
        setImportHistory([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      setImportHistory([]); // Initialiser avec un tableau vide en cas d'erreur
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger l\'historique des imports',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleInitialImport = async () => {
    if (!initialFile) {
      notifications.show({
        title: 'Erreur',
        message: 'Veuillez sélectionner un fichier',
        color: 'red',
        icon: <Warning size={20} />,
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setCurrentImportStats(null);

    // Simuler la progression
    const progressInterval = setInterval(() => {
      setImportProgress((prev) => Math.min(prev + 10, 90));
    }, 1000);

    try {
      const result = await importService.importInitial(initialFile);
      clearInterval(progressInterval);
      setImportProgress(100);
      setCurrentImportStats(result);

      notifications.show({
        title: 'Import terminé',
        message: `Import initial réussi: ${result.stats?.created || 0} créés, ${result.stats?.updated || 0} mis à jour`,
        color: 'green',
        icon: <CheckCircle size={20} />,
        autoClose: 10000,
      });

      // Recharger l'historique
      await loadImportHistory();
      
      // Réinitialiser après succès
      setTimeout(() => {
        setInitialFile(null);
        setImportProgress(0);
      }, 2000);
    } catch (error: any) {
      clearInterval(progressInterval);
      setImportProgress(0);
      
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'import';
      notifications.show({
        title: 'Erreur d\'import',
        message: errorMessage,
        color: 'red',
        icon: <XCircle size={20} />,
        autoClose: false,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleOluImport = async () => {
    if (!oluFile) {
      notifications.show({
        title: 'Erreur',
        message: 'Veuillez sélectionner un fichier',
        color: 'red',
        icon: <Warning size={20} />,
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setCurrentImportStats(null);

    // Simuler la progression
    const progressInterval = setInterval(() => {
      setImportProgress((prev) => Math.min(prev + 15, 90));
    }, 500);

    try {
      const result = await importService.importOlu(oluFile);
      clearInterval(progressInterval);
      setImportProgress(100);
      setCurrentImportStats(result);

      notifications.show({
        title: 'Import terminé',
        message: `Import OLU réussi: ${result.stats?.created || 0} créés, ${result.stats?.updated || 0} mis à jour`,
        color: 'green',
        icon: <CheckCircle size={20} />,
        autoClose: 10000,
      });

      // Recharger l'historique
      await loadImportHistory();

      // Réinitialiser après succès
      setTimeout(() => {
        setOluFile(null);
        setImportProgress(0);
      }, 2000);
    } catch (error: any) {
      clearInterval(progressInterval);
      setImportProgress(0);

      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'import';
      notifications.show({
        title: 'Erreur d\'import',
        message: errorMessage,
        color: 'red',
        icon: <XCircle size={20} />,
        autoClose: false,
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Preview OLU avec détection de conflits
  const handleOluPreview = async () => {
    if (!oluFile) {
      notifications.show({
        title: 'Erreur',
        message: 'Veuillez sélectionner un fichier',
        color: 'red',
        icon: <Warning size={20} />,
      });
      return;
    }

    setIsGeneratingPreview(true);
    try {
      const preview = await importPreviewService.generatePreview(oluFile);
      setPreviewData(preview);
      setShowPreviewModal(true);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la génération du preview';
      notifications.show({
        title: 'Erreur',
        message: errorMessage,
        color: 'red',
        icon: <XCircle size={20} />,
      });
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleImportSuccess = async () => {
    await loadImportHistory();
    setOluFile(null);
    setPreviewData(null);
  };

  const handleCollaborateursImport = async () => {
    if (!collaborateursFile) {
      notifications.show({
        title: 'Erreur',
        message: 'Veuillez sélectionner un fichier',
        color: 'red',
        icon: <Warning size={20} />,
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setCurrentImportStats(null);

    // Simuler la progression
    const progressInterval = setInterval(() => {
      setImportProgress((prev) => Math.min(prev + 10, 90));
    }, 800);

    try {
      const result = await importService.importCollaborateurs(collaborateursFile);
      clearInterval(progressInterval);
      setImportProgress(100);
      setCurrentImportStats(result);

      notifications.show({
        title: 'Import terminé',
        message: `Import collaborateurs réussi: ${result.stats?.created || 0} créés, ${result.stats?.updated || 0} mis à jour`,
        color: 'green',
        icon: <CheckCircle size={20} />,
        autoClose: 10000,
      });

      // Recharger l'historique
      await loadImportHistory();

      // Réinitialiser après succès
      setTimeout(() => {
        setCollaborateursFile(null);
        setImportProgress(0);
      }, 2000);
    } catch (error: any) {
      clearInterval(progressInterval);
      setImportProgress(0);

      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'import';
      notifications.show({
        title: 'Erreur d\'import',
        message: errorMessage,
        color: 'red',
        icon: <XCircle size={20} />,
        autoClose: false,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'green';
      case 'PARTIAL': return 'yellow';
      case 'ERROR': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS': return <CheckCircle size={16} />;
      case 'PARTIAL': return <Warning size={16} />;
      case 'ERROR': return <XCircle size={16} />;
      default: return <Info size={16} />;
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  // Calculer les statistiques globales (s'assurer que importHistory est un tableau)
  const historyArray = Array.isArray(importHistory) ? importHistory : [];
  const globalStats = {
    totalImports: historyArray.length,
    successfulImports: historyArray.filter(h => h.status === 'SUCCESS').length,
    totalRecords: historyArray.reduce((acc, h) => acc + (h.recordsProcessed || 0), 0),
    totalCreated: historyArray.reduce((acc, h) => acc + (h.recordsCreated || 0), 0),
    totalUpdated: historyArray.reduce((acc, h) => acc + (h.recordsUpdated || 0), 0),
    averageTime: historyArray.length > 0 
      ? historyArray.reduce((acc, h) => acc + (h.processingTimeMs || 0), 0) / historyArray.length
      : 0,
  };

  return (
    <Container size="xl">
      {/* En-tête */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Group justify="space-between" mb="md">
          <div>
            <Group align="center" gap="sm">
              <Database size={32} color="#228BE6" />
              <Title order={1}>Import ETL</Title>
            </Group>
            <Text size="lg" c="dimmed" mt="xs">
              Importez vos données de formation depuis Excel
            </Text>
          </div>
          <Tooltip label="Rafraîchir l'historique">
            <ActionIcon 
              variant="light" 
              size="lg" 
              onClick={loadImportHistory}
              loading={isLoadingHistory}
            >
              <ArrowsClockwise size={20} />
            </ActionIcon>
          </Tooltip>
        </Group>

        {/* Statistiques globales */}
        <Grid mt="lg">
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Total imports
                  </Text>
                  <Text size="xl" fw={700}>{globalStats.totalImports}</Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                  <Upload size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Réussis
                  </Text>
                  <Text size="xl" fw={700} c="green">
                    {globalStats.successfulImports}
                  </Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="green">
                  <CheckCircle size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Records traités
                  </Text>
                  <Text size="xl" fw={700}>{globalStats.totalRecords}</Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                  <FileText size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Card withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Temps moyen
                  </Text>
                  <Text size="xl" fw={700}>
                    {formatDuration(globalStats.averageTime)}
                  </Text>
                </div>
                <ThemeIcon size="lg" radius="md" variant="light" color="orange">
                  <Clock size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Bannière dernier import */}
      {!isLoadingHistory && historyArray.length > 0 && (() => {
        const last = historyArray[0];
        const date = new Date(last.createdAt);
        return (
          <Alert
            icon={<Clock size={16} />}
            color={getStatusColor(last.status)}
            variant="light"
            mb="xl"
            radius="md"
          >
            <Group justify="space-between" wrap="wrap">
              <Group gap="xs">
                <Text fw={600} size="sm">Dernier import :</Text>
                <Badge variant="light" size="sm">{last.type}</Badge>
                <Text size="sm">
                  le {date.toLocaleDateString('fr-FR')} à {date.toLocaleTimeString('fr-FR')}
                </Text>
                <Badge color={getStatusColor(last.status)} variant="light" size="sm" leftSection={getStatusIcon(last.status)}>
                  {last.status}
                </Badge>
                <Text size="sm" c="dimmed">
                  — {last.recordsProcessed || 0} lignes traitées
                </Text>
              </Group>
            </Group>
          </Alert>
        );
      })()}

      {/* Tabs d'import */}
      <Paper shadow="xs" radius="md" mb="xl">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="olu" leftSection={<ArrowsClockwise size={16} />}>
              Import Récurrent (OLU)
            </Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<Clock size={16} />}>
              Historique
            </Tabs.Tab>
          </Tabs.List>

          {/* Import OLU */}
          <Tabs.Panel value="olu" pt="xl" px="lg" pb="lg">
            <Stack gap="lg">
              <Group justify="space-between" align="flex-start">
                <Alert icon={<Info size={16} />} color="blue" variant="light" style={{ flex: 1 }}>
                  <Text fw={600} mb="xs">Import récurrent depuis l'export OLU</Text>
                  <Text size="sm">
                    Utilisez le mode <Text span fw={600}>Preview</Text> pour analyser le fichier et détecter les conflits avant import.
                    Les décisions prises seront mémorisées pour les prochains imports.
                  </Text>
                </Alert>
                <Tooltip label="Gérer les règles mémorisées">
                  <ActionIcon
                    component={Link}
                    href="/import/rules"
                    variant="light"
                    size="lg"
                    color="gray"
                  >
                    <Gear size={20} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              <FileInput
                label="Fichier Excel OLU"
                placeholder="Cliquez pour sélectionner un fichier"
                accept=".xlsx,.xls"
                leftSection={<FileXls size={20} />}
                value={oluFile}
                onChange={setOluFile}
                disabled={isImporting}
                required
              />

              {importProgress > 0 && (
                <div>
                  <Text size="sm" mb="xs">Progression de l'import...</Text>
                  <Progress value={importProgress} animated />
                </div>
              )}

              {currentImportStats && (
                <Alert icon={<CheckCircle size={16} />} color="green" variant="light">
                  <Text fw={600} mb="xs">Import terminé avec succès !</Text>
                  <Group gap="xl">
                    <Text size="sm">Total traité: {currentImportStats.stats?.total || 0}</Text>
                    <Text size="sm">Créés: {currentImportStats.stats?.created || 0}</Text>
                    <Text size="sm">Mis à jour: {currentImportStats.stats?.updated || 0}</Text>
                    <Text size="sm">Échecs: {currentImportStats.stats?.failed || 0}</Text>
                  </Group>
                </Alert>
              )}

              <Group justify="flex-end">
                <Button
                  variant="light"
                  leftSection={<Eye size={16} />}
                  onClick={handleOluPreview}
                  loading={isGeneratingPreview}
                  disabled={!oluFile || isImporting}
                  size="md"
                >
                  Preview
                </Button>
              </Group>
            </Stack>
          </Tabs.Panel>

          {/* Historique */}
          <Tabs.Panel value="history" pt="xl">
            {isLoadingHistory ? (
              <Center h={200}>
                <Loader size="lg" variant="bars" />
              </Center>
            ) : historyArray.length > 0 ? (
              <Table.ScrollContainer minWidth={800}>
                <Table verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Date</Table.Th>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>Fichier</Table.Th>
                      <Table.Th>Statut</Table.Th>
                      <Table.Th>Traités</Table.Th>
                      <Table.Th>Créés</Table.Th>
                      <Table.Th>Modifiés</Table.Th>
                      <Table.Th>Échecs</Table.Th>
                      <Table.Th>Durée</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {historyArray.map((history) => (
                      <Table.Tr key={history.id}>
                        <Table.Td>
                          <Text size="sm">
                            {new Date(history.createdAt).toLocaleDateString('fr-FR')}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {new Date(history.createdAt).toLocaleTimeString('fr-FR')}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light" size="sm">
                            {history.type}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" truncate style={{ maxWidth: 200 }}>
                            {history.filename}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={getStatusColor(history.status)}
                            variant="light"
                            leftSection={getStatusIcon(history.status)}
                          >
                            {history.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td>{history.recordsProcessed || 0}</Table.Td>
                        <Table.Td>
                          <Text c="green">{history.recordsCreated || 0}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text c="blue">{history.recordsUpdated || 0}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text c={history.recordsFailed ? 'red' : 'dimmed'}>
                            {history.recordsFailed || 0}
                          </Text>
                        </Table.Td>
                        <Table.Td>{formatDuration(history.processingTimeMs)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            ) : (
              <Center py="xl">
                <Stack align="center">
                  <Clock size={48} color="#868E96" />
                  <Text size="lg" fw={500} c="dimmed">Aucun import effectué</Text>
                  <Text size="sm" c="dimmed">
                    Les imports apparaîtront ici une fois effectués
                  </Text>
                </Stack>
              </Center>
            )}
          </Tabs.Panel>
        </Tabs>
      </Paper>

      {/* Modal Preview OLU */}
      <ImportPreviewModal
        opened={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        previewData={previewData}
        onImportSuccess={handleImportSuccess}
      />
    </Container>
  );
}