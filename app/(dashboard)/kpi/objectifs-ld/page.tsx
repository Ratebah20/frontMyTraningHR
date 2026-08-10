'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  SimpleGrid,
  Stack,
  Group,
  Badge,
  RingProgress,
  Center,
  Loader,
  Table,
  ThemeIcon,
  Alert,
  Button,
  Modal,
  NumberInput,
  ActionIcon,
  Tooltip,
  Divider,
  Collapse,
  Paper,
  Anchor,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { Target } from '@phosphor-icons/react/dist/ssr/Target';
import { ChartBar } from '@phosphor-icons/react/dist/ssr/ChartBar';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { TrendUp } from '@phosphor-icons/react/dist/ssr/TrendUp';
import { TrendDown } from '@phosphor-icons/react/dist/ssr/TrendDown';
import { Lightning } from '@phosphor-icons/react/dist/ssr/Lightning';
import { Books } from '@phosphor-icons/react/dist/ssr/Books';
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr/ShieldCheck';
import { FirstAidKit } from '@phosphor-icons/react/dist/ssr/FirstAidKit';
import { Certificate } from '@phosphor-icons/react/dist/ssr/Certificate';
import { Translate } from '@phosphor-icons/react/dist/ssr/Translate';
import { Desktop } from '@phosphor-icons/react/dist/ssr/Desktop';
import { Brain } from '@phosphor-icons/react/dist/ssr/Brain';
import { Briefcase } from '@phosphor-icons/react/dist/ssr/Briefcase';
import { PencilSimple } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { CurrencyDollar } from '@phosphor-icons/react/dist/ssr/CurrencyDollar';
import { Trash } from '@phosphor-icons/react/dist/ssr/Trash';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/ssr/ArrowCounterClockwise';
import { CaretDown } from '@phosphor-icons/react/dist/ssr/CaretDown';
import { CaretUp } from '@phosphor-icons/react/dist/ssr/CaretUp';
import dynamic from 'next/dynamic';
const LazyObjectifsRadarChart = dynamic(
  () => import('@/components/charts/ObjectifsRadarChart').then(mod => mod.ObjectifsRadarChart),
  { ssr: false, loading: () => <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>Chargement du graphique...</div> }
);
import { PeriodSelector } from '@/components/PeriodSelector';
import { statsService } from '@/lib/services';

interface CategoryKpi {
  categorieId: number;
  categorieNom: string;
  formations: number;
  totalSessions: number;
  sessionsCompleted: number;
  tauxCompletion: number;
  collaborateursFormes: number;
  heuresTotales: number;
  objectifCible: number;
  tauxAtteinte: number;
  evolution: number;
}

interface CertifiantesTopFormation {
  id: number;
  nomFormation: string;
  sessionsCompleted: number;
  collaborateurs: number;
}

interface CertifiantesKpi {
  totalFormationsCertifiantes: number;
  totalSessions: number;
  sessionsCompleted: number;
  tauxCompletion: number;
  collaborateursCertifies: number;
  totalCollaborateurs: number;
  tauxCertification: number;
  heuresTotales: number;
  objectifCible: number;
  tauxAtteinte: number;
  evolution: number;
  topFormations: CertifiantesTopFormation[];
}

interface LdObjectivesData {
  global: {
    totalFormations: number;
    totalSessions: number;
    sessionsCompleted: number;
    tauxCompletionGlobal: number;
    collaborateursFormes: number;
    totalCollaborateurs: number;
    heuresTotales: number;
    budgetTotal: number;
  };
  categories: CategoryKpi[];
  certifiantes: CertifiantesKpi;
}

interface LdTarget {
  categorieId: number;
  categorieNom: string;
  objectifCible: number;
  suiviLd: boolean;
}

// Category icon mapping
function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  // SST avant le test générique 'sécurité', qui capterait 'Sécurité - SST'
  // et lui donnerait l'icône Cybersécurité.
  if (lower.includes('sst') || lower.includes('secours') || lower.includes('santé')) {
    return <FirstAidKit size={24} weight="bold" />;
  }
  if (lower.includes('cyber') || lower.includes('sécurité')) return <ShieldCheck size={24} weight="bold" />;
  if (lower.includes('ia') || lower.includes('data') || lower.includes('intelligence')) return <Brain size={24} weight="bold" />;
  if (lower.includes('management') || lower.includes('grh')) return <Briefcase size={24} weight="bold" />;
  if (lower.includes('langue')) return <Translate size={24} weight="bold" />;
  if (lower.includes('certif')) return <Certificate size={24} weight="bold" />;
  if (lower.includes('digital') || lower.includes('informatique') || lower.includes('bureautique')) return <Desktop size={24} weight="bold" />;
  return <Books size={24} weight="bold" />;
}

function getCategoryColor(index: number): string {
  const colors = ['orange', 'blue', 'green', 'violet', 'pink', 'teal', 'cyan', 'indigo', 'grape', 'red'];
  return colors[index % colors.length];
}

// Seuils de couleur du taux d'atteinte : vert >= objectif, orange >= 70% de
// l'objectif, rouge sinon. Utilisé par les cartes catégorie, la section
// "Contenus certifiants" et la table récapitulative.
function getAtteinteColor(tauxAtteinte: number, objectifCible: number): string {
  if (tauxAtteinte >= objectifCible) return 'green';
  if (tauxAtteinte >= objectifCible * 0.7) return 'orange';
  return 'red';
}

export default function ObjectifsLdPage() {
  const [data, setData] = useState<LdObjectivesData | null>(null);
  const [loading, setLoading] = useState(true);

  // Period selector
  const [periode, setPeriode] = useState<'annee' | 'mois' | 'plage'>('annee');
  const [date, setDate] = useState<string>(new Date().getFullYear().toString());
  const [dateDebut, setDateDebut] = useState<Date | null>(null);
  const [dateFin, setDateFin] = useState<Date | null>(null);

  // Modal state
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editTargets, setEditTargets] = useState<Record<number, number>>({});
  const [editCertifiantesTarget, setEditCertifiantesTarget] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // Objectifs cibles par catégorie (inclut celles retirées du suivi KPI)
  const [targets, setTargets] = useState<LdTarget[]>([]);

  // Retrait / réintégration d'une catégorie du suivi KPI
  const [categoryToRemove, setCategoryToRemove] = useState<CategoryKpi | null>(null);
  const [removing, setRemoving] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [removedOpened, { toggle: toggleRemoved }] = useDisclosure(false);

  useEffect(() => {
    fetchData();
  }, [periode, date, dateDebut, dateFin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDateStr = dateDebut ? dateDebut.toISOString().split('T')[0] : undefined;
      const endDateStr = dateFin ? dateFin.toISOString().split('T')[0] : undefined;
      const [kpisResult, targetsResult] = await Promise.all([
        statsService.getLdObjectivesKpis(periode, date, startDateStr, endDateStr),
        // Les objectifs cibles ne doivent pas faire échouer l'affichage des KPI
        statsService.getLdObjectiveTargets().catch((error) => {
          console.error('Erreur lors du chargement des objectifs cibles:', error);
          return null;
        }),
      ]);
      setData(kpisResult);
      if (targetsResult) setTargets(targetsResult);
    } catch (error) {
      console.error('Erreur lors du chargement des objectifs L&D:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    if (data) {
      const nextTargets: Record<number, number> = {};
      data.categories.forEach(c => {
        nextTargets[c.categorieId] = c.objectifCible;
      });
      setEditTargets(nextTargets);
      setEditCertifiantesTarget(data.certifiantes?.objectifCible ?? 0);
    }
    openModal();
  };

  const handleSaveTargets = async () => {
    setSaving(true);
    try {
      const payload = Object.entries(editTargets).map(([categorieId, objectifCible]) => ({
        categorieId: Number(categorieId),
        objectifCible,
      }));
      // Les deux sauvegardes sont indépendantes : l'échec de l'une ne doit pas
      // annuler l'autre.
      const [categoriesResult, certifiantesResult] = await Promise.allSettled([
        statsService.updateLdObjectiveTargets(payload),
        statsService.updateLdObjectiveGlobalTarget('certifiantes', editCertifiantesTarget),
      ]);

      if (categoriesResult.status === 'rejected') {
        console.error('Erreur lors de la sauvegarde des objectifs par catégorie:', categoriesResult.reason);
        notifications.show({
          title: 'Erreur',
          message: 'Impossible de sauvegarder les objectifs par catégorie.',
          color: 'red',
        });
      }
      if (certifiantesResult.status === 'rejected') {
        console.error('Erreur lors de la sauvegarde de l\'objectif contenus certifiants:', certifiantesResult.reason);
        notifications.show({
          title: 'Erreur',
          message: 'Impossible de sauvegarder l\'objectif « Contenus certifiants ».',
          color: 'red',
        });
      }
      if (categoriesResult.status === 'fulfilled' && certifiantesResult.status === 'fulfilled') {
        notifications.show({
          title: 'Objectifs mis à jour',
          message: 'Les objectifs cibles ont été sauvegardés avec succès.',
          color: 'green',
        });
        closeModal();
      }
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCategory = async () => {
    if (!categoryToRemove) return;
    setRemoving(true);
    try {
      await statsService.excludeLdObjectiveCategorie(categoryToRemove.categorieId);
      notifications.show({
        title: 'Catégorie retirée du suivi',
        message: `« ${categoryToRemove.categorieNom} » n'apparaît plus dans les KPI Objectifs L&D.`,
        color: 'green',
      });
      setCategoryToRemove(null);
      await fetchData();
    } catch (error) {
      console.error('Erreur lors du retrait de la catégorie:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de retirer cette catégorie du suivi.',
        color: 'red',
      });
    } finally {
      setRemoving(false);
    }
  };

  const handleRestoreCategory = async (target: LdTarget) => {
    setRestoringId(target.categorieId);
    try {
      await statsService.restoreLdObjectiveCategorie(target.categorieId);
      notifications.show({
        title: 'Catégorie réintégrée',
        message: `« ${target.categorieNom} » est de nouveau suivie dans les KPI Objectifs L&D.`,
        color: 'green',
      });
      await fetchData();
    } catch (error) {
      console.error('Erreur lors de la réintégration de la catégorie:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de réintégrer cette catégorie.',
        color: 'red',
      });
    } finally {
      setRestoringId(null);
    }
  };

  if (loading) {
    return (
      <Container size="xl">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container size="xl">
        <Alert color="red" title="Erreur" icon={<Lightning size={20} />}>
          Impossible de charger les objectifs L&D
        </Alert>
      </Container>
    );
  }

  // Bloc "Contenus certifiants" (transverse, hors catégories)
  const certifiantes: CertifiantesKpi = data.certifiantes ?? {
    totalFormationsCertifiantes: 0,
    totalSessions: 0,
    sessionsCompleted: 0,
    tauxCompletion: 0,
    collaborateursCertifies: 0,
    totalCollaborateurs: data.global.totalCollaborateurs,
    tauxCertification: 0,
    heuresTotales: 0,
    objectifCible: 0,
    tauxAtteinte: 0,
    evolution: 0,
    topFormations: [],
  };
  const certifiantesEcart = certifiantes.tauxAtteinte - certifiantes.objectifCible;
  const hasCertifiantes = certifiantes.totalFormationsCertifiantes > 0;

  // Catégories retirées du suivi KPI (réintégrables)
  const removedTargets = targets.filter(t => !t.suiviLd);

  // Prepare radar chart data
  const radarData = data.categories
    .filter(c => c.totalSessions > 0 || c.formations > 0)
    .map(c => ({
      category: c.categorieNom.length > 15 ? c.categorieNom.substring(0, 15) + '...' : c.categorieNom,
      atteinte: c.tauxAtteinte,
      objectif: c.objectifCible,
      completion: c.tauxCompletion,
    }));

  return (
    <Container size="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={2}>
              <Target size={28} weight="bold" style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Objectifs L&D
            </Title>
            <Text c="dimmed" size="sm">
              Suivi des objectifs de formation par catégorie
            </Text>
          </div>
          <Group gap="sm">
            <Button
              variant="light"
              leftSection={<PencilSimple size={16} />}
              onClick={handleOpenModal}
            >
              Modifier les objectifs
            </Button>
            <PeriodSelector
              periode={periode}
              date={date}
              dateDebut={dateDebut}
              dateFin={dateFin}
              onChange={(p, d) => { setPeriode(p); setDate(d); }}
              onDateRangeChange={(debut, fin) => { setDateDebut(debut); setDateFin(fin); }}
            />
          </Group>
        </Group>

        {/* Global Summary Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing="lg">
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Formations</Text>
                <Text size="xl" fw={700}>{data.global.totalFormations}</Text>
                <Text size="xs" c="dimmed">{data.global.totalSessions} sessions</Text>
              </div>
              <ThemeIcon color="blue" size="lg" radius="md">
                <Books size={24} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Collaborateurs formés</Text>
                <Text size="xl" fw={700}>{data.global.collaborateursFormes}</Text>
                <Text size="xs" c="dimmed">sur {data.global.totalCollaborateurs} actifs</Text>
              </div>
              <ThemeIcon color="green" size="lg" radius="md">
                <Users size={24} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Budget formation</Text>
                <Text size="xl" fw={700}>{data.global.budgetTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</Text>
                <Text size="xs" c="dimmed">sessions complétées</Text>
              </div>
              <ThemeIcon color="orange" size="lg" radius="md">
                <CurrencyDollar size={24} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Heures de formation</Text>
                <Text size="xl" fw={700}>{Math.round(data.global.heuresTotales).toLocaleString('fr-FR')}</Text>
                <Text size="xs" c="dimmed">heures dispensées</Text>
              </div>
              <ThemeIcon color="violet" size="lg" radius="md">
                <Clock size={24} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Collaborateurs certifiés</Text>
                <Text size="xl" fw={700}>{certifiantes.collaborateursCertifies}</Text>
                <Text size="xs" c="dimmed">{certifiantes.tauxCertification}% de l'effectif</Text>
              </div>
              <ThemeIcon color="teal" size="lg" radius="md">
                <Certificate size={24} />
              </ThemeIcon>
            </Group>
          </Card>
        </SimpleGrid>

        {/* Contenus certifiants */}
        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Group justify="space-between" align="flex-start" mb="md">
            <Group gap="sm">
              <ThemeIcon color="teal" size="lg" radius="md" variant="light">
                <Certificate size={24} weight="bold" />
              </ThemeIcon>
              <div>
                <Title order={4}>Contenus certifiants</Title>
                <Text size="xs" c="dimmed">
                  Suivi transverse des formations marquées « certifiantes »
                </Text>
              </div>
            </Group>
            {hasCertifiantes && (
              <Badge
                color={certifiantes.evolution > 0 ? 'green' : certifiantes.evolution < 0 ? 'red' : 'gray'}
                variant="light"
                size="sm"
                leftSection={certifiantes.evolution > 0 ? <TrendUp size={12} weight="bold" /> : certifiantes.evolution < 0 ? <TrendDown size={12} weight="bold" /> : null}
              >
                {certifiantes.evolution > 0 ? '+' : ''}{certifiantes.evolution}% vs N-1
              </Badge>
            )}
          </Group>

          {!hasCertifiantes ? (
            <Alert color="blue" title="Aucun contenu certifiant" icon={<Certificate size={20} />}>
              Aucune formation n'est actuellement marquée comme « certifiante ». Cochez la case
              « Formation certifiante » dans la fiche d'une formation depuis le menu{' '}
              <Anchor href="/formations" fw={600}>Formations</Anchor> pour l'inclure dans ce KPI.
            </Alert>
          ) : (
            <>
              <Group align="center" gap="xl" wrap="wrap">
                <RingProgress
                  size={140}
                  thickness={12}
                  roundCaps
                  sections={[
                    {
                      value: Math.min(certifiantes.tauxAtteinte, 100),
                      color: getAtteinteColor(certifiantes.tauxAtteinte, certifiantes.objectifCible),
                    },
                  ]}
                  label={
                    <Center>
                      <div style={{ textAlign: 'center' }}>
                        <Text size="lg" fw={800}>{certifiantes.tauxAtteinte}</Text>
                        <Text size="xs" c="dimmed">/ {certifiantes.objectifCible}%</Text>
                      </div>
                    </Center>
                  }
                />

                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg" style={{ flex: 1, minWidth: 260 }}>
                  <div>
                    <Text size="xs" c="dimmed">Formations certifiantes</Text>
                    <Text size="lg" fw={700}>{certifiantes.totalFormationsCertifiantes}</Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">Sessions complétées</Text>
                    <Text size="lg" fw={700}>
                      {certifiantes.sessionsCompleted}
                      <Text span size="sm" c="dimmed" fw={500}> / {certifiantes.totalSessions}</Text>
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">Taux de complétion</Text>
                    <Text size="lg" fw={700}>{certifiantes.tauxCompletion}%</Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">Heures totales</Text>
                    <Text size="lg" fw={700}>{Math.round(certifiantes.heuresTotales).toLocaleString('fr-FR')}</Text>
                  </div>
                </SimpleGrid>
              </Group>

              {certifiantes.topFormations.length > 0 && (
                <>
                  <Divider my="lg" />
                  <Text size="sm" fw={600} mb="xs">Top 5 des contenus certifiants</Text>
                  <Table highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Formation</Table.Th>
                        <Table.Th>Sessions complétées</Table.Th>
                        <Table.Th>Collaborateurs</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {certifiantes.topFormations.slice(0, 5).map((formation) => (
                        <Table.Tr key={formation.id}>
                          <Table.Td><Text size="sm" fw={500}>{formation.nomFormation}</Text></Table.Td>
                          <Table.Td><Text size="sm">{formation.sessionsCompleted}</Text></Table.Td>
                          <Table.Td><Text size="sm" fw={600}>{formation.collaborateurs}</Text></Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </>
              )}
            </>
          )}
        </Card>

        {/* Categories Grid */}
        <Title order={3}>Par catégorie</Title>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {data.categories.map((cat, index) => (
            <Card key={cat.categorieId} shadow="sm" p="lg" radius="md" withBorder>
              <Group justify="space-between" mb="md">
                <Group gap="sm">
                  <ThemeIcon color={getCategoryColor(index)} size="lg" radius="md" variant="light">
                    {getCategoryIcon(cat.categorieNom)}
                  </ThemeIcon>
                  <div>
                    <Text fw={600} size="sm">{cat.categorieNom}</Text>
                    <Text size="xs" c="dimmed">{cat.formations} formations</Text>
                  </div>
                </Group>
                <Group gap={4}>
                  <Badge
                    color={cat.evolution > 0 ? 'green' : cat.evolution < 0 ? 'red' : 'gray'}
                    variant="light"
                    size="sm"
                    leftSection={cat.evolution > 0 ? <TrendUp size={12} weight="bold" /> : cat.evolution < 0 ? <TrendDown size={12} weight="bold" /> : null}
                  >
                    {cat.evolution > 0 ? '+' : ''}{cat.evolution}%
                  </Badge>
                  <Tooltip label="Retirer du suivi KPI" withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      aria-label="Retirer du suivi KPI"
                      onClick={() => setCategoryToRemove(cat)}
                    >
                      <Trash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>

              <Center>
                <RingProgress
                  size={120}
                  thickness={10}
                  roundCaps
                  sections={[
                    { value: Math.min(cat.tauxAtteinte, 100), color: getAtteinteColor(cat.tauxAtteinte, cat.objectifCible) },
                  ]}
                  label={
                    <Center>
                      <div style={{ textAlign: 'center' }}>
                        <Text size="lg" fw={800}>{cat.tauxAtteinte}</Text>
                        <Text size="xs" c="dimmed">/ {cat.objectifCible}%</Text>
                      </div>
                    </Center>
                  }
                />
              </Center>

              <SimpleGrid cols={3} mt="md" spacing="xs">
                <div style={{ textAlign: 'center' }}>
                  <Text size="xs" c="dimmed">Formés</Text>
                  <Text size="sm" fw={600}>{cat.collaborateursFormes}</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Text size="xs" c="dimmed">Heures</Text>
                  <Text size="sm" fw={600}>{Math.round(cat.heuresTotales)}</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Text size="xs" c="dimmed">Sessions</Text>
                  <Text size="sm" fw={600}>{cat.totalSessions}</Text>
                </div>
              </SimpleGrid>
            </Card>
          ))}
        </SimpleGrid>

        {/* Radar Chart */}
        {radarData.length > 2 && (
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Title order={4} mb="md">Vue synthétique</Title>
            <Text c="dimmed" size="sm" mb="lg">
              Comparaison entre les taux d'atteinte et les objectifs cibles par catégorie
            </Text>
            <LazyObjectifsRadarChart data={radarData} />
          </Card>
        )}

        {/* Summary Table */}
        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Title order={4} mb="md">Récapitulatif</Title>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Catégorie</Table.Th>
                <Table.Th>Formations</Table.Th>
                <Table.Th>Sessions</Table.Th>
                <Table.Th>Formés</Table.Th>
                <Table.Th>Heures</Table.Th>
                <Table.Th>Objectif</Table.Th>
                <Table.Th>Atteinte</Table.Th>
                <Table.Th>Écart</Table.Th>
                <Table.Th>Évolution</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.categories.map((cat, index) => {
                const ecart = cat.tauxAtteinte - cat.objectifCible;
                return (
                  <Table.Tr key={cat.categorieId}>
                    <Table.Td>
                      <Group gap="xs">
                        <ThemeIcon color={getCategoryColor(index)} size="sm" radius="md" variant="light">
                          {getCategoryIcon(cat.categorieNom)}
                        </ThemeIcon>
                        <Text size="sm" fw={500}>{cat.categorieNom}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td><Text size="sm">{cat.formations}</Text></Table.Td>
                    <Table.Td><Text size="sm">{cat.totalSessions}</Text></Table.Td>
                    <Table.Td><Text size="sm" fw={600}>{cat.collaborateursFormes}</Text></Table.Td>
                    <Table.Td><Text size="sm">{Math.round(cat.heuresTotales)}</Text></Table.Td>
                    <Table.Td><Badge variant="light" color="blue" size="sm">{cat.objectifCible}%</Badge></Table.Td>
                    <Table.Td>
                      <Badge
                        variant="filled"
                        color={getAtteinteColor(cat.tauxAtteinte, cat.objectifCible)}
                        size="sm"
                      >
                        {cat.tauxAtteinte}%
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={600} c={ecart >= 0 ? 'green' : 'red'}>
                        {ecart >= 0 ? '+' : ''}{ecart}%
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={cat.evolution > 0 ? 'green' : cat.evolution < 0 ? 'red' : 'gray'}
                        variant="light"
                        size="sm"
                      >
                        {cat.evolution > 0 ? '+' : ''}{cat.evolution}%
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                );
              })}

              {/* Ligne transverse : contenus certifiants (hors catégories) */}
              <Table.Tr
                style={{
                  borderTop: '3px solid var(--mantine-color-gray-4)',
                  backgroundColor: 'var(--mantine-color-teal-light)',
                }}
              >
                <Table.Td>
                  <Group gap="xs">
                    <ThemeIcon color="teal" size="sm" radius="md" variant="light">
                      <Certificate size={24} weight="bold" />
                    </ThemeIcon>
                    <Text size="sm" fw={600}>Contenus certifiants</Text>
                    <Badge color="teal" variant="light" size="xs">Transverse</Badge>
                  </Group>
                </Table.Td>
                <Table.Td><Text size="sm">{certifiantes.totalFormationsCertifiantes}</Text></Table.Td>
                <Table.Td><Text size="sm">{certifiantes.totalSessions}</Text></Table.Td>
                <Table.Td><Text size="sm" fw={600}>{certifiantes.collaborateursCertifies}</Text></Table.Td>
                <Table.Td><Text size="sm">{Math.round(certifiantes.heuresTotales)}</Text></Table.Td>
                <Table.Td><Badge variant="light" color="blue" size="sm">{certifiantes.objectifCible}%</Badge></Table.Td>
                <Table.Td>
                  <Badge
                    variant="filled"
                    color={getAtteinteColor(certifiantes.tauxAtteinte, certifiantes.objectifCible)}
                    size="sm"
                  >
                    {certifiantes.tauxAtteinte}%
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={600} c={certifiantesEcart >= 0 ? 'green' : 'red'}>
                    {certifiantesEcart >= 0 ? '+' : ''}{certifiantesEcart}%
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={certifiantes.evolution > 0 ? 'green' : certifiantes.evolution < 0 ? 'red' : 'gray'}
                    variant="light"
                    size="sm"
                  >
                    {certifiantes.evolution > 0 ? '+' : ''}{certifiantes.evolution}%
                  </Badge>
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Card>

        {/* Catégories retirées du suivi KPI */}
        {removedTargets.length > 0 && (
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text fw={600}>Catégories retirées du suivi ({removedTargets.length})</Text>
                <Text size="xs" c="dimmed">
                  Ces catégories existent toujours, elles ne sont simplement pas comptabilisées dans les KPI Objectifs L&D.
                </Text>
              </div>
              <Button
                variant="subtle"
                onClick={toggleRemoved}
                rightSection={removedOpened ? <CaretUp size={16} /> : <CaretDown size={16} />}
              >
                {removedOpened ? 'Masquer' : 'Afficher'}
              </Button>
            </Group>

            <Collapse in={removedOpened}>
              <Stack gap="xs" mt="md">
                {removedTargets.map((target) => (
                  <Paper key={target.categorieId} p="sm" radius="md" withBorder>
                    <Group justify="space-between">
                      <Group gap="sm">
                        <ThemeIcon color="gray" size="md" radius="md" variant="light">
                          {getCategoryIcon(target.categorieNom)}
                        </ThemeIcon>
                        <div>
                          <Text size="sm" fw={500}>{target.categorieNom}</Text>
                          <Text size="xs" c="dimmed">Objectif cible : {target.objectifCible}%</Text>
                        </div>
                      </Group>
                      <Button
                        variant="light"
                        size="xs"
                        leftSection={<ArrowCounterClockwise size={14} />}
                        loading={restoringId === target.categorieId}
                        onClick={() => handleRestoreCategory(target)}
                      >
                        Réintégrer
                      </Button>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Collapse>
          </Card>
        )}
      </Stack>

      {/* Edit Objectives Modal */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title="Modifier les objectifs cibles"
        size="lg"
      >
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Group gap="sm" style={{ flex: 1 }}>
              <ThemeIcon color="teal" size="sm" radius="md" variant="light">
                <Certificate size={24} weight="bold" />
              </ThemeIcon>
              <div>
                <Text size="sm" fw={500}>Contenus certifiants</Text>
                <Text size="xs" c="dimmed">Objectif transverse, toutes catégories confondues</Text>
              </div>
            </Group>
            <NumberInput
              value={editCertifiantesTarget}
              onChange={(val) => setEditCertifiantesTarget(Math.round(Number(val)) || 0)}
              min={0}
              max={100}
              // Le backend valide desormais @IsInt() : une decimale renverrait un 400
              allowDecimal={false}
              suffix="%"
              w={120}
              size="sm"
            />
          </Group>

          <Divider label="Par catégorie" labelPosition="center" />

          <Text size="sm" c="dimmed">
            Définissez le pourcentage cible de collaborateurs formés pour chaque catégorie.
          </Text>
          {data.categories.map((cat, index) => (
            <Group key={cat.categorieId} justify="space-between" align="center">
              <Group gap="sm" style={{ flex: 1 }}>
                <ThemeIcon color={getCategoryColor(index)} size="sm" radius="md" variant="light">
                  {getCategoryIcon(cat.categorieNom)}
                </ThemeIcon>
                <Text size="sm" fw={500}>{cat.categorieNom}</Text>
              </Group>
              <NumberInput
                value={editTargets[cat.categorieId] ?? cat.objectifCible}
                onChange={(val) => setEditTargets(prev => ({ ...prev, [cat.categorieId]: Math.round(Number(val)) || 0 }))}
                min={0}
                max={100}
                // Le backend valide desormais @IsInt() : une decimale renverrait un 400
                allowDecimal={false}
                suffix="%"
                w={120}
                size="sm"
              />
            </Group>
          ))}
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeModal}>Annuler</Button>
            <Button onClick={handleSaveTargets} loading={saving}>
              Sauvegarder
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Remove Category Confirmation Modal */}
      <Modal
        opened={categoryToRemove !== null}
        onClose={() => { if (!removing) setCategoryToRemove(null); }}
        title="Retirer la catégorie du suivi KPI"
        size="md"
      >
        <Stack gap="md">
          <Alert color="orange" icon={<Lightning size={20} />}>
            <Text size="sm">
              La catégorie <b>{categoryToRemove?.categorieNom}</b> ne sera plus suivie dans les KPI
              Objectifs L&D. La catégorie de formation et les formations qui y sont rattachées ne
              sont pas supprimées — vous pourrez la réintégrer à tout moment.
            </Text>
          </Alert>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setCategoryToRemove(null)} disabled={removing}>
              Annuler
            </Button>
            <Button color="red" onClick={handleRemoveCategory} loading={removing} leftSection={<Trash size={16} />}>
              Retirer du suivi
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
