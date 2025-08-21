'use client';

import { useState, useEffect } from 'react';
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
  ThemeIcon,
  RingProgress,
  Center,
  Loader,
  Alert,
  ActionIcon,
  Tooltip,
  Button,
  Select,
  Table,
  Modal,
  NumberInput,
  Timeline,
} from '@mantine/core';
import { 
  FileText,
  Download,
  ArrowsClockwise,
  Warning,
  CheckCircle,
  Clock,
  GraduationCap,
  Building,
  User,
  FileXls,
  FilePdf,
  Users,
  BookOpen,
  Info,
  TrendUp,
  TrendDown,
} from '@phosphor-icons/react';
import { notifications } from '@mantine/notifications';
import { statsService } from '@/lib/services';
import { useDisclosure } from '@mantine/hooks';

// Interface basée sur les vrais DTOs du backend
interface DashboardData {
  kpis: {
    totalCollaborateurs: number;
    totalFormations: number;
    totalSessions: number;
    tauxCompletion: number;
    heuresFormation: number;
    budgetUtilise?: number;
  };
  tendances: {
    evolutionSessions: Array<{
      periode: string;
      valeur: number;
      variation: number;
    }>;
    evolutionParticipants: Array<{
      periode: string;
      valeur: number;
      variation: number;
    }>;
  };
  topFormations: Array<{
    id: number;
    code: string;
    nom: string;
    categorie: string;
    participants: number;
    tauxCompletion: number;
  }>;
  alertes: Array<{
    type: string;
    message: string;
    count: number;
    severity: 'info' | 'warning' | 'error';
  }>;
}

export default function ReportsPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periode, setPeriode] = useState<string>('year');
  const [annee, setAnnee] = useState<number>(new Date().getFullYear());
  
  // Modal pour l'export
  const [exportModalOpened, { open: openExportModal, close: closeExportModal }] = useDisclosure(false);
  const [exportType, setExportType] = useState<string>('dashboard');
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [periode, annee]);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Maintenant on envoie les paramètres période et année
      const data = await statsService.getDashboard({ periode, annee });
      setDashboardData(data);
    } catch (err: any) {
      console.error('Erreur lors du chargement du dashboard:', err);
      setError(err.message || 'Erreur lors du chargement du dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const blob = await statsService.exportReport(exportType, exportFormat, {
        periode,
        annee,
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_${exportType}_${new Date().toISOString().split('T')[0]}.${exportFormat === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      notifications.show({
        title: 'Export réussi',
        message: 'Le rapport a été téléchargé',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
      
      closeExportModal();
    } catch (err: any) {
      notifications.show({
        title: 'Erreur d\'export',
        message: err.message || 'Erreur lors de l\'export',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'red';
      case 'warning': return 'yellow';
      default: return 'blue';
    }
  };

  if (isLoading) {
    return (
      <Container size="xl">
        <Center h={400}>
          <Loader size="lg" variant="bars" />
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl">
        <Alert icon={<Warning size={20} />} color="red" variant="light">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!dashboardData) {
    return (
      <Container size="xl">
        <Alert icon={<Info size={20} />} color="blue" variant="light">
          Aucune donnée disponible
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Stack gap="xl">
        {/* En-tête */}
        <Paper shadow="xs" p="lg" radius="md">
          <Group justify="space-between" align="center">
            <div>
              <Group align="center" gap="sm">
                <FileText size={32} color="#228BE6" />
                <Title order={1}>Module Reports</Title>
              </Group>
              <Text c="dimmed" size="lg" mt="xs">
                Tableaux de bord et rapports détaillés
              </Text>
            </div>
            <Group>
              <Select
                value={periode}
                onChange={(value) => setPeriode(value || 'year')}
                data={[
                  { value: 'month', label: 'Mois' },
                  { value: 'quarter', label: 'Trimestre' },
                  { value: 'year', label: 'Année' },
                  { value: 'all', label: 'Tout' },
                ]}
                w={120}
              />
              <NumberInput
                value={annee}
                onChange={(value) => setAnnee(Number(value))}
                min={2020}
                max={2030}
                w={100}
              />
              <Tooltip label="Rafraîchir">
                <ActionIcon variant="light" size="lg" onClick={loadDashboard}>
                  <ArrowsClockwise size={20} />
                </ActionIcon>
              </Tooltip>
              <Button
                leftSection={<Download size={16} />}
                onClick={openExportModal}
                variant="filled"
              >
                Exporter
              </Button>
            </Group>
          </Group>
        </Paper>

        {/* KPIs réels du backend */}
        <div>
          <Title order={3} mb="md">Indicateurs clés</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Stack align="center" gap="md">
                <ThemeIcon size="xl" variant="light" color="blue">
                  <Users size={32} />
                </ThemeIcon>
                <div style={{ textAlign: 'center' }}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Collaborateurs
                  </Text>
                  <Text size="2xl" fw={700}>
                    {dashboardData.kpis.totalCollaborateurs}
                  </Text>
                </div>
              </Stack>
            </Card>

            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Stack align="center" gap="md">
                <ThemeIcon size="xl" variant="light" color="green">
                  <BookOpen size={32} />
                </ThemeIcon>
                <div style={{ textAlign: 'center' }}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Formations
                  </Text>
                  <Text size="2xl" fw={700}>
                    {dashboardData.kpis.totalFormations}
                  </Text>
                </div>
              </Stack>
            </Card>

            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Stack align="center" gap="md">
                <ThemeIcon size="xl" variant="light" color="grape">
                  <GraduationCap size={32} />
                </ThemeIcon>
                <div style={{ textAlign: 'center' }}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Sessions
                  </Text>
                  <Text size="2xl" fw={700}>
                    {dashboardData.kpis.totalSessions}
                  </Text>
                </div>
              </Stack>
            </Card>

            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Stack align="center" gap="md">
                <Center>
                  <RingProgress
                    size={100}
                    thickness={12}
                    sections={[
                      { 
                        value: dashboardData.kpis.tauxCompletion, 
                        color: dashboardData.kpis.tauxCompletion > 70 ? 'green' : 
                               dashboardData.kpis.tauxCompletion > 40 ? 'yellow' : 'red'
                      }
                    ]}
                    label={
                      <Center>
                        <Text size="lg" fw={700}>
                          {Math.round(dashboardData.kpis.tauxCompletion)}%
                        </Text>
                      </Center>
                    }
                  />
                </Center>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700} ta="center">
                  Taux de complétion
                </Text>
              </Stack>
            </Card>
          </SimpleGrid>

          {/* Heures de formation */}
          {dashboardData.kpis.heuresFormation > 0 && (
            <Card shadow="sm" p="lg" radius="md" withBorder mt="md">
              <Group justify="space-between">
                <Group>
                  <ThemeIcon size="lg" variant="light" color="orange">
                    <Clock size={20} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      Heures de formation
                    </Text>
                    <Text size="xl" fw={700}>
                      {Math.round(dashboardData.kpis.heuresFormation)} heures
                    </Text>
                  </div>
                </Group>
                {dashboardData.kpis.budgetUtilise && (
                  <Text size="sm" c="dimmed">
                    Budget: {dashboardData.kpis.budgetUtilise}€
                  </Text>
                )}
              </Group>
            </Card>
          )}
        </div>

        {/* Tendances */}
        {(dashboardData.tendances.evolutionSessions.length > 0 || 
          dashboardData.tendances.evolutionParticipants.length > 0) && (
          <Paper shadow="xs" p="lg" radius="md">
            <Title order={3} mb="lg">Évolution</Title>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              {dashboardData.tendances.evolutionSessions.length > 0 && (
                <Card withBorder p="md">
                  <Text fw={600} mb="md">Sessions</Text>
                  <Timeline active={dashboardData.tendances.evolutionSessions.length - 1}>
                    {dashboardData.tendances.evolutionSessions.map((item, index) => (
                      <Timeline.Item key={index} title={item.periode}>
                        <Group gap="xs">
                          <Text size="sm">{item.valeur} sessions</Text>
                          {item.variation !== 0 && (
                            <Badge 
                              color={item.variation > 0 ? 'green' : 'red'} 
                              variant="light"
                              leftSection={item.variation > 0 ? <TrendUp size={12} /> : <TrendDown size={12} />}
                            >
                              {Math.abs(item.variation)}%
                            </Badge>
                          )}
                        </Group>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </Card>
              )}

              {dashboardData.tendances.evolutionParticipants.length > 0 && (
                <Card withBorder p="md">
                  <Text fw={600} mb="md">Participants</Text>
                  <Timeline active={dashboardData.tendances.evolutionParticipants.length - 1}>
                    {dashboardData.tendances.evolutionParticipants.map((item, index) => (
                      <Timeline.Item key={index} title={item.periode}>
                        <Group gap="xs">
                          <Text size="sm">{item.valeur} participants</Text>
                          {item.variation !== 0 && (
                            <Badge 
                              color={item.variation > 0 ? 'green' : 'red'} 
                              variant="light"
                              leftSection={item.variation > 0 ? <TrendUp size={12} /> : <TrendDown size={12} />}
                            >
                              {Math.abs(item.variation)}%
                            </Badge>
                          )}
                        </Group>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </Card>
              )}
            </SimpleGrid>
          </Paper>
        )}

        {/* Top formations */}
        {dashboardData.topFormations.length > 0 && (
          <Paper shadow="xs" p="lg" radius="md">
            <Title order={3} mb="lg">Top Formations</Title>
            <Table.ScrollContainer minWidth={600}>
              <Table verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Rang</Table.Th>
                    <Table.Th>Formation</Table.Th>
                    <Table.Th>Code</Table.Th>
                    <Table.Th>Catégorie</Table.Th>
                    <Table.Th>Participants</Table.Th>
                    <Table.Th>Taux complétion</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {dashboardData.topFormations.map((formation, index) => (
                    <Table.Tr key={formation.id}>
                      <Table.Td>
                        <Badge 
                          color={index < 3 ? 'yellow' : 'gray'} 
                          variant={index < 3 ? 'filled' : 'light'}
                        >
                          #{index + 1}
                        </Badge>
                      </Table.Td>
                      <Table.Td fw={500}>{formation.nom}</Table.Td>
                      <Table.Td>
                        <Badge variant="outline">{formation.code}</Badge>
                      </Table.Td>
                      <Table.Td>{formation.categorie}</Table.Td>
                      <Table.Td>{formation.participants}</Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Progress 
                            value={formation.tauxCompletion} 
                            color={formation.tauxCompletion > 70 ? 'green' : 
                                   formation.tauxCompletion > 40 ? 'yellow' : 'red'}
                            size="sm"
                            w={100}
                          />
                          <Text size="xs">{Math.round(formation.tauxCompletion)}%</Text>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
        )}

        {/* Alertes */}
        {dashboardData.alertes.length > 0 && (
          <Paper shadow="xs" p="lg" radius="md">
            <Title order={3} mb="lg">Alertes</Title>
            <Stack gap="sm">
              {dashboardData.alertes.map((alerte, index) => (
                <Alert
                  key={index}
                  icon={
                    alerte.severity === 'error' ? <Warning size={16} /> :
                    alerte.severity === 'warning' ? <Info size={16} /> :
                    <Info size={16} />
                  }
                  color={getSeverityColor(alerte.severity)}
                  variant="light"
                  title={`${alerte.count} ${alerte.type.replace(/_/g, ' ')}`}
                >
                  <Text size="sm">{alerte.message}</Text>
                </Alert>
              ))}
            </Stack>
          </Paper>
        )}

        {/* Actions rapides pour les rapports */}
        <Paper shadow="xs" p="lg" radius="md">
          <Title order={3} mb="lg">Générer des rapports détaillés</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            <Button
              variant="light"
              leftSection={<GraduationCap size={16} />}
              onClick={() => {
                const id = prompt('ID de la formation:');
                if (id) {
                  statsService.getFormationReport(Number(id)).then(report => {
                    console.log('Rapport formation:', report);
                    notifications.show({
                      title: 'Rapport généré',
                      message: 'Consultez la console pour voir le rapport',
                      color: 'green',
                    });
                  }).catch(err => {
                    notifications.show({
                      title: 'Erreur',
                      message: 'Formation non trouvée',
                      color: 'red',
                    });
                  });
                }
              }}
            >
              Rapport Formation
            </Button>
            
            <Button
              variant="light"
              leftSection={<User size={16} />}
              onClick={() => {
                const id = prompt('ID du collaborateur:');
                if (id) {
                  statsService.getCollaborateurReport(Number(id)).then(report => {
                    console.log('Rapport collaborateur:', report);
                    notifications.show({
                      title: 'Rapport généré',
                      message: 'Consultez la console pour voir le rapport',
                      color: 'blue',
                    });
                  }).catch(err => {
                    notifications.show({
                      title: 'Erreur',
                      message: 'Collaborateur non trouvé',
                      color: 'red',
                    });
                  });
                }
              }}
            >
              Rapport Collaborateur
            </Button>
            
            <Button
              variant="light"
              leftSection={<Building size={16} />}
              onClick={() => {
                const id = prompt('ID du département:');
                if (id) {
                  statsService.getDepartementReport(Number(id)).then(report => {
                    console.log('Rapport département:', report);
                    notifications.show({
                      title: 'Rapport généré',
                      message: 'Consultez la console pour voir le rapport',
                      color: 'orange',
                    });
                  }).catch(err => {
                    notifications.show({
                      title: 'Erreur',
                      message: 'Département non trouvé',
                      color: 'red',
                    });
                  });
                }
              }}
            >
              Rapport Département
            </Button>
            
            <Button
              variant="light"
              leftSection={<Download size={16} />}
              onClick={openExportModal}
            >
              Export personnalisé
            </Button>
          </SimpleGrid>
        </Paper>
      </Stack>

      {/* Modal d'export */}
      <Modal
        opened={exportModalOpened}
        onClose={closeExportModal}
        title="Exporter un rapport"
        size="md"
      >
        <Stack gap="md">
          <Select
            label="Type de rapport"
            placeholder="Sélectionner le type"
            value={exportType}
            onChange={(value) => setExportType(value || 'dashboard')}
            data={[
              { value: 'dashboard', label: 'Dashboard complet' },
              { value: 'formations', label: 'Rapport formations' },
              { value: 'collaborateurs', label: 'Rapport collaborateurs' },
              { value: 'departements', label: 'Rapport départements' },
              { value: 'sessions', label: 'Rapport sessions' },
            ]}
          />
          
          <Select
            label="Format"
            placeholder="Sélectionner le format"
            value={exportFormat}
            onChange={(value) => setExportFormat((value as 'excel' | 'pdf') || 'excel')}
            data={[
              { value: 'excel', label: 'Excel (.xlsx)' },
              { value: 'pdf', label: 'PDF' },
            ]}
          />
          
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeExportModal}>
              Annuler
            </Button>
            <Button
              leftSection={exportFormat === 'excel' ? <FileXls size={16} /> : <FilePdf size={16} />}
              onClick={handleExport}
              loading={isExporting}
            >
              Exporter
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}