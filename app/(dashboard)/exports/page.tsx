'use client';

import { useState } from 'react';
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
  SegmentedControl,
  Paper,
  Loader,
  Alert,
  Select,
  Switch,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import {
  Download,
  FileXls,
  Calendar,
  Database,
  Warning,
  Check,
  Envelope,
  ClipboardText,
  ArrowRight,
  FilePdf,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { exportsService, ExportFilters, ExportType } from '@/lib/services';

type ExportMode = 'all' | 'period';

interface ExportItem {
  id: ExportType;
  title: string;
  description: string;
  format: string;
  icon: typeof FileXls;
  color: string;
}

export default function ExportsPage() {
  const [exportMode, setExportMode] = useState<ExportMode>('all');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [loadingExports, setLoadingExports] = useState<Record<string, boolean>>({});
  const [filterActif, setFilterActif] = useState<boolean | undefined>(undefined);
  const [filterStatut, setFilterStatut] = useState<string | null>(null);

  const exportTypes: ExportItem[] = [
    {
      id: 'collaborateurs',
      title: 'Liste des collaborateurs',
      description: 'Export CSV de tous les collaborateurs avec leurs informations',
      format: 'CSV',
      icon: FileXls,
      color: 'green',
    },
    {
      id: 'formations',
      title: 'Catalogue formations',
      description: 'Export CSV du catalogue complet des formations',
      format: 'CSV',
      icon: FileXls,
      color: 'blue',
    },
    {
      id: 'sessions',
      title: 'Sessions de formation',
      description: 'Export CSV de toutes les sessions avec participants',
      format: 'CSV',
      icon: FileXls,
      color: 'violet',
    },
  ];

  const ensureDate = (date: Date | string | number): Date => {
    return date instanceof Date ? date : new Date(date);
  };

  const formatDateForApi = (date: Date): string => {
    const d = ensureDate(date);
    return d.toISOString().split('T')[0];
  };

  const formatDateDisplay = (date: Date | null): string => {
    if (!date) return '';
    const d = ensureDate(date);
    return d.toLocaleDateString('fr-FR');
  };

  const getFilters = (exportType: ExportType): ExportFilters | undefined => {
    const filters: ExportFilters = {};

    // Filtres de date si mode période
    if (exportMode === 'period' && dateRange[0] && dateRange[1]) {
      filters.startDate = formatDateForApi(dateRange[0]);
      filters.endDate = formatDateForApi(dateRange[1]);
    }

    // Filtre actif/inactif (pour collaborateurs et sessions)
    if (filterActif !== undefined && (exportType === 'collaborateurs' || exportType === 'sessions')) {
      filters.actif = filterActif;
    }

    // Filtre statut (uniquement pour sessions)
    if (filterStatut && exportType === 'sessions') {
      filters.statut = filterStatut;
    }

    return Object.keys(filters).length > 0 ? filters : undefined;
  };

  const handleExport = async (exportType: ExportItem) => {
    const filters = getFilters(exportType.id);

    if (exportMode === 'period' && (!dateRange[0] || !dateRange[1])) {
      notifications.show({
        title: 'Dates requises',
        message: 'Veuillez sélectionner une période de dates pour l\'export.',
        color: 'orange',
        icon: <Warning size={16} />,
      });
      return;
    }

    setLoadingExports((prev) => ({ ...prev, [exportType.id]: true }));

    try {
      let blob: Blob;

      switch (exportType.id) {
        case 'collaborateurs':
          blob = await exportsService.exportCollaborateurs(filters);
          break;
        case 'formations':
          blob = await exportsService.exportFormations(filters);
          break;
        case 'sessions':
          blob = await exportsService.exportSessions(filters);
          break;
        default:
          throw new Error('Type d\'export non supporté');
      }

      const filename = exportsService.generateFilename(exportType.id, filters);
      exportsService.downloadBlob(blob, filename);

      notifications.show({
        title: 'Export réussi',
        message: `Le fichier ${filename} a été téléchargé avec succès.`,
        color: 'green',
        icon: <Check size={16} />,
      });
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      notifications.show({
        title: 'Erreur d\'export',
        message: 'Une erreur est survenue lors de la génération du fichier.',
        color: 'red',
        icon: <Warning size={16} />,
      });
    } finally {
      setLoadingExports((prev) => ({ ...prev, [exportType.id]: false }));
    }
  };

  const isValidPeriod = exportMode === 'all' || (dateRange[0] && dateRange[1]);

  return (
    <Container size="xl">
      <Stack gap="xl">
        <div>
          <Title order={2}>Exports de données</Title>
          <Text c="dimmed" size="sm">
            Générez des rapports et exportez vos données au format CSV
          </Text>
        </div>

        <Paper p="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <ThemeIcon variant="light" color="cyan" size="lg">
                <Calendar size={20} />
              </ThemeIcon>
              <div>
                <Text fw={500}>Mode d'export</Text>
                <Text size="xs" c="dimmed">
                  Choisissez d'exporter toutes les données ou une période spécifique
                </Text>
              </div>
            </Group>

            <SegmentedControl
              value={exportMode}
              onChange={(value) => setExportMode(value as ExportMode)}
              data={[
                {
                  label: (
                    <Group gap="xs" wrap="nowrap">
                      <Database size={16} />
                      <span>Tout exporter</span>
                    </Group>
                  ),
                  value: 'all',
                },
                {
                  label: (
                    <Group gap="xs" wrap="nowrap">
                      <Calendar size={16} />
                      <span>Période personnalisée</span>
                    </Group>
                  ),
                  value: 'period',
                },
              ]}
              fullWidth
            />

            {exportMode === 'period' && (
              <Paper p="md" radius="sm" bg="var(--mantine-color-gray-light)">
                <Stack gap="sm">
                  <Text size="sm" fw={500}>
                    Sélectionnez la période
                  </Text>
                  <DatePickerInput
                    type="range"
                    label="Plage de dates"
                    placeholder="Sélectionnez les dates"
                    value={dateRange}
                    onChange={setDateRange}
                    locale="fr"
                    valueFormat="DD/MM/YYYY"
                    clearable
                    maxDate={new Date()}
                  />
                  {dateRange[0] && dateRange[1] && (
                    <Alert variant="light" color="blue" icon={<Calendar size={16} />}>
                      Les données seront filtrées du{' '}
                      <strong>{formatDateDisplay(dateRange[0])}</strong> au{' '}
                      <strong>{formatDateDisplay(dateRange[1])}</strong>
                    </Alert>
                  )}
                </Stack>
              </Paper>
            )}

            <Paper p="md" radius="sm" bg="var(--mantine-color-gray-light)">
              <Stack gap="sm">
                <Text size="sm" fw={500}>
                  Filtres avancés
                </Text>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <Select
                    label="Statut collaborateur"
                    placeholder="Tous"
                    clearable
                    data={[
                      { value: 'true', label: 'Actifs uniquement' },
                      { value: 'false', label: 'Inactifs uniquement' },
                    ]}
                    value={filterActif === undefined ? null : String(filterActif)}
                    onChange={(value) => setFilterActif(value === null ? undefined : value === 'true')}
                  />
                  <Select
                    label="Statut session (export sessions)"
                    placeholder="Tous les statuts"
                    clearable
                    data={[
                      { value: 'Terminé', label: 'Terminé' },
                      { value: 'En cours', label: 'En cours' },
                      { value: 'Planifié', label: 'Planifié' },
                      { value: 'Annulé', label: 'Annulé' },
                    ]}
                    value={filterStatut}
                    onChange={setFilterStatut}
                  />
                </SimpleGrid>
              </Stack>
            </Paper>
          </Stack>
        </Paper>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {exportTypes.map((exportType) => {
            const isLoading = loadingExports[exportType.id];
            const IconComponent = exportType.icon;

            return (
              <Card key={exportType.id} shadow="sm" p="lg" radius="md" withBorder>
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
                      <IconComponent size={24} />
                    </ThemeIcon>
                    <Text size="sm" c="dimmed" style={{ flex: 1 }}>
                      {exportType.description}
                    </Text>
                  </Group>

                  <Button
                    fullWidth
                    variant="light"
                    leftSection={
                      isLoading ? <Loader size={16} /> : <Download size={16} />
                    }
                    color={exportType.color}
                    onClick={() => handleExport(exportType)}
                    disabled={isLoading || !isValidPeriod}
                    loading={isLoading}
                  >
                    {isLoading ? 'Export en cours...' : 'Exporter'}
                  </Button>
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>

        {exportMode === 'period' && !isValidPeriod && (
          <Alert variant="light" color="orange" icon={<Warning size={16} />}>
            Veuillez sélectionner une plage de dates pour pouvoir exporter les données.
          </Alert>
        )}

        {/* Section Documents HR */}
        <Paper p="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <ThemeIcon variant="light" color="orange" size="lg">
                <FilePdf size={20} />
              </ThemeIcon>
              <div>
                <Text fw={500}>Documents HR</Text>
                <Text size="xs" c="dimmed">
                  Templates de documents pour les formations
                </Text>
              </div>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Card padding="md" radius="md" withBorder>
                <Group>
                  <ThemeIcon size="xl" variant="light" color="orange">
                    <Envelope size={28} />
                  </ThemeIcon>
                  <div style={{ flex: 1 }}>
                    <Text fw={500}>Convocation formation</Text>
                    <Text size="xs" c="dimmed">
                      Document à envoyer aux participants avant une formation
                    </Text>
                  </div>
                </Group>
                <Text size="sm" c="dimmed" mt="sm">
                  Accessible depuis le détail d'une session de formation
                </Text>
                <Button
                  component={Link}
                  href="/sessions"
                  variant="light"
                  color="orange"
                  fullWidth
                  mt="md"
                  rightSection={<ArrowRight size={16} />}
                >
                  Voir les sessions
                </Button>
              </Card>

              <Card padding="md" radius="md" withBorder>
                <Group>
                  <ThemeIcon size="xl" variant="light" color="orange">
                    <ClipboardText size={28} />
                  </ThemeIcon>
                  <div style={{ flex: 1 }}>
                    <Text fw={500}>Fiche de présence</Text>
                    <Text size="xs" c="dimmed">
                      Feuille d'émargement pour signature des participants
                    </Text>
                  </div>
                </Group>
                <Text size="sm" c="dimmed" mt="sm">
                  Accessible depuis le détail d'une session de formation
                </Text>
                <Button
                  component={Link}
                  href="/sessions"
                  variant="light"
                  color="orange"
                  fullWidth
                  mt="md"
                  rightSection={<ArrowRight size={16} />}
                >
                  Voir les sessions
                </Button>
              </Card>
            </SimpleGrid>

            <Alert variant="light" color="blue" icon={<FilePdf size={16} />}>
              Pour générer une convocation ou une fiche de présence, accédez au détail d'une session
              de formation et cliquez sur le bouton <strong>Documents</strong>.
            </Alert>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
