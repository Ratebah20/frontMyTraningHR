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
import {
  Upload,
  Download,
  FileXls,
  CheckCircle,
  Warning,
  XCircle,
  Clock,
  Database,
  ArrowsClockwise,
  Info,
  Users,
  BookOpen,
  CalendarCheck,
  FileText,
} from '@phosphor-icons/react';
import { importService } from '@/lib/services';
import type { ImportHistory, ImportResult } from '@/lib/services/import.service';

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<string | null>('collaborateurs');
  const [initialFile, setInitialFile] = useState<File | null>(null);
  const [oluFile, setOluFile] = useState<File | null>(null);
  const [collaborateursFile, setCollaborateursFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [importProgress, setImportProgress] = useState(0);
  const [currentImportStats, setCurrentImportStats] = useState<ImportResult | null>(null);

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

      {/* Tabs d'import */}
      <Paper shadow="xs" radius="md" mb="xl">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="collaborateurs" leftSection={<Users size={16} />}>
              Import Collaborateurs
            </Tabs.Tab>
            <Tabs.Tab value="initial" leftSection={<Database size={16} />}>
              Import Initial (SUIVI_FORMATIONS)
            </Tabs.Tab>
            <Tabs.Tab value="olu" leftSection={<ArrowsClockwise size={16} />}>
              Import Récurrent (OLU)
            </Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<Clock size={16} />}>
              Historique
            </Tabs.Tab>
          </Tabs.List>

          {/* Import Collaborateurs */}
          <Tabs.Panel value="collaborateurs" pt="xl" px="lg" pb="lg">
            <Stack gap="lg">
              <Alert icon={<Info size={16} />} color="blue" variant="light">
                <Text fw={600} mb="xs">Import du fichier collaborateurs</Text>
                <Text size="sm">
                  Utilisez cet import pour charger ou mettre à jour les données des collaborateurs.
                  Format attendu : Excel avec colonnes spécifiques (Matricule, Nom, Prénom, Département, Manager, etc.)
                </Text>
              </Alert>

              <FileInput
                label="Fichier Excel collaborateurs"
                placeholder="Cliquez pour sélectionner un fichier"
                accept=".xlsx,.xls"
                leftSection={<FileXls size={20} />}
                value={collaborateursFile}
                onChange={setCollaborateursFile}
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
                  leftSection={<Upload size={16} />}
                  onClick={handleCollaborateursImport}
                  loading={isImporting}
                  disabled={!collaborateursFile}
                  size="md"
                >
                  Lancer l'import collaborateurs
                </Button>
              </Group>
            </Stack>
          </Tabs.Panel>

          {/* Import Initial */}
          <Tabs.Panel value="initial" pt="xl" px="lg" pb="lg">
            <Stack gap="lg">
              <Alert icon={<Info size={16} />} color="blue" variant="light">
                <Text fw={600} mb="xs">Import initial depuis le fichier SUIVI_FORMATIONS</Text>
                <Text size="sm">
                  Utilisez cet import pour charger les données historiques de formation.
                  Format attendu : Excel avec colonnes spécifiques (ID_SALARIE, NOM, PRENOM, etc.)
                </Text>
              </Alert>

              <FileInput
                label="Fichier Excel à importer"
                placeholder="Cliquez pour sélectionner un fichier"
                accept=".xlsx,.xls"
                leftSection={<FileXls size={20} />}
                value={initialFile}
                onChange={setInitialFile}
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
                  leftSection={<Upload size={16} />}
                  onClick={handleInitialImport}
                  loading={isImporting}
                  disabled={!initialFile}
                  size="md"
                >
                  Lancer l'import initial
                </Button>
              </Group>
            </Stack>
          </Tabs.Panel>

          {/* Import OLU */}
          <Tabs.Panel value="olu" pt="xl" px="lg" pb="lg">
            <Stack gap="lg">
              <Alert icon={<Info size={16} />} color="blue" variant="light">
                <Text fw={600} mb="xs">Import récurrent depuis l'export OLU</Text>
                <Text size="sm">
                  Utilisez cet import pour mettre à jour régulièrement les données depuis la plateforme OLU.
                  Format attendu : Export Excel OLU standard
                </Text>
              </Alert>

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
                  leftSection={<ArrowsClockwise size={16} />}
                  onClick={handleOluImport}
                  loading={isImporting}
                  disabled={!oluFile}
                  size="md"
                >
                  Lancer l'import OLU
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
    </Container>
  );
}