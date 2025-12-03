'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Group,
  Text,
  Button,
  Alert,
  Badge,
  Progress,
  Divider,
  Tabs,
  Center,
  Card,
  Grid,
  ThemeIcon,
  ScrollArea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  Warning,
  CheckCircle,
  XCircle,
  Info,
  Users,
  BookOpen,
  Building,
  ArrowsClockwise,
  Eye,
  ListChecks,
} from '@phosphor-icons/react';
import type {
  ImportPreviewResponse,
  ConflictItem,
  ResolutionConflict,
} from '@/lib/types/import-preview.types';
import { importPreviewService } from '@/lib/services/import-preview.service';
import { ConflictResolutionList } from './ConflictResolutionList';

interface ImportPreviewModalProps {
  opened: boolean;
  onClose: () => void;
  previewData: ImportPreviewResponse | null;
  onImportSuccess: () => void;
}

export function ImportPreviewModal({
  opened,
  onClose,
  previewData,
  onImportSuccess,
}: ImportPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<string | null>('stats');
  const [resolutions, setResolutions] = useState<Map<string, ResolutionConflict>>(
    new Map(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [canImport, setCanImport] = useState(false);

  // Reinitialiser l'etat a l'ouverture
  useEffect(() => {
    if (opened && previewData) {
      setResolutions(new Map());
      setCanImport(previewData.peutImporterDirectement);
      setActiveTab(previewData.conflits.length > 0 ? 'conflicts' : 'stats');
      setImportProgress(0);
    }
  }, [opened, previewData]);

  if (!previewData) return null;

  const handleResolutionChange = (
    conflict: ConflictItem,
    resolution: ResolutionConflict,
  ) => {
    const key = `${conflict.typeEntite}:${conflict.valeurExcel}`;
    const newResolutions = new Map(resolutions);
    newResolutions.set(key, resolution);
    setResolutions(newResolutions);

    // Verifier si tous les conflits sont resolus
    setCanImport(newResolutions.size >= previewData.conflits.length);
  };

  const handleSubmitResolutions = async () => {
    if (resolutions.size === 0) return;

    setIsSubmitting(true);
    try {
      const result = await importPreviewService.submitResolutions({
        previewId: previewData.previewId,
        resolutions: Array.from(resolutions.values()),
      });

      if (result.peutImporter) {
        setCanImport(true);
        notifications.show({
          title: 'Resolutions enregistrees',
          message: "Vous pouvez maintenant lancer l'import",
          color: 'green',
          icon: <CheckCircle size={20} />,
        });
      } else {
        notifications.show({
          title: 'Resolutions partielles',
          message: `Il reste ${result.conflitsRestants} conflit(s) a resoudre`,
          color: 'yellow',
          icon: <Warning size={20} />,
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: "Impossible d'enregistrer les resolutions",
        color: 'red',
        icon: <XCircle size={20} />,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    setImportProgress(0);

    // Simulation de progression
    const progressInterval = setInterval(() => {
      setImportProgress((prev) => Math.min(prev + 5, 90));
    }, 500);

    try {
      // Soumettre les résolutions au backend si des conflits existent
      if (resolutions.size > 0) {
        await importPreviewService.submitResolutions({
          previewId: previewData.previewId,
          resolutions: Array.from(resolutions.values()),
        });
      }

      const result = await importPreviewService.confirmImport(previewData.previewId);
      clearInterval(progressInterval);
      setImportProgress(100);

      notifications.show({
        title: 'Import termine',
        message: `${result.sessionsAdded} sessions creees, ${result.sessionsUpdated} mises a jour`,
        color: 'green',
        icon: <CheckCircle size={20} />,
        autoClose: 10000,
      });

      onImportSuccess();
      onClose();
    } catch (error: any) {
      clearInterval(progressInterval);
      setImportProgress(0);
      notifications.show({
        title: "Erreur d'import",
        message: error.response?.data?.message || "Erreur lors de l'import",
        color: 'red',
        icon: <XCircle size={20} />,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancel = async () => {
    try {
      await importPreviewService.cancelPreview(previewData.previewId);
    } catch {
      // Ignorer les erreurs d'annulation
    }
    onClose();
  };

  const { stats, conflits } = previewData;

  return (
    <Modal
      opened={opened}
      onClose={handleCancel}
      title={
        <Group gap="sm">
          <Eye size={24} />
          <Text fw={600}>Preview Import OLU</Text>
          <Badge color="blue" variant="light">
            {stats.totalLignes} lignes
          </Badge>
        </Group>
      }
      size="xl"
      closeOnClickOutside={!isImporting}
      closeOnEscape={!isImporting}
    >
      <Stack gap="md">
        {/* Indicateur de regles appliquees */}
        {previewData.reglesAppliquees > 0 && (
          <Alert icon={<Info size={16} />} color="blue" variant="light">
            {previewData.reglesAppliquees} regle(s) memorisee(s) appliquee(s)
            automatiquement
          </Alert>
        )}

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="stats" leftSection={<ListChecks size={16} />}>
              Resume ({stats.totalLignes} lignes)
            </Tabs.Tab>
            <Tabs.Tab
              value="conflicts"
              leftSection={<Warning size={16} />}
              disabled={conflits.length === 0}
            >
              Conflits
              {conflits.length > 0 && (
                <Badge ml="xs" size="sm" color="red" variant="filled">
                  {conflits.length}
                </Badge>
              )}
            </Tabs.Tab>
          </Tabs.List>

          {/* Onglet Statistiques */}
          <Tabs.Panel value="stats" pt="md">
            <Grid>
              <Grid.Col span={6}>
                <Card withBorder p="sm">
                  <Group>
                    <ThemeIcon size="lg" variant="light" color="blue">
                      <BookOpen size={20} />
                    </ThemeIcon>
                    <div>
                      <Text size="xs" c="dimmed">
                        Sessions
                      </Text>
                      <Text fw={600}>
                        {stats.sessionsACreer} nouvelles / {stats.sessionsAMettreAJour}{' '}
                        maj
                      </Text>
                    </div>
                  </Group>
                </Card>
              </Grid.Col>

              <Grid.Col span={6}>
                <Card withBorder p="sm">
                  <Group>
                    <ThemeIcon size="lg" variant="light" color="green">
                      <Users size={20} />
                    </ThemeIcon>
                    <div>
                      <Text size="xs" c="dimmed">
                        Collaborateurs
                      </Text>
                      <Text fw={600}>
                        {stats.collaborateursTrouves} trouves
                        {stats.collaborateursNonTrouves.length > 0 && (
                          <Text span c="orange" ml="xs">
                            ({stats.collaborateursNonTrouves.length} non trouves)
                          </Text>
                        )}
                      </Text>
                    </div>
                  </Group>
                </Card>
              </Grid.Col>

              <Grid.Col span={6}>
                <Card withBorder p="sm">
                  <Group>
                    <ThemeIcon size="lg" variant="light" color="violet">
                      <Building size={20} />
                    </ThemeIcon>
                    <div>
                      <Text size="xs" c="dimmed">
                        Formations
                      </Text>
                      <Text fw={600}>
                        {stats.formationsNouvelles} nouvelles /{' '}
                        {stats.formationsExistantes} existantes
                      </Text>
                    </div>
                  </Group>
                </Card>
              </Grid.Col>

              {stats.nouveauxOrganismes.length > 0 && (
                <Grid.Col span={12}>
                  <Alert icon={<Info size={16} />} color="blue" variant="light">
                    <Text size="sm" fw={500} mb="xs">
                      Nouveaux organismes a creer :
                    </Text>
                    <Group gap="xs">
                      {stats.nouveauxOrganismes.slice(0, 10).map((org) => (
                        <Badge key={org} variant="light">
                          {org}
                        </Badge>
                      ))}
                      {stats.nouveauxOrganismes.length > 10 && (
                        <Badge variant="light" color="gray">
                          +{stats.nouveauxOrganismes.length - 10} autres
                        </Badge>
                      )}
                    </Group>
                  </Alert>
                </Grid.Col>
              )}

              {stats.collaborateursNonTrouves.length > 0 && (
                <Grid.Col span={12}>
                  <Alert icon={<Warning size={16} />} color="orange" variant="light">
                    <Text size="sm" fw={500} mb="xs">
                      Collaborateurs non trouves (sessions ignorees) :
                    </Text>
                    <ScrollArea h={100}>
                      <Group gap="xs">
                        {stats.collaborateursNonTrouves.slice(0, 20).map((c) => (
                          <Badge key={c.idExterne} variant="light" color="orange">
                            {c.idExterne} ({c.lignes.length} lignes)
                          </Badge>
                        ))}
                        {stats.collaborateursNonTrouves.length > 20 && (
                          <Badge variant="light" color="gray">
                            +{stats.collaborateursNonTrouves.length - 20} autres
                          </Badge>
                        )}
                      </Group>
                    </ScrollArea>
                  </Alert>
                </Grid.Col>
              )}
            </Grid>
          </Tabs.Panel>

          {/* Onglet Conflits */}
          <Tabs.Panel value="conflicts" pt="md">
            {conflits.length > 0 ? (
              <ConflictResolutionList
                conflicts={conflits}
                resolutions={resolutions}
                onResolutionChange={handleResolutionChange}
              />
            ) : (
              <Center py="xl">
                <Stack align="center">
                  <CheckCircle size={48} color="#40C057" />
                  <Text c="dimmed">Aucun conflit detecte</Text>
                </Stack>
              </Center>
            )}
          </Tabs.Panel>
        </Tabs>

        <Divider />

        {/* Progression de l'import */}
        {isImporting && (
          <div>
            <Text size="sm" mb="xs">
              Import en cours...
            </Text>
            <Progress value={importProgress} animated striped />
          </div>
        )}

        {/* Actions */}
        <Group justify="space-between">
          <Button variant="subtle" onClick={handleCancel} disabled={isImporting}>
            Annuler
          </Button>

          <Group>
            {conflits.length > 0 && resolutions.size > 0 && !canImport && (
              <Button
                variant="light"
                onClick={handleSubmitResolutions}
                loading={isSubmitting}
                leftSection={<CheckCircle size={16} />}
              >
                Valider les resolutions ({resolutions.size}/{conflits.length})
              </Button>
            )}

            <Button
              onClick={handleConfirmImport}
              loading={isImporting}
              disabled={!canImport}
              leftSection={<ArrowsClockwise size={16} />}
              color="green"
            >
              {canImport
                ? "Lancer l'import"
                : `Resoudre ${conflits.length} conflit(s)`}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
